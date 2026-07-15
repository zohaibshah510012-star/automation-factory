import { NextResponse } from "next/server";

import { listAdminFeedback, updateFeedbackStatus } from "@/lib/product-analytics";
import { requireAdmin } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ feedback: await listAdminFeedback() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json() as { id?: string; status?: string };
    if (!body.id || !body.status) throw new Error("INVALID_PAYLOAD");
    return NextResponse.json({ feedback: await updateFeedbackStatus(body.id, body.status) });
  } catch {
    return NextResponse.json({ error: "Unable to update feedback" }, { status: 400 });
  }
}
