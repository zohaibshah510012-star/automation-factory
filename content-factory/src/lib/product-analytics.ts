import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ProductEventName =
  | "page_view"
  | "cta_click"
  | "signup_complete"
  | "signup_completed"
  | "first_workspace_created"
  | "template_view"
  | "template_select"
  | "workflow_created"
  | "first_workflow_created"
  | "task_create"
  | "first_generation_started"
  | "second_generation_started"
  | "third_generation_started"
  | "task_complete"
  | "generation_failed"
  | "first_generation_completed"
  | "first_asset_created"
  | "credits_consumed"
  | "return_visit"
  | "billing_view"
  | "pricing_view"
  | "upgrade_click"
  | "feedback_submitted";

type ProductEventInput = {
  eventName: ProductEventName;
  userId?: string | null;
  anonymousId?: string | null;
  surface?: string;
  path?: string | null;
  properties?: Record<string, unknown>;
  userAgent?: string | null;
  referrer?: string | null;
};

export async function trackProductEvent(input: ProductEventInput) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("product_events").insert({
    user_id: input.userId ?? null,
    anonymous_id: input.anonymousId ?? null,
    event_name: input.eventName,
    surface: input.surface ?? "unknown",
    path: input.path ?? null,
    properties: input.properties ?? {},
    user_agent: input.userAgent ?? null,
    referrer: input.referrer ?? null,
  });
}

export async function trackProductEventOnce(input: ProductEventInput & { userId: string }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { data } = await supabase
    .from("product_events")
    .select("id")
    .eq("user_id", input.userId)
    .eq("event_name", input.eventName)
    .maybeSingle();
  if (data) return;
  await trackProductEvent(input);
}

export async function trackGenerationStartedMilestone(input: {
  userId: string;
  taskId: string;
  taskType?: string | null;
  surface: string;
  path: string;
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const { count, error } = await supabase
    .from("content_tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId);
  if (error) return;

  const eventName =
    count === 1 ? "first_generation_started"
      : count === 2 ? "second_generation_started"
        : count === 3 ? "third_generation_started"
          : null;

  if (!eventName) return;
  await trackProductEventOnce({
    eventName,
    userId: input.userId,
    surface: input.surface,
    path: input.path,
    properties: { taskId: input.taskId, taskType: input.taskType },
  });
}

export type FeedbackInput = {
  userId: string;
  satisfaction: number;
  category?: string;
  contentFeedback?: string;
  suggestion?: string;
  resultQuality?: number | null;
  useCase?: string | null;
  continueUse?: boolean | null;
  source?: string;
  contentTaskId?: string | null;
};

export async function createUserFeedback(input: FeedbackInput) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("FEEDBACK_STORE_UNAVAILABLE");

  const { data, error } = await supabase
    .from("user_feedback")
    .insert({
      user_id: input.userId,
      satisfaction: input.satisfaction,
      category: input.category ?? "general",
      content_feedback: input.contentFeedback ?? null,
      suggestion: input.suggestion ?? null,
      result_quality: input.resultQuality ?? null,
      use_case: input.useCase ?? null,
      continue_use: input.continueUse ?? null,
      source: input.source ?? "dashboard",
      content_task_id: input.contentTaskId ?? null,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to save feedback");
  await trackProductEvent({
    eventName: "feedback_submitted",
    userId: input.userId,
    surface: "feedback",
    path: input.source ?? "dashboard",
    properties: {
      feedbackId: data.id,
      category: input.category ?? "general",
      satisfaction: input.satisfaction,
      resultQuality: input.resultQuality ?? null,
      useCase: input.useCase ?? null,
      continueUse: input.continueUse ?? null,
      contentTaskId: input.contentTaskId ?? null,
    },
  });
  return data;
}

export async function listAdminFeedback() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("FEEDBACK_STORE_UNAVAILABLE");

  const { data, error } = await supabase
    .from("user_feedback")
    .select("*,profiles(email,display_name),content_tasks(topic,title,task_type,status)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateFeedbackStatus(id: string, status: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("FEEDBACK_STORE_UNAVAILABLE");

  const { data, error } = await supabase
    .from("user_feedback")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to update feedback");
  return data;
}
