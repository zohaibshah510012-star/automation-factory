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
const supportedImageProviders: ProviderName[] = ["openai", "gemini", "flux", "local"];
const supportedVideoProviders: ProviderName[] = ["runway", "kling", "local"];

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

function requireProviderEnv(value: string | undefined, envName: "AI_IMAGE_PROVIDER" | "AI_VIDEO_PROVIDER") {
  if (!value?.trim()) {
    throw new ProviderConfigurationError(envName === "AI_IMAGE_PROVIDER" ? "Image provider not configured" : "Video provider not configured");
  }
  return value.trim();
}

function parseCapabilityProvider(value: string | undefined, envName: "AI_IMAGE_PROVIDER" | "AI_VIDEO_PROVIDER", providers: ProviderName[]) {
  const provider = parseProviderName(requireProviderEnv(value, envName), envName);
  if (providers.includes(provider)) return provider;
  throw new ProviderConfigurationError(envName === "AI_IMAGE_PROVIDER" ? "Image provider not configured" : "Video provider not configured");
}

export function getImageProviderName(): ProviderName {
  return parseCapabilityProvider(process.env.AI_IMAGE_PROVIDER, "AI_IMAGE_PROVIDER", supportedImageProviders);
}

export function getImageProvider() {
  return getProvidersFor(getImageProviderName()).image;
}

export function getVideoProviderName(): ProviderName {
  return parseCapabilityProvider(process.env.AI_VIDEO_PROVIDER, "AI_VIDEO_PROVIDER", supportedVideoProviders);
}

export function getVideoProvider() {
  return getProvidersFor(getVideoProviderName()).video;
}

export function assertImageProviderConfigured() {
  void getImageProviderName();
}

export function assertVideoProviderConfigured() {
  void getVideoProviderName();
}
