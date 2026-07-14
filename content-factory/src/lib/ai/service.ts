import { getAiProviders, getActiveProviderName } from "@/lib/ai-providers";
export type AiResult = { provider:string; content:{title:string;script:string;storyboard:string[]} };
export async function generateText(input:{topic:string;brief?:string;systemPrompt:string;userPrompt:string}):Promise<AiResult>{const content=await getAiProviders().text.generateContentPack(input);return {provider:getActiveProviderName(),content};}
export async function generateImage(){ throw new Error("IMAGE_PROVIDER_NOT_ENABLED"); }
export async function generateVideo(){ throw new Error("VIDEO_PROVIDER_NOT_ENABLED"); }
