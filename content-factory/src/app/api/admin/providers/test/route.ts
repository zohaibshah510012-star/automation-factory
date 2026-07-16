import { NextResponse } from "next/server";

import { getAiProviders, getActiveProviderName } from "@/lib/ai-providers";
import { getProviderReadiness } from "@/lib/provider-readiness";
import { requireAdmin } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json(getProviderReadiness(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json().catch(() => ({})) as { live?: boolean };
    if (!body.live) {
      const readiness = getProviderReadiness();
      await getSupabaseServerClient()?.from("system_logs").insert({ level: "info", event: "provider_readiness_checked", metadata: readiness });
      return NextResponse.json(readiness);
    }

    const provider = getActiveProviderName();
    await getAiProviders().text.generateContentPack({
      topic: "health check",
      systemPrompt: "Return JSON only: title, script, storyboard with exactly four strings.",
      userPrompt: "Return a short health check content pack.",
    });
    await getSupabaseServerClient()?.from("system_logs").insert({ level: "info", event: "provider_test_connected", metadata: { provider } });
    return NextResponse.json({ status: "connected", provider });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown provider error";
    await getSupabaseServerClient()?.from("system_logs").insert({ level: "error", event: "provider_test_failed", metadata: { reason } });
    return NextResponse.json({ status: "failed", reason }, { status: 502 });
  }
}
