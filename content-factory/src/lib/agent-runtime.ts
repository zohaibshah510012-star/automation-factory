import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentAsset, ContentPack, ContentTask } from "@/lib/types";
import type { ProviderUsage } from "@/lib/providers/contracts";
import { executeWorkflow } from "@/lib/workflow-executor";

type ResolvedPrompt = {
  name: string;
  version: number;
  systemPrompt: string;
  userPrompt: string;
};

type GeneratedContent = Required<Omit<ContentPack, "assets">> & { assets?: ContentAsset[]; usage?: ProviderUsage };

type AgentRuntimeInput = {
  task: ContentTask;
  prompt: ResolvedPrompt;
  generateContent: () => Promise<GeneratedContent>;
  generateImage?: () => Promise<{ url: string; provider: string; model: string; metadata?: Record<string, unknown> }>;
  generateVideo?: () => Promise<{ status: "processing" | "completed"; provider: string; model: string; videoUrl?: string; thumbnailUrl?: string; metadata?: Record<string, unknown> }>;
};

type ConfiguredAgent = {
  id: string;
  agent_name: string;
  provider_name: string | null;
  model: string | null;
  prompt_template_name: string;
};

type AgentRuntimeResult = {
  agentId?: string;
  agentRunId?: string;
  workflowId: string;
  workflowRunId: string;
  content: GeneratedContent;
};

function getAgentId(inputPayload: unknown) {
  if (!inputPayload || typeof inputPayload !== "object" || Array.isArray(inputPayload)) return undefined;
  const agentId = (inputPayload as Record<string, unknown>).agent_id;
  return typeof agentId === "string" && agentId.length > 0 ? agentId : undefined;
}

async function loadTaskAgent(taskId: string): Promise<ConfiguredAgent | undefined> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Agent Runtime requires Supabase configuration.");

  const { data: task, error: taskError } = await supabase
    .from("content_tasks")
    .select("input_payload,task_type")
    .eq("id", taskId)
    .maybeSingle();
  if (taskError) throw new Error(`Unable to load task agent configuration: ${taskError.message}`);

  const agentId = getAgentId(task?.input_payload);
  if (!agentId && task?.task_type !== "drama") return undefined;

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("id,agent_name,provider_name,model,prompt_template_name")
    .eq(agentId ? "id" : "agent_name", agentId ?? "Short Drama Producer")
    .eq("enabled", true)
    .maybeSingle();
  if (agentError) throw new Error(`Unable to load agent: ${agentError.message}`);
  if (!agent) throw new Error("The selected agent is unavailable.");
  return agent as ConfiguredAgent;
}

async function writeAgentLog(level: "info" | "error", event: "agent_started" | "agent_completed" | "agent_failed", task: ContentTask, metadata: Record<string, unknown>) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;
  await supabase.from("system_logs").insert({ level, event, task_id: task.id, user_id: task.userId ?? null, metadata });
}

/**
 * Runs an explicitly selected agent for a task. A task without input_payload.agent_id
 * keeps the existing default Workflow Executor path and does not create an agent run.
 */
export async function runAgent(taskId: string, input: AgentRuntimeInput): Promise<AgentRuntimeResult> {
  const agent = await loadTaskAgent(taskId);
  if (!agent) {
    const workflow = await executeWorkflow(input);
    return { ...workflow };
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Agent Runtime requires Supabase configuration.");
  const startedAt = new Date().toISOString();
  const { data: agentRun, error: agentRunError } = await supabase
    .from("agent_runs")
    .insert({
      agent_id: agent.id,
      content_task_id: input.task.id,
      user_id: input.task.userId ?? null,
      status: "running",
      input: { topic: input.task.topic, prompt: input.prompt.name, agent: agent.agent_name },
      started_at: startedAt,
    })
    .select("id")
    .single();
  if (agentRunError || !agentRun) {
    throw new Error(`Unable to create agent run: ${agentRunError?.message ?? "unknown error"}`);
  }

  await writeAgentLog("info", "agent_started", input.task, { agentId: agent.id, agentName: agent.agent_name, agentRunId: agentRun.id });

  try {
    const workflow = await executeWorkflow(input);
    const output = { title: workflow.content.title, script: workflow.content.script, storyboard: workflow.content.storyboard, workflowRunId: workflow.workflowRunId };
    const { error: completeError } = await supabase
      .from("agent_runs")
      .update({ status: "completed", output, completed_at: new Date().toISOString() })
      .eq("id", agentRun.id);
    if (completeError) throw new Error(`Unable to complete agent run: ${completeError.message}`);
    await writeAgentLog("info", "agent_completed", input.task, { agentId: agent.id, agentName: agent.agent_name, agentRunId: agentRun.id, workflowRunId: workflow.workflowRunId });
    return { agentId: agent.id, agentRunId: agentRun.id, ...workflow };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent execution failed.";
    await supabase.from("agent_runs").update({ status: "failed", error: message, completed_at: new Date().toISOString() }).eq("id", agentRun.id);
    await writeAgentLog("error", "agent_failed", input.task, { agentId: agent.id, agentName: agent.agent_name, agentRunId: agentRun.id, error: message });
    throw error;
  }
}
