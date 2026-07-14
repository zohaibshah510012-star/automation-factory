import { NextResponse } from "next/server";
import { requireUser } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request); const supabase = getSupabaseServerClient()!;
    const { data, error } = await supabase.from("prompt_templates").select("id,name,category,type,owner_type,owner_id,system_prompt,user_template,variables,version,status,updated_at")
      .or(`and(owner_type.eq.platform,status.eq.published),and(owner_type.eq.user,owner_id.eq.${user.id})`).order("updated_at", { ascending: false });
    if (error) throw error; return NextResponse.json({ prompts: data });
  } catch { return NextResponse.json({ error: "Authentication required" }, { status: 401 }); }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request); const body = await request.json() as { sourceId?: string; name?: string; systemPrompt?: string; userTemplate?: string };
    const supabase = getSupabaseServerClient()!;
    const { data: source } = body.sourceId ? await supabase.from("prompt_templates").select("name,category,type,system_prompt,user_template,variables").eq("id", body.sourceId).maybeSingle() : { data: null };
    const name = body.name?.trim() || (source ? `${source.name}_personal` : "personal_prompt");
    const { data: latest } = await supabase.from("prompt_templates").select("version").eq("name", name).eq("owner_type", "user").eq("owner_id", user.id).order("version", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await supabase.from("prompt_templates").insert({ name, category: source?.category ?? "custom", type: source?.type ?? "text", owner_type: "user", owner_id: user.id, parent_template_id: body.sourceId ?? null, system_prompt: body.systemPrompt?.trim() || source?.system_prompt || "", user_template: body.userTemplate?.trim() || source?.user_template || "{{topic}}", variables: source?.variables ?? ["topic", "brief"], version: (latest?.version ?? 0) + 1, status: "published" }).select().single();
    if (error) throw error; return NextResponse.json({ prompt: data }, { status: 201 });
  } catch { return NextResponse.json({ error: "Unable to save prompt" }, { status: 400 }); }
}
