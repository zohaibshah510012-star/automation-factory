import { getImageProvider, getImageProviderName } from "@/lib/ai-providers";
import { trackProductEvent } from "@/lib/product-analytics";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type ImageTask = { id: string; userId: string; prompt: string; provider: string | null; model: string | null; size: string | null; status: "pending" | "running" | "completed" | "failed"; resultUrl: string | null; metadata: Record<string, unknown>; error: string | null; createdAt: string; updatedAt: string };
type ImageTaskRow = { id: string; user_id: string; prompt: string; provider_name: string | null; model: string | null; size: string | null; status: ImageTask["status"]; result_url: string | null; metadata: unknown; error: string | null; created_at: string; updated_at: string };
function asMetadata(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function mapTask(row: ImageTaskRow): ImageTask { return { id: row.id, userId: row.user_id, prompt: row.prompt, provider: row.provider_name, model: row.model, size: row.size, status: row.status, resultUrl: row.result_url, metadata: asMetadata(row.metadata), error: row.error, createdAt: row.created_at, updatedAt: row.updated_at }; }
async function requireStore() { const supabase = getSupabaseServerClient(); if (!supabase) throw new Error("IMAGE_TASK_STORE_UNAVAILABLE"); return supabase; }

export async function createImageTask(input: { userId: string; prompt: string; model?: string; size?: string }) {
  const supabase = await requireStore();
  const now = new Date().toISOString();
  const { data, error } = await supabase.from("image_tasks").insert({ user_id: input.userId, prompt: input.prompt, model: input.model ?? null, size: input.size ?? "1024x1024", status: "pending", created_at: now, updated_at: now }).select().single();
  if (error || !data) throw new Error(`Unable to create image task: ${error?.message ?? "unknown error"}`);
  return mapTask(data as ImageTaskRow);
}

export async function runImageTask(taskId: string) {
  const supabase = await requireStore();
  const { data, error } = await supabase.from("image_tasks").select("*").eq("id", taskId).maybeSingle();
  if (error || !data) throw new Error("IMAGE_TASK_NOT_FOUND");
  const task = mapTask(data as ImageTaskRow);
  if (task.status === "completed") return task;
  const provider = getImageProviderName();
  const now = new Date().toISOString();
  await supabase.from("image_tasks").update({ status: "running", provider_name: provider, updated_at: now, error: null }).eq("id", taskId);
  await supabase.from("system_logs").insert({ level: "info", event: "image_task_started", user_id: task.userId, metadata: { imageTaskId: task.id, provider } });
  try {
    const image = await getImageProvider().generateImage({ taskId: task.id, prompt: task.prompt, model: task.model ?? undefined, size: task.size ?? undefined });
    const completedAt = new Date().toISOString();
    const { data: completed, error: completedError } = await supabase.from("image_tasks").update({ status: "completed", provider_name: image.provider, model: image.model, result_url: image.url, result: { url: image.url, provider: image.provider, model: image.model }, metadata: image.metadata ?? {}, updated_at: completedAt }).eq("id", taskId).select().single();
    if (completedError || !completed) throw new Error(`Unable to save image result: ${completedError?.message ?? "unknown error"}`);
    await supabase.from("system_logs").insert({ level: "info", event: "image_task_completed", user_id: task.userId, metadata: { imageTaskId: task.id, provider: image.provider, model: image.model } });
    await trackProductEvent({ eventName: "task_complete", userId: task.userId, surface: "image", path: "image-service", properties: { taskId: task.id, taskType: "image", provider: image.provider, model: image.model } });
    return mapTask(completed as ImageTaskRow);
  } catch (exception) {
    const message = exception instanceof Error ? exception.message : "Image generation failed.";
    const { data: failed } = await supabase.from("image_tasks").update({ status: "failed", error: message, updated_at: new Date().toISOString() }).eq("id", taskId).select().single();
    await supabase.from("system_logs").insert({ level: "error", event: "image_task_failed", user_id: task.userId, metadata: { imageTaskId: task.id, provider, error: message } });
    if (failed) return mapTask(failed as ImageTaskRow);
    throw exception;
  }
}

export async function listImageTasks(userId: string) { const supabase = await requireStore(); const { data, error } = await supabase.from("image_tasks").select("*").eq("user_id", userId).order("updated_at", { ascending: false }); if (error) throw new Error(`Unable to load images: ${error.message}`); return (data ?? []).map((row) => mapTask(row as ImageTaskRow)); }
