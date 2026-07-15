import { NextResponse } from "next/server";

import { listAdminTaskMonitoring, retryFailedTask } from "@/lib/admin-operations-service";
import { requireAdmin } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json(await listAdminTaskMonitoring(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json() as { task_id?: string };
    if (!body.task_id) throw new Error("TASK_REQUIRED");
    return NextResponse.json(await retryFailedTask({ taskId: body.task_id, operator: admin.id }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to retry task" }, { status: 400 });
  }
}
