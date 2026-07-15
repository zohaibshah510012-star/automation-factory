import { NextResponse } from "next/server";
import { listContentAssets } from "@/lib/content-assets";
import { requireAdmin } from "@/lib/request-auth";

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const assets = await listContentAssets({ limit: 100 });
    const promptCounts = new Map<string, number>();
    const agentCounts = new Map<string, number>();
    for (const asset of assets) {
      if (asset.promptName) promptCounts.set(asset.promptName, (promptCounts.get(asset.promptName) ?? 0) + 1);
      if (asset.agentName) agentCounts.set(asset.agentName, (agentCounts.get(asset.agentName) ?? 0) + 1);
    }
    const popular = (counts: Map<string, number>) => [...counts.entries()].map(([name, count]) => ({ name, count })).toSorted((a, b) => b.count - a.count).slice(0, 5);
    return NextResponse.json({ assets, popularPrompts: popular(promptCounts), popularAgents: popular(agentCounts) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Admin access required" }, { status: 403 });
  }
}
