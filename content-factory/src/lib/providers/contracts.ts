import type { ContentAsset, ContentPack } from "@/lib/types";

export type GeneratedTextContent = Required<Omit<ContentPack, "assets">>;

export interface TextProvider {
  generateContentPack(input: { topic: string; brief?: string }): Promise<GeneratedTextContent>;
}

export interface ImageProvider {
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
