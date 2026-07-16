import type { TaskType } from "@/lib/prompt-engine";

export type WorkflowCapability = "drama" | "video" | "image" | "content";

export type WorkflowTemplate = {
  id: "tiktok_ad" | "xiaohongshu_content" | "product_promo_video" | "short_drama" | "youtube_shorts" | "image_asset";
  title: string;
  channel: string;
  capability: WorkflowCapability;
  taskType: TaskType;
  description: string;
  promptStarter: string;
  briefStarter: string;
  outcome: string[];
  accent: string;
};

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "tiktok_ad",
    title: "TikTok Ad",
    channel: "Performance creative",
    capability: "video",
    taskType: "video",
    description: "Create a fast hook, visual direction, and video generation prompt for a conversion-focused TikTok ad.",
    promptStarter: "Create a 15-second TikTok ad for an AI automation SaaS that helps content teams turn one idea into scripts, scenes, and publish-ready assets.",
    briefStarter: "Audience: founders and content teams. Style: fast hook, premium SaaS visuals, clear CTA, vertical video.",
    outcome: ["Hook", "Scene prompt", "Video task", "CTA"],
    accent: "from-sky-500 to-cyan-400",
  },
  {
    id: "xiaohongshu_content",
    title: "小红书内容",
    channel: "Social content",
    capability: "content",
    taskType: "social",
    description: "Generate a Xiaohongshu-style post idea, title angles, body copy, and visual notes.",
    promptStarter: "为一款 AI 短剧生产平台生成一篇小红书种草内容，目标用户是短视频创作者和内容团队。",
    briefStarter: "风格：真实体验、强开头、适合收藏；输出标题、正文、封面建议和行动引导。",
    outcome: ["标题", "正文", "封面建议", "发布角度"],
    accent: "from-rose-500 to-pink-500",
  },
  {
    id: "product_promo_video",
    title: "产品宣传视频",
    channel: "Product marketing",
    capability: "video",
    taskType: "video",
    description: "Turn a product message into a cinematic promo video prompt and production task.",
    promptStarter: "Create a premium product promo video for Automation Factory, showing an AI creator workspace transforming one idea into script, image, video, and distribution assets.",
    briefStarter: "Style: Runway-like, dark premium SaaS, cinematic UI motion, 20 seconds, vertical-first.",
    outcome: ["Video concept", "Visual style", "Generation task", "Review link"],
    accent: "from-violet-500 to-indigo-500",
  },
  {
    id: "short_drama",
    title: "短剧生成",
    channel: "AI drama production",
    capability: "drama",
    taskType: "drama",
    description: "Generate story premise, characters, scene structure, and downstream production tasks for a short drama.",
    promptStarter: "一个普通创作者发现 AI 工作流后，用 7 天把混乱的内容生产变成稳定短剧流水线，过程有冲突、反转和商业结果。",
    briefStarter: "类型：都市创业。节奏：强冲突、短视频竖屏、90 秒。输出剧情、角色、分镜和资产建议。",
    outcome: ["剧情", "角色", "分镜", "资产任务"],
    accent: "from-fuchsia-500 to-violet-500",
  },
  {
    id: "youtube_shorts",
    title: "YouTube Shorts",
    channel: "Short-form education",
    capability: "content",
    taskType: "short_video_script",
    description: "Create a concise Shorts script with hook, value points, storyboard, and CTA.",
    promptStarter: "Create a YouTube Shorts script explaining how AI agents can automate content production for a small marketing team.",
    briefStarter: "Audience: SaaS founders and marketers. Style: educational, sharp, 45 seconds, strong retention loop.",
    outcome: ["Hook", "Script", "Storyboard", "CTA"],
    accent: "from-red-500 to-orange-500",
  },
  {
    id: "image_asset",
    title: "AI图片",
    channel: "Visual asset",
    capability: "image",
    taskType: "image",
    description: "Generate covers, thumbnails, posters, storyboard frames, and campaign visuals from one visual brief.",
    promptStarter: "为 Automation Factory 生成一张高级 AI SaaS 产品视觉图：深色背景、AI 工作流、创作者工作台、未来感但真实可用。",
    briefStarter: "画幅：竖屏或方图。风格：premium SaaS、电影感灯光、清晰主体、可用于官网或短视频封面。",
    outcome: ["视觉 Prompt", "图片任务", "结果预览", "资产保存"],
    accent: "from-emerald-400 to-teal-500",
  },
];

export const capabilityLabels: Record<WorkflowCapability, { title: string; description: string }> = {
  drama: {
    title: "AI短剧",
    description: "剧情、角色、分镜和短剧生产链路。",
  },
  video: {
    title: "AI视频",
    description: "视频 Prompt、镜头描述和生成任务。",
  },
  image: {
    title: "AI图片",
    description: "封面、海报、分镜图和视觉资产。",
  },
  content: {
    title: "AI内容",
    description: "脚本、文案、社媒内容和营销素材。",
  },
};
