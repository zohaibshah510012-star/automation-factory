import { getSupabaseServerClient } from "@/lib/supabase/server";

type TaskRow = {
  id: string;
  user_id: string | null;
  task_type: string;
  topic: string;
  brief: string | null;
  status: string;
  title: string | null;
  script: string | null;
  storyboard: unknown;
  error: string | null;
  credits_charged: number;
  prompt_template_id: string | null;
  input_payload: unknown;
  created_at: string;
  updated_at: string;
};

export type ContentAsset = {
  id: string;
  taskId: string;
  userId: string | null;
  type: string;
  title: string;
  topic: string;
  brief: string | null;
  content: { script: string | null; storyboard: string[]; raw: Record<string, unknown> };
  status: string;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  promptName: string | null;
  agentName: string | null;
  creditsCharged: number;
  favorite: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

async function hydrateAssets(rows: TaskRow[], viewerId?: string): Promise<ContentAsset[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase || !rows.length) return [];
  const ids = rows.map((row) => row.id);
  const promptIds = rows.map((row) => row.prompt_template_id).filter((id): id is string => Boolean(id));
  const [favoritesResult, promptsResult, agentsResult] = await Promise.all([
    viewerId
      ? supabase.from("content_favorites").select("content_task_id").eq("user_id", viewerId).in("content_task_id", ids)
      : Promise.resolve({ data: [] as { content_task_id: string }[] }),
    promptIds.length
      ? supabase.from("prompt_templates").select("id,name").in("id", promptIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase.from("agent_runs").select("content_task_id,agents(agent_name)").in("content_task_id", ids).order("created_at", { ascending: false }),
  ]);

  const favoriteIds = new Set((favoritesResult.data ?? []).map((item) => item.content_task_id));
  const promptNames = new Map((promptsResult.data ?? []).map((prompt) => [prompt.id, prompt.name]));
  const agentNames = new Map<string, string>();
  for (const run of agentsResult.data ?? []) {
    const agent = Array.isArray(run.agents) ? run.agents[0] : run.agents;
    if (run.content_task_id && agent?.agent_name && !agentNames.has(run.content_task_id)) agentNames.set(run.content_task_id, agent.agent_name);
  }

  return rows.map((row) => {
    const payload = asRecord(row.input_payload);
    const storyboard = asStringArray(row.storyboard);
    return {
      id: row.id,
      taskId: row.id,
      userId: row.user_id,
      type: row.task_type,
      title: row.title ?? row.topic,
      topic: row.topic,
      brief: row.brief,
      content: { script: row.script, storyboard, raw: { title: row.title, script: row.script, storyboard, topic: row.topic, brief: row.brief, input: payload } },
      status: row.status,
      error: row.error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      promptName: row.prompt_template_id ? promptNames.get(row.prompt_template_id) ?? null : null,
      agentName: agentNames.get(row.id) ?? null,
      creditsCharged: row.credits_charged,
      favorite: favoriteIds.has(row.id),
    };
  });
}

export async function listContentAssets(input: { userId?: string; query?: string; type?: string; limit?: number }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("CONTENT_ASSET_STORE_UNAVAILABLE");
  let query = supabase
    .from("content_tasks")
    .select("id,user_id,task_type,topic,brief,status,title,script,storyboard,error,credits_charged,prompt_template_id,input_payload,created_at,updated_at")
    .eq("status", "completed")
    .order("updated_at", { ascending: false })
    .limit(input.limit ?? 100);
  if (input.userId) query = query.eq("user_id", input.userId);
  if (input.type && input.type !== "all") query = query.eq("task_type", input.type);
  if (input.query) {
    const searchable = input.query.replace(/[^\p{L}\p{N}\s-]/gu, "").trim();
    if (searchable) query = query.or(`topic.ilike.%${searchable}%,title.ilike.%${searchable}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Unable to load content assets: ${error.message}`);
  return hydrateAssets((data ?? []) as TaskRow[], input.userId);
}

export async function getContentAsset(id: string, userId?: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("CONTENT_ASSET_STORE_UNAVAILABLE");
  const { data, error } = await supabase
    .from("content_tasks")
    .select("id,user_id,task_type,topic,brief,status,title,script,storyboard,error,credits_charged,prompt_template_id,input_payload,created_at,updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Unable to load content asset: ${error.message}`);
  if (!data || (userId && data.user_id !== userId)) return undefined;
  const [asset] = await hydrateAssets([data as TaskRow], userId);
  if (!asset) return undefined;

  const [{ data: workflowRuns }, { data: agentRuns }] = await Promise.all([
    supabase.from("workflow_runs").select("id,status,current_step,error,created_at,updated_at").eq("content_task_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("agent_runs").select("id,status,error,started_at,completed_at,agents(agent_name)").eq("content_task_id", id).order("created_at", { ascending: false }).limit(1),
  ]);
  const workflow = workflowRuns?.[0] ?? null;
  const agentRun = agentRuns?.[0] ?? null;
  const agent = agentRun && (Array.isArray(agentRun.agents) ? agentRun.agents[0] : agentRun.agents);
  return {
    ...asset,
    execution: {
      workflow: workflow ? { id: workflow.id, status: workflow.status, currentStep: workflow.current_step, error: workflow.error } : null,
      agent: agentRun ? { id: agentRun.id, name: agent?.agent_name ?? null, status: agentRun.status, error: agentRun.error, startedAt: agentRun.started_at, completedAt: agentRun.completed_at } : null,
    },
  };
}

export async function setContentFavorite(input: { taskId: string; userId: string; favorite: boolean }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("CONTENT_ASSET_STORE_UNAVAILABLE");
  const { data: task } = await supabase.from("content_tasks").select("id,user_id").eq("id", input.taskId).maybeSingle();
  if (!task || task.user_id !== input.userId) throw new Error("CONTENT_NOT_FOUND");
  if (input.favorite) {
    const { error } = await supabase.from("content_favorites").upsert({ user_id: input.userId, content_task_id: input.taskId });
    if (error) throw new Error(`Unable to favorite content: ${error.message}`);
  } else {
    const { error } = await supabase.from("content_favorites").delete().eq("user_id", input.userId).eq("content_task_id", input.taskId);
    if (error) throw new Error(`Unable to remove content favorite: ${error.message}`);
  }
}

export async function deleteContentAsset(input: { taskId: string; userId: string }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("CONTENT_ASSET_STORE_UNAVAILABLE");
  const { data: task, error: taskError } = await supabase.from("content_tasks").select("id").eq("id", input.taskId).eq("user_id", input.userId).maybeSingle();
  if (taskError || !task) throw new Error("CONTENT_NOT_FOUND");
  const { error } = await supabase.from("content_tasks").delete().eq("id", input.taskId).eq("user_id", input.userId);
  if (error) throw new Error(`Unable to delete content asset: ${error.message}`);
}
