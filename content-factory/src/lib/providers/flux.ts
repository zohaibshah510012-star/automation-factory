import type { AiProviders } from "@/lib/providers/contracts";
import { ProviderConfigurationError } from "@/lib/providers/errors";
import { createLocalProviders } from "@/lib/providers/local";

type FluxResponse = {
  url?: string;
  result_url?: string;
  image_url?: string;
  data?: { url?: string; image_url?: string };
  metadata?: Record<string, unknown>;
};

function endpoint() {
  return process.env.FLUX_API_BASE_URL;
}

function apiKey() {
  return process.env.FLUX_API_KEY;
}

async function providerError(response: Response) {
  const text = await response.text().catch(() => "");
  return `Flux image request failed: ${response.status}${text ? ` ${text.slice(0, 240)}` : ""}`;
}

export function createFluxProviders(): AiProviders {
  const fallback = createLocalProviders();
  return {
    text: fallback.text,
    image: {
      async generateImage({ taskId, prompt, model, size }) {
        const baseUrl = endpoint();
        const token = apiKey();
        if (!baseUrl || !token) throw new ProviderConfigurationError("Flux image provider requires FLUX_API_BASE_URL and FLUX_API_KEY.");

        const response = await fetch(baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            model: model ?? process.env.FLUX_IMAGE_MODEL ?? "flux-1.1-pro",
            size: size ?? "1024x1024",
            task_id: taskId,
          }),
        });
        if (!response.ok) throw new Error(await providerError(response));

        const payload = (await response.json()) as FluxResponse;
        const url = payload.url ?? payload.result_url ?? payload.image_url ?? payload.data?.url ?? payload.data?.image_url;
        if (!url) throw new Error("Flux image response did not include a URL.");

        return {
          url,
          provider: "flux",
          model: model ?? process.env.FLUX_IMAGE_MODEL ?? "flux-1.1-pro",
          metadata: payload.metadata ?? { size: size ?? "1024x1024" },
        };
      },
      async generateStoryboardImages({ taskId, topic, scenes }) {
        return Promise.all(
          scenes.map(async (scene, index) => {
            const image = await this.generateImage({
              taskId,
              prompt: `Short drama storyboard frame. Topic: ${topic}. Scene: ${scene}. Cinematic, 9:16, no text.`,
              size: "1024x1536",
            });
            return {
              id: `image_${index + 1}`,
              type: "image" as const,
              name: `Flux scene ${index + 1}`,
              url: image.url,
              provider: `${image.provider}/${image.model}`,
            };
          }),
        );
      },
    },
    voice: fallback.voice,
    video: fallback.video,
  };
}
