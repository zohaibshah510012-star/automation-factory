import { NextResponse } from "next/server";
import { createImageTask, listImageTasks, runImageTask } from "@/lib/image-service";
import { trackProductEvent } from "@/lib/product-analytics";
import { requireUser } from "@/lib/request-auth";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { const user = await requireUser(request); return NextResponse.json({ tasks: await listImageTasks(user.id) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load images" }, { status: 400 }); } }
export async function POST(request: Request) { try { const user = await requireUser(request); const body = await request.json() as { prompt?: string; model?: string; size?: string }; const prompt = body.prompt?.trim(); if (!prompt) return NextResponse.json({ error: "Image prompt is required" }, { status: 400 }); const task = await createImageTask({ userId: user.id, prompt, model: body.model, size: body.size }); await trackProductEvent({ eventName: "task_create", userId: user.id, surface: "image", path: "/api/images", properties: { taskId: task.id, taskType: "image" } }); void runImageTask(task.id); return NextResponse.json({ task }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create image task" }, { status: 400 }); } }
