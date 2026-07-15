import OpenAI from "openai";

import type { AiProviders, GeneratedTextContent } from "@/lib/providers/contracts";
import { ProviderConfigurationError } from "@/lib/providers/errors";

function client() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new ProviderConfigurationError("DEEPSEEK_API_KEY is not configured.");
  return new OpenAI({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    maxRetries: 0,
    timeout: Number.parseInt(process.env.DEEPSEEK_REQUEST_TIMEOUT_MS ?? "45000", 10),
  });
}

export function createDeepSeekProviders(): AiProviders {
  return {
    text: {
      async generateContentPack({ topic, brief, systemPrompt, userPrompt }) {
        const response = await client().chat.completions.create({
          model: process.env.DEEPSEEK_TEXT_MODEL ?? "deepseek-chat",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt || "Return JSON only: title, script, storyboard with exactly four strings." },
            { role: "user", content: userPrompt || "Topic: " + topic + "\nBrief: " + (brief || "none") },
          ],
        });
        const content = response.choices[0]?.message.content;
        if (!content) throw new Error("DeepSeek text response was empty.");
        return JSON.parse(content) as GeneratedTextContent;
      },
    },
    image: {
      async generateImage() {
        throw new ProviderConfigurationError("DeepSeek image provider is not configured. Set AI_IMAGE_PROVIDER to openai, gemini, or another image-capable provider.");
      },
      async generateStoryboardImages() {
        throw new ProviderConfigurationError("DeepSeek image provider is not configured in this text MVP.");
      },
    },
    voice: {
      async synthesize() {
        throw new ProviderConfigurationError("DeepSeek voice provider is not configured in this text MVP.");
      },
    },
    video: {
      async render() {
        throw new ProviderConfigurationError("DeepSeek video provider is not configured in this text MVP.");
      },
    },
  };
}
