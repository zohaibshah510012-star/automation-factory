import { NextResponse } from "next/server";

import { verifyBetaInvite } from "@/lib/beta-invite-service";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit({ key: `beta-invite:${getClientIp(request)}`, limit: 20, windowMs: 60_000 });
    if (!rate.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    const body = await request.json() as { email?: string; invite_code?: string };
    if (!body.email || !body.invite_code) return NextResponse.json({ error: "Email and invite code are required" }, { status: 400 });
    await verifyBetaInvite({ email: body.email, inviteCode: body.invite_code });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid beta invite" }, { status: 400 });
  }
}
