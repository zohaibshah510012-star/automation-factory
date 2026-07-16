import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getProviderReadiness } from "@/lib/provider-readiness";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = getSupabaseServerClient()!;
    const [users, tasks, credits, providers, events, feedback] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("content_tasks").select("id,status", { count: "exact" }).order("updated_at", { ascending: false }).limit(10),
      supabase.from("usage_history").select("credits_charged"),
      supabase.from("ai_providers").select("provider_name,enabled,model"),
      supabase.from("product_events").select("event_name,user_id").limit(1000),
      supabase.from("user_feedback").select("id,status,satisfaction").limit(500),
    ]);
    const taskRows = tasks.data ?? [];
    const eventRows = events.data ?? [];
    const feedbackRows = feedback.data ?? [];
    const signups = new Set(eventRows.filter((event) => event.event_name === "signup_completed" || event.event_name === "signup_complete").map((event) => event.user_id).filter(Boolean));
    const activated = new Set(eventRows.filter((event) => event.event_name === "first_generation_completed").map((event) => event.user_id).filter(Boolean));
    return NextResponse.json({
      users: users.count ?? 0,
      tasks: taskRows,
      taskCount: tasks.count ?? 0,
      completed: taskRows.filter((item) => item.status === "completed").length,
      failed: taskRows.filter((item) => item.status === "failed").length,
      creditsUsed: (credits.data ?? []).reduce((sum, item) => sum + item.credits_charged, 0),
      providers: providers.data ?? [],
      providerReadiness: getProviderReadiness(),
      beta: {
        signups: signups.size,
        activated: activated.size,
        activationRate: signups.size ? Number(((activated.size / signups.size) * 100).toFixed(1)) : 0,
      },
      feedback: {
        total: feedbackRows.length,
        open: feedbackRows.filter((row) => row.status === "open").length,
        averageSatisfaction: feedbackRows.length ? Number((feedbackRows.reduce((sum, row) => sum + Number(row.satisfaction ?? 0), 0) / feedbackRows.length).toFixed(1)) : 0,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Admin access required" }, { status: 403 }); }
}
