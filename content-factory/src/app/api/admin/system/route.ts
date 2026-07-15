import { NextResponse } from "next/server";

import { getProductionDiagnostics } from "@/lib/production-diagnostics";
import { requireAdmin } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    return NextResponse.json(await getProductionDiagnostics(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Admin access required" },
      { status: 403 },
    );
  }
}
