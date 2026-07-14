import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = getSupabaseServerClient()!;
    const [users, tasks, credits, providers] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("content_tasks").select("id,status", { count: "exact" }).order("updated_at", { ascending: false }).limit(10),
      supabase.from("usage_history").select("credits_charged"),
      supabase.from("ai_providers").select("provider_name,enabled,model"),
    ]);
    const taskRows = tasks.data ?? [];
    return NextResponse.json({ users: users.count ?? 0, tasks: taskRows, taskCount: tasks.count ?? 0, completed: taskRows.filter((item) => item.status === "completed").length, failed: taskRows.filter((item) => item.status === "failed").length, creditsUsed: (credits.data ?? []).reduce((sum, item) => sum + item.credits_charged, 0), providers: providers.data ?? [] });
  } catch { return NextResponse.json({ error: "Admin access required" }, { status: 403 }); }
}
