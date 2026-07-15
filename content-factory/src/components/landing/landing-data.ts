import {
  BotIcon,
  FilmIcon,
  ImageIcon,
  Layers3Icon,
  MegaphoneIcon,
  PenLineIcon,
  RadioTowerIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react";

export const navigationItems = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Showcase", href: "#showcase" },
  { label: "Pricing", href: "/dashboard/billing" },
  { label: "FAQ", href: "#faq" },
];

export const pipelineSteps = [
  { label: "Idea", value: "创业逆袭故事" },
  { label: "AI Agents", value: "剧本 · 角色 · 分镜" },
  { label: "Script", value: "8 集短剧结构" },
  { label: "Scenes", value: "24 个镜头计划" },
  { label: "Video", value: "可预览片段" },
  { label: "Publish", value: "多平台发布任务" },
];

export const demoAssets = [
  {
    label: "Script",
    title: "《七天起号》",
    description: "一个小团队用 AI 内容工厂逆转停更危机，重新找到账号增长节奏。",
    accent: "from-cyan-300 to-blue-500",
  },
  {
    label: "Characters",
    title: "林澈 · 周雨 · 何然",
    description: "创业者、内容负责人、增长顾问三条人物线制造冲突和转折。",
    accent: "from-violet-300 to-fuchsia-500",
  },
  {
    label: "Storyboard",
    title: "24 Scenes",
    description: "从深夜会议到首条爆款，每个镜头都有画面描述和生成状态。",
    accent: "from-amber-300 to-orange-500",
  },
];

export const mockScenes = [
  "深夜办公室，白板上只剩最后 7 天倒计时。",
  "AI Agent 拆解账号定位、冲突和前三集剧情钩子。",
  "分镜进入图片生成队列，角色视觉逐步统一。",
  "视频片段完成预览，发布任务进入多平台排期。",
];

export const showcaseItems = [
  {
    title: "七天起号",
    category: "创业逆袭",
    duration: "8 episodes",
    status: "Demo ready",
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
  },
  {
    title: "消失的爆款公式",
    category: "内容团队",
    duration: "6 episodes",
    status: "Storyboard",
    gradient: "from-fuchsia-400 via-purple-500 to-slate-900",
  },
  {
    title: "凌晨三点的投放室",
    category: "营销战役",
    duration: "5 episodes",
    status: "Video preview",
    gradient: "from-amber-300 via-orange-500 to-rose-600",
  },
];

export const workflowSteps = [
  {
    title: "Create",
    subtitle: "输入主题",
    description: "从一句创意、产品卖点或账号方向开始，选择短剧、营销或图片模板。",
    icon: PenLineIcon,
  },
  {
    title: "Generate",
    subtitle: "AI Agent 自动生产",
    description: "自动生成剧本、角色、分镜、图片任务和视频任务，过程可追踪。",
    icon: WandSparklesIcon,
  },
  {
    title: "Publish",
    subtitle: "沉淀并分发",
    description: "把作品沉淀为内容资产，并为 YouTube、TikTok、小红书等平台预留发布链路。",
    icon: RadioTowerIcon,
  },
];

export const features = [
  {
    title: "AI Agent",
    description: "把创作流程拆给专业 Agent，让内容生产从手工协作变成自动流水线。",
    icon: BotIcon,
  },
  {
    title: "Prompt Engine",
    description: "用模板化提示词稳定输出剧情结构、角色设定和镜头语言。",
    icon: SparklesIcon,
  },
  {
    title: "Image Generation",
    description: "把分镜描述转成可预览视觉资产，帮助团队快速判断方向。",
    icon: ImageIcon,
  },
  {
    title: "Video Generation",
    description: "串联图片、提示词和视频任务，为短剧片段生产做好准备。",
    icon: FilmIcon,
  },
  {
    title: "Distribution Engine",
    description: "内容完成后进入分发任务队列，为多平台增长预留自动化入口。",
    icon: MegaphoneIcon,
  },
  {
    title: "Content Assets",
    description: "剧本、角色、分镜、图片、视频统一沉淀，方便复用和团队协作。",
    icon: Layers3Icon,
  },
];

export const faqs = [
  {
    question: "我需要懂 Agent 或 Workflow 吗？",
    answer: "不需要。用户只需要选择模板并输入主题，底层 Agent、Workflow 和 Provider 会在后台完成生产链路。",
  },
  {
    question: "新用户可以免费试用吗？",
    answer: "可以。产品保留体验 Credits 和首次生成引导，适合先验证一条短剧生产链路再升级套餐。",
  },
  {
    question: "适合什么团队购买？",
    answer: "适合短视频创作者、MCN、内容团队、营销团队，以及需要批量生产脚本、视觉和视频资产的业务团队。",
  },
  {
    question: "生成后可以直接发布吗？",
    answer: "当前已具备内容资产和分发任务架构，可先用 Mock/配置化 Provider 验证流程，后续接入真实平台 API。",
  },
];
