import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentAsset, ContentPack, ContentTask } from "@/lib/types";
import { writeDramaAsset } from "@/lib/short-drama-asset-service";
import { createDistributionJob } from "@/lib/distribution-service";

type WorkflowStepType = "prompt" | "ai_generate" | "story_generate" | "character_generate" | "scene_generate" | "image_generate" | "video_generate" | "publish_content" | "save_result";

type Workflow = {
  id: string;
  name: string;
};

type WorkflowStep = {
  id: string;
  position: number;
  agent_name: string;
  enabled: boolean;
  config: unknown;
};

type ResolvedPrompt = {
  name: string;
  version: number;
  systemPrompt: string;
  userPrompt: string;
};

type GeneratedContent = Required<Omit<ContentPack, "assets">> & { assets?: ContentAsset[] };

type WorkflowExecutionInput = {
  task: ContentTask;
  prompt: ResolvedPrompt;
  generateContent: () => Promise<GeneratedContent>;
  generateImage?: () => Promise<{ url: string; provider: string; model: string; metadata?: Record<string, unknown> }>;
  generateVideo?: () => Promise<{ status: "processing" | "completed"; provider: string; model: string; videoUrl?: string; thumbnailUrl?: string; metadata?: Record<string, unknown> }>;
};

type WorkflowExecutionResult = {
  workflowId: string;
  workflowRunId: string;
  content: GeneratedContent;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function getStepType(step: WorkflowStep, isLastStep: boolean): WorkflowStepType {
  const configuredType = asRecord(step.config).type;
  if (configuredType === "prompt" || configuredType === "ai_generate" || configuredType === "story_generate" || configuredType === "character_generate" || configuredType === "scene_generate" || configuredType === "image_generate" || configuredType === "video_generate" || configuredType === "publish_content" || configuredType === "save_result") {
    return configuredType;
  }

  // Existing seed workflows predate the typed step editor. Keep them executable
  // by mapping their Text Agent to generation and their final step to persistence.
  if (step.agent_name === "Text Agent") return "ai_generate";
  if (isLastStep) return "save_result";
  return "prompt";
}

async function requireActiveWorkflow(task: ContentTask) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Workflow Executor requires Supabase configuration.");

  let workflowQuery = supabase
    .from("workflows")
    .select("id,name")
    .eq("enabled", true)
    .order("created_at", { ascending: true })
    .limit(1);
  if (task.taskType === "drama") workflowQuery = workflowQuery.eq("name", "short_drama_pipeline");
  const { data: workflow, error: workflowError } = await workflowQuery.maybeSingle();

  if (workflowError) throw new Error(`Unable to load workflow: ${workflowError.message}`);
  if (!workflow) throw new Error("No enabled workflow is available for this task.");

  const { data: steps, error: stepsError } = await supabase
    .from("workflow_steps")
    .select("id,position,agent_name,enabled,config")
    .eq("workflow_id", workflow.id)
    .eq("enabled", true)
    .order("position", { ascending: true });

  if (stepsError) throw new Error(`Unable to load workflow steps: ${stepsError.message}`);
  if (!steps?.length) throw new Error("The selected workflow does not contain enabled steps.");

  return { supabase, workflow: workflow as Workflow, steps: steps as WorkflowStep[] };
}

async function failWorkflowRun(workflowRunId: string, error: unknown) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  await supabase
    .from("workflow_runs")
    .update({ status: "failed", error: error instanceof Error ? error.message : "Workflow execution failed.", updated_at: new Date().toISOString() })
    .eq("id", workflowRunId);
}

