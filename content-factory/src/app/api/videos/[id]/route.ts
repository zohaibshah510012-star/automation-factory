import { NextResponse } from "next/server";
import { getVideoTask } from "@/lib/video-service";
import { requireUser } from "@/lib/request-auth";
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await requireUser(request); const task = await getVideoTask((await params).id, user.id); if (!task) return NextResponse.json({ error: "Video task not found" }, { status: 404 }); return NextResponse.json({ task }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load video" }, { status: 400 }); } }
