import { NextResponse } from "next/server";

import {
  getAiProviders,
  getOpenAiNetworkDiagnostics,
  getProviderErrorMessage,
  getProviderErrorType,
} from "@/lib/ai-providers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { topic?: string };
  const topic = body.topic?.trim();
  if (!topic) {
    return NextResponse.json({ error: "主题不能为空。" }, { status: 400 });
  }

  try {
    const result = await getAiProviders().text.generateContentPack({ topic });
    return NextResponse.json({
      title: result.title,
      scriptLength: result.script.length,
      storyboardCount: result.storyboard.length,
    });
  } catch (error) {
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
