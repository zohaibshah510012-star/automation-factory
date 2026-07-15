import { NextResponse } from "next/server";

import { getSystemHealth } from "@/lib/admin-operations-service";
import { requireAdmin } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json(await getSystemHealth(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
}
