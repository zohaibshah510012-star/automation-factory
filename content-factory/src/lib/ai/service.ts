import { getAiProviders, getActiveProviderName, getImageProvider, getImageProviderName } from "@/lib/ai-providers";
export type AiResult = { provider:string; content:{title:string;script:string;storyboard:string[]} };
export async function generateText(input:{topic:string;brief?:string;systemPrompt:string;userPrompt:string}):Promise<AiResult>{const content=await getAiProviders().text.generateContentPack(input);return {provider:getActiveProviderName(),content};}
export async function generateImage(input:{taskId:string;prompt:string;model?:string;size?:string}){const image=await getImageProvider().generateImage(input);return {provider:getImageProviderName(),image};}
export async function generateVideo(){ throw new Error("VIDEO_PROVIDER_NOT_ENABLED"); }
