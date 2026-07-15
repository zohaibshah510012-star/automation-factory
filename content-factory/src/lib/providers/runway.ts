import type { AiProviders } from "@/lib/providers/contracts";
import { ProviderConfigurationError } from "@/lib/providers/errors";
import { createLocalProviders } from "@/lib/providers/local";

type VideoResponse = {
  id?: string;
  status?: "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  metadata?: Record<string, unknown>;
  error?: string;
};

function runwayEndpoint(path = "") {
  const baseUrl = process.env.RUNWAY_API_BASE_URL;
  if (!baseUrl) throw new ProviderConfigurationError("Runway provider requires RUNWAY_API_BASE_URL.");
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function runwayHeaders() {
  const token = process.env.RUNWAY_API_KEY;
  if (!token) throw new ProviderConfigurationError("Runway provider requires RUNWAY_API_KEY.");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export function createRunwayProviders(): AiProviders {
  const fallback = createLocalProviders();
  return {
    text: fallback.text,
    image: fallback.image,
    voice: fallback.voice,
    video: {
      async generateVideo({ taskId, prompt, model, durationSeconds }) {
        const response = await fetch(runwayEndpoint("/videos"), {
          method: "POST",
          headers: runwayHeaders(),
          body: JSON.stringify({
            prompt,
            model: model ?? process.env.RUNWAY_VIDEO_MODEL ?? "gen4_turbo",
            duration_seconds: durationSeconds ?? 5,
            task_id: taskId,
          }),
        });
        if (!response.ok) throw new Error(`Runway video request failed: ${response.status}`);
        const payload = (await response.json()) as VideoResponse;
        return {
          status: payload.status === "completed" ? "completed" : "processing",
          provider: "runway",
          model: model ?? process.env.RUNWAY_VIDEO_MODEL ?? "gen4_turbo",
          videoUrl: payload.video_url,
          thumbnailUrl: payload.thumbnail_url,
          metadata: { ...(payload.metadata ?? {}), providerJobId: payload.id },
        };
      },
      async getStatus({ providerJobId }) {
        if (!providerJobId) return { status: "processing" };
        const response = await fetch(runwayEndpoint(`/videos/${providerJobId}`), { headers: runwayHeaders() });
        if (!response.ok) throw new Error(`Runway status request failed: ${response.status}`);
        const payload = (await response.json()) as VideoResponse;
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
