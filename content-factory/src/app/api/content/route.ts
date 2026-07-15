import { NextResponse } from "next/server";
import { listContentAssets } from "@/lib/content-assets";
import { requireUser } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const assets = await listContentAssets({ userId: user.id, query: url.searchParams.get("q") ?? undefined, type: url.searchParams.get("type") ?? undefined });
    return NextResponse.json({ assets });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load content" }, { status: 400 });
  }
}
