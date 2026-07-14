import {
  getActiveProviderName,
  getAiProviders,
  getProviderErrorMessage,
  getProviderErrorType,
  getOpenAiNetworkDiagnostics,
} from "@/lib/ai-providers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentTask } from "@/lib/types";

const taskStore = new Map<string, ContentTask>();

function timestamp() {
  return new Date().toISOString();
}

function userFacingGenerationError(error: unknown) {
  return getProviderErrorMessage(error);
}

function seedTask(): ContentTask {
  const createdAt = new Date(Date.now() - 1000 * 60 * 18).toISOString();
  return {
    id: "demo-content-factory",
    topic: "AI 自动化如何帮助小团队提升内容产能",
    status: "completed",
    title: "AI 自动化：小团队内容产能翻倍的 3 个动作",
    script: "从一个主题开始，把选题、脚本、素材和配音串成稳定的内容生产线。",
    storyboard: ["痛点开场", "方法拆解", "成果展示", "行动号召"],
    assets: [
      { id: "demo-image-1", type: "image", name: "分镜素材 1", url: "mock://images/demo/1", provider: "local-image" },
      { id: "demo-image-2", type: "image", name: "分镜素材 2", url: "mock://images/demo/2", provider: "local-image" },
      { id: "demo-voice", type: "voice", name: "中文口播配音", url: "mock://voice/demo", provider: "local-voice" },
    ],
    createdAt,
    updatedAt: createdAt,
  };
}

taskStore.set("demo-content-factory", seedTask());

type DatabaseTask = {
  id: string;
  project_id: string | null;
  topic: string;
  brief: string | null;
  status: ContentTask["status"];
  title: string | null;
  script: string | null;
  storyboard: unknown;
  error: string | null;
  created_at: string;
  updated_at: string;
  assets?: { id: string; type: "image" | "voice" | "video"; name: string; url: string; provider: string }[];
};

function taskFromDatabase(row: DatabaseTask): ContentTask {
  return {
    id: row.id,
    topic: row.topic,
    brief: row.brief ?? undefined,
    status: row.status,
    title: row.title ?? undefined,
    script: row.script ?? undefined,
    storyboard: Array.isArray(row.storyboard) ? row.storyboard as string[] : undefined,
    assets: row.assets ?? [],
    error: row.error ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function syncTask(task: ContentTask) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("content_tasks").upsert({
    id: task.id,
    topic: task.topic,
    brief: task.brief ?? null,
    status: task.status,
    title: task.title ?? null,
    script: task.script ?? null,
    storyboard: task.storyboard ?? null,
    error: task.error ?? null,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  });
}

async function syncContentPack(task: ContentTask) {
  const supabase = getSupabaseServerClient();
  if (!supabase || !task.title || !task.script || !task.storyboard) return;

  await Promise.all([
    supabase.from("assets").delete().eq("content_task_id", task.id),
    supabase.from("ai_generations").upsert({
      content_task_id: task.id,
      provider: getActiveProviderName(),
      stage: "text",
      status: task.status,
      input: { topic: task.topic, brief: task.brief ?? null },
      output: {
        title: task.title,
        script: task.script,
        storyboard: task.storyboard,
      },
      error: task.error ?? null,
      updated_at: task.updatedAt,
    }, { onConflict: "content_task_id,stage" }),
  ]);

  if (task.assets.length) {
    await supabase.from("assets").insert(task.assets.map((asset) => ({
      content_task_id: task.id,
      type: asset.type,
      name: asset.name,
      url: asset.url,
      provider: asset.provider,
    })));
  }
}

async function syncGenerationStatus(task: ContentTask) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("ai_generations").upsert({
    content_task_id: task.id,
    provider: getActiveProviderName(),
    stage: "text",
    status: task.status,
    input: { topic: task.topic, brief: task.brief ?? null },
    error: task.error ?? null,
    updated_at: task.updatedAt,
  }, { onConflict: "content_task_id,stage" });
}

export async function listTasks(): Promise<ContentTask[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("content_tasks")
      .select("*, assets(id, type, name, url, provider)")
      .order("updated_at", { ascending: false });
    if (!error && data) return (data as DatabaseTask[]).map(taskFromDatabase);
  }

  return [...taskStore.values()].toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createTask(input: { topic: string; brief?: string }): Promise<ContentTask> {
  const createdAt = timestamp();
  const task: ContentTask = {
    id: crypto.randomUUID(),
    topic: input.topic,
    brief: input.brief,
    status: "pending",
    assets: [],
    createdAt,
    updatedAt: createdAt,
  };
  taskStore.set(task.id, task);
  await syncTask(task);
  await syncGenerationStatus(task);
  return task;
}

export async function runTask(taskId: string) {
  const task = taskStore.get(taskId) ?? (await listTasks()).find((item) => item.id === taskId);
  if (!task) return;

  task.status = "generating";
  task.updatedAt = timestamp();
  await syncTask(task);
  await syncGenerationStatus(task);

  try {
    const providers = getAiProviders();
    const content = await providers.text.generateContentPack(task);

    task.title = content.title;
    task.script = content.script;
    task.storyboard = content.storyboard;
    task.assets = [];

    // The DeepSeek MVP is intentionally text-only: title, script, and storyboard.
    if (getActiveProviderName() !== "deepseek") {
      const images = await providers.image.generateStoryboardImages({
        taskId: task.id,
        topic: task.topic,
        scenes: content.storyboard,
      });
      const voice = await providers.voice.synthesize({ taskId: task.id, script: content.script });
      task.assets = [...images, voice];
    }

    task.status = "completed";
    task.updatedAt = timestamp();
    await syncTask(task);
    await syncContentPack(task);
  } catch (error) {
    task.status = "failed";
    console.error("[content-factory] provider_error", {
      stage: "content_generation",
      type: getProviderErrorType(error),
      ...getOpenAiNetworkDiagnostics(),
    });
    task.error = userFacingGenerationError(error);
    task.updatedAt = timestamp();
    await syncTask(task);
    await syncGenerationStatus(task);
  }
}
