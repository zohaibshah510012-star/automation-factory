import { NextResponse } from "next/server";

import { verifyPayment } from "@/lib/payment-service";
import { requireUser } from "@/lib/request-auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(request);
    const { id } = await params;
    const payment = await verifyPayment(id);
    return NextResponse.json({ payment });
  } catch {
    return NextResponse.json({ error: "Unable to verify payment" }, { status: 400 });
  }
}
