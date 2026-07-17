import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

const contentTypes: Record<string, string> = {
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
};

function safeSegment(value: string) {
  return /^[a-zA-Z0-9._-]+$/.test(value);
}

function generatedAssetPath(taskId: string, filename: string) {
  return path.join(process.cwd(), "public", "generated", taskId, filename);
}

export async function GET(_request: Request, { params }: { params: Promise<{ taskId: string; filename: string }> }) {
  const { taskId, filename } = await params;
  if (!safeSegment(taskId) || !safeSegment(filename)) {
    return NextResponse.json({ error: "Invalid generated asset path" }, { status: 400 });
  }

  try {
    const body = await readFile(generatedAssetPath(taskId, filename));
    return new NextResponse(body, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentTypes[path.extname(filename).toLowerCase()] ?? "application/octet-stream",
      },
    });
  } catch {
    return NextResponse.json({ error: "Generated asset not found" }, { status: 404 });
  }
}
