import { GoogleGenAI } from "@google/genai";

import type { AiProviders, GeneratedTextContent } from "@/lib/providers/contracts";
import { ProviderConfigurationError } from "@/lib/providers/errors";
import { saveGeneratedFile } from "@/lib/providers/media";

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ProviderConfigurationError("GEMINI_API_KEY is not configured.");
  return new GoogleGenAI({ apiKey });
}

export function createGeminiProviders(): AiProviders {
  return {
    text: {
      async generateContentPack({ topic, brief }) {
        const response = await client().models.generateContent({
          model: process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash",
          contents: "Return JSON only: title, script, storyboard with exactly four strings.\nTopic: " + topic + "\nBrief: " + (brief || "none"),
          config: {
            responseMimeType: "application/json",
            responseJsonSchema: {
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
        });
        if (!response.text) throw new Error("Gemini text response was empty.");
        return JSON.parse(response.text) as GeneratedTextContent;
      },
    },
    image: {
      async generateImage({ taskId, prompt, model, size, filename }) {
        const selectedModel = model || process.env.GEMINI_IMAGE_MODEL;
        if (!selectedModel) throw new ProviderConfigurationError("GEMINI_IMAGE_MODEL is not configured.");
        const response = await client().models.generateContent({ model: selectedModel, contents: prompt, config: { responseModalities: ["IMAGE"] } });
        if (!response.data) throw new Error("Gemini image response was empty.");
        return { url: await saveGeneratedFile(taskId, filename ?? "image.png", Buffer.from(response.data, "base64")), provider: "gemini", model: selectedModel, metadata: { size: size ?? null } };
      },
      async generateStoryboardImages({ taskId, topic, scenes }) {
        return Promise.all(scenes.map(async (scene, index) => {
          const image = await this.generateImage({ taskId, prompt: "Vertical short-video scene. Topic: " + topic + ". Scene: " + scene + ". 9:16, no text.", filename: `scene-${index + 1}.png` });
          return {
            id: "image_" + (index + 1),
            type: "image" as const,
            name: "Gemini scene " + (index + 1),
            url: image.url,
            provider: image.provider + "/" + image.model,
          };
        }));
      },
    },
    voice: {
      async synthesize() {
        throw new ProviderConfigurationError("Gemini voice provider is not configured in this MVP.");
      },
    },
    video: {
      async render() {
        throw new ProviderConfigurationError("Gemini video provider is not configured in this MVP.");
      },
    },
  };
}
