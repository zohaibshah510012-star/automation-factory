import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const tables = { providers: "ai_providers", agents: "agents", workflows: "workflows", prompts: "prompt_templates" } as const;
type Resource = keyof typeof tables;
function tableFor(resource: string) { return tables[resource as Resource]; }

export async function GET(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  try { await requireAdmin(request); const table = tableFor((await params).resource); if (!table) throw new Error(); const { data, error } = await getSupabaseServerClient()!.from(table).select("*").order("updated_at", { ascending: false }); if (error) throw error; return NextResponse.json({ data }); }
  catch { return NextResponse.json({ error: "Admin access required" }, { status: 403 }); }
}
export async function POST(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  try { await requireAdmin(request); const table = tableFor((await params).resource); if (!table) throw new Error(); const payload = await request.json(); delete payload.api_key; const { data, error } = await getSupabaseServerClient()!.from(table).insert(payload).select().single(); if (error) throw error; return NextResponse.json({ data }, { status: 201 }); }
  catch { return NextResponse.json({ error: "Unable to create resource" }, { status: 400 }); }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  try { await requireAdmin(request); const table = tableFor((await params).resource); const { id, ...payload } = await request.json(); if (!table || !id) throw new Error(); delete payload.api_key; const { data, error } = await getSupabaseServerClient()!.from(table).update(payload).eq("id", id).select().single(); if (error) throw error; return NextResponse.json({ data }); }
  catch { return NextResponse.json({ error: "Unable to update resource" }, { status: 400 }); }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ resource: string }> }) {
  try { await requireAdmin(request); const table = tableFor((await params).resource); const id = new URL(request.url).searchParams.get("id"); if (!table || !id) throw new Error(); const { error } = await getSupabaseServerClient()!.from(table).delete().eq("id", id); if (error) throw error; return new NextResponse(null, { status: 204 }); }
  catch { return NextResponse.json({ error: "Unable to delete resource" }, { status: 400 }); }
}
