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
      source?: string;
    };

    const satisfaction = Number(body.satisfaction ?? 0);
    if (!Number.isFinite(satisfaction) || satisfaction < 1 || satisfaction > 5) {
      return NextResponse.json({ error: "Satisfaction must be between 1 and 5" }, { status: 400 });
    }

    const feedback = await createUserFeedback({
      userId: user.id,
      satisfaction,
      category: body.category,
      contentFeedback: body.content_feedback,
      suggestion: body.suggestion,
      source: body.source,
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to submit feedback" }, { status: 400 });
  }
}
