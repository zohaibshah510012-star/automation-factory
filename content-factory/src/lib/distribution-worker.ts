import { processDistributionJob } from "@/lib/distribution-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function processDistributionJobs() {
  const supabase = getSupabaseServerClient(); if (!supabase) throw new Error("DISTRIBUTION_UNAVAILABLE");
  const { data, error } = await supabase.from("distribution_jobs").select("id,user_id").eq("status", "queued").order("created_at").limit(50);
  if (error) throw error; const results = [];
  for (const job of data ?? []) {
    await supabase.from("system_logs").insert({ level: "info", event: "distribution_started", user_id: job.user_id, metadata: { distributionJobId: job.id } });
    try { const result = await processDistributionJob(job.id); await supabase.from("system_logs").insert({ level: "info", event: "distribution_completed", user_id: job.user_id, metadata: { distributionJobId: job.id } }); results.push(result); }
    catch (exception) { await supabase.from("system_logs").insert({ level: "error", event: "distribution_failed", user_id: job.user_id, metadata: { distributionJobId: job.id, error: exception instanceof Error ? exception.message : "Publish failed" } }); }
  }
  return results;
}
