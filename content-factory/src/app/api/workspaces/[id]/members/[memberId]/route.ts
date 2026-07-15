import { NextResponse } from "next/server";

import { updateWorkspaceMember } from "@/lib/workspace-service";
import { requireUser } from "@/lib/request-auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  try {
    const user = await requireUser(request);
    const { id, memberId } = await params;
    const body = await request.json();
    const member = await updateWorkspaceMember({
      workspaceId: id,
      memberId,
      operatorId: user.id,
      role: body.role,
      status: body.status,
    });
    return NextResponse.json({ member });
  } catch {
    return NextResponse.json({ error: "Unable to update workspace member" }, { status: 400 });
  }
}
