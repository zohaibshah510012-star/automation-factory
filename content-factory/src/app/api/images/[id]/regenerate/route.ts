import { NextResponse } from "next/server";
import { createImageTask, listImageTasks, runImageTask } from "@/lib/image-service";
import { assertImageProviderConfigured } from "@/lib/ai-providers";
import { assertDailyGenerationLimit } from "@/lib/ai-cost-service";
import { requireUser } from "@/lib/request-auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    const id = (await params).id;
    const original = (await listImageTasks(user.id)).find((task) => task.id === id);
    if (!original) return NextResponse.json({ error: "Image task not found" }, { status: 404 });
    assertImageProviderConfigured();
    await assertDailyGenerationLimit(user.id);
    const task = await createImageTask({ userId: user.id, prompt: original.prompt, model: original.model ?? undefined, size: original.size ?? undefined });
    void runImageTask(task.id);
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to regenerate image" }, { status: 400 });
  }
}
