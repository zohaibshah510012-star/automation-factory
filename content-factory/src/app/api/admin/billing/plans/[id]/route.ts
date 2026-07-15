import { NextResponse } from "next/server";

import { disablePlan, updatePlan } from "@/lib/billing-service";
import { requireAdmin } from "@/lib/request-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const plan = await updatePlan(id, await request.json(), admin.id);
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: "Unable to update plan" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const plan = await disablePlan(id, admin.id);
    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ error: "Unable to disable plan" }, { status: 400 });
  }
}
