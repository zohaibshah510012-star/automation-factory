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

function ensureJsonModePrompt(value: string | undefined, fallback: string) {
  const prompt = value?.trim() || fallback;
  return /\bjson\b/i.test(prompt)
    ? prompt
    : `${prompt}\n\nReturn valid json only. The response must be a single json object with title, script, and storyboard.`;
}

export function createDeepSeekProviders(): AiProviders {
  return {
    text: {
      async generateContentPack({ topic, brief, systemPrompt, userPrompt }) {
        const safeSystemPrompt = ensureJsonModePrompt(
          systemPrompt,
          "Return JSON only: title, script, storyboard with exactly four strings.",
        );
        const safeUserPrompt = ensureJsonModePrompt(
          userPrompt,
          "Topic: " + topic + "\nBrief: " + (brief || "none"),
        );
        const response = await client().chat.completions.create({
          model: process.env.DEEPSEEK_TEXT_MODEL ?? "deepseek-chat",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: safeSystemPrompt },
            { role: "user", content: safeUserPrompt },
          ],
        });
        const content = response.choices[0]?.message.content;
        if (!content) throw new Error("DeepSeek text response was empty.");
        return {
          ...JSON.parse(content) as GeneratedTextContent,
          usage: {
            inputTokens: response.usage?.prompt_tokens ?? null,
            outputTokens: response.usage?.completion_tokens ?? null,
          },
        };
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
      async generateVideo() { throw new ProviderConfigurationError("DeepSeek video provider is not configured. Set AI_VIDEO_PROVIDER to a video-capable provider."); },
      async getStatus() { throw new ProviderConfigurationError("DeepSeek video provider is not configured."); },
      async render() {
        throw new ProviderConfigurationError("DeepSeek video provider is not configured in this text MVP.");
      },
    },
  };
}
