import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type UsageRow = { provider: string | null; model: string | null; capability: string; credits_charged: number };
type PaymentRow = { amount: number; status: string };
type TaskRow = { status: string };

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function estimateProviderCost(credits: number) {
  return Number((credits * Number(process.env.PROVIDER_COST_PER_CREDIT_USD ?? "0.01")).toFixed(2));
}

function groupProviderUsage(rows: UsageRow[]) {
  const grouped = new Map<string, { provider: string; model: string | null; credits: number; requests: number; estimatedCost: number }>();
  for (const row of rows) {
    const provider = row.provider ?? "unknown";
    const key = `${provider}:${row.model ?? "default"}`;
    const current = grouped.get(key) ?? { provider, model: row.model, credits: 0, requests: 0, estimatedCost: 0 };
    current.credits += Number(row.credits_charged ?? 0);
    current.requests += 1;
    current.estimatedCost = estimateProviderCost(current.credits);
    grouped.set(key, current);
  }
  return Array.from(grouped.values()).sort((a, b) => b.credits - a.credits);
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = getSupabaseServerClient()!;

    const [users, tasks, usage, prompts, payments, subscriptions] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("content_tasks").select("status"),
      supabase.from("usage_history").select("provider,model,capability,credits_charged"),
      supabase.from("prompt_templates").select("name").eq("status", "published"),
      supabase.from("payments").select("amount,status"),
      supabase.from("subscriptions").select("status"),
    ]);

    const taskRows = (tasks.data ?? []) as TaskRow[];
    const usageRows = (usage.data ?? []) as UsageRow[];
    const paymentRows = (payments.data ?? []) as PaymentRow[];
    const paidRevenue = sum(paymentRows.filter((payment) => payment.status === "paid").map((payment) => Number(payment.amount ?? 0)));
    const pendingRevenue = sum(paymentRows.filter((payment) => payment.status === "pending").map((payment) => Number(payment.amount ?? 0)));
    const creditsConsumed = sum(usageRows.map((row) => Number(row.credits_charged ?? 0)));
    const providerUsage = groupProviderUsage(usageRows);
    const providerCost = sum(providerUsage.map((row) => row.estimatedCost));
    const grossProfit = Number((paidRevenue - providerCost).toFixed(2));
    const activeSubscriptions = (subscriptions.data ?? []).filter((subscription) => subscription.status === "active").length;
    const userCount = users.count ?? 0;

    return NextResponse.json(
      {
        users: userCount,
        tasks: taskRows.length,
        successRate: taskRows.length ? taskRows.filter((task) => task.status === "completed").length / taskRows.length : 0,
        prompts: prompts.data ?? [],
        revenue: {
          paid: Number(paidRevenue.toFixed(2)),
          pending: Number(pendingRevenue.toFixed(2)),
          arpu: userCount ? Number((paidRevenue / userCount).toFixed(2)) : 0,
          activeSubscriptions,
        },
        credits: {
          consumed: creditsConsumed,
          estimatedValue: Number((creditsConsumed * Number(process.env.CREDIT_PRICE_USD ?? "0.05")).toFixed(2)),
        },
        providerCost,
        grossProfit,
        grossMargin: paidRevenue > 0 ? Number((((paidRevenue - providerCost) / paidRevenue) * 100).toFixed(1)) : 0,
        providerUsage,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
