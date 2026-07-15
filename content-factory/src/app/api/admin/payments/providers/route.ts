import { NextResponse } from "next/server";

import { listPaymentProviders, upsertPaymentProvider } from "@/lib/payment-service";
import { requireAdmin } from "@/lib/request-auth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ providers: await listPaymentProviders() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const provider = await upsertPaymentProvider(await request.json(), admin.id);
    return NextResponse.json({ provider }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to save provider" }, { status: 400 });
  }
}
