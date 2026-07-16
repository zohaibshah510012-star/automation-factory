import { getSupabaseServerClient } from "@/lib/supabase/server";

type DramaSceneInput = Record<string, unknown> | string;

export async function writeDramaAsset(input: {
  taskId: string;
  userId?: string;
  title?: string;
  story?: unknown;
  characters?: unknown;
  scenes?: DramaSceneInput[];
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("short_drama_assets")
    .select("id")
    .eq("task_id", input.taskId)
    .maybeSingle();

  const patch: Record<string, unknown> = {
    task_id: input.taskId,
    user_id: input.userId ?? null,
    status: "generating",
    updated_at: now,
  };
  if (input.title !== undefined) patch.title = input.title;
  if (input.story !== undefined) patch.story = input.story;
  if (input.characters !== undefined) patch.characters = input.characters;
  if (input.scenes !== undefined) patch.scenes = input.scenes;

  const query = existing?.id
    ? supabase.from("short_drama_assets").update(patch).eq("id", existing.id).select("id").single()
    : supabase.from("short_drama_assets").insert({ title: "Short Drama", ...patch }).select("id").single();
  const { data } = await query;

  if (data && Array.isArray(input.scenes)) {
    await supabase.from("short_drama_scenes").upsert(input.scenes.map((content, index) => ({
      drama_id: data.id,
      scene_number: index + 1,
      content,
      status: "pending",
    })), { onConflict: "drama_id,scene_number" });
  }
}

export async function updateDramaStatus(taskId: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  const { data: asset } = await supabase.from("short_drama_assets").select("id").eq("task_id", taskId).maybeSingle();
  if (!asset) return;
  const { data: rows } = await supabase.from("short_drama_scenes").select("status").eq("drama_id", asset.id);
  const scenes = rows ?? [];
  const status = scenes.some((scene) => scene.status === "failed")
    ? "failed"
    : scenes.length && scenes.every((scene) => scene.status === "completed")
      ? "completed"
      : "generating";
  await supabase.from("short_drama_assets").update({ status, updated_at: new Date().toISOString() }).eq("id", asset.id);
}
