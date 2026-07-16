import { NextResponse } from "next/server";

import { createUserFeedback } from "@/lib/product-analytics";
import { requireUser } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    const body = await request.json() as {
      satisfaction?: number;
      category?: string;
      content_feedback?: string;
      suggestion?: string;
      result_quality?: number | null;
      use_case?: string | null;
      continue_use?: boolean | null;
      source?: string;
      content_task_id?: string | null;
    };

    const satisfaction = Number(body.satisfaction ?? 0);
    if (!Number.isFinite(satisfaction) || satisfaction < 1 || satisfaction > 5) {
      return NextResponse.json({ error: "Satisfaction must be between 1 and 5" }, { status: 400 });
    }
    const resultQuality = body.result_quality === undefined || body.result_quality === null ? null : Number(body.result_quality);
    if (resultQuality !== null && (!Number.isFinite(resultQuality) || resultQuality < 1 || resultQuality > 5)) {
      return NextResponse.json({ error: "Result quality must be between 1 and 5" }, { status: 400 });
    }

    const feedback = await createUserFeedback({
      userId: user.id,
      satisfaction,
      category: body.category,
      contentFeedback: body.content_feedback,
      suggestion: body.suggestion,
      resultQuality,
      useCase: body.use_case,
      continueUse: typeof body.continue_use === "boolean" ? body.continue_use : null,
      source: body.source,
      contentTaskId: body.content_task_id,
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to submit feedback" }, { status: 400 });
  }
}
