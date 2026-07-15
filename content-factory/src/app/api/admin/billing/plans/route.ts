import { NextResponse } from "next/server";

import { createPlan, listPlans } from "@/lib/billing-service";
import { requireAdmin } from "@/lib/request-auth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ plans: await listPlans() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const plan = await createPlan(await request.json(), admin.id);
    return NextResponse.json({ plan }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create plan" }, { status: 400 });
  }
}
