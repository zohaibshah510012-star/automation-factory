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
    title: "抖音广告",
    commercialName: "15 秒短视频转化广告",
    channel: "转化创意",
    capability: "video",
    taskType: "video",
    description: "为产品生成短视频广告脚本、画面方向和视频生成提示词，适合做第一版投放素材。",
    exampleInput: "为一个 AI 内容生产工具写一条抖音广告，目标用户是想更快产出短视频的创作者和小团队。",
    promptStarter: "为 Automation Factory 写一条 15 秒抖音广告，突出“一个想法自动生成脚本、分镜、图片、视频和发布包”。",
    briefStarter: "目标用户：创作者、小品牌、内容团队。风格：开头强钩子、高级科技感、明确行动号召、竖屏短视频。",
    estimatedOutput: "广告钩子、镜头设计、视频提示词、可查看的生成任务。",
    outcome: ["开头钩子", "镜头提示词", "视频任务", "行动号召"],
    accent: "from-sky-500 to-cyan-400",
  },
  {
    id: "xiaohongshu_content",
    title: "小红书内容",
    commercialName: "小红书产品种草笔记",
    channel: "社媒内容",
    capability: "content",
    taskType: "social",
    description: "生成小红书选题、标题、正文、封面建议和发布角度。",
    exampleInput: "写一篇小红书笔记，介绍一个 AI 短剧内容生产平台，面向短视频创作者和内容团队。",
    promptStarter: "写一篇小红书种草笔记，介绍 Automation Factory 如何把一个创意生成脚本、图片、视频预览和发布包。",
    briefStarter: "风格：真实、有痛点、有干货、适合收藏。包含标题、正文、封面建议和行动号召。",
    estimatedOutput: "标题选项、正文内容、封面概念、发布角度。",
    outcome: ["标题", "正文", "封面建议", "发布角度"],
    accent: "from-rose-500 to-pink-500",
  },
  {
    id: "product_promo_video",
    title: "产品宣传视频",
    commercialName: "高质感产品宣传短片",
    channel: "产品营销",
    capability: "video",
    taskType: "video",
    description: "把产品卖点转成宣传短片创意、镜头脚本和视频生成任务。",
    exampleInput: "做一条产品宣传视频，展示 Automation Factory 如何把一个想法变成脚本、图片、视频和发布素材。",
    promptStarter: "为 Automation Factory 生成一条高质感产品宣传短片，展示 AI 创作工作台把一个想法变成脚本、图片、视频和发布素材。",
    briefStarter: "风格：高级 SaaS、深色科技感、电影级 UI 动效、20 秒、优先竖屏。",
    estimatedOutput: "视频创意、视觉风格、生成提示词、任务详情链接。",
    outcome: ["视频创意", "视觉风格", "生成任务", "查看链接"],
    accent: "from-violet-500 to-indigo-500",
  },
  {
    id: "short_drama",
    title: "AI 短剧",
    commercialName: "90 秒 AI 短剧内容包",
    channel: "AI 短剧生产",
    capability: "drama",
    taskType: "drama",
    description: "生成故事设定、角色、分镜结构，并自动衔接图片和视频预览任务。",
    exampleInput: "一个普通创作者用 AI 工作流，在 7 天内把混乱的内容生产变成稳定短剧流水线。",
    promptStarter: "一个普通创作者发现 Automation Factory，用 7 天把混乱的内容生产变成稳定短剧流水线。需要有冲突、反转和商业结果。",
    briefStarter: "类型：都市创业。节奏：强冲突、竖屏短剧风格、90 秒。输出故事、角色、分镜、图片提示词和视频提示词。",
    estimatedOutput: "故事大纲、角色设定、分镜拆解、图片/视频资产任务。",
    outcome: ["故事", "角色", "分镜", "资产任务"],
    accent: "from-fuchsia-500 to-violet-500",
  },
  {
    id: "youtube_shorts",
    title: "短视频口播",
    commercialName: "45 秒知识型短视频脚本",
    channel: "知识短视频",
    capability: "content",
    taskType: "short_video_script",
    description: "生成短视频口播脚本，包含开头钩子、价值点、分镜节奏和行动号召。",
    exampleInput: "用 45 秒解释 AI Agent 如何帮小型营销团队自动化内容生产。",
    promptStarter: "生成一条 45 秒短视频口播脚本，解释 Automation Factory 如何帮助小团队自动化内容生产。",
    briefStarter: "目标用户：创始人、营销人员、创作者。风格：信息密度高、表达清晰、节奏快、强留存。",
    estimatedOutput: "开头钩子、口播脚本、分镜节奏、行动号召。",
    outcome: ["钩子", "脚本", "分镜", "行动号召"],
    accent: "from-red-500 to-orange-500",
  },
  {
    id: "image_asset",
    title: "AI 图片",
    commercialName: "营销视觉素材",
    channel: "视觉素材",
    capability: "image",
    taskType: "image",
    description: "根据一句视觉需求生成封面图、海报、分镜图或营销视觉素材。",
    exampleInput: "生成一张高级 AI SaaS 视觉图，展示创作者工作台和自动化生产流水线。",
    promptStarter: "为 Automation Factory 生成一张高级 AI SaaS 产品视觉图：深色背景、AI 工作流、创作者工作台、科技感但真实可用。",
    briefStarter: "比例：竖版或方图。风格：高级 SaaS、电影光影、主体清晰，适合作为落地页或短视频封面。",
    estimatedOutput: "图片提示词、图片任务、预览结果、已保存视觉素材。",
    outcome: ["视觉提示词", "图片任务", "预览", "保存素材"],
    accent: "from-emerald-400 to-teal-500",
  },
];

export const capabilityLabels: Record<WorkflowCapability, { title: string; description: string }> = {
  drama: {
    title: "AI 短剧",
    description: "故事、角色、分镜和短剧生产结构。",
  },
  video: {
    title: "AI 视频",
    description: "视频提示词、镜头方向和生成任务。",
  },
  image: {
    title: "AI 图片",
    description: "封面、海报、分镜图和视觉资产。",
  },
  content: {
    title: "AI 文案",
    description: "脚本、文案、社媒内容和营销材料。",
  },
};
