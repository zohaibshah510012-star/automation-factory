import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  email: string | null;
  created_at: string;
  credits_balance: number;
};

type InviteRow = {
  email: string;
  invite_code: string;
  status: string;
  created_at: string;
  used_at: string | null;
};

type EventRow = {
  user_id: string | null;
  event_name: string;
  surface: string;
  path: string | null;
  properties: Record<string, unknown> | null;
  created_at: string;
};

type TaskRow = {
  id: string;
  user_id: string | null;
  task_type: string | null;
  status: string;
  credits_charged: number;
  created_at: string;
  updated_at: string;
};

type UsageRow = {
  user_id: string | null;
  capability: string;
  credits_charged: number;
  created_at: string;
};

type FeedbackRow = {
  user_id: string | null;
  category: string;
  satisfaction: number;
  result_quality: number | null;
  use_case: string | null;
  continue_use: boolean | null;
  status: string;
  content_feedback: string | null;
  suggestion: string | null;
  created_at: string;
};

type BetaStatus = "invited" | "active" | "completed" | "churned";

type BetaStatusRow = {
  user_id: string;
  status: BetaStatus;
  note: string | null;
  updated_at: string;
};

type SubscriptionRow = {
  user_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  plans: { name: string; price: number; credits: number } | null;
};

type LifecycleStatus = "NEW" | "ACTIVATED" | "ENGAGED" | "POWER_USER" | "AT_RISK";

function toTime(value?: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function minDate(rows: Array<{ created_at: string }>) {
  return rows.map((row) => row.created_at).sort()[0] ?? null;
}

function maxDate(values: Array<string | null | undefined>) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

function taskBucket(taskType?: string | null) {
  const value = (taskType ?? "text").toLowerCase();
  if (value.includes("image")) return "image";
  if (value.includes("video")) return "video";
  return "text";
}

function hasUpgradeIntent(feedback: FeedbackRow) {
  const haystack = `${feedback.category} ${feedback.content_feedback ?? ""} ${feedback.suggestion ?? ""}`.toLowerCase();
  return /billing|upgrade|price|pricing|plan|credits|pay|paid/.test(haystack);
}

function feedbackText(feedback: FeedbackRow) {
  return `${feedback.category} ${feedback.use_case ?? ""} ${feedback.content_feedback ?? ""} ${feedback.suggestion ?? ""}`.toLowerCase();
}

function classifyFeedback(feedback: FeedbackRow) {
  const text = feedbackText(feedback);
  if (hasUpgradeIntent(feedback) || /pay|paid|price|pricing|upgrade|billing|plan/.test(text)) return "Payment intent";
  if (/slow|speed|timeout|latency|wait/.test(text)) return "Generation speed";
  if (/confusing|hard|difficult|ux|ui|where|how|bug|error|flow/.test(text)) return "Usability";
  if (feedback.use_case?.trim() || /case|scenario|workflow|tiktok|short|marketing|drama/.test(text)) return "Use case";
  return "Content quality";
}

function commonIssueLabels(feedback: FeedbackRow) {
  const text = feedbackText(feedback);
  const labels: string[] = [];
  if ((feedback.result_quality ?? 5) <= 3 || /quality|bad|wrong|inaccurate/.test(text)) labels.push("Content quality is unstable");
  if (/slow|timeout|wait/.test(text)) labels.push("Generation speed needs improvement");
  if (/confusing|hard|where|how|flow/.test(text)) labels.push("First-use path is not clear enough");
  if (/credit|credits/.test(text)) labels.push("Credits are not easy to understand");
  if (/video|mp4|preview/.test(text)) labels.push("Video output still needs a real provider");
  return labels.length ? labels : ["No clear issue"];
}

function average(values: number[]) {
  return values.length ? Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1)) : 0;
}

