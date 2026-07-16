import { createImageTask, runImageTask } from "@/lib/image-service";
import { createVideoTask, runVideoTask } from "@/lib/video-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function sceneDescription(scene: unknown) {
  if (typeof scene === "string") return scene;
  if (!scene || typeof scene !== "object" || Array.isArray(scene)) return String(scene ?? "");
  const record = scene as Record<string, unknown>;
  const parts = [
    record.title,
    record.description,
    record.synopsis,
    record.conflict,
    record.emotion,
    record.camera,
    record.visual_prompt,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  if (Array.isArray(record.scenes)) {
    parts.push(...record.scenes.map(sceneDescription).filter(Boolean));
  }
  return parts.join(" ");
}

function completedStatus(results: Array<PromiseSettledResult<{ status: string }>>) {
  if (results.some((result) => result.status === "rejected" || result.value.status === "failed")) return "failed";
  if (results.every((result) => result.status === "fulfilled" && result.value.status === "completed")) return "completed";
  return "running";
}

export async function createDramaSceneImages(input: { dramaId: string; userId: string; topic: string; scenes: unknown[] }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data: dramaAsset } = await supabase
    .from("short_drama_assets")
    .select("id")
    .eq("task_id", input.dramaId)
    .maybeSingle();

  const generatedScenes = await Promise.all(input.scenes.slice(0, 4).map(async (scene, index) => {
    const sceneNumber = index + 1;
    const description = sceneDescription(scene);
    const imagePrompt = `${input.topic}. Scene ${sceneNumber}: ${description}. cinematic short drama, consistent characters, professional lighting, film still`;
    const videoPrompt = `${description}. Animate the scene with cinematic camera movement, consistent characters, 5 seconds.`;
    const imageTask = await createImageTask({ userId: input.userId, prompt: imagePrompt });
    const videoTask = await createVideoTask({ userId: input.userId, prompt: videoPrompt, durationSeconds: 5 });

    await supabase.from("drama_scene_images").upsert({
      drama_id: input.dramaId,
      scene_number: sceneNumber,
      image_prompt: imagePrompt,
      image_task_id: imageTask.id,
      video_prompt: videoPrompt,
      video_task_id: videoTask.id,
    });

    const [imageResult, videoResult] = await Promise.allSettled([
      runImageTask(imageTask.id),
      runVideoTask(videoTask.id),
    ]);
    const sceneStatus = completedStatus([imageResult, videoResult]);
    const completedImage = imageResult.status === "fulfilled" ? imageResult.value : undefined;
    const completedVideo = videoResult.status === "fulfilled" ? videoResult.value : undefined;

    if (dramaAsset?.id) {
      await supabase.from("short_drama_scenes").upsert({
        drama_id: dramaAsset.id,
        scene_number: sceneNumber,
        content: {
          source: scene,
          image_prompt: imagePrompt,
          video_prompt: videoPrompt,
        },
        image_task_id: imageTask.id,
        video_task_id: videoTask.id,
        status: sceneStatus,
      }, { onConflict: "drama_id,scene_number" });
    }

    const assetRows: Array<{ content_task_id: string; type: "image" | "video"; name: string; url: string; provider: string }> = [];
    if (completedImage?.resultUrl) {
      assetRows.push({
        content_task_id: input.dramaId,
        type: "image",
        name: `Drama scene ${sceneNumber} image`,
        url: completedImage.resultUrl,
        provider: `${completedImage.provider ?? "unknown"}/${completedImage.model ?? "unknown"}`,
      });
    }
    if (completedVideo?.videoUrl) {
      assetRows.push({
        content_task_id: input.dramaId,
        type: "video",
        name: `Drama scene ${sceneNumber} video`,
        url: completedVideo.videoUrl,
        provider: `${completedVideo.provider ?? "unknown"}/${completedVideo.model ?? "unknown"}`,
      });
    }

    if (assetRows.length) await supabase.from("assets").insert(assetRows);

    return {
      scene_number: sceneNumber,
      image_task_id: imageTask.id,
      video_task_id: videoTask.id,
      status: sceneStatus,
      image_prompt: imagePrompt,
      video_prompt: videoPrompt,
    };
  }));

  if (dramaAsset?.id) {
    const finalStatus = generatedScenes.some((scene) => scene.status === "failed")
      ? "failed"
      : generatedScenes.every((scene) => scene.status === "completed")
        ? "completed"
        : "generating";
    await supabase
      .from("short_drama_assets")
      .update({ status: finalStatus, updated_at: new Date().toISOString() })
      .eq("id", dramaAsset.id);
  }

  return generatedScenes;
}
