import { NextResponse } from "next/server";
import { createVideoTask, listVideoTasks, runVideoTask } from "@/lib/video-service";
import { assertVideoProviderConfigured } from "@/lib/ai-providers";
import { assertDailyGenerationLimit } from "@/lib/ai-cost-service";
import { trackProductEvent } from "@/lib/product-analytics";
import { requireUser } from "@/lib/request-auth";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { const user = await requireUser(request); return NextResponse.json({ tasks: await listVideoTasks(user.id) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load videos" }, { status: 400 }); } }
export async function POST(request: Request) { try { const user = await requireUser(request); const body = await request.json() as { prompt?: string; model?: string; durationSeconds?: number }; const prompt = body.prompt?.trim(); if (!prompt) return NextResponse.json({ error: "Video prompt is required" }, { status: 400 }); assertVideoProviderConfigured(); await assertDailyGenerationLimit(user.id); const task = await createVideoTask({ userId: user.id, prompt, model: body.model, durationSeconds: body.durationSeconds }); await trackProductEvent({ eventName: "task_create", userId: user.id, surface: "video", path: "/api/videos", properties: { taskId: task.id, taskType: "video" } }); void runVideoTask(task.id); return NextResponse.json({ task }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create video task" }, { status: 400 }); } }
