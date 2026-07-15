import { NextResponse } from "next/server";
import { deleteContentAsset, getContentAsset } from "@/lib/content-assets";
import { requireUser } from "@/lib/request-auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const asset = await getContentAsset((await params).id, user.id);
    if (!asset) return NextResponse.json({ error: "Content not found" }, { status: 404 });
    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load content" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    await deleteContentAsset({ taskId: (await params).id, userId: user.id });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to delete content" }, { status: 400 });
  }
}
