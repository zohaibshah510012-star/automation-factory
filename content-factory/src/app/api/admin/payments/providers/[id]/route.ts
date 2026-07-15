import { NextResponse } from "next/server";

import { updatePaymentProvider } from "@/lib/payment-service";
import { requireAdmin } from "@/lib/request-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;
    const provider = await updatePaymentProvider(id, await request.json(), admin.id);
    return NextResponse.json({ provider });
  } catch {
    return NextResponse.json({ error: "Unable to update provider" }, { status: 400 });
  }
}
