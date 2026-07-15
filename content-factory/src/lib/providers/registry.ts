import type { AiProviders } from "@/lib/providers/contracts";
import { createAlternativeProviders } from "@/lib/providers/alternative";
import { createDeepSeekProviders } from "@/lib/providers/deepseek";
import { ProviderConfigurationError } from "@/lib/providers/errors";
import { createGeminiProviders } from "@/lib/providers/gemini";
import { createLocalProviders } from "@/lib/providers/local";
import { createOpenAIProviders } from "@/lib/providers/openai";

export type ProviderName = "openai" | "gemini" | "deepseek" | "alternative" | "local";

export function getActiveProviderName(): ProviderName {
  const provider = process.env.AI_PROVIDER ?? "openai";
  if (provider === "openai" || provider === "gemini" || provider === "deepseek" || provider === "alternative" || provider === "local") {
    return provider;
  }
  throw new ProviderConfigurationError("Unsupported AI_PROVIDER: " + provider);
}

export function getAiProviders(): AiProviders {
  return getProvidersFor(getActiveProviderName());
}

export function getProvidersFor(provider: ProviderName): AiProviders {
  const factory: Record<ProviderName, () => AiProviders> = {
    openai: createOpenAIProviders,
    gemini: createGeminiProviders,
    deepseek: createDeepSeekProviders,
    alternative: createAlternativeProviders,
    local: createLocalProviders,
  };
  return factory[provider]();
}

export function getImageProviderName(): ProviderName {
  const provider = process.env.AI_IMAGE_PROVIDER ?? process.env.AI_PROVIDER ?? "openai";
  if (provider === "openai" || provider === "gemini" || provider === "deepseek" || provider === "alternative" || provider === "local") return provider;
  throw new ProviderConfigurationError("Unsupported AI_IMAGE_PROVIDER: " + provider);
}

export function getImageProvider() {
  return getProvidersFor(getImageProviderName()).image;
}
