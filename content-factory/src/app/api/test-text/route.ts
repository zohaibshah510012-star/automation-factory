import { NextResponse } from "next/server";

import {
  getAiProviders,
  getOpenAiNetworkDiagnostics,
  getProviderErrorMessage,
  getProviderErrorType,
} from "@/lib/ai-providers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { requireAdmin } from "@/lib/request-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const rate = checkRateLimit({ key: `test-text:${admin.id}:${getClientIp(request)}`, limit: 10, windowMs: 60_000 });
    if (!rate.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = (await request.json()) as { topic?: unknown };
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    if (!topic || topic.length > 200) {
      return NextResponse.json({ error: "Topic must be 1-200 characters." }, { status: 400 });
    }

    const result = await getAiProviders().text.generateContentPack({ topic });
    return NextResponse.json({
      title: result.title,
      scriptLength: result.script.length,
      storyboardCount: result.storyboard.length,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "AUTH_REQUIRED" || error.message === "ADMIN_REQUIRED")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const type = getProviderErrorType(error);
    console.error("[content-factory] provider_error", {
      stage: "text_probe",
      type,
      ...getOpenAiNetworkDiagnostics(),
    });
    return NextResponse.json(
      { error: getProviderErrorMessage(error), type },
      { status: 502 },
    );
  }
}