function isBetaStatus(value: unknown): value is BetaStatus {
  return value === "invited" || value === "active" || value === "completed" || value === "churned";
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function lifecycleFor(input: { activated: boolean; generationCount: number; creditsConsumed: number; returnVisits: number; latestActivity: string | null; now: number }): LifecycleStatus {
  const inactiveDays = input.latestActivity ? (input.now - toTime(input.latestActivity)) / 86_400_000 : Number.POSITIVE_INFINITY;
  if (input.activated && inactiveDays > 14) return "AT_RISK";
  if (input.generationCount >= 10 || input.creditsConsumed >= 500) return "POWER_USER";
  if (input.generationCount >= 3 || input.returnVisits >= 2) return "ENGAGED";
  if (input.activated) return "ACTIVATED";
  return "NEW";
}

function betaHealthScore(input: { activated: boolean; generationCount: number; creditsConsumed: number; returnedWithinSevenDays: boolean; activeRecently: boolean; feedbackCount: number; averageSatisfaction: number }) {
  const activation = input.activated ? 25 : 0;
  const usageFrequency = Math.min(25, input.generationCount * 5);
  const credits = Math.min(20, input.creditsConsumed / 10);
  const retention = (input.returnedWithinSevenDays ? 10 : 0) + (input.activeRecently ? 10 : 0);
  const feedback = input.feedbackCount ? Math.min(10, 4 + input.averageSatisfaction) : 0;
  return clampScore(activation + usageFrequency + credits + retention + feedback);
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = getSupabaseServerClient()!;

    const [profiles, invites, events, tasks, usage, subscriptions, feedback, betaStatuses] = await Promise.all([
      supabase.from("profiles").select("id,email,created_at,credits_balance").order("created_at", { ascending: false }).limit(500),
      supabase.from("beta_invites").select("email,invite_code,status,created_at,used_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("product_events").select("user_id,event_name,surface,path,properties,created_at").order("created_at", { ascending: false }).limit(5000),
      supabase.from("content_tasks").select("id,user_id,task_type,status,credits_charged,created_at,updated_at").order("created_at", { ascending: false }).limit(5000),
      supabase.from("usage_history").select("user_id,capability,credits_charged,created_at").order("created_at", { ascending: false }).limit(5000),
      supabase.from("subscriptions").select("user_id,status,started_at,expires_at,plans(name,price,credits)").order("created_at", { ascending: false }).limit(1000),
      supabase.from("user_feedback").select("user_id,category,satisfaction,result_quality,use_case,continue_use,status,content_feedback,suggestion,created_at").order("created_at", { ascending: false }).limit(1000),
      supabase.from("beta_user_statuses").select("user_id,status,note,updated_at").order("updated_at", { ascending: false }).limit(1000),
    ]);

    for (const result of [profiles, invites, events, tasks, usage, subscriptions, feedback, betaStatuses]) {
      if (result.error) throw result.error;
    }

    const profileRows = (profiles.data ?? []) as ProfileRow[];
    const inviteRows = (invites.data ?? []) as InviteRow[];
    const eventRows = (events.data ?? []) as EventRow[];
    const taskRows = (tasks.data ?? []) as TaskRow[];
    const usageRows = (usage.data ?? []) as UsageRow[];
    const subscriptionRows = (subscriptions.data ?? []) as unknown as SubscriptionRow[];
    const feedbackRows = (feedback.data ?? []) as FeedbackRow[];
    const statusRows = (betaStatuses.data ?? []) as BetaStatusRow[];

    const inviteByEmail = new Map(inviteRows.map((invite) => [invite.email.toLowerCase(), invite]));
    const betaStatusByUser = new Map(statusRows.map((status) => [status.user_id, status]));
    const signupUserIds = new Set(eventRows.filter((event) => event.event_name === "signup_completed" || event.event_name === "signup_complete").map((event) => event.user_id).filter(Boolean) as string[]);
    const betaProfiles = profileRows.filter((profile) => {
      const email = profile.email?.toLowerCase();
      return (email && inviteByEmail.has(email)) || signupUserIds.has(profile.id);
    });
    const betaUserIds = new Set(betaProfiles.map((profile) => profile.id));

    const betaEvents = eventRows.filter((event) => event.user_id && betaUserIds.has(event.user_id));
    const betaTasks = taskRows.filter((task) => task.user_id && betaUserIds.has(task.user_id));
    const betaUsage = usageRows.filter((row) => row.user_id && betaUserIds.has(row.user_id));
    const betaFeedback = feedbackRows.filter((row) => row.user_id && betaUserIds.has(row.user_id));

    const eventsByUser = new Map<string, EventRow[]>();
    for (const event of betaEvents) {
      if (!event.user_id) continue;
      eventsByUser.set(event.user_id, [...(eventsByUser.get(event.user_id) ?? []), event]);
    }

    const tasksByUser = new Map<string, TaskRow[]>();
    for (const task of betaTasks) {
      if (!task.user_id) continue;
      tasksByUser.set(task.user_id, [...(tasksByUser.get(task.user_id) ?? []), task]);
    }

    const usageByUser = new Map<string, UsageRow[]>();
    for (const row of betaUsage) {
      if (!row.user_id) continue;
      usageByUser.set(row.user_id, [...(usageByUser.get(row.user_id) ?? []), row]);
    }

    const feedbackByUser = new Map<string, FeedbackRow[]>();
    for (const row of betaFeedback) {
      if (!row.user_id) continue;
      feedbackByUser.set(row.user_id, [...(feedbackByUser.get(row.user_id) ?? []), row]);
    }

    const planByUser = new Map<string, SubscriptionRow>();
    for (const subscription of subscriptionRows.filter((row) => betaUserIds.has(row.user_id))) {
      if (!planByUser.has(subscription.user_id)) planByUser.set(subscription.user_id, subscription);
    }

    const completedFirstGenUsers = new Set(
      betaEvents
        .filter((event) => event.event_name === "first_generation_completed")
        .map((event) => event.user_id)
        .filter(Boolean) as string[],
    );
    for (const task of betaTasks.filter((task) => task.status === "completed")) {
      if (task.user_id) completedFirstGenUsers.add(task.user_id);
    }

    const firstGenerationDurations = betaProfiles.flatMap((profile) => {
      const userEvents = eventsByUser.get(profile.id) ?? [];
      const signupAt = minDate(userEvents.filter((event) => event.event_name === "signup_completed" || event.event_name === "signup_complete")) ?? profile.created_at;
      const firstCompletedAt = minDate(userEvents.filter((event) => event.event_name === "first_generation_completed" || event.event_name === "task_complete"))
        ?? minDate((tasksByUser.get(profile.id) ?? []).filter((task) => task.status === "completed"));
      if (!signupAt || !firstCompletedAt) return [];
      const duration = toTime(firstCompletedAt) - toTime(signupAt);
      return duration >= 0 ? [duration] : [];
    });

    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const activeUserIds = new Set<string>();
    const retainedUserIds = new Set<string>();

    for (const profile of betaProfiles) {
      const userEvents = eventsByUser.get(profile.id) ?? [];
      const userTasks = tasksByUser.get(profile.id) ?? [];
      const activityDates = [
        ...userEvents.map((event) => event.created_at),
        ...userTasks.map((task) => task.updated_at ?? task.created_at),
        ...(usageByUser.get(profile.id) ?? []).map((row) => row.created_at),
        ...(feedbackByUser.get(profile.id) ?? []).map((row) => row.created_at),
      ];
      const latest = maxDate(activityDates);
      if (latest && now - toTime(latest) <= sevenDaysMs) activeUserIds.add(profile.id);

      const signupAt = minDate(userEvents.filter((event) => event.event_name === "signup_completed" || event.event_name === "signup_complete")) ?? profile.created_at;
      const returnedWithinSevenDays = activityDates.some((date) => {
        const delta = toTime(date) - toTime(signupAt);
        return delta > 60_000 && delta <= sevenDaysMs;
      });
      if (returnedWithinSevenDays) retainedUserIds.add(profile.id);
    }

    const usageByType = betaTasks.reduce<Record<"text" | "image" | "video", number>>((counts, task) => {
      counts[taskBucket(task.task_type)] += 1;
      return counts;
    }, { text: 0, image: 0, video: 0 });
    const creditsConsumed = betaUsage.reduce((total, row) => total + Number(row.credits_charged ?? 0), 0);

    const betaUsers = betaProfiles.map((profile) => {
      const userEvents = eventsByUser.get(profile.id) ?? [];
      const userTasks = tasksByUser.get(profile.id) ?? [];
      const userUsage = usageByUser.get(profile.id) ?? [];
      const userFeedback = feedbackByUser.get(profile.id) ?? [];
      const invite = profile.email ? inviteByEmail.get(profile.email.toLowerCase()) : undefined;
      const betaStatus = betaStatusByUser.get(profile.id);
      const subscription = planByUser.get(profile.id);
      const upgradeClicks = userEvents.filter((event) => event.event_name === "upgrade_click").length;
      const upgradeFeedback = userFeedback.filter(hasUpgradeIntent).length;
      const returnVisits = userEvents.filter((event) => event.event_name === "return_visit").length;
      const completedGenerations = userTasks.filter((task) => task.status === "completed").length;
      const activated = completedFirstGenUsers.has(profile.id) || completedGenerations > 0;
      const userCreditsConsumed = userUsage.reduce((total, row) => total + Number(row.credits_charged ?? 0), 0);
      const averageSatisfaction = userFeedback.length
        ? userFeedback.reduce((total, row) => total + Number(row.satisfaction ?? 0), 0) / userFeedback.length
        : 0;
      const latestActivity = maxDate([
        ...userEvents.map((event) => event.created_at),
        ...userTasks.map((task) => task.updated_at ?? task.created_at),
        ...userUsage.map((row) => row.created_at),
        ...userFeedback.map((row) => row.created_at),
      ]);
      const signupAt = minDate(userEvents.filter((event) => event.event_name === "signup_completed" || event.event_name === "signup_complete")) ?? profile.created_at;
      const firstGenerationAt = minDate(userEvents.filter((event) => event.event_name === "first_generation_completed" || event.event_name === "task_complete"))
        ?? minDate(userTasks.filter((task) => task.status === "completed"));
      const timeToFirstValueMinutes = firstGenerationAt && signupAt && toTime(firstGenerationAt) >= toTime(signupAt)
        ? Number(((toTime(firstGenerationAt) - toTime(signupAt)) / 60_000).toFixed(1))
        : null;
      const activityDates = [
        ...userEvents.map((event) => event.created_at),
        ...userTasks.map((task) => task.updated_at ?? task.created_at),
        ...userUsage.map((row) => row.created_at),
        ...userFeedback.map((row) => row.created_at),
      ];
      const workflowsUsed = Array.from(new Set(userTasks.map((task) => task.task_type ?? "unknown"))).sort();
      const returnedWithinSevenDays = activityDates.some((date) => {
        const delta = toTime(date) - toTime(signupAt);
        return delta > 60_000 && delta <= sevenDaysMs;
      });
      const activeRecently = Boolean(latestActivity && now - toTime(latestActivity) <= sevenDaysMs);
      const lifecycleStatus = lifecycleFor({
        activated,
        generationCount: userTasks.length,
        creditsConsumed: userCreditsConsumed,
        returnVisits,
        latestActivity,
        now,
      });

      return {
        id: profile.id,
        email: profile.email,
        registeredAt: profile.created_at,
        firstGenerationAt,
        timeToFirstValueMinutes,
        inviteSource: invite ? `${invite.invite_code} (${invite.status})` : "direct/internal",
        latestActivity,
        betaStatus: betaStatus?.status ?? (invite?.status === "pending" ? "invited" : activated ? "active" : "invited"),
        betaStatusNote: betaStatus?.note ?? null,
        betaStatusUpdatedAt: betaStatus?.updated_at ?? null,
        currentPlan: subscription?.plans?.name ?? "Free",
        subscriptionStatus: subscription?.status ?? "none",
        lifecycleStatus,
        betaHealthScore: betaHealthScore({
          activated,
          generationCount: userTasks.length,
          creditsConsumed: userCreditsConsumed,
          returnedWithinSevenDays,
          activeRecently,
          feedbackCount: userFeedback.length,
          averageSatisfaction,
        }),
        generationCount: userTasks.length,
        completedGenerations,
        workflowsUsed,
        creditsConsumed: userCreditsConsumed,
        returnVisits,
        feedbackCount: userFeedback.length,
        upgradeIntent: upgradeClicks + upgradeFeedback,
        activationChecklist: {
          signupCompleted: userEvents.some((event) => event.event_name === "signup_completed" || event.event_name === "signup_complete"),
          workspaceCreated: userEvents.some((event) => event.event_name === "first_workspace_created"),
          firstGenerationStarted: userEvents.some((event) => event.event_name === "first_generation_started"),
          firstGenerationCompleted: activated,
          feedbackSubmitted: userFeedback.length > 0 || userEvents.some((event) => event.event_name === "feedback_submitted"),
        },
      };
    });
    const mostActive = [...betaUsers]
      .sort((a, b) => b.generationCount - a.generationCount || b.betaHealthScore - a.betaHealthScore)
      .slice(0, 5);
    const likelyToPay = [...betaUsers]
      .sort((a, b) => b.upgradeIntent - a.upgradeIntent || b.creditsConsumed - a.creditsConsumed)
      .slice(0, 5);
    const atRisk = betaUsers
      .filter((user) => user.lifecycleStatus === "AT_RISK" || (user.latestActivity && now - toTime(user.latestActivity) > sevenDaysMs && user.generationCount > 0))
      .sort((a, b) => a.betaHealthScore - b.betaHealthScore)
      .slice(0, 5);

    const feedbackCategories = betaFeedback.reduce<Record<string, number>>((counts, row) => {
      const category = classifyFeedback(row);
      counts[category] = (counts[category] ?? 0) + 1;
      return counts;
    }, {});
    const issueCounts = betaFeedback.flatMap(commonIssueLabels).reduce<Record<string, number>>((counts, label) => {
      counts[label] = (counts[label] ?? 0) + 1;
      return counts;
    }, {});
    const recommendationDenominator = betaFeedback.filter((row) => row.continue_use !== null).length;
    const recommendationCount = betaFeedback.filter((row) => row.continue_use === true).length;
    const feedbackIntelligence = {
      total: betaFeedback.length,
      averageSatisfaction: average(betaFeedback.map((row) => Number(row.satisfaction ?? 0)).filter((value) => value > 0)),
      averageResultQuality: average(betaFeedback.map((row) => Number(row.result_quality ?? 0)).filter((value) => value > 0)),
      recommendationRate: recommendationDenominator ? Number(((recommendationCount / recommendationDenominator) * 100).toFixed(1)) : 0,
      categories: ["Content quality", "Generation speed", "Usability", "Use case", "Payment intent"].map((category) => ({
        category,
        count: feedbackCategories[category] ?? 0,
      })),
      commonIssues: Object.entries(issueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([issue, count]) => ({ issue, count })),
      openCount: betaFeedback.filter((row) => row.status === "open").length,
    };
    const uniqueUsersForEvents = (...eventNames: string[]) => new Set(
      betaEvents
        .filter((event) => eventNames.includes(event.event_name))
        .map((event) => event.user_id)
        .filter(Boolean) as string[],
    ).size;

    return NextResponse.json({
      users: betaUsers,
      activation: {
        registeredUsers: betaProfiles.length,
        signupCompletedUsers: uniqueUsersForEvents("signup_completed", "signup_complete"),
        workspaceCreatedUsers: uniqueUsersForEvents("first_workspace_created"),
        firstGenerationStartedUsers: uniqueUsersForEvents("first_generation_started"),
        firstGenerationCompletedUsers: completedFirstGenUsers.size,
        feedbackSubmittedUsers: Math.max(uniqueUsersForEvents("feedback_submitted"), new Set(betaFeedback.map((row) => row.user_id).filter(Boolean)).size),
        firstGenerationCompletionRate: betaProfiles.length ? Number(((completedFirstGenUsers.size / betaProfiles.length) * 100).toFixed(1)) : 0,
        averageFirstGenerationTimeMinutes: firstGenerationDurations.length
          ? Number((firstGenerationDurations.reduce((total, value) => total + value, 0) / firstGenerationDurations.length / 60_000).toFixed(1))
          : 0,
      },
      usage: {
        totalGenerations: betaTasks.length,
        byType: usageByType,
        creditsConsumed,
      },
      retention: {
        returnedWithinSevenDays: retainedUserIds.size,
        activeUsers: activeUserIds.size,
      },
      revenueReadiness: {
        plans: Array.from(betaUsers.reduce<Map<string, number>>((counts, user) => {
          counts.set(user.currentPlan, (counts.get(user.currentPlan) ?? 0) + 1);
          return counts;
        }, new Map()).entries()).map(([plan, count]) => ({ plan, count })),
        upgradeIntentRecords: betaUsers.reduce((total, user) => total + user.upgradeIntent, 0),
        upgradeClicks: betaEvents.filter((event) => event.event_name === "upgrade_click").length,
        billingFeedback: betaFeedback.filter(hasUpgradeIntent).length,
      },
      experiment: {
        lifecycleCounts: betaUsers.reduce<Record<LifecycleStatus, number>>((counts, user) => {
          counts[user.lifecycleStatus] += 1;
          return counts;
        }, { NEW: 0, ACTIVATED: 0, ENGAGED: 0, POWER_USER: 0, AT_RISK: 0 }),
        averageHealthScore: betaUsers.length ? Number((betaUsers.reduce((total, user) => total + user.betaHealthScore, 0) / betaUsers.length).toFixed(1)) : 0,
        mostActive,
        likelyToPay,
        atRisk,
      },
      feedbackIntelligence,
      generatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load beta insights";
    console.error("[automation-factory] beta_insights_failed", { message });
    return NextResponse.json({ error: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? "Admin access required" : "Unable to load beta insights" }, { status: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? 403 : 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json() as { userId?: string; status?: unknown; note?: string | null };
    if (!body.userId || !isBetaStatus(body.status)) {
      return NextResponse.json({ error: "Invalid Beta user status update" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient()!;
    const patch = {
      user_id: body.userId,
      status: body.status,
      note: body.note?.trim() || null,
      updated_by: admin.id,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from("beta_user_statuses")
      .upsert(patch, { onConflict: "user_id" })
      .select()
      .single();
    if (error || !data) throw error ?? new Error("Unable to update Beta user status");

    await supabase.from("audit_logs").insert({
      admin_id: admin.id,
      action: "beta_user_status_updated",
      resource_type: "profile",
      resource_id: body.userId,
      metadata: { status: body.status, note: patch.note },
    });

    return NextResponse.json({ status: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Beta user status";
    console.error("[automation-factory] beta_user_status_update_failed", { message });
    return NextResponse.json({ error: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? "Admin access required" : "Unable to update Beta user status" }, { status: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? 403 : 400 });
  }
}
