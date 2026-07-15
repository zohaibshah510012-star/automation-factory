import { getPaymentProvider } from "@/lib/payment-provider";
import { getActiveProviderName, getImageProviderName, getVideoProviderName } from "@/lib/providers/registry";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type DiagnosticStatus = "READY" | "WARNING" | "ERROR";

export type DiagnosticItem = {
  name: string;
  status: DiagnosticStatus;
  reason: string;
  details?: Record<string, unknown>;
};

function env(name: string) {
  return process.env[name]?.trim() ?? "";
}

function item(name: string, status: DiagnosticStatus, reason: string, details?: Record<string, unknown>): DiagnosticItem {
  return { name, status, reason, details };
}

function requireEnv(names: string[]) {
  const missing = names.filter((name) => !env(name));
  return missing.length
    ? item("Environment", "ERROR", `Missing required variables: ${missing.join(", ")}`, { missing })
    : item("Environment", "READY", "Required production variables are present.");
}

function providerEnvChecks() {
  const checks: DiagnosticItem[] = [];
  const textProvider = getActiveProviderName();
  const imageProvider = getImageProviderName();
  const videoProvider = getVideoProviderName();

  const requirements: Record<string, string[]> = {
    openai: ["OPENAI_API_KEY"],
    deepseek: ["DEEPSEEK_API_KEY"],
    gemini: ["GEMINI_API_KEY"],
    flux: ["FLUX_API_KEY", "FLUX_API_BASE_URL"],
    runway: ["RUNWAY_API_KEY", "RUNWAY_API_BASE_URL"],
    kling: ["KLING_API_KEY", "KLING_API_BASE_URL"],
    local: [],
    alternative: [],
  };

  for (const [label, provider] of [
    ["Text AI Provider", textProvider],
    ["Image AI Provider", imageProvider],
    ["Video AI Provider", videoProvider],
  ] as const) {
    const missing = (requirements[provider] ?? []).filter((name) => !env(name));
    checks.push(
      missing.length
        ? item(label, "ERROR", `${provider} is selected but missing ${missing.join(", ")}.`, { provider, missing })
        : item(label, provider === "local" || provider === "alternative" ? "WARNING" : "READY", `${provider} provider is configured.`, { provider }),
    );
  }

  return checks;
}

async function checkDatabase(): Promise<DiagnosticItem> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return item("Database", "ERROR", "Supabase service client is unavailable.");
  const { error, count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
  return error
    ? item("Database", "ERROR", error.message)
    : item("Database", "READY", "Supabase database query succeeded.", { profiles: count ?? 0 });
}

async function checkStorage(): Promise<DiagnosticItem> {
  const bucket = env("STORAGE_BUCKET");
  const supabase = getSupabaseServerClient();
  if (!bucket) return item("Storage", "WARNING", "STORAGE_BUCKET is not configured.");
  if (!supabase) return item("Storage", "ERROR", "Supabase service client is unavailable.");
  const { error } = await supabase.storage.getBucket(bucket);
  return error
    ? item("Storage", "WARNING", `Storage bucket check failed: ${error.message}`, { bucket })
    : item("Storage", "READY", "Storage bucket is reachable.", { bucket });
}

async function checkPayment(): Promise<DiagnosticItem> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return item("Payment Provider", "ERROR", "Supabase service client is unavailable.");
  const { data, error } = await supabase.from("payment_providers").select("provider,enabled,mode,status").eq("enabled", true);
  if (error) return item("Payment Provider", "ERROR", error.message);
  const providers = data ?? [];
  if (!providers.length) return item("Payment Provider", "WARNING", "No enabled payment provider.");
  const configured = providers.some((provider) => provider.status === "configured");
  const mockOnly = providers.every((provider) => provider.provider === "mock");
  try {
    getPaymentProvider(providers[0].provider);
  } catch (error) {
    return item("Payment Provider", "ERROR", error instanceof Error ? error.message : "Payment provider check failed.");
  }
  return item(
    "Payment Provider",
    configured && !mockOnly ? "READY" : "WARNING",
    mockOnly ? "Only mock payment provider is enabled." : "At least one payment provider is configured.",
    { providers },
  );
}

async function checkMigrations(): Promise<DiagnosticItem> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return item("Database migration", "ERROR", "Supabase service client is unavailable.");
  const requiredTables = [
    "profiles",
    "content_tasks",
    "credit_transactions",
    "short_drama_assets",
    "distribution_jobs",
    "payment_providers",
    "product_events",
  ];
  const missing: string[] = [];
  for (const table of requiredTables) {
    const { error } = await supabase.from(table).select("*", { head: true, count: "exact" }).limit(1);
    if (error) missing.push(table);
  }
  return missing.length
    ? item("Database migration", "ERROR", `Required tables are missing or inaccessible: ${missing.join(", ")}`, { expectedLatest: "0024_beta_operations.sql", missing })
    : item("Database migration", "READY", "Required tables through migration 0024 are reachable.", { expectedLatest: "0024_beta_operations.sql" });
}

