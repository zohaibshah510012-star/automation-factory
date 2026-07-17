import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type JsonRecord = Record<string, unknown>;

type ProfileRow = {
  id: string;
  email: string | null;
  created_at: string;
  updated_at: string | null;
};

type InviteRow = {
  id: string;
  email: string;
  invite_code: string;
  status: string;
  created_at: string;
  used_at: string | null;
};

type EventRow = {
  user_id: string | null;
  event_name: string;
  properties: JsonRecord | null;
  created_at: string;
};

type TaskRow = {
  id: string;
  user_id: string | null;
  task_type: string | null;
  status: string;
  credits_charged: number | null;
  duration_ms: number | null;
  created_at: string;
  updated_at: string;
};

type UsageRow = {
  user_id: string | null;
  provider: string | null;
  model: string | null;
  credits_charged: number;
  created_at: string;
};

type FeedbackRow = {
  user_id: string | null;
  satisfaction: number;
  result_quality: number | null;
  use_case: string | null;
  continue_use: boolean | null;
  status: string;
  category: string;
  content_feedback: string | null;
  suggestion: string | null;
  created_at: string;
};

type CostRow = {
  user_id: string | null;
  estimated_cost: number;
  credits_used: number;
  created_at: string;
};

type CohortRow = {
  id: string;
  name: string;
  target_users: number;
  status: "draft" | "running" | "completed";
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type CohortMemberRow = {
  id: string;
  cohort_id: string;
  user_id: string | null;
  invite_id: string | null;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type ReviewNoteRow = {
  id: string;
  user_id: string | null;
  cohort_id: string | null;
  content_task_id: string | null;
  category: "feedback" | "need" | "bug" | "feature_request" | "business_signal";
  priority: "low" | "medium" | "high";
  note: string;
  status: "open" | "reviewing" | "resolved";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const REVIEW_CATEGORIES = ["feedback", "need", "bug", "feature_request", "business_signal"] as const;
const REVIEW_PRIORITIES = ["low", "medium", "high"] as const;
const REVIEW_STATUSES = ["open", "reviewing", "resolved"] as const;
const COHORT_STATUSES = ["draft", "running", "completed"] as const;

function toTime(value?: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function minDate(rows: Array<{ created_at: string }>) {
  return rows.map((row) => row.created_at).sort()[0] ?? null;
}

function average(values: number[]) {
  return values.length ? Number((values.reduce((total, value) => total + value, 0) / values.length).toFixed(1)) : 0;
}

function percent(numerator: number, denominator: number) {
  return denominator ? Number(((numerator / denominator) * 100).toFixed(1)) : 0;
}

function cleanText(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isReviewCategory(value: unknown): value is ReviewNoteRow["category"] {
  return REVIEW_CATEGORIES.includes(value as ReviewNoteRow["category"]);
}

function isReviewPriority(value: unknown): value is ReviewNoteRow["priority"] {
  return REVIEW_PRIORITIES.includes(value as ReviewNoteRow["priority"]);
}

function isReviewStatus(value: unknown): value is ReviewNoteRow["status"] {
  return REVIEW_STATUSES.includes(value as ReviewNoteRow["status"]);
}

function isCohortStatus(value: unknown): value is CohortRow["status"] {
  return COHORT_STATUSES.includes(value as CohortRow["status"]);
}

function hasUpgradeIntent(feedback: FeedbackRow) {
  const haystack = `${feedback.category} ${feedback.use_case ?? ""} ${feedback.content_feedback ?? ""} ${feedback.suggestion ?? ""}`.toLowerCase();
  return /billing|upgrade|price|pricing|plan|credits|pay|paid|budget|subscription/.test(haystack);
}

function workflowType(task: TaskRow) {
  return task.task_type ?? "unknown";
}

function firstCompletedAt(events: EventRow[], tasks: TaskRow[]) {
  return (
    minDate(events.filter((event) => event.event_name === "first_generation_completed" || event.event_name === "task_complete")) ??
    minDate(tasks.filter((task) => task.status === "completed"))
  );
}

function latestDate(values: Array<string | null | undefined>) {
  return values.filter(Boolean).sort().at(-1) ?? null;
}

async function audit(adminId: string, action: string, resourceType: string, resourceId: string, metadata: JsonRecord) {
  const supabase = getSupabaseServerClient()!;
  await supabase.from("audit_logs").insert({
    admin_id: adminId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = getSupabaseServerClient()!;

    const [
      profiles,
      invites,
      events,
      tasks,
      usage,
      feedback,
      costs,
      cohorts,
      members,
      notes,
    ] = await Promise.all([
      supabase.from("profiles").select("id,email,created_at,updated_at").order("created_at", { ascending: false }).limit(1000),
      supabase.from("beta_invites").select("id,email,invite_code,status,created_at,used_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("product_events").select("user_id,event_name,properties,created_at").order("created_at", { ascending: false }).limit(5000),
      supabase.from("content_tasks").select("id,user_id,task_type,status,credits_charged,duration_ms,created_at,updated_at").order("created_at", { ascending: false }).limit(5000),
      supabase.from("usage_history").select("user_id,provider,model,credits_charged,created_at").order("created_at", { ascending: false }).limit(5000),
      supabase.from("user_feedback").select("user_id,satisfaction,result_quality,use_case,continue_use,status,category,content_feedback,suggestion,created_at").order("created_at", { ascending: false }).limit(1000),
      supabase.from("ai_provider_costs").select("user_id,estimated_cost,credits_used,created_at").order("created_at", { ascending: false }).limit(5000),
      supabase.from("beta_cohorts").select("id,name,target_users,status,description,created_by,created_at,updated_at").order("created_at", { ascending: false }).limit(20),
      supabase.from("beta_cohort_members").select("id,cohort_id,user_id,invite_id,status,note,created_at,updated_at").order("updated_at", { ascending: false }).limit(1000),
      supabase.from("beta_review_notes").select("id,user_id,cohort_id,content_task_id,category,priority,note,status,created_by,created_at,updated_at").order("created_at", { ascending: false }).limit(200),
    ]);

    for (const result of [profiles, invites, events, tasks, usage, feedback, costs, cohorts, members, notes]) {
      if (result.error) throw result.error;
    }

    const profileRows = (profiles.data ?? []) as ProfileRow[];
    const inviteRows = (invites.data ?? []) as InviteRow[];
    const eventRows = (events.data ?? []) as EventRow[];
    const taskRows = (tasks.data ?? []) as TaskRow[];
    const usageRows = (usage.data ?? []) as UsageRow[];
    const feedbackRows = (feedback.data ?? []) as FeedbackRow[];
    const costRows = (costs.data ?? []) as CostRow[];
    const cohortRows = (cohorts.data ?? []) as CohortRow[];
    const memberRows = (members.data ?? []) as CohortMemberRow[];
    const noteRows = (notes.data ?? []) as ReviewNoteRow[];

    const invitedEmails = new Set(inviteRows.map((invite) => invite.email.toLowerCase()));
    const signupUserIds = new Set(
      eventRows
        .filter((event) => event.event_name === "signup_completed" || event.event_name === "signup_complete")
        .map((event) => event.user_id)
        .filter(Boolean) as string[],
    );
    const cohortUserIds = new Set(memberRows.map((member) => member.user_id).filter(Boolean) as string[]);
    const betaProfiles = profileRows.filter((profile) => {
      const email = profile.email?.toLowerCase();
      return (email && invitedEmails.has(email)) || signupUserIds.has(profile.id) || cohortUserIds.has(profile.id);
    });
    const betaUserIds = new Set(betaProfiles.map((profile) => profile.id));
    const profileById = new Map(profileRows.map((profile) => [profile.id, profile]));
    const inviteById = new Map(inviteRows.map((invite) => [invite.id, invite]));

    const eventsByUser = new Map<string, EventRow[]>();
    for (const event of eventRows) {
      if (event.user_id && betaUserIds.has(event.user_id)) {
        eventsByUser.set(event.user_id, [...(eventsByUser.get(event.user_id) ?? []), event]);
      }
    }

    const tasksByUser = new Map<string, TaskRow[]>();
    for (const task of taskRows) {
      if (task.user_id && betaUserIds.has(task.user_id)) {
        tasksByUser.set(task.user_id, [...(tasksByUser.get(task.user_id) ?? []), task]);
      }
    }

    const betaTasks = taskRows.filter((task) => task.user_id && betaUserIds.has(task.user_id));
    const betaUsage = usageRows.filter((row) => row.user_id && betaUserIds.has(row.user_id));
    const betaFeedback = feedbackRows.filter((row) => row.user_id && betaUserIds.has(row.user_id));
    const betaCosts = costRows.filter((row) => row.user_id && betaUserIds.has(row.user_id));

    const activatedUserIds = new Set<string>();
    const completedUserIds = new Set<string>();
    const timeToValueMinutes: number[] = [];

    for (const profile of betaProfiles) {
      const userEvents = eventsByUser.get(profile.id) ?? [];
      const userTasks = tasksByUser.get(profile.id) ?? [];
      const signupAt = minDate(userEvents.filter((event) => event.event_name === "signup_completed" || event.event_name === "signup_complete")) ?? profile.created_at;
      const firstValueAt = firstCompletedAt(userEvents, userTasks);
      if (firstValueAt) {
        activatedUserIds.add(profile.id);
        const duration = toTime(firstValueAt) - toTime(signupAt);
        if (duration >= 0) timeToValueMinutes.push(Number((duration / 60_000).toFixed(1)));
      }
      if (userEvents.some((event) => event.event_name === "feedback_submitted") || betaFeedback.some((row) => row.user_id === profile.id)) {
        completedUserIds.add(profile.id);
      }
    }

    for (const member of memberRows) {
      if (member.user_id && member.status === "completed") completedUserIds.add(member.user_id);
      if (member.user_id && ["first_generation", "result", "feedback", "completed"].includes(member.status)) activatedUserIds.add(member.user_id);
    }

    const workflowCounts = betaTasks.reduce<Record<string, number>>((counts, task) => {
      const key = workflowType(task);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});
    const mostUsedWorkflow = Object.entries(workflowCounts).sort((a, b) => b[1] - a[1])[0] ?? null;
    const completedTasks = betaTasks.filter((task) => task.status === "completed").length;
    const failedTasks = betaTasks.filter((task) => task.status === "failed").length;
    const creditsUsed = betaUsage.reduce((total, row) => total + Number(row.credits_charged ?? 0), 0);
    const estimatedCost = betaCosts.reduce((total, row) => total + Number(row.estimated_cost ?? 0), 0);
    const upgradeClicks = eventRows.filter((event) => event.user_id && betaUserIds.has(event.user_id) && event.event_name === "upgrade_click").length;
    const pricingViews = eventRows.filter((event) => event.user_id && betaUserIds.has(event.user_id) && event.event_name === "pricing_view").length;
    const upgradeFeedback = betaFeedback.filter(hasUpgradeIntent).length;

    const enrichedNotes = noteRows.map((note) => ({
      ...note,
      userEmail: note.user_id ? profileById.get(note.user_id)?.email ?? null : null,
      cohortName: note.cohort_id ? cohortRows.find((cohort) => cohort.id === note.cohort_id)?.name ?? null : null,
    }));

    const cohortsWithProgress = cohortRows.map((cohort) => {
      const cohortMembers = memberRows.filter((member) => member.cohort_id === cohort.id);
      const invited = cohortMembers.filter((member) => member.status === "invited").length || inviteRows.filter((invite) => invite.status !== "revoked").length;
      const signup = cohortMembers.filter((member) => ["signup", "workspace", "first_generation", "result", "feedback", "completed"].includes(member.status)).length || betaProfiles.length;
      const firstGeneration = cohortMembers.filter((member) => ["first_generation", "result", "feedback", "completed"].includes(member.status)).length || activatedUserIds.size;
      const feedbackCount = cohortMembers.filter((member) => ["feedback", "completed"].includes(member.status)).length || completedUserIds.size;
      return {
        ...cohort,
        members: cohortMembers.map((member) => ({
          ...member,
          email: member.user_id ? profileById.get(member.user_id)?.email ?? null : member.invite_id ? inviteById.get(member.invite_id)?.email ?? null : null,
        })),
        progress: {
          invited,
          signup,
          firstGeneration,
          feedback: feedbackCount,
          completed: cohortMembers.filter((member) => member.status === "completed").length || completedUserIds.size,
          targetUsers: cohort.target_users,
        },
      };
    });

    const activeCohort = cohortsWithProgress.find((cohort) => cohort.status === "running") ?? cohortsWithProgress[0] ?? null;
    const targetUsers = activeCohort?.target_users ?? 5;
    const latestActivity = latestDate([
      ...eventRows.filter((event) => event.user_id && betaUserIds.has(event.user_id)).map((event) => event.created_at),
      ...betaTasks.map((task) => task.updated_at ?? task.created_at),
      ...betaFeedback.map((row) => row.created_at),
    ]);

    return NextResponse.json(
      {
        setup: {
          targetUsers,
          hasActiveCohort: Boolean(activeCohort),
          recommendedWorkflow: "short_drama",
          demoInvitePath: "/admin/beta",
          userJourney: ["Invite", "Signup", "Workspace", "First Generation", "Result", "Feedback"],
          timingGoals: [
            { label: "1 minute", goal: "User understands they should click Create and choose AI Short Drama." },
            { label: "5 minutes", goal: "User starts or completes first generation." },
            { label: "10 minutes", goal: "User reviews result and submits feedback." },
          ],
        },
        cohorts: cohortsWithProgress,
        metrics: {
          betaUsers: {
            invited: inviteRows.filter((invite) => invite.status !== "revoked").length,
            activated: activatedUserIds.size,
            completed: completedUserIds.size,
            registered: betaProfiles.length,
            target: targetUsers,
          },
          product: {
            firstGenerationRate: percent(activatedUserIds.size, betaProfiles.length || targetUsers),
            completionRate: percent(completedTasks, betaTasks.length),
            averageTimeToValueMinutes: average(timeToValueMinutes),
            mostUsedWorkflow: mostUsedWorkflow ? { name: mostUsedWorkflow[0], count: mostUsedWorkflow[1] } : null,
            totalTasks: betaTasks.length,
            completedTasks,
            failedTasks,
          },
          business: {
            creditsUsed,
            estimatedCost: Number(estimatedCost.toFixed(2)),
            feedbackScore: average(betaFeedback.map((row) => Number(row.satisfaction ?? 0)).filter((value) => value > 0)),
            resultQuality: average(betaFeedback.map((row) => Number(row.result_quality ?? 0)).filter((value) => value > 0)),
            upgradeInterest: upgradeClicks + pricingViews + upgradeFeedback,
            feedbackCount: betaFeedback.length,
          },
          latestActivity,
        },
        reviewNotes: {
          notes: enrichedNotes,
          open: noteRows.filter((note) => note.status === "open").length,
          reviewing: noteRows.filter((note) => note.status === "reviewing").length,
          resolved: noteRows.filter((note) => note.status === "resolved").length,
          byCategory: REVIEW_CATEGORIES.map((category) => ({
            category,
            count: noteRows.filter((note) => note.category === category).length,
          })),
        },
        generatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load founder view";
    console.error("[automation-factory] founder_view_failed", { message });
    return NextResponse.json(
      { error: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? "Admin access required" : "Unable to load founder view" },
      { status: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? 403 : 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = (await request.json()) as JsonRecord;
    const action = body.action;
    const supabase = getSupabaseServerClient()!;

    if (action === "create_default_cohort") {
      const targetUsers = Number(body.targetUsers ?? 5);
      if (!Number.isInteger(targetUsers) || targetUsers < 1 || targetUsers > 50) {
        return NextResponse.json({ error: "Target users must be between 1 and 50" }, { status: 400 });
      }
      const name = cleanText(body.name, 120) || "Founder Beta Cohort 1";
      const description =
        cleanText(body.description, 1000) ||
        "Founder-led validation cohort: invite 5 users, get them to first Short Drama generation, collect feedback, and decide the next product bet.";
      const { data, error } = await supabase
        .from("beta_cohorts")
        .insert({ name, target_users: targetUsers, status: "running", description, created_by: admin.id })
        .select()
        .single();
      if (error || !data) throw error ?? new Error("Unable to create Beta cohort");
      await audit(admin.id, "beta_cohort_created", "beta_cohort", data.id, { name, targetUsers });
      return NextResponse.json({ cohort: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    if (action === "create_review_note") {
      const category = isReviewCategory(body.category) ? body.category : null;
      const priority = isReviewPriority(body.priority) ? body.priority : "medium";
      const note = cleanText(body.note, 4000);
      if (!category || !note) return NextResponse.json({ error: "Category and note are required" }, { status: 400 });
      const payload = {
        user_id: cleanText(body.userId, 64) || null,
        cohort_id: cleanText(body.cohortId, 64) || null,
        content_task_id: cleanText(body.contentTaskId, 64) || null,
        category,
        priority,
        note,
        status: "open",
        created_by: admin.id,
      };
      const { data, error } = await supabase.from("beta_review_notes").insert(payload).select().single();
      if (error || !data) throw error ?? new Error("Unable to create review note");
      await audit(admin.id, "beta_review_note_created", "beta_review_note", data.id, { category, priority });
      return NextResponse.json({ note: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ error: "Unsupported founder action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update founder view";
    console.error("[automation-factory] founder_view_update_failed", { message });
    return NextResponse.json(
      { error: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? "Admin access required" : "Unable to update founder view" },
      { status: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? 403 : 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = (await request.json()) as JsonRecord;
    const action = body.action;
    const supabase = getSupabaseServerClient()!;

    if (action === "update_review_note_status") {
      const noteId = cleanText(body.noteId, 64);
      const status = isReviewStatus(body.status) ? body.status : null;
      if (!noteId || !status) return NextResponse.json({ error: "Valid noteId and status are required" }, { status: 400 });
      const { data, error } = await supabase
        .from("beta_review_notes")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", noteId)
        .select()
        .single();
      if (error || !data) throw error ?? new Error("Unable to update review note");
      await audit(admin.id, "beta_review_note_status_updated", "beta_review_note", noteId, { status });
      return NextResponse.json({ note: data }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "update_cohort_status") {
      const cohortId = cleanText(body.cohortId, 64);
      const status = isCohortStatus(body.status) ? body.status : null;
      if (!cohortId || !status) return NextResponse.json({ error: "Valid cohortId and status are required" }, { status: 400 });
      const { data, error } = await supabase
        .from("beta_cohorts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", cohortId)
        .select()
        .single();
      if (error || !data) throw error ?? new Error("Unable to update cohort");
      await audit(admin.id, "beta_cohort_status_updated", "beta_cohort", cohortId, { status });
      return NextResponse.json({ cohort: data }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json({ error: "Unsupported founder action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update founder view";
    console.error("[automation-factory] founder_view_patch_failed", { message });
    return NextResponse.json(
      { error: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? "Admin access required" : "Unable to update founder view" },
      { status: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? 403 : 400 },
    );
  }
}
