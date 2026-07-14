import type { AiProviders, GeneratedTextContent } from "@/lib/providers/contracts";
import { ProviderConfigurationError } from "@/lib/providers/errors";

function localContent(topic: string, brief?: string): GeneratedTextContent {
  return {
    title: topic + ": practical content workflow",
    script: "Hook: " + topic + ". Core point: turn repeated content work into a reusable system. Brief: " + (brief || "none") + ". CTA: create the next content task.",
    storyboard: ["Hook", "Problem", "Method", "Call to action"],
  };
}

export function createLocalProviders(): AiProviders {
  return {
    text: { async generateContentPack({ topic, brief }) { return localContent(topic, brief); } },
    image: {
      async generateStoryboardImages({ topic, scenes }) {
        return scenes.map((_, index) => ({
          id: "image_" + (index + 1),
          type: "image" as const,
          name: "Local scene " + (index + 1),
          url: "mock://images/" + encodeURIComponent(topic) + "/" + (index + 1),
          provider: "local",
        }));
      },
    },
    voice: {
      async synthesize() {
        return { id: "voice_1", type: "voice" as const, name: "Local voice", url: "mock://voice/local", provider: "local" };
      },
    },
    video: {
      async render() {
        throw new ProviderConfigurationError("Local video provider is not configured in this MVP.");
      },
    },
  };
}
