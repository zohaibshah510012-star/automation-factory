import { NextResponse } from "next/server";

import { listSubscriptions } from "@/lib/billing-service";
import { requireAdmin } from "@/lib/request-auth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json({ subscriptions: await listSubscriptions() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
