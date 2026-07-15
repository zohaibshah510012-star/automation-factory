import {
  getActiveProviderName,
  getAiProviders,
  getImageProvider,
  getVideoProvider,
  getProviderErrorMessage,
  getProviderErrorType,
  getOpenAiNetworkDiagnostics,
} from "@/lib/ai-providers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePublishedPrompt, type TaskType } from "@/lib/prompt-engine";
import type { ContentTask } from "@/lib/types";
import { runAgent } from "@/lib/agent-runtime";
import { commitCredits, refundCredits, reserveCredits } from "@/lib/credits-service";
import { createDramaSceneImages } from "@/lib/drama-images";
import { trackProductEvent } from "@/lib/product-analytics";

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
  user_id?: string | null;
  task_type?: TaskType;
  input_payload?: unknown;
  credits_charged?: number;
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
  const inputPayload = row.input_payload && typeof row.input_payload === "object" && !Array.isArray(row.input_payload)
    ? row.input_payload as Record<string, unknown>
    : {};
  return {
    id: row.id,
    userId: row.user_id ?? undefined,
    topic: row.topic,
    brief: row.brief ?? undefined,
    taskType: row.task_type ?? "short_video_script",
    agentId: typeof inputPayload.agent_id === "string" ? inputPayload.agent_id : undefined,
    creditsCharged: row.credits_charged ?? 0,
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
    user_id: task.userId ?? null,
    topic: task.topic,
    brief: task.brief ?? null,
    task_type: task.taskType ?? "short_video_script",
    input_payload: task.agentId ? { agent_id: task.agentId } : {},
    prompt_template_id: task.promptId ?? null,
    credits_charged: task.creditsCharged ?? 0,
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

export async function listTasks(userId?: string): Promise<ContentTask[]> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    let query = supabase
      .from("content_tasks")
      .select("*, assets(id, type, name, url, provider)")
      .order("updated_at", { ascending: false });
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query;
    if (!error && data) return (data as DatabaseTask[]).map(taskFromDatabase);
  }

  return [...taskStore.values()].toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createTask(input: { topic: string; brief?: string; userId: string; taskType: TaskType; promptId?: string; agentId?: string }): Promise<ContentTask> {
  const createdAt = timestamp();
  const task: ContentTask = {
    id: crypto.randomUUID(),
    userId: input.userId,
    topic: input.topic,
    brief: input.brief,
    taskType: input.taskType,
    promptId: input.promptId,
    agentId: input.agentId,
    status: "pending",
    assets: [],
    createdAt,
    updatedAt: createdAt,
  };
  await syncTask(task);
  taskStore.set(task.id, task);
  await syncGenerationStatus(task);
  console.info("[automation-factory] task_created", { taskId: task.id, userId: task.userId, taskType: task.taskType, credits: task.creditsCharged });
  return task;
}

export async function runTask(taskId: string) {
  const task = taskStore.get(taskId) ?? (await listTasks()).find((item) => item.id === taskId);
  if (!task) return;

  task.status = "running";
  task.updatedAt = timestamp();
  await syncTask(task);
  await syncGenerationStatus(task);
  await getSupabaseServerClient()?.from("system_logs").insert({ level: "info", event: "task_started", task_id: task.id, metadata: { taskType: task.taskType } });
  console.info("[automation-factory] workflow_started", { taskId: task.id, taskType: task.taskType });

  try {
    const pricing = await reserveCredits(task);
    await syncTask(task);
    const [providers, imageProvider, videoProvider, prompt] = await Promise.all([Promise.resolve(getAiProviders()), Promise.resolve(getImageProvider()), Promise.resolve(getVideoProvider()), resolvePublishedPrompt({ taskType: task.taskType ?? "short_video_script", topic: task.topic, brief: task.brief, userId: task.userId, promptId: task.promptId })]);
    const agent = await runAgent(task.id, {
      task,
      prompt,
      generateContent: () => providers.text.generateContentPack({ ...task, systemPrompt: prompt.systemPrompt, userPrompt: prompt.userPrompt }),
      generateImage: () => imageProvider.generateImage({ taskId: task.id, prompt: prompt.userPrompt }),
      generateVideo: () => videoProvider.generateVideo({ taskId: task.id, prompt: prompt.userPrompt }),
    });
    const content = agent.content;
    console.info("[automation-factory] provider_completed", { taskId: task.id, provider: getActiveProviderName(), prompt: prompt.name, version: prompt.version, workflowId: agent.workflowId, workflowRunId: agent.workflowRunId, agentId: agent.agentId, agentRunId: agent.agentRunId });

    task.title = content.title;
    task.script = content.script;
    task.storyboard = content.storyboard;
    task.assets = content.assets ?? [];
    if (task.taskType === "drama" && task.userId) await createDramaSceneImages({ dramaId: task.id, userId: task.userId, topic: task.topic, scenes: content.storyboard });

    // The DeepSeek MVP is intentionally text-only: title, script, and storyboard.
    if (!task.assets.length && getActiveProviderName() !== "deepseek") {
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
    await commitCredits(task, pricing);
    await syncTask(task);
    await syncContentPack(task);
    await trackProductEvent({ eventName: "task_complete", userId: task.userId, surface: "product", path: "task-store", properties: { taskId: task.id, taskType: task.taskType, provider: getActiveProviderName() } });
    await getSupabaseServerClient()?.from("system_logs").insert({ level: "info", event: "task_completed", task_id: task.id, metadata: { provider: getActiveProviderName() } });
    console.info("[automation-factory] workflow_completed", { taskId: task.id });
  } catch (error) {
    task.status = "failed";
    console.error("[content-factory] provider_error", {
      stage: "content_generation",
      type: getProviderErrorType(error),
      ...getOpenAiNetworkDiagnostics(),
    });
    task.error = userFacingGenerationError(error);
    task.updatedAt = timestamp();
    await refundCredits(task);
    await syncTask(task);
    await syncGenerationStatus(task);
    await getSupabaseServerClient()?.from("system_logs").insert({ level: "error", event: "task_failed", task_id: task.id, metadata: { type: getProviderErrorType(error) } });
    console.error("[automation-factory] workflow_failed", { taskId: task.id, type: getProviderErrorType(error) });
  }
}
