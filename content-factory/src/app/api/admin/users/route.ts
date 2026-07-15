import { NextResponse } from "next/server";

import { adjustUserCredits, listAdminUsers, updateUserStatus } from "@/lib/admin-operations-service";
import { requireAdmin } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ users: await listAdminUsers() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json() as { user_id?: string; status?: "active" | "frozen" };
    if (!body.user_id || (body.status !== "active" && body.status !== "frozen")) throw new Error("INVALID_PAYLOAD");
    return NextResponse.json({ user: await updateUserStatus({ userId: body.user_id, status: body.status, operator: admin.id }) });
  } catch {
    return NextResponse.json({ error: "Unable to update user" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = await request.json() as { user_id?: string; amount?: number; reason?: string };
    const amount = Number(body.amount ?? 0);
    if (!body.user_id || !Number.isInteger(amount) || amount === 0) throw new Error("INVALID_PAYLOAD");
    const balance = await adjustUserCredits({
      userId: body.user_id,
      amount,
      reason: body.reason ?? "admin_manual_adjustment",
      operator: admin.id,
    });
    return NextResponse.json({ balance });
  } catch {
    return NextResponse.json({ error: "Unable to adjust credits" }, { status: 400 });
  }
}
