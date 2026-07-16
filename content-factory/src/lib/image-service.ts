import { getImageProvider, getImageProviderName } from "@/lib/ai-providers";
import { recordAiProviderCost } from "@/lib/ai-cost-service";
import { commitCredits, refundCredits, reserveCredits } from "@/lib/credits-service";
import { trackProductEvent, trackProductEventOnce } from "@/lib/product-analytics";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentTask } from "@/lib/types";

export type ImageTask = { id: string; userId: string; prompt: string; provider: string | null; model: string | null; size: string | null; status: "pending" | "running" | "completed" | "failed"; resultUrl: string | null; metadata: Record<string, unknown>; error: string | null; createdAt: string; updatedAt: string };
type ImageTaskRow = { id: string; user_id: string; prompt: string; provider_name: string | null; model: string | null; size: string | null; status: ImageTask["status"]; result_url: string | null; metadata: unknown; error: string | null; created_at: string; updated_at: string };
function asMetadata(value: unknown) { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function mapTask(row: ImageTaskRow): ImageTask { return { id: row.id, userId: row.user_id, prompt: row.prompt, provider: row.provider_name, model: row.model, size: row.size, status: row.status, resultUrl: row.result_url, metadata: asMetadata(row.metadata), error: row.error, createdAt: row.created_at, updatedAt: row.updated_at }; }
async function requireStore() { const supabase = getSupabaseServerClient(); if (!supabase) throw new Error("IMAGE_TASK_STORE_UNAVAILABLE"); return supabase; }

function contentTaskFromImageTask(task: ImageTask): ContentTask {
  return {
    id: task.id,
    userId: task.userId,
    topic: task.prompt,
    taskType: "image",
    status: task.status === "completed" ? "completed" : task.status === "failed" ? "failed" : task.status === "running" ? "running" : "pending",
    assets: [],
    error: task.error ?? undefined,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function taskDurationMs(task: ImageTask) {
  return Math.max(0, new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime());
}

async function syncImageContentTask(task: ImageTask, patch: Partial<{ status: ContentTask["status"]; error: string | null; creditsCharged: number }>) {
  const supabase = await requireStore();
  const { error } = await supabase.from("content_tasks").upsert({
    id: task.id,
    user_id: task.userId,
    topic: task.prompt,
    brief: null,
    task_type: "image",
    status: patch.status ?? contentTaskFromImageTask(task).status,
    error: patch.error ?? task.error,
    credits_charged: patch.creditsCharged ?? 0,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Unable to sync image content task: ${error.message}`);
}

async function writeImageAsset(task: ImageTask, image: { url: string; provider: string; model: string }) {
  const supabase = await requireStore();
  const provider = `${image.provider}/${image.model}`;
  const { data: existing } = await supabase
    .from("assets")
    .select("id")
    .eq("content_task_id", task.id)
    .eq("type", "image")
    .maybeSingle();
  if (existing) return;
  const { error } = await supabase.from("assets").insert({
    content_task_id: task.id,
    type: "image",
    name: "Generated image",
    url: image.url,
    provider,
  });
  if (error) throw new Error(`Unable to save image asset: ${error.message}`);
}

export async function createImageTask(input: { userId: string; prompt: string; model?: string; size?: string }) {
  const supabase = await requireStore();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const { data, error } = await supabase.from("image_tasks").insert({ id, user_id: input.userId, prompt: input.prompt, model: input.model ?? null, size: input.size ?? "1024x1024", status: "pending", created_at: now, updated_at: now }).select().single();
  if (error || !data) throw new Error(`Unable to create image task: ${error?.message ?? "unknown error"}`);
  const task = mapTask(data as ImageTaskRow);
  await syncImageContentTask(task, { status: "pending" });
  return task;
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
  await syncImageContentTask({ ...task, status: "running", provider }, { status: "running", error: null });
  await supabase.from("system_logs").insert({ level: "info", event: "image_task_started", user_id: task.userId, metadata: { imageTaskId: task.id, provider } });
  const creditTask = contentTaskFromImageTask({ ...task, status: "running", provider });
  let pricing: { amount: number; provider: string | null; model: string | null } | undefined;
  try {
    pricing = await reserveCredits(creditTask);
    await syncImageContentTask({ ...task, status: "running", provider }, { status: "running", error: null, creditsCharged: pricing.amount });
    const image = await getImageProvider().generateImage({ taskId: task.id, prompt: task.prompt, model: task.model ?? undefined, size: task.size ?? undefined });
    const completedAt = new Date().toISOString();
    const { data: completed, error: completedError } = await supabase.from("image_tasks").update({ status: "completed", provider_name: image.provider, model: image.model, result_url: image.url, result: { url: image.url, provider: image.provider, model: image.model }, metadata: image.metadata ?? {}, updated_at: completedAt }).eq("id", taskId).select().single();
    if (completedError || !completed) throw new Error(`Unable to save image result: ${completedError?.message ?? "unknown error"}`);
    creditTask.creditsCharged = pricing.amount;
    const settlement = await commitCredits(creditTask, { provider: image.provider, model: image.model });
    await syncImageContentTask(mapTask(completed as ImageTaskRow), { status: "completed", error: null, creditsCharged: pricing.amount });
    await writeImageAsset(mapTask(completed as ImageTaskRow), image);
    await recordAiProviderCost({ userId: task.userId, contentTaskId: task.id, usageHistoryId: settlement.usageHistoryId, provider: image.provider, model: image.model, taskType: "image", creditsUsed: pricing.amount, status: "completed" });
    await supabase.from("system_logs").insert({ level: "info", event: "image_task_completed", user_id: task.userId, metadata: { imageTaskId: task.id, provider: image.provider, model: image.model } });
    const completedTask = mapTask(completed as ImageTaskRow);
    await trackProductEvent({ eventName: "task_complete", userId: task.userId, surface: "image", path: "image-service", properties: { taskId: task.id, taskType: "image", workflowType: "image", provider: image.provider, model: image.model, creditsUsed: pricing.amount, durationMs: taskDurationMs(completedTask) } });
    await trackProductEventOnce({ eventName: "first_generation_completed", userId: task.userId, surface: "image", path: "image-service", properties: { taskId: task.id, taskType: "image", workflowType: "image", creditsUsed: pricing.amount, durationMs: taskDurationMs(completedTask) } });
    await trackProductEventOnce({ eventName: "first_asset_created", userId: task.userId, surface: "content", path: "image-service", properties: { taskId: task.id, assetType: "image" } });
    return mapTask(completed as ImageTaskRow);
  } catch (exception) {
    const message = exception instanceof Error ? exception.message : "Image generation failed.";
    const { data: failed } = await supabase.from("image_tasks").update({ status: "failed", error: message, updated_at: new Date().toISOString() }).eq("id", taskId).select().single();
    await refundCredits(creditTask).catch((refundError) => {
      console.error("[automation-factory] image_credit_refund_failed", { imageTaskId: task.id, message: refundError instanceof Error ? refundError.message : "unknown" });
    });
    await syncImageContentTask(failed ? mapTask(failed as ImageTaskRow) : task, { status: "failed", error: message, creditsCharged: 0 });
    await recordAiProviderCost({ userId: task.userId, contentTaskId: task.id, provider, model: task.model, taskType: "image", creditsUsed: 0, status: "failed", error: message, usage: pricing ? { estimatedCost: undefined } : null });
    await supabase.from("system_logs").insert({ level: "error", event: "image_task_failed", user_id: task.userId, metadata: { imageTaskId: task.id, provider, error: message } });
    await trackProductEvent({ eventName: "generation_failed", userId: task.userId, surface: "image", path: "image-service", properties: { taskId: task.id, taskType: "image", workflowType: "image", provider, error: message, durationMs: failed ? taskDurationMs(mapTask(failed as ImageTaskRow)) : taskDurationMs(task) } });
    if (failed) return mapTask(failed as ImageTaskRow);
    throw exception;
  }
}

export async function listImageTasks(userId: string) { const supabase = await requireStore(); const { data, error } = await supabase.from("image_tasks").select("*").eq("user_id", userId).order("updated_at", { ascending: false }); if (error) throw new Error(`Unable to load images: ${error.message}`); return (data ?? []).map((row) => mapTask(row as ImageTaskRow)); }
