import { NextResponse } from "next/server";

import { updateSubscription } from "@/lib/billing-service";
import { requireAdmin } from "@/lib/request-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const subscription = await updateSubscription({
      subscriptionId: id,
      planId: body.plan_id,
      status: body.status,
      expiresAt: body.expires_at,
      note: body.note,
      operator: admin.id,
      reason: body.reason ?? "admin_update",
    });
    return NextResponse.json({ subscription });
  } catch {
    return NextResponse.json({ error: "Unable to update subscription" }, { status: 400 });
  }
}
