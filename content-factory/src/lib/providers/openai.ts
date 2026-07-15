import OpenAI from "openai";
import { fetch as undiciFetch, ProxyAgent } from "undici";

import type { AiProviders, GeneratedTextContent } from "@/lib/providers/contracts";
import { ProviderConfigurationError } from "@/lib/providers/errors";
import { saveGeneratedFile } from "@/lib/providers/media";

const endpoint = "https://api.openai.com/v1";
let proxyAgent: ProxyAgent | undefined;
let proxyAgentUrl: string | undefined;

function timeoutMs() {
  const value = Number.parseInt(process.env.OPENAI_REQUEST_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : 45_000;
}

function proxyUrl() {
  return process.env.HTTPS_PROXY || process.env.HTTP_PROXY || undefined;
}

function getProxyAgent(url: string) {
  if (!proxyAgent || proxyAgentUrl !== url) {
    proxyAgent?.close();
    proxyAgent = new ProxyAgent(url);
    proxyAgentUrl = url;
  }
  return proxyAgent;
}

export function getOpenAiNetworkDiagnostics() {
  const proxy = proxyUrl();
  return {
    endpoint,
    timeoutMs: timeoutMs(),
    proxyConfigured: Boolean(proxy),
    proxySource: process.env.HTTPS_PROXY ? "HTTPS_PROXY" : process.env.HTTP_PROXY ? "HTTP_PROXY" : "none",
  };
}

function client() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new ProviderConfigurationError("OPENAI_API_KEY is not configured.");
  const options = { apiKey, maxRetries: 0, timeout: timeoutMs() };
  const proxy = proxyUrl();
  if (!proxy) return new OpenAI(options);
  const proxiedFetch: typeof fetch = (url, init) =>
    undiciFetch(url as never, { ...init, dispatcher: getProxyAgent(proxy) } as never) as unknown as Promise<Response>;
  return new OpenAI({ ...options, fetch: proxiedFetch });
}

export function createOpenAIProviders(): AiProviders {
  return {
    text: {
      async generateContentPack({ topic, brief }) {
        const response = await client().responses.create({
          model: process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini",
          instructions: "Return JSON only: title, script, storyboard with exactly four strings.",
          input: "Topic: " + topic + "\nBrief: " + (brief || "none"),
          text: {
            format: {
              type: "json_schema",
              name: "content_pack",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  script: { type: "string" },
                  storyboard: { type: "array", minItems: 4, maxItems: 4, items: { type: "string" } },
                },
                required: ["title", "script", "storyboard"],
              },
            },
          },
        });
        return JSON.parse(response.output_text) as GeneratedTextContent;
      },
    },
    image: {
      async generateImage({ taskId, prompt, model, size, filename }) {
        const selectedModel = model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
        const selectedSize = size || "1024x1024";
        const result = await client().images.generate({
          model: selectedModel,
          prompt,
          size: selectedSize as "1024x1024" | "1024x1536" | "1536x1024",
          quality: (process.env.OPENAI_IMAGE_QUALITY as "low" | "medium" | "high" | "auto" | undefined) ?? "low",
          output_format: "png",
        });
        const base64 = result.data?.[0]?.b64_json;
        if (!base64) throw new Error("OpenAI image response was empty.");
        return { url: await saveGeneratedFile(taskId, filename ?? "image.png", Buffer.from(base64, "base64")), provider: "openai", model: selectedModel, metadata: { size: selectedSize } };
      },
      async generateStoryboardImages({ taskId, topic, scenes }) {
        return Promise.all(scenes.map(async (scene, index) => {
          const image = await this.generateImage({ taskId, prompt: "Vertical short-video scene. Topic: " + topic + ". Scene: " + scene + ". 9:16, no text, no watermark.", size: "1024x1536", filename: `scene-${index + 1}.png` });
          return {
            id: "image_" + (index + 1),
            type: "image" as const,
            name: "OpenAI scene " + (index + 1),
            url: image.url,
            provider: image.provider + "/" + image.model,
          };
        }));
      },
    },
    voice: {
      async synthesize({ taskId, script }) {
        const speech = await client().audio.speech.create({
          model: process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
          voice: process.env.OPENAI_TTS_VOICE ?? "coral",
          input: script.slice(0, 4096),
          response_format: "mp3",
        });
        return {
          id: "voice_1",
          type: "voice" as const,
          name: "OpenAI voiceover",
          url: await saveGeneratedFile(taskId, "voice.mp3", new Uint8Array(await speech.arrayBuffer())),
          provider: "openai/" + (process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts"),
        };
      },
    },
    video: {
      async generateVideo() { throw new ProviderConfigurationError("OpenAI video provider is not configured in this MVP. Set AI_VIDEO_PROVIDER to a configured video provider."); },
      async getStatus() { throw new ProviderConfigurationError("OpenAI video provider is not configured in this MVP."); },
      async render() {
        throw new ProviderConfigurationError("OpenAI video provider is not configured in this MVP.");
      },
    },
  };
}
