import { processDistributionJobs } from "@/lib/distribution-worker";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const MAX_RETRIES = 3; const TIMEOUT_MS = 10 * 60 * 1000;
export async function runDistributionScheduler() {
  const supabase = getSupabaseServerClient(); if (!supabase) throw new Error("DISTRIBUTION_UNAVAILABLE");
  const now = Date.now(); const { data: publishing } = await supabase.from("distribution_jobs").select("id,updated_at").eq("status", "publishing");
  for (const job of publishing ?? []) if (now - new Date(job.updated_at).getTime() > TIMEOUT_MS) await supabase.from("distribution_jobs").update({ status: "failed", error: "Publishing timed out", result: { lastRunAt: new Date().toISOString(), errorHistory: ["Publishing timed out"] } }).eq("id", job.id);
  await processDistributionJobs();
  const { data: failed } = await supabase.from("distribution_jobs").select("id,payload,result,error").eq("status", "failed");
  for (const job of failed ?? []) { const payload = job.payload as Record<string, unknown>; const retryCount = Number(payload.retry_count ?? 0) + 1; const maxRetries = Number(payload.max_retries ?? MAX_RETRIES); if (retryCount <= maxRetries) await supabase.from("distribution_jobs").update({ status: "queued", payload: { ...payload, retry_count: retryCount, max_retries: maxRetries }, result: { ...(job.result as Record<string, unknown> ?? {}), lastRunAt: new Date().toISOString() }, updated_at: new Date().toISOString() }).eq("id", job.id); }
}
