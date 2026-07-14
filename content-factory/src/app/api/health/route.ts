import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ status: "degraded", database: false, timestamp: new Date().toISOString() }, { status: 503 });
  const { error } = await supabase.from("profiles").select("id", { head: true, count: "exact" }).limit(1);
  return NextResponse.json({ status: error ? "degraded" : "ok", database: !error, timestamp: new Date().toISOString() }, { status: error ? 503 : 200 });
}
