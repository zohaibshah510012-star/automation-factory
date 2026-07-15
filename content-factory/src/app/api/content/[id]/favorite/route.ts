import { NextResponse } from "next/server";
import { setContentFavorite } from "@/lib/content-assets";
import { requireUser } from "@/lib/request-auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const { favorite } = await request.json() as { favorite?: boolean };
    await setContentFavorite({ taskId: (await params).id, userId: user.id, favorite: Boolean(favorite) });
    return NextResponse.json({ ok: true, favorite: Boolean(favorite) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update favorite" }, { status: 400 });
  }
}
