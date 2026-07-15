import { getSupabaseServerClient } from "@/lib/supabase/server";

type JsonRecord = Record<string, unknown>;

export type PlanInput = {
  name?: string;
  description?: string | null;
  price?: number | string;
  credits?: number | string;
  features?: JsonRecord | string | null;
  enabled?: boolean;
};

export type UpdateSubscriptionInput = {
  subscriptionId: string;
  planId?: string;
  status?: string;
  expiresAt?: string | null;
  note?: string;
  operator?: string;
  reason?: string;
};

function store() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("BILLING_UNAVAILABLE");
  return supabase;
}

function parseFeatures(value: PlanInput["features"]) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      throw new Error("INVALID_PLAN_FEATURES");
    }
  }
  return value;
}

function normalizePlanPayload(input: PlanInput, partial = false) {
  const payload: JsonRecord = {};

  if (input.name !== undefined) {
    const name = String(input.name).trim();
    if (!name && !partial) throw new Error("PLAN_NAME_REQUIRED");
    if (name) payload.name = name;
  }

  if (input.description !== undefined) payload.description = input.description ? String(input.description) : null;
  if (input.price !== undefined) payload.price = Number(input.price);
  if (input.credits !== undefined) payload.credits = Number.parseInt(String(input.credits), 10);
  if (input.enabled !== undefined) payload.enabled = Boolean(input.enabled);

  const features = parseFeatures(input.features);
  if (features !== undefined) payload.features = features;

  if (!partial) {
    if (payload.name === undefined) throw new Error("PLAN_NAME_REQUIRED");
    if (payload.price === undefined) payload.price = 0;
    if (payload.credits === undefined) payload.credits = 0;
    if (payload.features === undefined) payload.features = {};
    if (payload.enabled === undefined) payload.enabled = true;
  }

  if (payload.price !== undefined && (!Number.isFinite(payload.price as number) || (payload.price as number) < 0)) {
    throw new Error("INVALID_PLAN_PRICE");
  }

  if (payload.credits !== undefined && (!Number.isInteger(payload.credits) || (payload.credits as number) < 0)) {
    throw new Error("INVALID_PLAN_CREDITS");
  }

  return payload;
}

async function audit(
  operator: string | undefined,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: JsonRecord,
) {
  const { error } = await store().from("audit_logs").insert({
    admin_id: operator ?? null,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
  if (error) throw error;
}

export async function addSubscriptionAdjustment(input: {
  subscriptionId: string;
  operator?: string;
  reason: string;
  beforeData: JsonRecord;
  afterData: JsonRecord;
}) {
  const { data, error } = await store()
    .from("subscription_adjustments")
    .insert({
      subscription_id: input.subscriptionId,
      operator: input.operator ?? null,
      reason: input.reason,
      before_data: input.beforeData,
      after_data: input.afterData,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getUserSubscription(userId: string) {
  const { data, error } = await store()
    .from("subscriptions")
    .select("*,plans(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function grantSubscriptionCredits(subscriptionId: string, operator?: string) {
  const { data, error } = await store().rpc("grant_subscription_credits", {
    p_subscription_id: subscriptionId,
  });
  if (error) throw error;

  await audit(operator, "subscription_credits_granted", "subscription", subscriptionId, {
    subscriptionId,
    balanceAfter: data,
  });

  return data;
}

export async function assignPlan(input: { userId: string; planId: string; operator?: string; expiresAt?: string }) {
  const supabase = store();
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: input.userId,
      plan_id: input.planId,
      status: "active",
      expires_at: input.expiresAt ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  await grantSubscriptionCredits(data.id);
  await audit(input.operator, "subscription_assigned", "subscription", data.id, {
    userId: input.userId,
    planId: input.planId,
  });

  return data;
}

export async function changePlan(input: { subscriptionId: string; planId: string; operator?: string; reason: string }) {
  return updateSubscription({
    subscriptionId: input.subscriptionId,
    planId: input.planId,
    operator: input.operator,
    reason: input.reason,
  });
}

export async function listPlans() {
  const { data, error } = await store().from("plans").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPlan(input: PlanInput, operator?: string) {
  const payload = normalizePlanPayload(input);
  const { data, error } = await store().from("plans").insert(payload).select().single();
  if (error) throw error;

  await audit(operator, "plan_created", "plan", data.id, { after: data });
  return data;
}

export async function updatePlan(id: string, input: PlanInput, operator?: string) {
  const supabase = store();
  const { data: before, error: beforeError } = await supabase.from("plans").select("*").eq("id", id).single();
  if (beforeError) throw beforeError;

  const payload = normalizePlanPayload(input, true);
  const { data, error } = await supabase.from("plans").update(payload).eq("id", id).select().single();
  if (error) throw error;

  await audit(operator, "plan_updated", "plan", id, { before, after: data });
  return data;
}

export async function disablePlan(id: string, operator?: string) {
  return updatePlan(id, { enabled: false }, operator);
}

export async function getSubscription(subscriptionId: string) {
  const { data, error } = await store()
    .from("subscriptions")
    .select("*,profiles(id,email,display_name,credits_balance),plans(id,name,price,credits)")
    .eq("id", subscriptionId)
    .single();
  if (error) throw error;
  return data;
}

export async function listSubscriptions() {
  const { data, error } = await store()
    .from("subscriptions")
    .select("*,profiles(id,email,display_name,credits_balance),plans(id,name,price,credits)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateSubscription(input: UpdateSubscriptionInput) {
  const supabase = store();
  const reason = input.note?.trim() || input.reason?.trim() || "admin_update";

  const { data: before, error: beforeError } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("id", input.subscriptionId)
    .single();
  if (beforeError) throw beforeError;

  const payload: JsonRecord = {};
  if (input.planId) payload.plan_id = input.planId;
  if (input.status) payload.status = input.status;
  if (input.expiresAt !== undefined) payload.expires_at = input.expiresAt || null;

  if (Object.keys(payload).length === 0) throw new Error("NO_SUBSCRIPTION_CHANGES");

  const { data, error } = await supabase
    .from("subscriptions")
    .update(payload)
    .eq("id", input.subscriptionId)
    .select()
    .single();
  if (error) throw error;

  await addSubscriptionAdjustment({
    subscriptionId: input.subscriptionId,
    operator: input.operator,
    reason,
    beforeData: before ?? {},
    afterData: data,
  });

  await audit(input.operator, "subscription_updated", "subscription", input.subscriptionId, {
    reason,
    before,
    after: data,
  });

  return data;
}

export async function listCreditAccounts() {
  const { data, error } = await store()
    .from("profiles")
    .select("id,email,display_name,role,status,credits_balance,created_at")
    .order("email", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listCreditTransactions(limit = 100) {
  const { data, error } = await store()
    .from("credit_transactions")
    .select("id,user_id,amount,balance_after,reason,type,status,subscription_id,content_task_id,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
