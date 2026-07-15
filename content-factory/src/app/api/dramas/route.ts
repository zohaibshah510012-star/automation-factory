import { NextResponse } from "next/server";
import { listUserDramas } from "@/lib/short-drama-service";
import { requireUser } from "@/lib/request-auth";
export async function GET(request: Request) { try { const user = await requireUser(request); return NextResponse.json({ dramas: await listUserDramas(user.id) }); } catch { return NextResponse.json({ error: "Authentication required" }, { status: 401 }); } }
