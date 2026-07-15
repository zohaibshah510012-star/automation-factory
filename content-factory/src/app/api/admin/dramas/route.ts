import { NextResponse } from "next/server";
import { listAllDramas } from "@/lib/short-drama-service";
import { requireAdmin } from "@/lib/request-auth";
export async function GET(request: Request) { try { await requireAdmin(request); return NextResponse.json({ dramas: await listAllDramas() }); } catch { return NextResponse.json({ error: "Admin access required" }, { status: 403 }); } }
