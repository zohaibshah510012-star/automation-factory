import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ProductEventName =
  | "page_view"
  | "cta_click"
  | "signup_complete"
  | "template_view"
  | "template_select"
  | "task_create"
  | "task_complete"
  | "billing_view"
  | "upgrade_click";

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

export type FeedbackInput = {
  userId: string;
  satisfaction: number;
  category?: string;
  contentFeedback?: string;
  suggestion?: string;
  source?: string;
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
      source: input.source ?? "dashboard",
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? "Unable to save feedback");
  return data;
}

export async function listAdminFeedback() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("FEEDBACK_STORE_UNAVAILABLE");

  const { data, error } = await supabase
    .from("user_feedback")
    .select("*,profiles(email,display_name)")
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
