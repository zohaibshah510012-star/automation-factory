import type { AiProviders } from "@/lib/providers/contracts";
import { ProviderConfigurationError } from "@/lib/providers/errors";

const unavailable = (capability: string) => {
  throw new ProviderConfigurationError(
    "AI_PROVIDER=alternative selected. Implement " + capability + " with ALTERNATIVE_API_BASE_URL and ALTERNATIVE_API_KEY.",
  );
};

export function createAlternativeProviders(): AiProviders {
  return {
    text: { async generateContentPack() { return unavailable("AlternativeTextProvider"); } },
    image: { async generateImage() { return unavailable("AlternativeImageProvider"); }, async generateStoryboardImages() { return unavailable("AlternativeImageProvider"); } },
    voice: { async synthesize() { return unavailable("AlternativeVoiceProvider"); } },
    video: { async generateVideo() { return unavailable("AlternativeVideoProvider"); }, async getStatus() { return unavailable("AlternativeVideoProvider"); }, async render() { return unavailable("AlternativeVideoProvider"); } },
  };
}
