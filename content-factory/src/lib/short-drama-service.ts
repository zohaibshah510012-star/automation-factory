import { getSupabaseServerClient } from "@/lib/supabase/server";

export type DramaProgress = { total: number; completed: number; failed: number };
export type DramaAsset = { id: string; task_id: string; user_id: string | null; title: string; status: string; story: unknown; characters: unknown; created_at: string };
export type DramaScene = { id: string; scene_number: number; content: unknown; image_task_id: string | null; video_task_id: string | null; status: string; image: { status: string; url: string | null } | null; video: { status: string; url: string | null; thumbnail: string | null } | null };

function requireClient() { const client = getSupabaseServerClient(); if (!client) throw new Error("DRAMA_STORE_UNAVAILABLE"); return client; }

async function getDramaBase(id: string, userId?: string) {
  const client = requireClient();
  const { data, error } = await client.from("short_drama_assets").select("*").or(`id.eq.${id},task_id.eq.${id}`).maybeSingle();
  if (error || !data) return undefined;
  const drama = data as DramaAsset;
  if (userId && drama.user_id !== userId) return undefined;
  return drama;
}

async function getSceneMedia(imageId: string | null, videoId: string | null) {
  const client = requireClient(); const [image, video] = await Promise.all([
    imageId ? client.from("image_tasks").select("status,result_url").eq("id", imageId).maybeSingle() : Promise.resolve({ data: null }),
    videoId ? client.from("video_tasks").select("status,video_url,thumbnail_url").eq("id", videoId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return { image: image.data ? { status: image.data.status, url: image.data.result_url } : null, video: video.data ? { status: video.data.status, url: video.data.video_url, thumbnail: video.data.thumbnail_url } : null };
}

function sceneStatus(image: DramaScene["image"], video: DramaScene["video"], stored: string) {
  if (image?.status === "failed" || video?.status === "failed") return "failed";
  if (image?.status === "completed" && video?.status === "completed") return "completed";
  if (image?.status === "running" || video?.status === "running" || image?.status === "processing" || video?.status === "processing") return "running";
  return stored;
}

async function getDramaScenes(drama: DramaAsset): Promise<DramaScene[]> {
  const client = requireClient();
  const [{ data: sceneRows }, { data: mediaRows }] = await Promise.all([
    client.from("short_drama_scenes").select("*").eq("drama_id", drama.id).order("scene_number"),
    client.from("drama_scene_images").select("scene_number,image_prompt,image_task_id,video_prompt,video_task_id").eq("drama_id", drama.task_id).order("scene_number"),
  ]);
  const mediaByScene = new Map((mediaRows ?? []).map((row) => [row.scene_number, row]));
  const mergedRows = (sceneRows ?? []).map((scene) => {
    const media = mediaByScene.get(scene.scene_number);
    return {
      ...scene,
      image_task_id: scene.image_task_id ?? media?.image_task_id ?? null,
      video_task_id: scene.video_task_id ?? media?.video_task_id ?? null,
      content: {
        ...(scene.content && typeof scene.content === "object" && !Array.isArray(scene.content) ? scene.content as Record<string, unknown> : { source: scene.content }),
        image_prompt: media?.image_prompt,
        video_prompt: media?.video_prompt,
      },
    };
  });
  return await Promise.all(mergedRows.map(async scene => {
    const media = await getSceneMedia(scene.image_task_id, scene.video_task_id);
    return { ...scene, ...media, status: sceneStatus(media.image, media.video, scene.status) };
  })) as DramaScene[];
}

function calculateDramaProgress(scenes: DramaScene[]): DramaProgress { return { total: scenes.length, completed: scenes.filter(scene => scene.video?.status === "completed" || scene.image?.status === "completed").length, failed: scenes.filter(scene => scene.video?.status === "failed" || scene.image?.status === "failed").length }; }

async function getDramaProgresses(ids: string[]) {
  const client = requireClient(); if (!ids.length) return new Map<string, DramaProgress>();
  const { data } = await client.from("short_drama_scenes").select("drama_id,status").in("drama_id", ids);
  const groups = new Map<string, DramaScene[]>();
  for (const row of data ?? []) groups.set(row.drama_id, [...(groups.get(row.drama_id) ?? []), { ...row, id: "", scene_number: 0, content: {}, image_task_id: null, video_task_id: null, image: null, video: null }]);
  return new Map(ids.map(id => [id, calculateDramaProgress(groups.get(id) ?? [])]));
}

async function listDramas(userId?: string) {
  const client = requireClient(); let query = client.from("short_drama_assets").select("id,user_id,title,status,created_at").order("created_at", { ascending: false });
  if (userId) query = query.eq("user_id", userId); const { data, error } = await query; if (error) throw error;
  const rows = data ?? []; const progress = await getDramaProgresses(rows.map(row => row.id));
  return rows.map(row => ({ ...row, progress: progress.get(row.id) ?? { total: 0, completed: 0, failed: 0 } }));
}

export async function listUserDramas(userId: string) {
  return listDramas(userId).then(rows => rows.map(drama => ({
    id: drama.id,
    title: drama.title,
    status: drama.status,
    created_at: drama.created_at,
    progress: drama.progress,
  })));
}
export async function listAllDramas() { return listDramas(); }

export async function getDramaAsset(id: string, userId?: string) {
  const drama = await getDramaBase(id, userId); if (!drama) return undefined;
  const scenes = await getDramaScenes(drama);
  const progress = calculateDramaProgress(scenes);
  const status = progress.failed ? "failed" : progress.total && progress.completed === progress.total ? "completed" : drama.status;
  return { drama: { id: drama.id, task_id: drama.task_id, title: drama.title, status, story: drama.story, characters: drama.characters, created_at: drama.created_at }, scenes, progress };
}
