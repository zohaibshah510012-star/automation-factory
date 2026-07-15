import { NextResponse } from "next/server";
import { getVideoTask, refreshVideoTaskStatus } from "@/lib/video-service";
import { requireUser } from "@/lib/request-auth";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await requireUser(request); const id = (await params).id; if (!await getVideoTask(id, user.id)) return NextResponse.json({ error: "Video task not found" }, { status: 404 }); return NextResponse.json({ task: await refreshVideoTaskStatus(id) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to refresh video" }, { status: 400 }); } }
