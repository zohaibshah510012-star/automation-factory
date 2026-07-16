import { NextResponse } from "next/server";

import { createTask, listTasks, runTask } from "@/lib/task-store";
import { assertDailyGenerationLimit } from "@/lib/ai-cost-service";
import { trackProductEvent } from "@/lib/product-analytics";
import { requireUser } from "@/lib/request-auth";
import type { TaskType } from "@/lib/prompt-engine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { const user = await requireUser(request); return NextResponse.json({ tasks: await listTasks(user.id) }); }
  catch { return NextResponse.json({ error: "Authentication required" }, { status: 401 }); }
}

export async function POST(request: Request) {
  const body = (await request.json()) as { topic?: string; brief?: string; taskType?: TaskType; promptId?: string; agentId?: string };
  const topic = body.topic?.trim();

  if (!topic) {
    return NextResponse.json({ error: "主题不能为空。" }, { status: 400 });
  }

  try {
    const user = await requireUser(request);
    await assertDailyGenerationLimit(user.id);
    const task = await createTask({ topic, brief: body.brief?.trim(), userId: user.id, taskType: body.taskType ?? "short_video_script", promptId: body.promptId, agentId: body.agentId });
    await trackProductEvent({ eventName: "task_create", userId: user.id, surface: "product", path: "/api/tasks", properties: { taskId: task.id, taskType: task.taskType, topic: task.topic } });
    void runTask(task.id);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "TASK_CREATION_FAILED";
    return NextResponse.json({ error: code }, { status: code === "INSUFFICIENT_CREDITS" ? 402 : 400 });
  }
}
