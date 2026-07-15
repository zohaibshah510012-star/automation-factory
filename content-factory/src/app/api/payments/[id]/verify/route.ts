import { NextResponse } from "next/server";

import { verifyPayment } from "@/lib/payment-service";
import { requireAdmin, requireUser } from "@/lib/request-auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const isAdmin = await requireAdmin(request).then(() => true).catch(() => false);
    const { id } = await params;
    const payment = await verifyPayment(id, { userId: user.id, allowAdmin: isAdmin });
    return NextResponse.json({ payment });
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof Error && (error.message === "PAYMENT_NOT_FOUND" || error.message === "PAYMENT_VERIFICATION_CONTEXT_REQUIRED")) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to verify payment" }, { status: 400 });
  }
}
