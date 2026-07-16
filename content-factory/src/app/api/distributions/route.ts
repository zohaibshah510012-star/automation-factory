import { NextResponse } from "next/server";

import { createDistributionJob, processDistributionJob } from "@/lib/distribution-service";
import { requireUser } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const { data, error } = await getSupabaseServerClient()!
      .from("distribution_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ jobs: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json() as { contentId?: string; contentType?: string; platform?: string; payload?: Record<string, unknown> };
    if (!body.contentId || !body.contentType || !body.platform) return NextResponse.json({ error: "contentId, contentType, and platform are required" }, { status: 400 });
    const job = await createDistributionJob({
      userId: user.id,
      contentId: body.contentId,
      contentType: body.contentType,
      platform: body.platform,
      payload: body.payload,
    });
    void processDistributionJob(job.id);
    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create distribution job" }, { status: 400 });
  }
}
