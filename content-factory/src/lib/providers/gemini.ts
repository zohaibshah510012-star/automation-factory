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
      async generateStoryboardImages({ taskId, topic, scenes }) {
        const model = process.env.GEMINI_IMAGE_MODEL;
        if (!model) throw new ProviderConfigurationError("GEMINI_IMAGE_MODEL is not configured.");
        return Promise.all(scenes.map(async (scene, index) => {
          const response = await client().models.generateContent({
            model,
            contents: "Vertical short-video scene. Topic: " + topic + ". Scene: " + scene + ". 9:16, no text.",
            config: { responseModalities: ["IMAGE"] },
          });
          if (!response.data) throw new Error("Gemini image response was empty.");
          return {
            id: "image_" + (index + 1),
            type: "image" as const,
            name: "Gemini scene " + (index + 1),
            url: await saveGeneratedFile(taskId, "scene-" + (index + 1) + ".png", Buffer.from(response.data, "base64")),
            provider: "gemini/" + model,
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
