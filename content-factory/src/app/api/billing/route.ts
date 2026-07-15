import { NextResponse } from "next/server";

import { getUserBillingSummary } from "@/lib/billing-service";
import { requireUser } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return NextResponse.json(await getUserBillingSummary(user.id), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
}
