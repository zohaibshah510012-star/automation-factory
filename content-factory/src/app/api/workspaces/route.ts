import { NextResponse } from "next/server";

import { createWorkspace, listUserWorkspaces } from "@/lib/workspace-service";
import { requireUser } from "@/lib/request-auth";

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    return NextResponse.json({ workspaces: await listUserWorkspaces(user.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json();
    if (!body.name) throw new Error("WORKSPACE_NAME_REQUIRED");
    return NextResponse.json({ workspace: await createWorkspace({ userId: user.id, name: body.name, slug: body.slug }) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to create workspace" }, { status: 400 });
  }
}
