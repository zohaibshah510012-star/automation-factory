import { NextResponse } from "next/server";

import { createCheckout } from "@/lib/payment-service";
import { requireUser } from "@/lib/request-auth";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    if (!body.plan_id) throw new Error("PLAN_REQUIRED");
    const payment = await createCheckout({ userId: user.id, planId: body.plan_id, provider: body.provider ?? "mock" });
    return NextResponse.json({ payment });
  } catch {
    return NextResponse.json({ error: "Unable to create checkout" }, { status: 400 });
  }
}
