import type { AiProviders } from "@/lib/providers/contracts";
import { createAlternativeProviders } from "@/lib/providers/alternative";
import { createDeepSeekProviders } from "@/lib/providers/deepseek";
import { ProviderConfigurationError } from "@/lib/providers/errors";
import { createFluxProviders } from "@/lib/providers/flux";
import { createGeminiProviders } from "@/lib/providers/gemini";
import { createKlingProviders } from "@/lib/providers/kling";
import { createLocalProviders } from "@/lib/providers/local";
import { createOpenAIProviders } from "@/lib/providers/openai";
import { createRunwayProviders } from "@/lib/providers/runway";

export type ProviderName = "openai" | "gemini" | "deepseek" | "alternative" | "local" | "flux" | "runway" | "kling";

const supportedProviders: ProviderName[] = ["openai", "gemini", "deepseek", "alternative", "local", "flux", "runway", "kling"];

function parseProviderName(value: string, envName: string): ProviderName {
  if (supportedProviders.includes(value as ProviderName)) return value as ProviderName;
  throw new ProviderConfigurationError(`Unsupported ${envName}: ${value}`);
}

export function getActiveProviderName(): ProviderName {
  return parseProviderName(process.env.AI_PROVIDER ?? "openai", "AI_PROVIDER");
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
    flux: createFluxProviders,
    runway: createRunwayProviders,
    kling: createKlingProviders,
  };
  return factory[provider]();
}

export function getImageProviderName(): ProviderName {
  return parseProviderName(process.env.AI_IMAGE_PROVIDER ?? process.env.AI_PROVIDER ?? "openai", "AI_IMAGE_PROVIDER");
}

export function getImageProvider() {
  return getProvidersFor(getImageProviderName()).image;
}

export function getVideoProviderName(): ProviderName {
  return parseProviderName(process.env.AI_VIDEO_PROVIDER ?? process.env.AI_PROVIDER ?? "openai", "AI_VIDEO_PROVIDER");
}

export function getVideoProvider() {
  return getProvidersFor(getVideoProviderName()).video;
}
