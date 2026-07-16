import { NextResponse } from "next/server";

import { createBetaInvite, listBetaInvites, updateBetaInviteStatus } from "@/lib/beta-invite-service";
import { requireAdmin } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ invites: await listBetaInvites() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json() as { email?: string; invite_code?: string };
    if (!body.email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    return NextResponse.json({ invite: await createBetaInvite({ email: body.email, inviteCode: body.invite_code }) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create invite" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin(request);
    const body = await request.json() as { id?: string; status?: "pending" | "used" | "revoked" };
    if (!body.id || !body.status) return NextResponse.json({ error: "Invalid invite update" }, { status: 400 });
    return NextResponse.json({ invite: await updateBetaInviteStatus({ id: body.id, status: body.status }) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update invite" }, { status: 400 });
  }
}
