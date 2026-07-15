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

export async function createDramaSceneImages(input:{dramaId:string;userId:string;topic:string;scenes:unknown[]}){const s=getSupabaseServerClient();if(!s)return[];return Promise.all(input.scenes.slice(0,4).map(async(scene,index)=>{const description=sceneDescription(scene);const image_prompt=`${input.topic}. Scene ${index+1}: ${description}. cinematic short drama, consistent characters, professional lighting, film still`;const video_prompt=`${description}. Animate the scene with cinematic camera movement, consistent characters, 5 seconds.`;const task=await createImageTask({userId:input.userId,prompt:image_prompt});const video=await createVideoTask({userId:input.userId,prompt:video_prompt,durationSeconds:5});await s.from("drama_scene_images").upsert({drama_id:input.dramaId,scene_number:index+1,image_prompt,image_task_id:task.id,video_prompt,video_task_id:video.id});void runImageTask(task.id);void runVideoTask(video.id);return{scene_number:index+1,image_task_id:task.id,video_task_id:video.id,status:"pending",image_prompt,video_prompt};}));}
