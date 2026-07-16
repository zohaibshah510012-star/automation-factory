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
  status: string;
  content_feedback: string | null;
  suggestion: string | null;
  created_at: string;
};

type SubscriptionRow = {
  user_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  plans: { name: string; price: number; credits: number } | null;
};

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
  return /billing|upgrade|price|pricing|plan|credits|付费|升级|套餐|额度/.test(haystack);
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = getSupabaseServerClient()!;

    const [profiles, invites, events, tasks, usage, subscriptions, feedback] = await Promise.all([
      supabase.from("profiles").select("id,email,created_at,credits_balance").order("created_at", { ascending: false }).limit(500),
      supabase.from("beta_invites").select("email,invite_code,status,created_at,used_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("product_events").select("user_id,event_name,surface,path,properties,created_at").order("created_at", { ascending: false }).limit(5000),
      supabase.from("content_tasks").select("id,user_id,task_type,status,credits_charged,created_at,updated_at").order("created_at", { ascending: false }).limit(5000),
      supabase.from("usage_history").select("user_id,capability,credits_charged,created_at").order("created_at", { ascending: false }).limit(5000),
      supabase.from("subscriptions").select("user_id,status,started_at,expires_at,plans(name,price,credits)").order("created_at", { ascending: false }).limit(1000),
      supabase.from("user_feedback").select("user_id,category,satisfaction,status,content_feedback,suggestion,created_at").order("created_at", { ascending: false }).limit(1000),
    ]);

    for (const result of [profiles, invites, events, tasks, usage, subscriptions, feedback]) {
      if (result.error) throw result.error;
    }

    const profileRows = (profiles.data ?? []) as ProfileRow[];
    const inviteRows = (invites.data ?? []) as InviteRow[];
    const eventRows = (events.data ?? []) as EventRow[];
    const taskRows = (tasks.data ?? []) as TaskRow[];
    const usageRows = (usage.data ?? []) as UsageRow[];
    const subscriptionRows = (subscriptions.data ?? []) as unknown as SubscriptionRow[];
    const feedbackRows = (feedback.data ?? []) as FeedbackRow[];

    const inviteByEmail = new Map(inviteRows.map((invite) => [invite.email.toLowerCase(), invite]));
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
      const subscription = planByUser.get(profile.id);
      const upgradeClicks = userEvents.filter((event) => event.event_name === "upgrade_click").length;
      const upgradeFeedback = userFeedback.filter(hasUpgradeIntent).length;
      const latestActivity = maxDate([
        ...userEvents.map((event) => event.created_at),
        ...userTasks.map((task) => task.updated_at ?? task.created_at),
        ...userUsage.map((row) => row.created_at),
        ...userFeedback.map((row) => row.created_at),
      ]);

      return {
        id: profile.id,
        email: profile.email,
        registeredAt: profile.created_at,
        inviteSource: invite ? `${invite.invite_code} (${invite.status})` : "direct/internal",
        latestActivity,
        currentPlan: subscription?.plans?.name ?? "Free",
        subscriptionStatus: subscription?.status ?? "none",
        generationCount: userTasks.length,
        creditsConsumed: userUsage.reduce((total, row) => total + Number(row.credits_charged ?? 0), 0),
        upgradeIntent: upgradeClicks + upgradeFeedback,
      };
    });

    return NextResponse.json({
      users: betaUsers,
      activation: {
        registeredUsers: betaProfiles.length,
        firstGenerationCompletedUsers: completedFirstGenUsers.size,
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
      generatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load beta insights";
    console.error("[automation-factory] beta_insights_failed", { message });
    return NextResponse.json({ error: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? "Admin access required" : "Unable to load beta insights" }, { status: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? 403 : 500 });
  }
}
