import { runTask } from "@/lib/task-store";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type JsonRecord = Record<string, unknown>;

function store() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("ADMIN_OPERATIONS_UNAVAILABLE");
  return supabase;
}

async function audit(operator: string, action: string, resourceType: string, resourceId: string, metadata: JsonRecord) {
  await store().from("audit_logs").insert({
    admin_id: operator,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
}

export async function listAdminUsers() {
  const supabase = store();
  const [profiles, subscriptions, tasks, events] = await Promise.all([
    supabase.from("profiles").select("id,email,display_name,role,status,credits_balance,created_at,updated_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("subscriptions").select("id,user_id,status,plans(name,credits,price)").order("created_at", { ascending: false }),
    supabase.from("content_tasks").select("id,user_id,status,updated_at"),
    supabase.from("product_events").select("user_id,created_at").not("user_id", "is", null).order("created_at", { ascending: false }).limit(1000),
  ]);

  if (profiles.error) throw profiles.error;
  if (subscriptions.error) throw subscriptions.error;
  if (tasks.error) throw tasks.error;

  const taskStats = new Map<string, { total: number; running: number; failed: number; completed: number; lastTaskAt: string | null }>();
  for (const task of tasks.data ?? []) {
    if (!task.user_id) continue;
    const current = taskStats.get(task.user_id) ?? { total: 0, running: 0, failed: 0, completed: 0, lastTaskAt: null };
    current.total += 1;
    if (task.status === "running" || task.status === "generating" || task.status === "pending") current.running += 1;
    if (task.status === "failed") current.failed += 1;
    if (task.status === "completed") current.completed += 1;
    if (!current.lastTaskAt || task.updated_at > current.lastTaskAt) current.lastTaskAt = task.updated_at;
    taskStats.set(task.user_id, current);
  }

  const latestEvents = new Map<string, string>();
  for (const event of events.data ?? []) {
    if (event.user_id && !latestEvents.has(event.user_id)) latestEvents.set(event.user_id, event.created_at);
  }

  const latestSubscription = new Map<string, unknown>();
  for (const subscription of subscriptions.data ?? []) {
    if (subscription.user_id && !latestSubscription.has(subscription.user_id)) latestSubscription.set(subscription.user_id, subscription);
  }

  return (profiles.data ?? []).map((profile) => ({
    ...profile,
    last_activity_at: latestEvents.get(profile.id) ?? taskStats.get(profile.id)?.lastTaskAt ?? profile.updated_at ?? profile.created_at,
    subscription: latestSubscription.get(profile.id) ?? null,
    tasks: taskStats.get(profile.id) ?? { total: 0, running: 0, failed: 0, completed: 0, lastTaskAt: null },
  }));
}

export async function updateUserStatus(input: { userId: string; status: "active" | "frozen"; operator: string }) {
  const supabase = store();
  const { data: before } = await supabase.from("profiles").select("id,status").eq("id", input.userId).maybeSingle();
  const { data, error } = await supabase
    .from("profiles")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.userId)
    .select("id,email,status")
    .single();
  if (error) throw error;
  await audit(input.operator, "user_status_updated", "profile", input.userId, { before, after: data });
  return data;
}

export async function adjustUserCredits(input: { userId: string; amount: number; reason: string; operator: string }) {
  const { data, error } = await store().rpc("admin_adjust_user_credits", {
    p_user_id: input.userId,
    p_amount: input.amount,
    p_reason: input.reason || "admin_manual_adjustment",
  });
  if (error) throw error;
  await audit(input.operator, "user_credits_adjusted", "profile", input.userId, {
    amount: input.amount,
    reason: input.reason,
    balanceAfter: data,
  });
  return data as number;
}

export async function listAdminTaskMonitoring() {
  const supabase = store();
  const [tasks, logs, providers, usage] = await Promise.all([
    supabase
      .from("content_tasks")
      .select("id,user_id,topic,task_type,status,error,credits_charged,created_at,updated_at,profiles(email)")
      .in("status", ["running", "generating", "pending", "failed"])
      .order("updated_at", { ascending: false })
      .limit(100),
    supabase.from("system_logs").select("id,level,event,task_id,user_id,metadata,created_at").eq("level", "error").order("created_at", { ascending: false }).limit(50),
    supabase.from("ai_providers").select("provider_name,enabled,model,updated_at").order("provider_name"),
    supabase.from("usage_history").select("provider,model,credits_charged,created_at"),
  ]);

  if (tasks.error) throw tasks.error;
  if (logs.error) throw logs.error;

  return {
    tasks: tasks.data ?? [],
    errors: logs.data ?? [],
    providers: providers.data ?? [],
    usage: usage.data ?? [],
  };
}

export async function retryFailedTask(input: { taskId: string; operator: string }) {
  const supabase = store();
  const { data: task, error } = await supabase.from("content_tasks").select("id,status").eq("id", input.taskId).single();
  if (error || !task) throw error ?? new Error("TASK_NOT_FOUND");
  if (task.status !== "failed") throw new Error("ONLY_FAILED_TASKS_CAN_BE_RETRIED");
  await audit(input.operator, "failed_task_retry_started", "content_task", input.taskId, { status: task.status });
  void runTask(input.taskId);
  return { taskId: input.taskId, status: "retry_started" };
}

export async function getSystemHealth() {
  const supabase = store();
  const [tasks, usage, providers, logs, imageTasks, videoTasks] = await Promise.all([
    supabase.from("content_tasks").select("status,credits_charged,updated_at"),
    supabase.from("usage_history").select("provider,model,credits_charged,created_at"),
    supabase.from("ai_providers").select("provider_name,enabled,model,updated_at").order("provider_name"),
    supabase.from("system_logs").select("level,event,metadata,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("image_tasks").select("status"),
    supabase.from("video_tasks").select("status"),
  ]);

  if (tasks.error) throw tasks.error;
  const taskRows = tasks.data ?? [];
  const failedTasks = taskRows.filter((task) => task.status === "failed").length;
  const completedTasks = taskRows.filter((task) => task.status === "completed").length;
  const totalTasks = taskRows.length;
  const usageRows = usage.data ?? [];
  const creditsConsumed = usageRows.reduce((total, row) => total + Number(row.credits_charged ?? 0), 0);
  const providerCalls = usageRows.length;
  const errorLogs = (logs.data ?? []).filter((log) => log.level === "error");

  return {
    aiCalls: providerCalls,
    successRate: totalTasks ? completedTasks / totalTasks : 0,
    failureRate: totalTasks ? failedTasks / totalTasks : 0,
    creditsConsumed,
    providers: providers.data ?? [],
    providerUsage: usageRows.reduce<Record<string, { calls: number; credits: number }>>((grouped, row) => {
      const provider = row.provider ?? "unknown";
      grouped[provider] = grouped[provider] ?? { calls: 0, credits: 0 };
      grouped[provider].calls += 1;
      grouped[provider].credits += Number(row.credits_charged ?? 0);
      return grouped;
    }, {}),
    taskStatus: {
      total: totalTasks,
      completed: completedTasks,
      failed: failedTasks,
      running: taskRows.filter((task) => task.status === "running" || task.status === "generating" || task.status === "pending").length,
      imageFailed: (imageTasks.data ?? []).filter((task) => task.status === "failed").length,
      videoFailed: (videoTasks.data ?? []).filter((task) => task.status === "failed").length,
    },
    recentErrors: errorLogs.slice(0, 20),
  };
}
