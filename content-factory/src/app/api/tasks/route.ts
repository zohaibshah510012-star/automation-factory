import { NextResponse } from "next/server";

import { createTask, listTasks, runTask } from "@/lib/task-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ tasks: await listTasks() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { topic?: string; brief?: string };
  const topic = body.topic?.trim();

  if (!topic) {
    return NextResponse.json({ error: "主题不能为空。" }, { status: 400 });
  }

  const task = await createTask({ topic, brief: body.brief?.trim() });
  void runTask(task.id);
  return NextResponse.json({ task }, { status: 201 });
}
