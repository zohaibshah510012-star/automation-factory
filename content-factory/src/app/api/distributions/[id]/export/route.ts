import { NextResponse } from "next/server";

import { requireUser } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const id = (await params).id;
    const supabase = getSupabaseServerClient()!;
    const { data: job, error: jobError } = await supabase
      .from("distribution_jobs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (jobError) throw jobError;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!job || (job.user_id !== user.id && profile?.role !== "admin")) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [{ data: task }, { data: assets }] = await Promise.all([
      supabase.from("content_tasks").select("*").eq("id", job.content_id).maybeSingle(),
      supabase.from("assets").select("type,name,url,provider").eq("content_task_id", job.content_id).order("created_at", { ascending: true }),
    ]);

    const platform = String(job.platform);

    return NextResponse.json({
      exportVersion: "distribution-mvp-v1",
      platform,
      status: job.status,
      content: {
        id: job.content_id,
        type: job.content_type,
        title: task?.title ?? task?.topic ?? "Untitled content",
        topic: task?.topic ?? null,
        script: task?.script ?? null,
        storyboard: task?.storyboard ?? null,
      },
      assets: assets ?? [],
      publishingChecklist: [
        "Review title, hook, and CTA.",
        "Download or copy the generated media assets.",
        "Adapt caption and hashtags for the selected platform.",
        "Upload manually or connect a production publishing provider.",
      ],
      platformNotes: {
        tiktok: "Use vertical video, fast hook, and concise caption.",
        youtube: "Use Shorts format, title keywords, and retention-focused opening.",
        xiaohongshu: "Use stronger cover/title, practical caption, and save-worthy structure.",
      }[platform as "tiktok" | "youtube" | "xiaohongshu"] ?? "Review platform-specific requirements before publishing.",
      generatedAt: new Date().toISOString(),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to export distribution package" }, { status: 400 });
  }
}
