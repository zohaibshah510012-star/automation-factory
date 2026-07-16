import { getActiveProviderName, getImageProviderName, getVideoProviderName } from "@/lib/ai-providers";

type CapabilityStatus = {
  capability: "text" | "image" | "video";
  provider: string | null;
  ready: boolean;
  mode: "configured" | "beta-fallback" | "missing" | "error";
  reason: string;
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function status(input: CapabilityStatus): CapabilityStatus {
  return input;
}

function textStatus(): CapabilityStatus {
  try {
    const provider = getActiveProviderName();
    if (provider === "local") return status({ capability: "text", provider, ready: true, mode: "beta-fallback", reason: "Local text provider is enabled for Beta smoke tests." });
    if (provider === "deepseek") return status({ capability: "text", provider, ready: hasEnv("DEEPSEEK_API_KEY"), mode: hasEnv("DEEPSEEK_API_KEY") ? "configured" : "missing", reason: hasEnv("DEEPSEEK_API_KEY") ? "DeepSeek key is configured." : "DEEPSEEK_API_KEY is missing." });
    if (provider === "openai") return status({ capability: "text", provider, ready: hasEnv("OPENAI_API_KEY"), mode: hasEnv("OPENAI_API_KEY") ? "configured" : "missing", reason: hasEnv("OPENAI_API_KEY") ? "OpenAI key is configured." : "OPENAI_API_KEY is missing." });
    return status({ capability: "text", provider, ready: false, mode: "error", reason: `Provider ${provider} is not production text-ready.` });
  } catch (error) {
    return status({ capability: "text", provider: null, ready: false, mode: "error", reason: error instanceof Error ? error.message : "Text provider is invalid." });
  }
}

function imageStatus(): CapabilityStatus {
  try {
    const provider = getImageProviderName();
    if (provider === "local") return status({ capability: "image", provider, ready: true, mode: "beta-fallback", reason: "Local image provider is enabled for Beta demo assets." });
    if (provider === "openai") return status({ capability: "image", provider, ready: hasEnv("OPENAI_API_KEY"), mode: hasEnv("OPENAI_API_KEY") ? "configured" : "missing", reason: hasEnv("OPENAI_API_KEY") ? "OpenAI image key is configured." : "OPENAI_API_KEY is missing." });
    if (provider === "flux") return status({ capability: "image", provider, ready: hasEnv("FLUX_API_KEY") && hasEnv("FLUX_API_BASE_URL"), mode: hasEnv("FLUX_API_KEY") && hasEnv("FLUX_API_BASE_URL") ? "configured" : "missing", reason: hasEnv("FLUX_API_KEY") && hasEnv("FLUX_API_BASE_URL") ? "Flux endpoint and key are configured." : "FLUX_API_BASE_URL or FLUX_API_KEY is missing." });
    if (provider === "gemini") return status({ capability: "image", provider, ready: hasEnv("GEMINI_API_KEY") && hasEnv("GEMINI_IMAGE_MODEL"), mode: hasEnv("GEMINI_API_KEY") && hasEnv("GEMINI_IMAGE_MODEL") ? "configured" : "missing", reason: hasEnv("GEMINI_API_KEY") && hasEnv("GEMINI_IMAGE_MODEL") ? "Gemini image configuration is present." : "GEMINI_API_KEY or GEMINI_IMAGE_MODEL is missing." });
    return status({ capability: "image", provider, ready: false, mode: "error", reason: `Provider ${provider} is not image-capable.` });
  } catch (error) {
    return status({ capability: "image", provider: null, ready: false, mode: "error", reason: error instanceof Error ? error.message : "Image provider is invalid." });
  }
}

function videoStatus(): CapabilityStatus {
  try {
    const provider = getVideoProviderName();
    if (provider === "local") return status({ capability: "video", provider, ready: true, mode: "beta-fallback", reason: "Local video preview provider is enabled for Beta demo assets." });
    if (provider === "runway") return status({ capability: "video", provider, ready: hasEnv("RUNWAY_API_KEY") && hasEnv("RUNWAY_API_BASE_URL"), mode: hasEnv("RUNWAY_API_KEY") && hasEnv("RUNWAY_API_BASE_URL") ? "configured" : "missing", reason: hasEnv("RUNWAY_API_KEY") && hasEnv("RUNWAY_API_BASE_URL") ? "Runway endpoint and key are configured." : "RUNWAY_API_BASE_URL or RUNWAY_API_KEY is missing." });
    if (provider === "kling") return status({ capability: "video", provider, ready: hasEnv("KLING_API_KEY") && hasEnv("KLING_API_BASE_URL"), mode: hasEnv("KLING_API_KEY") && hasEnv("KLING_API_BASE_URL") ? "configured" : "missing", reason: hasEnv("KLING_API_KEY") && hasEnv("KLING_API_BASE_URL") ? "Kling endpoint and key are configured." : "KLING_API_BASE_URL or KLING_API_KEY is missing." });
    return status({ capability: "video", provider, ready: false, mode: "error", reason: `Provider ${provider} is not video-capable.` });
  } catch (error) {
    return status({ capability: "video", provider: null, ready: false, mode: "error", reason: error instanceof Error ? error.message : "Video provider is invalid." });
  }
}

export function getProviderReadiness() {
  const capabilities = [textStatus(), imageStatus(), videoStatus()];
  return {
    status: capabilities.every((item) => item.ready) ? "ready" : "warning",
    capabilities,
  };
}
