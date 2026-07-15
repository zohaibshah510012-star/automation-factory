import { NextResponse } from "next/server";
import { createVideoTask, listVideoTasks, runVideoTask } from "@/lib/video-service";
import { requireUser } from "@/lib/request-auth";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { const user = await requireUser(request); return NextResponse.json({ tasks: await listVideoTasks(user.id) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load videos" }, { status: 400 }); } }
export async function POST(request: Request) { try { const user = await requireUser(request); const body = await request.json() as { prompt?: string; model?: string; durationSeconds?: number }; const prompt = body.prompt?.trim(); if (!prompt) return NextResponse.json({ error: "Video prompt is required" }, { status: 400 }); const task = await createVideoTask({ userId: user.id, prompt, model: body.model, durationSeconds: body.durationSeconds }); void runVideoTask(task.id); return NextResponse.json({ task }, { status: 201 }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create video task" }, { status: 400 }); } }
