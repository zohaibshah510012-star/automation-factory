import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ProviderUsage = {
  inputTokens?: number | null;
  outputTokens?: number | null;
  estimatedCost?: number | null;
};

type CostStatus = "completed" | "failed" | "processing";

type CostInput = {
  userId?: string | null;
  contentTaskId?: string | null;
  aiGenerationId?: string | null;
  usageHistoryId?: string | null;
  provider: string | null | undefined;
  model?: string | null;
  taskType?: string | null;
  usage?: ProviderUsage | null;
  creditsUsed?: number | null;
  status?: CostStatus;
  error?: string | null;
};

function store() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("AI_COST_STORE_UNAVAILABLE");
  return supabase;
}

function costTrackingEnabled() {
  return (process.env.AI_COST_TRACKING_ENABLED ?? "true").toLowerCase() !== "false";
}

function parseNumber(value: string | undefined, fallback: number) {
  if (!value?.trim()) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dailyLimitForTier(tier: "free" | "pro") {
  return tier === "pro"
    ? parseNumber(process.env.DAILY_GENERATION_LIMIT_PRO, 100)
    : parseNumber(process.env.DAILY_GENERATION_LIMIT_FREE, 10);
}

function startOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
}

function providerCostPerMillion(provider: string, direction: "input" | "output") {
  const key = `${provider.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_${direction.toUpperCase()}_COST_PER_1M_USD`;
  return parseNumber(process.env[key], 0);
}

export function estimateProviderCost(input: { provider: string; inputTokens?: number | null; outputTokens?: number | null; creditsUsed?: number | null; explicitCost?: number | null }) {
  if (typeof input.explicitCost === "number" && Number.isFinite(input.explicitCost)) return Number(input.explicitCost.toFixed(6));

  const tokenCost =
    ((input.inputTokens ?? 0) / 1_000_000) * providerCostPerMillion(input.provider, "input") +
    ((input.outputTokens ?? 0) / 1_000_000) * providerCostPerMillion(input.provider, "output");
  if (tokenCost > 0) return Number(tokenCost.toFixed(6));

  return Number(((input.creditsUsed ?? 0) * parseNumber(process.env.PROVIDER_COST_PER_CREDIT_USD, 0.01)).toFixed(6));
}

export async function assertDailyGenerationLimit(userId: string) {
  const supabase = store();
  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id,status,expires_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subscriptionError) throw subscriptionError;

  const tier = subscription ? "pro" : "free";
  const limit = dailyLimitForTier(tier);
  if (limit <= 0) return;

  const { count, error } = await supabase
    .from("content_tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfUtcDay());
  if (error) throw error;
  if ((count ?? 0) >= limit) throw new Error("Daily generation limit reached");
}

export async function recordAiProviderCost(input: CostInput) {
  if (!costTrackingEnabled()) return;
  const provider = input.provider ?? "unknown";
  const inputTokens = input.usage?.inputTokens ?? null;
  const outputTokens = input.usage?.outputTokens ?? null;
  const creditsUsed = input.creditsUsed ?? 0;
  const estimatedCost = estimateProviderCost({
    provider,
    inputTokens,
    outputTokens,
    creditsUsed,
    explicitCost: input.usage?.estimatedCost,
  });

  const { error } = await store().from("ai_provider_costs").insert({
    user_id: input.userId ?? null,
    content_task_id: input.contentTaskId ?? null,
    ai_generation_id: input.aiGenerationId ?? null,
    usage_history_id: input.usageHistoryId ?? null,
    provider,
    model: input.model ?? null,
    task_type: input.taskType ?? null,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    estimated_cost: estimatedCost,
    credits_used: creditsUsed,
    status: input.status ?? "completed",
    error: input.error ?? null,
  });
  if (error) console.error("[automation-factory] ai_cost_write_failed", { message: error.message, provider, contentTaskId: input.contentTaskId });
}

export async function getCostOverview() {
  const since = startOfUtcDay();
  const { data, error } = await store()
    .from("ai_provider_costs")
    .select("provider,model,task_type,estimated_cost,credits_used,status,created_at")
    .gte("created_at", since);
  if (error) {
    console.error("[automation-factory] ai_cost_overview_unavailable", { message: error.message });
    return {
      today: { aiCalls: 0, creditsConsumed: 0, estimatedProviderCost: 0 },
      byProvider: Object.fromEntries(["deepseek", "openai", "flux", "kling", "runway"].map((provider) => [provider, { calls: 0, credits: 0, estimatedCost: 0, failed: 0 }])),
      trackingAvailable: false,
    };
  }

  const rows = data ?? [];
  const byProvider = rows.reduce<Record<string, { calls: number; credits: number; estimatedCost: number; failed: number }>>((grouped, row) => {
    const provider = row.provider ?? "unknown";
    grouped[provider] = grouped[provider] ?? { calls: 0, credits: 0, estimatedCost: 0, failed: 0 };
    grouped[provider].calls += 1;
    grouped[provider].credits += Number(row.credits_used ?? 0);
    grouped[provider].estimatedCost = Number((grouped[provider].estimatedCost + Number(row.estimated_cost ?? 0)).toFixed(6));
    if (row.status === "failed") grouped[provider].failed += 1;
    return grouped;
  }, {});

  for (const provider of ["deepseek", "openai", "flux", "kling", "runway"]) {
    byProvider[provider] = byProvider[provider] ?? { calls: 0, credits: 0, estimatedCost: 0, failed: 0 };
  }

  return {
    today: {
      aiCalls: rows.length,
      creditsConsumed: rows.reduce((total, row) => total + Number(row.credits_used ?? 0), 0),
      estimatedProviderCost: Number(rows.reduce((total, row) => total + Number(row.estimated_cost ?? 0), 0).toFixed(6)),
    },
    byProvider,
    trackingAvailable: true,
  };
}
