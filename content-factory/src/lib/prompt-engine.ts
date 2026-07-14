import { getSupabaseServerClient } from "@/lib/supabase/server";

export type TaskType = "marketing" | "short_video_script" | "video" | "image" | "drama" | "ecommerce" | "social";

const templateByTask: Record<TaskType, string> = {
  marketing: "marketing_agent_prompt", short_video_script: "short_video_script_prompt", video: "video_generation_prompt",
  image: "image_generation_prompt", drama: "short_drama_agent_prompt", ecommerce: "ecommerce_content_prompt", social: "social_media_agent_prompt",
};

function interpolate(template: string, values: Record<string, string | undefined>) {
  return template.replace(/{{(\w+)}}/g, (_, key) => values[key] || "无");
}

export async function resolvePublishedPrompt(input: { taskType: TaskType; topic: string; brief?: string; userId?: string; promptId?: string }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Prompt Engine requires Supabase configuration.");
  let query = supabase.from("prompt_templates").select("id,name,system_prompt,user_template,version,owner_type,owner_id");
  if (input.promptId) query = query.eq("id", input.promptId);
  else query = query.eq("name", templateByTask[input.taskType]).eq("owner_type", "platform").eq("status", "published");
  const { data, error } = await query.maybeSingle();
  if (error || !data) throw new Error("No published prompt is available for this task type.");
  if (data.owner_type === "user" && data.owner_id !== input.userId) throw new Error("The selected prompt is not available to this user.");
  return { name: data.name, version: data.version, systemPrompt: data.system_prompt, userPrompt: interpolate(data.user_template, input) };
}
