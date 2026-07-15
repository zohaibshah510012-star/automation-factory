import { NextResponse } from "next/server";

import { addWorkspaceMember, listWorkspaceMembers } from "@/lib/workspace-service";
import { requireUser } from "@/lib/request-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    return NextResponse.json({ members: await listWorkspaceMembers(id, user.id) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load workspace members" }, { status: 400 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const body = await request.json();
    if (!body.user_id) throw new Error("MEMBER_USER_REQUIRED");
    return NextResponse.json({
      member: await addWorkspaceMember({ workspaceId: id, operatorId: user.id, userId: body.user_id, role: body.role ?? "member" }),
    });
  } catch {
    return NextResponse.json({ error: "Unable to add workspace member" }, { status: 400 });
  }
}
