import type { TaskType } from "@/lib/prompt-engine";

export type WorkflowCapability = "drama" | "video" | "image" | "content";

export type WorkflowTemplate = {
  id: "tiktok_ad" | "xiaohongshu_content" | "product_promo_video" | "short_drama" | "youtube_shorts" | "image_asset";
  title: string;
  commercialName: string;
  channel: string;
  capability: WorkflowCapability;
  taskType: TaskType;
  description: string;
  exampleInput: string;
  promptStarter: string;
  briefStarter: string;
  estimatedOutput: string;
  outcome: string[];
  accent: string;
};

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "tiktok_ad",
    title: "TikTok Ad",
    commercialName: "15-second TikTok conversion ad",
    channel: "Performance creative",
    capability: "video",
    taskType: "video",
    description: "Create a fast hook, visual direction, and video generation prompt for a conversion-focused TikTok ad.",
    exampleInput: "Launch a TikTok ad for an AI content workflow product targeting creators who want to produce more videos with less manual work.",
    promptStarter: "Create a 15-second TikTok ad for an AI automation SaaS that helps content teams turn one idea into scripts, scenes, and publish-ready assets.",
    briefStarter: "Audience: founders and content teams. Style: fast hook, premium SaaS visuals, clear CTA, vertical video.",
    estimatedOutput: "Hook, shot direction, video prompt, and a generation task ready for review.",
    outcome: ["Hook", "Scene prompt", "Video task", "CTA"],
    accent: "from-sky-500 to-cyan-400",
  },
  {
    id: "xiaohongshu_content",
    title: "Xiaohongshu Content",
    commercialName: "Xiaohongshu product seeding post",
    channel: "Social content",
    capability: "content",
    taskType: "social",
    description: "Generate a Xiaohongshu-style post idea, title angles, body copy, and visual notes.",
    exampleInput: "Write a Xiaohongshu post introducing an AI short-drama production platform for short-video creators and content teams.",
    promptStarter: "Write a Xiaohongshu-style product seeding post for an AI short-drama production platform. Target users: short-video creators and content teams.",
    briefStarter: "Style: authentic, strong opening, useful enough to save. Include titles, body copy, cover suggestion, and CTA.",
    estimatedOutput: "Title options, main post copy, cover concept, and posting angle.",
    outcome: ["Titles", "Post copy", "Cover idea", "Publishing angle"],
    accent: "from-rose-500 to-pink-500",
  },
  {
    id: "product_promo_video",
    title: "Product Promo Video",
    commercialName: "Premium SaaS product promo",
    channel: "Product marketing",
    capability: "video",
    taskType: "video",
    description: "Turn a product message into a cinematic promo video prompt and production task.",
    exampleInput: "Create a product promo video showing Automation Factory turning one idea into script, images, video, and distribution assets.",
    promptStarter: "Create a premium product promo video for Automation Factory, showing an AI creator workspace transforming one idea into script, image, video, and distribution assets.",
    briefStarter: "Style: Runway-like, dark premium SaaS, cinematic UI motion, 20 seconds, vertical-first.",
    estimatedOutput: "Video concept, visual style guide, generation prompt, and task detail link.",
    outcome: ["Video concept", "Visual style", "Generation task", "Review link"],
    accent: "from-violet-500 to-indigo-500",
  },
  {
    id: "short_drama",
    title: "Short Drama",
    commercialName: "90-second AI short-drama pack",
    channel: "AI drama production",
    capability: "drama",
    taskType: "drama",
    description: "Generate story premise, characters, scene structure, and downstream production tasks for a short drama.",
    exampleInput: "A creator discovers an AI workflow and turns chaotic content production into a stable short-drama pipeline in 7 days.",
    promptStarter: "A normal creator discovers an AI workflow and uses 7 days to turn chaotic content production into a stable short-drama pipeline, with conflict, reversal, and a business result.",
    briefStarter: "Genre: urban entrepreneurship. Rhythm: strong conflict, vertical short-video style, 90 seconds. Output story, characters, scenes, and asset suggestions.",
    estimatedOutput: "Story premise, character setup, scene breakdown, and production-ready asset tasks.",
    outcome: ["Story", "Characters", "Scenes", "Asset tasks"],
    accent: "from-fuchsia-500 to-violet-500",
  },
  {
    id: "youtube_shorts",
    title: "YouTube Shorts",
    commercialName: "45-second educational Shorts script",
    channel: "Short-form education",
    capability: "content",
    taskType: "short_video_script",
    description: "Create a concise Shorts script with hook, value points, storyboard, and CTA.",
    exampleInput: "Explain how AI agents can automate content production for a small marketing team in a 45-second YouTube Shorts video.",
    promptStarter: "Create a YouTube Shorts script explaining how AI agents can automate content production for a small marketing team.",
    briefStarter: "Audience: SaaS founders and marketers. Style: educational, sharp, 45 seconds, strong retention loop.",
    estimatedOutput: "Hook, voiceover script, storyboard beats, and CTA.",
    outcome: ["Hook", "Script", "Storyboard", "CTA"],
    accent: "from-red-500 to-orange-500",
  },
  {
    id: "image_asset",
    title: "AI Image",
    commercialName: "Campaign visual asset",
    channel: "Visual asset",
    capability: "image",
    taskType: "image",
    description: "Generate covers, thumbnails, posters, storyboard frames, and campaign visuals from one visual brief.",
    exampleInput: "Create a premium AI SaaS visual showing a creator workspace and an automated production pipeline.",
    promptStarter: "Generate a premium AI SaaS product visual for Automation Factory: dark background, AI workflow, creator workspace, futuristic but usable.",
    briefStarter: "Aspect ratio: vertical or square. Style: premium SaaS, cinematic lighting, clear subject, suitable for landing page or short-video cover.",
    estimatedOutput: "Image prompt, image task, preview result, and saved visual asset.",
    outcome: ["Visual prompt", "Image task", "Preview", "Saved asset"],
    accent: "from-emerald-400 to-teal-500",
  },
];

export const capabilityLabels: Record<WorkflowCapability, { title: string; description: string }> = {
  drama: {
    title: "AI Short Drama",
    description: "Story, characters, scenes, and short-drama production structure.",
  },
  video: {
    title: "AI Video",
    description: "Video prompts, shot direction, and generation tasks.",
  },
  image: {
    title: "AI Image",
    description: "Covers, posters, storyboards, and visual assets.",
  },
  content: {
    title: "AI Content",
    description: "Scripts, copy, social content, and marketing materials.",
  },
};
