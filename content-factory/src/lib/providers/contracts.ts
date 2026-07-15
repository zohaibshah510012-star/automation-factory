import type { ContentAsset, ContentPack } from "@/lib/types";

export type GeneratedTextContent = Required<Omit<ContentPack, "assets">>;

export interface TextProvider {
  generateContentPack(input: { topic: string; brief?: string; systemPrompt?: string; userPrompt?: string }): Promise<GeneratedTextContent>;
}

export interface ImageProvider {
  generateImage(input: { taskId: string; prompt: string; model?: string; size?: string; filename?: string }): Promise<{ url: string; provider: string; model: string; metadata?: Record<string, unknown> }>;
  generateStoryboardImages(input: { taskId: string; topic: string; scenes: string[] }): Promise<ContentAsset[]>;
}

export interface VoiceProvider {
  synthesize(input: { taskId: string; script: string }): Promise<ContentAsset>;
}

export interface VideoProvider {
  render(input: { taskId: string; script: string; assets: ContentAsset[] }): Promise<ContentAsset>;
}

export type AiProviders = {
  text: TextProvider;
  image: ImageProvider;
  voice: VoiceProvider;
  video: VideoProvider;
};
