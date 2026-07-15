import type { AiProviders } from "@/lib/providers/contracts";
import { ProviderConfigurationError } from "@/lib/providers/errors";
import { createLocalProviders } from "@/lib/providers/local";

type KlingResponse = {
  task_id?: string;
  status?: "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  metadata?: Record<string, unknown>;
  error?: string;
};

function klingEndpoint(path = "") {
  const baseUrl = process.env.KLING_API_BASE_URL;
  if (!baseUrl) throw new ProviderConfigurationError("Kling provider requires KLING_API_BASE_URL.");
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function klingHeaders() {
  const token = process.env.KLING_API_KEY;
  if (!token) throw new ProviderConfigurationError("Kling provider requires KLING_API_KEY.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export function createKlingProviders(): AiProviders {
  const fallback = createLocalProviders();
  return {
    text: fallback.text,
    image: fallback.image,
    voice: fallback.voice,
    video: {
      async generateVideo({ taskId, prompt, model, durationSeconds }) {
        const response = await fetch(klingEndpoint("/videos"), {
          method: "POST",
          headers: klingHeaders(),
          body: JSON.stringify({
            prompt,
            model: model ?? process.env.KLING_VIDEO_MODEL ?? "kling-v1",
            duration: durationSeconds ?? 5,
            task_id: taskId,
          }),
        });
        if (!response.ok) throw new Error(`Kling video request failed: ${response.status}`);
        const payload = (await response.json()) as KlingResponse;
        return {
          status: payload.status === "completed" ? "completed" : "processing",
          provider: "kling",
          model: model ?? process.env.KLING_VIDEO_MODEL ?? "kling-v1",
          videoUrl: payload.video_url,
          thumbnailUrl: payload.thumbnail_url,
          metadata: { ...(payload.metadata ?? {}), providerJobId: payload.task_id },
        };
      },
      async getStatus({ providerJobId }) {
        if (!providerJobId) return { status: "processing" };
        const response = await fetch(klingEndpoint(`/videos/${providerJobId}`), { headers: klingHeaders() });
        if (!response.ok) throw new Error(`Kling status request failed: ${response.status}`);
        const payload = (await response.json()) as KlingResponse;
        return {
          status: payload.status ?? "processing",
          videoUrl: payload.video_url,
          thumbnailUrl: payload.thumbnail_url,
          metadata: payload.metadata,
          error: payload.error,
        };
      },
      render: fallback.video.render,
    },
  };
}
