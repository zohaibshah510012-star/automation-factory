import { getSupabaseServerClient } from "@/lib/supabase/server";

export type DramaProgress = { total: number; completed: number; failed: number };
export type DramaAsset = { id: string; user_id: string | null; title: string; status: string; story: unknown; characters: unknown; created_at: string };
export type DramaScene = { id: string; scene_number: number; content: unknown; image_task_id: string | null; video_task_id: string | null; status: string; image: { status: string; url: string | null } | null; video: { status: string; url: string | null; thumbnail: string | null } | null };

function requireClient() { const client = getSupabaseServerClient(); if (!client) throw new Error("DRAMA_STORE_UNAVAILABLE"); return client; }

async function getDramaBase(id: string, userId?: string) {
  const client = requireClient(); let query = client.from("short_drama_assets").select("*").eq("id", id);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query.maybeSingle(); return error || !data ? undefined : data as DramaAsset;
}

async function getSceneMedia(imageId: string | null, videoId: string | null) {
  const client = requireClient(); const [image, video] = await Promise.all([
    imageId ? client.from("image_tasks").select("status,result_url").eq("id", imageId).maybeSingle() : Promise.resolve({ data: null }),
    videoId ? client.from("video_tasks").select("status,video_url,thumbnail_url").eq("id", videoId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return { image: image.data ? { status: image.data.status, url: image.data.result_url } : null, video: video.data ? { status: video.data.status, url: video.data.video_url, thumbnail: video.data.thumbnail_url } : null };
}

async function getDramaScenes(dramaId: string): Promise<DramaScene[]> {
  const { data } = await requireClient().from("short_drama_scenes").select("*").eq("drama_id", dramaId).order("scene_number");
  return Promise.all((data ?? []).map(async scene => ({ ...scene, ...(await getSceneMedia(scene.image_task_id, scene.video_task_id)) })) as Promise<DramaScene>[]);
}

function calculateDramaProgress(scenes: DramaScene[]): DramaProgress { return { total: scenes.length, completed: scenes.filter(scene => scene.video?.status === "completed" || scene.image?.status === "completed").length, failed: scenes.filter(scene => scene.video?.status === "failed" || scene.image?.status === "failed").length }; }

export async function getDramaAsset(id: string, userId?: string) {
  const drama = await getDramaBase(id, userId); if (!drama) return undefined;
  const scenes = await getDramaScenes(id);
  return { drama: { id: drama.id, title: drama.title, status: drama.status, story: drama.story, characters: drama.characters, created_at: drama.created_at }, scenes, progress: calculateDramaProgress(scenes) };
}
