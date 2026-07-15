import { getDistributionProvider } from "@/lib/distribution-registry";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type CreateDistributionJobInput = { userId: string; contentId: string; contentType: string; platform: string; payload?: Record<string, unknown> };

function requireStore() { const store = getSupabaseServerClient(); if (!store) throw new Error("DISTRIBUTION_UNAVAILABLE"); return store; }

export async function createDistributionJob(input: CreateDistributionJobInput) {
  const store = requireStore();
  const { data, error } = await store.from("distribution_jobs").insert({ user_id: input.userId, content_id: input.contentId, content_type: input.contentType, platform: input.platform, status: "queued", payload: input.payload ?? {} }).select().single();
  if (error || !data) throw error ?? new Error("Job create failed");
  return data;
}

async function setJobStatus(id: string, values: Record<string, unknown>) { return requireStore().from("distribution_jobs").update({ ...values, updated_at: new Date().toISOString() }).eq("id", id); }

function resolveProvider(platform: string) {
  try { return getDistributionProvider(platform); }
  catch { return getDistributionProvider("mock"); }
}

export async function processDistributionJob(id: string) {
  const store = requireStore();
  const { data: job, error } = await store.from("distribution_jobs").select("*").eq("id", id).single();
  if (error || !job) throw error ?? new Error("Distribution job not found");
  await setJobStatus(id, { status: "publishing" });
  try {
    const result = await resolveProvider(job.platform).publish({ platform: job.platform, payload: job.payload });
    const { data } = await store.from("distribution_jobs").update({ status: "published", result, updated_at: new Date().toISOString() }).eq("id", id).select().single();
    return data;
  } catch (exception) {
    await setJobStatus(id, { status: "failed", error: exception instanceof Error ? exception.message : "Publish failed" });
    throw exception;
  }
}