export async function executeWorkflow(input: WorkflowExecutionInput): Promise<WorkflowExecutionResult> {
  const { supabase, workflow, steps } = await requireActiveWorkflow(input.task);
  const startedAt = new Date().toISOString();
  const { data: workflowRun, error: workflowRunError } = await supabase
    .from("workflow_runs")
    .insert({
      workflow_id: workflow.id,
      content_task_id: input.task.id,
      user_id: input.task.userId ?? null,
      // task_status predates the application-level "running" state.
      status: "generating",
      current_step: 0,
      attempts: 1,
      created_at: startedAt,
      updated_at: startedAt,
    })
    .select("id")
    .single();

  if (workflowRunError || !workflowRun) {
    throw new Error(`Unable to create workflow run: ${workflowRunError?.message ?? "unknown error"}`);
  }

  let generatedContent: GeneratedContent | undefined;
  const generatedAssets: ContentAsset[] = [];

  try {
    for (const [index, step] of steps.entries()) {
      const stepType = getStepType(step, index === steps.length - 1);
      const stepInput = stepType === "prompt"
        ? { prompt: input.prompt.name, version: input.prompt.version }
        : stepType === "ai_generate" || stepType === "story_generate"
          ? { topic: input.task.topic, prompt: input.prompt.name }
          : stepType === "scene_generate"
            ? { topic: input.task.topic, hasStory: Boolean(generatedContent) }
            : stepType === "character_generate"
              ? { topic: input.task.topic, hasStory: Boolean(generatedContent) }
          : stepType === "image_generate"
            ? { topic: input.task.topic, prompt: input.prompt.name }
            : stepType === "video_generate"
              ? { topic: input.task.topic, prompt: input.prompt.name }
          : { taskId: input.task.id, hasGeneratedContent: Boolean(generatedContent) };
      const stepStartedAt = new Date().toISOString();
      const { data: stepRun, error: stepRunError } = await supabase
        .from("workflow_step_runs")
        .insert({
          workflow_run_id: workflowRun.id,
          step_id: step.id,
          position: step.position,
          status: "generating",
          input: stepInput,
          started_at: stepStartedAt,
        })
        .select("id")
        .single();

      if (stepRunError || !stepRun) {
        throw new Error(`Unable to create workflow step run: ${stepRunError?.message ?? "unknown error"}`);
      }

      try {
        let output: Record<string, unknown>;
        if (stepType === "prompt") {
          output = { systemPrompt: input.prompt.systemPrompt, userPrompt: input.prompt.userPrompt };
        } else if (stepType === "ai_generate" || stepType === "story_generate") {
          generatedContent = await input.generateContent();
          generatedContent.assets = generatedAssets;
          output = stepType === "story_generate" ? { title: generatedContent.title, story: generatedContent.script } : { title: generatedContent.title, script: generatedContent.script, storyboard: generatedContent.storyboard };
          if(stepType==="story_generate")await writeDramaAsset({taskId:input.task.id,userId:input.task.userId,title:generatedContent.title,story:generatedContent.script});
        } else if (stepType === "character_generate") {
          if (!generatedContent) throw new Error("Workflow character_generate step requires a story result.");
          const characters = [{ character_name: "主角", appearance: "与主题相符的鲜明视觉特征", personality: "目标明确、具有成长弧光", role: "推动主线冲突", visual_prompt: `${input.task.topic}, cinematic character design, consistent costume, dramatic lighting` }];
          output = { characters };
          await writeDramaAsset({taskId:input.task.id,userId:input.task.userId,characters});
        } else if (stepType === "scene_generate") {
          if (!generatedContent) throw new Error("Workflow scene_generate step requires a story result.");
          output = { scenes: generatedContent.storyboard.map((description, index) => ({ scene_number: index + 1, title: `场景 ${index + 1}`, description, location: "根据剧情设定", characters: ["主角"], dialogue: "根据剧情推进的关键对白", camera: "cinematic medium shot", duration: "8-12s" })), story: generatedContent.script };
          await writeDramaAsset({taskId:input.task.id,userId:input.task.userId,scenes:output.scenes});
        } else if (stepType === "image_generate") {
          if (input.task.taskType === "drama") {
            output = { queuedSceneImages: true, scenes: generatedContent?.storyboard ?? [] };
          } else {
          if (!input.generateImage) throw new Error("Workflow image_generate step requires an image provider.");
          const image = await input.generateImage();
          const asset = { id: `workflow-image-${step.position}`, type: "image" as const, name: `Workflow image ${step.position}`, url: image.url, provider: `${image.provider}/${image.model}` };
          generatedAssets.push(asset);
          if (generatedContent) generatedContent.assets = generatedAssets;
          output = { image: asset, metadata: image.metadata ?? {} };
          }
        } else if (stepType === "video_generate") {
          if (!input.generateVideo) throw new Error("Workflow video_generate step requires a video provider.");
          const video = await input.generateVideo();
          if (video.status !== "completed" || !video.videoUrl) throw new Error("Workflow video_generate step requires a completed video result.");
          const asset = { id: `workflow-video-${step.position}`, type: "video" as const, name: `Workflow video ${step.position}`, url: video.videoUrl, provider: `${video.provider}/${video.model}` };
          generatedAssets.push(asset);
          if (generatedContent) generatedContent.assets = generatedAssets;
          output = { video: asset, thumbnailUrl: video.thumbnailUrl ?? null, metadata: video.metadata ?? {} };
        } else if (stepType === "publish_content") {
          if (!input.task.userId) throw new Error("Workflow publish_content requires a user."); const job=await createDistributionJob({userId:input.task.userId,contentId:input.task.id,contentType:input.task.taskType??"text",platform:"mock"}); output={distributionJobId:job.id,status:"queued"};
        } else {
          if (!generatedContent) throw new Error("Workflow save_result step requires generated content.");
          output = { saved: true, title: generatedContent.title };
        }

        const { error: completeStepError } = await supabase
          .from("workflow_step_runs")
          .update({ status: "completed", output, completed_at: new Date().toISOString() })
          .eq("id", stepRun.id);
        if (completeStepError) throw new Error(`Unable to complete workflow step: ${completeStepError.message}`);

        const { error: progressError } = await supabase
          .from("workflow_runs")
          .update({ current_step: step.position, updated_at: new Date().toISOString() })
          .eq("id", workflowRun.id);
        if (progressError) throw new Error(`Unable to update workflow progress: ${progressError.message}`);
      } catch (error) {
        await supabase
          .from("workflow_step_runs")
          .update({ status: "failed", error: error instanceof Error ? error.message : "Workflow step failed.", completed_at: new Date().toISOString() })
          .eq("id", stepRun.id);
        throw error;
      }
    }

    if (!generatedContent) throw new Error("Workflow completed without an AI generation step.");

    const { error: completeWorkflowError } = await supabase
      .from("workflow_runs")
      .update({ status: "completed", current_step: steps.at(-1)?.position ?? 0, updated_at: new Date().toISOString() })
      .eq("id", workflowRun.id);
    if (completeWorkflowError) throw new Error(`Unable to complete workflow run: ${completeWorkflowError.message}`);

    return { workflowId: workflow.id, workflowRunId: workflowRun.id, content: generatedContent };
  } catch (error) {
    await failWorkflowRun(workflowRun.id, error);
    throw error;
  }
}
