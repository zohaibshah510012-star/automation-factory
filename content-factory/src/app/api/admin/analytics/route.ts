import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type UsageRow = { provider: string | null; model: string | null; capability: string; credits_charged: number };
type PaymentRow = { amount: number; status: string };
type TaskRow = { status: string };
type ProductEventRow = { event_name: string; surface: string; path: string | null; created_at: string };
type FeedbackRow = { satisfaction: number; status: string; category: string };

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

    const [users, tasks, usage, prompts, payments, subscriptions, productEvents, feedback] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("content_tasks").select("status"),
      supabase.from("usage_history").select("provider,model,capability,credits_charged"),
      supabase.from("prompt_templates").select("name").eq("status", "published"),
      supabase.from("payments").select("amount,status"),
      supabase.from("subscriptions").select("status"),
      supabase.from("product_events").select("event_name,surface,path,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("user_feedback").select("satisfaction,status,category").limit(200),
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
    const productEventRows = (productEvents.data ?? []) as ProductEventRow[];
    const feedbackRows = (feedback.data ?? []) as FeedbackRow[];
    const eventCounts = productEventRows.reduce<Record<string, number>>((counts, event) => {
      counts[event.event_name] = (counts[event.event_name] ?? 0) + 1;
      return counts;
    }, {});
    const averageSatisfaction = feedbackRows.length
      ? Number((feedbackRows.reduce((total, row) => total + Number(row.satisfaction ?? 0), 0) / feedbackRows.length).toFixed(1))
      : 0;

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
        productAnalytics: {
          eventCounts,
          recentEvents: productEventRows.slice(0, 20),
          funnel: {
            pageView: eventCounts.page_view ?? 0,
            ctaClick: eventCounts.cta_click ?? 0,
            signupComplete: eventCounts.signup_complete ?? 0,
            templateSelect: eventCounts.template_select ?? 0,
            taskCreate: eventCounts.task_create ?? 0,
            taskComplete: eventCounts.task_complete ?? 0,
            upgradeClick: eventCounts.upgrade_click ?? 0,
          },
        },
        feedback: {
          total: feedbackRows.length,
          averageSatisfaction,
          newCount: feedbackRows.filter((row) => row.status === "new").length,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
