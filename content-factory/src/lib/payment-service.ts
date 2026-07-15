import { assignPlan } from "@/lib/billing-service";
import { getPaymentProvider, type PaymentProviderName } from "@/lib/payment-provider";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ProviderInput = {
  provider: PaymentProviderName;
  enabled?: boolean;
  mode?: "sandbox" | "production";
  status?: "configured" | "disabled" | "unavailable";
};

type VerifyPaymentOptions = {
  userId?: string;
  allowAdmin?: boolean;
};

function store() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("PAYMENT_STORE_UNAVAILABLE");
  return supabase;
}

function providerName(value: unknown): PaymentProviderName {
  return value === "stripe" || value === "paypal" || value === "mock" ? value : "mock";
}

async function audit(operator: string | undefined, action: string, resourceId: string, metadata: Record<string, unknown>) {
  const { error } = await store().from("audit_logs").insert({
    admin_id: operator ?? null,
    action,
    resource_type: "payment",
    resource_id: resourceId,
    metadata,
  });
  if (error) throw error;
}

export async function listPaymentProviders() {
  const { data, error } = await store().from("payment_providers").select("*").order("provider", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertPaymentProvider(input: ProviderInput, operator?: string) {
  const payload = {
    provider: input.provider,
    enabled: Boolean(input.enabled),
    mode: input.mode ?? "sandbox",
    status: input.enabled ? input.status ?? "configured" : "disabled",
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await store()
    .from("payment_providers")
    .upsert(payload, { onConflict: "provider" })
    .select()
    .single();
  if (error) throw error;
  await audit(operator, "payment_provider_saved", data.id, { provider: data.provider, enabled: data.enabled, mode: data.mode });
  return data;
}

export async function updatePaymentProvider(id: string, input: Partial<ProviderInput>, operator?: string) {
  const payload = {
    ...(input.enabled !== undefined ? { enabled: Boolean(input.enabled) } : {}),
    ...(input.mode ? { mode: input.mode } : {}),
    ...(input.status ? { status: input.status } : {}),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await store().from("payment_providers").update(payload).eq("id", id).select().single();
  if (error) throw error;
  await audit(operator, "payment_provider_updated", id, { after: data });
  return data;
}

export async function listPayments() {
  const { data, error } = await store()
    .from("payments")
    .select("*,profiles(email,display_name),plans(name,credits)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function listPaymentEvents() {
  const { data, error } = await store()
    .from("payment_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function createCheckout(input: { userId: string; planId: string; provider?: PaymentProviderName }) {
  const supabase = store();
  const selectedProvider = input.provider ?? "mock";
  const [providerResult, planResult] = await Promise.all([
    supabase.from("payment_providers").select("*").eq("provider", selectedProvider).maybeSingle(),
    supabase.from("plans").select("*").eq("id", input.planId).eq("enabled", true).single(),
  ]);

  if (providerResult.error) throw providerResult.error;
  if (planResult.error) throw planResult.error;
  if (!providerResult.data?.enabled || providerResult.data.status !== "configured") throw new Error("PAYMENT_PROVIDER_DISABLED");

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      user_id: input.userId,
      plan_id: input.planId,
      provider: selectedProvider,
      amount: planResult.data.price,
      currency: "USD",
      status: "pending",
      metadata: { planName: planResult.data.name },
    })
    .select()
    .single();
  if (paymentError) throw paymentError;

  const checkout = await getPaymentProvider(providerName(selectedProvider)).createCheckout({
    paymentId: payment.id,
    userId: input.userId,
    planId: input.planId,
    amount: Number(planResult.data.price),
    currency: "USD",
    mode: providerResult.data.mode,
  });

  const { data: updated, error: updateError } = await supabase
    .from("payments")
    .update({
      provider_payment_id: checkout.providerPaymentId,
      checkout_url: checkout.checkoutUrl,
      status: checkout.status,
      metadata: checkout.metadata ?? {},
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .select()
    .single();
  if (updateError) throw updateError;

  await supabase.from("payment_events").insert({
    payment_id: payment.id,
    provider: selectedProvider,
    event_type: "checkout_created",
    payload: { checkoutUrl: checkout.checkoutUrl, providerPaymentId: checkout.providerPaymentId },
    status: "processed",
  });

  return updated;
}

async function getPaymentForVerification(paymentId: string, options?: VerifyPaymentOptions) {
  const supabase = store();
  if (!options?.allowAdmin && !options?.userId) throw new Error("PAYMENT_VERIFICATION_CONTEXT_REQUIRED");

  let query = supabase.from("payments").select("*").eq("id", paymentId);
  if (!options.allowAdmin) query = query.eq("user_id", options.userId);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("PAYMENT_NOT_FOUND");
  return data;
}

export async function verifyPayment(paymentId: string, options?: VerifyPaymentOptions) {
  const supabase = store();
  const payment = await getPaymentForVerification(paymentId, options);

  const provider = getPaymentProvider(providerName(payment.provider));
  const result = await provider.verifyPayment({
    paymentId,
    providerPaymentId: payment.provider_payment_id ?? paymentId,
  });

  const subscription = result.status === "paid" && !payment.subscription_id
    ? await assignPlan({ userId: payment.user_id, planId: payment.plan_id, operator: undefined })
    : null;

  const { data: updated, error: updateError } = await supabase
    .from("payments")
    .update({
      status: result.status,
      subscription_id: subscription?.id ?? payment.subscription_id,
      metadata: { ...(payment.metadata ?? {}), ...(result.metadata ?? {}) },
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .select()
    .single();
  if (updateError) throw updateError;

  await supabase.from("payment_events").insert({
    payment_id: paymentId,
    provider: payment.provider,
    event_type: "payment_verified",
    payload: result,
    status: "processed",
  });

  return updated;
}
