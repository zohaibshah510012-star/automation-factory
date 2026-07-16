import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentTask } from "@/lib/types";
import { trackProductEvent } from "@/lib/product-analytics";

type CreditAgent = {
  credit_cost: number;
  provider_name: string | null;
  model: string | null;
};

async function requireBillingContext(task: ContentTask) {
  const supabase = getSupabaseServerClient();
  if (!supabase || !task.userId) throw new Error("BILLING_CONFIGURATION_REQUIRED");
  return supabase;
}

async function getCreditAgent(task: ContentTask): Promise<CreditAgent> {
  const supabase = await requireBillingContext(task);
  let query = supabase.from("agents").select("credit_cost,provider_name,model").eq("enabled", true);
  const defaultAgentByTaskType: Record<string, string> = {
    image: "Image Agent",
    video: "Video Agent",
    drama: "Short Drama Producer",
  };
  query = task.agentId ? query.eq("id", task.agentId) : query.eq("agent_name", defaultAgentByTaskType[task.taskType ?? ""] ?? "Text Agent");
  const { data: agent, error } = await query.maybeSingle();
  if (error) throw new Error(`Unable to load credit pricing: ${error.message}`);
  return { credit_cost: agent?.credit_cost ?? 25, provider_name: agent?.provider_name ?? null, model: agent?.model ?? null };
}

export async function reserveCredits(task: ContentTask) {
  const supabase = await requireBillingContext(task);
  const agent = await getCreditAgent(task);
  const amount = task.creditsCharged || agent.credit_cost;
  const { error } = await supabase.rpc("reserve_task_credits", {
    p_user_id: task.userId,
    p_amount: amount,
    p_reason: `generation:${task.taskType ?? "short_video_script"}`,
    p_task_id: task.id,
  });
  if (error) throw new Error(error.message.includes("INSUFFICIENT_CREDITS") ? "INSUFFICIENT_CREDITS" : `CREDIT_RESERVATION_FAILED: ${error.message}`);
  task.creditsCharged = amount;
  return { amount, provider: agent.provider_name, model: agent.model };
}

export async function commitCredits(task: ContentTask, pricing?: { provider: string | null; model: string | null }) {
  const supabase = await requireBillingContext(task);
  const { error } = await supabase.rpc("commit_task_credits", { p_task_id: task.id });
  if (error) throw new Error(`CREDIT_COMMIT_FAILED: ${error.message}`);

  const { data: existing, error: existingError } = await supabase
    .from("usage_history")
    .select("id")
    .eq("content_task_id", task.id)
    .maybeSingle();
  if (existingError) {
    console.error("[automation-factory] usage_history_check_failed", { taskId: task.id, message: existingError.message });
    return {};
  }
  if (existing) return { usageHistoryId: existing.id as string };

  const { data: usage, error: usageError } = await supabase.from("usage_history").insert({
      user_id: task.userId,
      content_task_id: task.id,
      capability: task.taskType ?? "short_video_script",
      provider: pricing?.provider ?? null,
      model: pricing?.model ?? null,
      credits_charged: task.creditsCharged ?? 0,
    }).select("id").single();
  if (usageError) {
    console.error("[automation-factory] usage_history_write_failed", { taskId: task.id, message: usageError.message });
    return {};
  }
  await trackProductEvent({
    eventName: "credits_consumed",
    userId: task.userId,
    surface: "billing",
    path: "credits-service",
    properties: { taskId: task.id, taskType: task.taskType, credits: task.creditsCharged ?? 0 },
  });
  return { usageHistoryId: usage?.id as string | undefined };
}

export async function refundCredits(task: ContentTask) {
  const supabase = await requireBillingContext(task);
  const { error } = await supabase.rpc("refund_task_credits", { p_task_id: task.id });
  if (error && !error.message.includes("CREDIT_RESERVATION_NOT_FOUND")) {
    throw new Error(`CREDIT_REFUND_FAILED: ${error.message}`);
  }
  task.creditsCharged = 0;
}