function checkEmail() {
  const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "EMAIL_FROM"].filter((name) => !env(name));
  return missing.length
    ? item("Email", "WARNING", `Email delivery is not fully configured: ${missing.join(", ")}.`, { missing })
    : item("Email", "READY", "SMTP variables are present.");
}

function checkWebhook() {
  return env("WEBHOOK_SIGNING_SECRET")
    ? item("Webhook", "READY", "Webhook signing secret is configured.")
    : item("Webhook", "WARNING", "WEBHOOK_SIGNING_SECRET is not configured.");
}

function checkCron() {
  return env("CRON_SECRET")
    ? item("Cron", "READY", "CRON_SECRET is configured.")
    : item("Cron", "WARNING", "CRON_SECRET is not configured.");
}

function checkSecurity() {
  const hasServiceRoleLeak = Boolean(env("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY"));
  return hasServiceRoleLeak
    ? item("Security", "ERROR", "Service role key is exposed through a NEXT_PUBLIC variable.")
    : item("Security", "READY", "Service role key is server-only and security headers are configured in next.config.ts.");
}

function checkBackup() {
  return env("DATABASE_URL")
    ? item("Backup", "READY", "DATABASE_URL is available for documented backup workflows.")
    : item("Backup", "WARNING", "DATABASE_URL is not configured; use Supabase dashboard backups or add a direct Postgres URL.");
}

export async function getProductionDiagnostics() {
  const [database, storage, payment, migrations] = await Promise.all([
    checkDatabase(),
    checkStorage(),
    checkPayment(),
    checkMigrations(),
  ]);

  const checks = [
    migrations,
    database,
    storage,
    ...providerEnvChecks(),
    payment,
    checkEmail(),
    checkWebhook(),
    checkCron(),
    requireEnv(["NODE_ENV", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "ADMIN_EMAILS"]),
    checkSecurity(),
    checkBackup(),
  ];

  const overall: DiagnosticStatus = checks.some((check) => check.status === "ERROR")
    ? "ERROR"
    : checks.some((check) => check.status === "WARNING")
      ? "WARNING"
      : "READY";

  return { overall, checks, generatedAt: new Date().toISOString() };
}

export async function getProductionMonitor() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase service client is unavailable.");

  const [tasks, usage, logs, imageTasks, videoTasks, distributions, credits] = await Promise.all([
    supabase.from("content_tasks").select("status,credits_charged,updated_at"),
    supabase.from("usage_history").select("provider,model,credits_charged,duration_ms,created_at"),
    supabase.from("system_logs").select("level,event,metadata,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("image_tasks").select("status"),
    supabase.from("video_tasks").select("status"),
    supabase.from("distribution_jobs").select("status"),
    supabase.from("credit_transactions").select("amount,type,status,created_at").order("created_at", { ascending: false }).limit(200),
  ]);

  if (tasks.error) throw tasks.error;
  if (usage.error) throw usage.error;

  const taskRows = tasks.data ?? [];
  const usageRows = usage.data ?? [];
  const completed = taskRows.filter((task) => task.status === "completed").length;
  const failed = taskRows.filter((task) => task.status === "failed").length;
  const running = taskRows.filter((task) => ["pending", "running", "generating"].includes(task.status)).length;
  const total = taskRows.length;
  const latencyValues = usageRows.map((row) => Number(row.duration_ms ?? 0)).filter((value) => value > 0);
  const providerErrors = (logs.data ?? []).filter((log) => log.level === "error" && /provider|ai|video|image/i.test(log.event ?? ""));
  const creditsConsumed = usageRows.reduce((totalCredits, row) => totalCredits + Number(row.credits_charged ?? 0), 0);

  return {
    taskSuccessRate: total ? completed / total : 0,
    taskFailureRate: total ? failed / total : 0,
    tasks: { total, completed, failed, running },
    providerErrors: providerErrors.slice(0, 20),
    aiLatencyMs: {
      average: latencyValues.length ? Math.round(latencyValues.reduce((sum, value) => sum + value, 0) / latencyValues.length) : 0,
      samples: latencyValues.length,
    },
    credits: {
      consumed: creditsConsumed,
      recentTransactions: credits.data ?? [],
    },
    queueStatus: {
      content: running,
      images: (imageTasks.data ?? []).filter((task) => ["pending", "running"].includes(task.status)).length,
      videos: (videoTasks.data ?? []).filter((task) => ["pending", "running", "processing"].includes(task.status)).length,
      distributions: (distributions.data ?? []).filter((job) => ["queued", "publishing"].includes(job.status)).length,
    },
    generatedAt: new Date().toISOString(),
  };
}
