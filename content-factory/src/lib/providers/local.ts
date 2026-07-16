import type { AiProviders, GeneratedTextContent } from "@/lib/providers/contracts";
import { ProviderConfigurationError } from "@/lib/providers/errors";
import { saveGeneratedFile } from "@/lib/providers/media";

function localContent(topic: string, brief?: string): GeneratedTextContent {
  return {
    title: topic + ": practical content workflow",
    script: "Hook: " + topic + ". Core point: turn repeated content work into a reusable system. Brief: " + (brief || "none") + ". CTA: create the next content task.",
    storyboard: ["Hook", "Problem", "Method", "Call to action"],
  };
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function colorFromPrompt(prompt: string) {
  let hash = 0;
  for (let index = 0; index < prompt.length; index += 1) {
    hash = (hash * 31 + prompt.charCodeAt(index)) % 360;
  }
  return {
    primary: `hsl(${hash} 86% 58%)`,
    secondary: `hsl(${(hash + 52) % 360} 88% 62%)`,
    accent: `hsl(${(hash + 118) % 360} 92% 70%)`,
  };
}

function localSvg(prompt: string) {
  const colors = colorFromPrompt(prompt);
  const safePrompt = escapeXml(prompt.slice(0, 180));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="Generated local image asset">
  <defs>
    <radialGradient id="hero" cx="32%" cy="24%" r="78%">
      <stop offset="0%" stop-color="${colors.accent}" stop-opacity="0.95"/>
      <stop offset="44%" stop-color="${colors.primary}" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="#050713"/>
    </radialGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="20" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1024" height="1024" fill="#050713"/>
  <rect width="1024" height="1024" fill="url(#hero)"/>
  <circle cx="808" cy="178" r="196" fill="${colors.secondary}" opacity="0.24" filter="url(#glow)"/>
  <circle cx="210" cy="808" r="260" fill="${colors.primary}" opacity="0.18" filter="url(#glow)"/>
  <g opacity="0.38">
    <path d="M96 286h832M96 512h832M96 738h832M286 96v832M512 96v832M738 96v832" stroke="#fff" stroke-width="1"/>
  </g>
  <g transform="translate(132 188)">
    <rect width="760" height="648" rx="48" fill="url(#card)" stroke="#fff" stroke-opacity="0.28"/>
    <rect x="56" y="64" width="648" height="82" rx="28" fill="#fff" opacity="0.14"/>
    <rect x="56" y="194" width="188" height="250" rx="34" fill="#fff" opacity="0.13"/>
    <rect x="286" y="194" width="188" height="250" rx="34" fill="#fff" opacity="0.17"/>
    <rect x="516" y="194" width="188" height="250" rx="34" fill="#fff" opacity="0.13"/>
    <path d="M244 320h42M474 320h42" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.72"/>
    <circle cx="150" cy="318" r="42" fill="${colors.accent}" opacity="0.86"/>
    <circle cx="380" cy="318" r="42" fill="${colors.primary}" opacity="0.86"/>
    <circle cx="610" cy="318" r="42" fill="${colors.secondary}" opacity="0.86"/>
    <rect x="56" y="500" width="648" height="84" rx="28" fill="#050713" opacity="0.46"/>
    <text x="88" y="552" fill="#fff" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600">Automation Factory Image Asset</text>
    <text x="88" y="612" fill="#fff" fill-opacity="0.72" font-family="Inter, Arial, sans-serif" font-size="18">${safePrompt}</text>
  </g>
</svg>`;
}

export function createLocalProviders(): AiProviders {
  return {
    text: { async generateContentPack({ topic, brief }) { return localContent(topic, brief); } },
    image: {
      async generateImage({ taskId, prompt, model, size, filename }) {
        const selectedModel = model ?? "local-svg-image";
        const url = await saveGeneratedFile(taskId, filename ?? "image.svg", Buffer.from(localSvg(prompt), "utf8"));
        return { url, provider: "local", model: selectedModel, metadata: { size: size ?? "1024x1024", format: "svg" } };
      },
      async generateStoryboardImages({ taskId, topic, scenes }) {
        return Promise.all(
          scenes.map(async (scene, index) => {
            const image = await this.generateImage({
              taskId,
              prompt: `${topic}. Scene: ${scene}`,
              filename: `scene-${index + 1}.svg`,
            });
            return {
              id: "image_" + (index + 1),
              type: "image" as const,
              name: "Local scene " + (index + 1),
              url: image.url,
              provider: `${image.provider}/${image.model}`,
            };
          }),
        );
      },
    },
    voice: {
      async synthesize() {
        return { id: "voice_1", type: "voice" as const, name: "Local voice", url: "mock://voice/local", provider: "local" };
      },
    },
    video: {
      async generateVideo({ taskId, prompt, model, durationSeconds }) { return { status: "completed" as const, provider: "local", model: model ?? "local-video", videoUrl: `mock://videos/${encodeURIComponent(prompt)}/${taskId}`, thumbnailUrl: "mock://thumbnails/local", metadata: { durationSeconds: durationSeconds ?? 5 } }; },
      async getStatus() { return { status: "completed" as const }; },
      async render() {
        throw new ProviderConfigurationError("Local video provider is not configured in this MVP.");
      },
    },
  };
}
