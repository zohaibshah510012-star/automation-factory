import { NextResponse } from "next/server";

import { listPaymentEvents, listPayments } from "@/lib/payment-service";
import { requireAdmin } from "@/lib/request-auth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const [payments, events] = await Promise.all([listPayments(), listPaymentEvents()]);
    return NextResponse.json({ payments, events }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
