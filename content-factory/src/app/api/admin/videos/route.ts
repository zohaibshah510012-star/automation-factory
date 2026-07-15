import { NextResponse } from "next/server";
import { listAllVideoTasks } from "@/lib/video-service";
import { requireAdmin } from "@/lib/request-auth";
export async function GET(request: Request) { try { await requireAdmin(request); return NextResponse.json({ tasks: await listAllVideoTasks() }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Admin access required" }, { status: 403 }); } }
