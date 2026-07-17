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

function localVideoPreviewSvg(prompt: string, durationSeconds: number) {
  const colors = colorFromPrompt(`video:${prompt}`);
  const safePrompt = escapeXml(prompt.slice(0, 160));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" role="img" aria-label="Generated local video preview asset">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050713"/>
      <stop offset="45%" stop-color="${colors.primary}" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <radialGradient id="glow" cx="72%" cy="24%" r="64%">
      <stop offset="0%" stop-color="${colors.accent}" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="${colors.secondary}" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#glow)"/>
  <circle cx="1050" cy="146" r="170" fill="${colors.accent}" opacity="0.25" filter="url(#soft)"/>
  <circle cx="178" cy="612" r="220" fill="${colors.secondary}" opacity="0.18" filter="url(#soft)"/>
  <g transform="translate(92 76)">
    <rect width="1096" height="568" rx="42" fill="#ffffff" opacity="0.08" stroke="#ffffff" stroke-opacity="0.22"/>
    <rect x="42" y="38" width="1012" height="70" rx="24" fill="#ffffff" opacity="0.11"/>
    <circle cx="84" cy="73" r="10" fill="#f87171"/>
    <circle cx="120" cy="73" r="10" fill="#fbbf24"/>
    <circle cx="156" cy="73" r="10" fill="#34d399"/>
    <g transform="translate(84 154)">
      <rect width="280" height="330" rx="30" fill="#ffffff" opacity="0.13"/>
      <rect x="330" width="280" height="330" rx="30" fill="#ffffff" opacity="0.18"/>
      <rect x="660" width="280" height="330" rx="30" fill="#ffffff" opacity="0.13"/>
      <path d="M392 111l115 66-115 66z" fill="#ffffff" opacity="0.88"/>
      <path d="M300 166h60M610 166h60" stroke="#ffffff" stroke-width="10" stroke-linecap="round" opacity="0.62"/>
      <text x="0" y="386" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700">Automation Factory Video Preview</text>
      <text x="0" y="430" fill="#ffffff" fill-opacity="0.72" font-family="Inter, Arial, sans-serif" font-size="20">${safePrompt}</text>
      <text x="0" y="472" fill="#ffffff" fill-opacity="0.56" font-family="Inter, Arial, sans-serif" font-size="18">Local Beta provider · ${durationSeconds}s storyboard preview · replace with Kling/Runway in production</text>
    </g>
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
        return { url, provider: "local-image-provider", model: selectedModel, metadata: { size: size ?? "1024x1024", format: "svg" } };
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
      async generateVideo({ taskId, prompt, model, durationSeconds }) {
        const selectedDuration = durationSeconds ?? 5;
        const selectedModel = model ?? "local-svg-video-preview";
        const videoUrl = await saveGeneratedFile(taskId, "video-preview.svg", Buffer.from(localVideoPreviewSvg(prompt, selectedDuration), "utf8"));
        return {
          status: "completed" as const,
          provider: "local-video-provider",
          model: selectedModel,
          videoUrl,
          thumbnailUrl: videoUrl,
          metadata: { durationSeconds: selectedDuration, format: "svg-preview", betaFallback: true },
        };
      },
      async getStatus({ taskId }) {
        return { status: "completed" as const, videoUrl: `/generated/${taskId}/video-preview.svg`, thumbnailUrl: `/generated/${taskId}/video-preview.svg`, metadata: { format: "svg-preview", betaFallback: true } };
      },
      async render() {
        throw new ProviderConfigurationError("Local video provider is not configured in this MVP.");
      },
    },
  };
}
