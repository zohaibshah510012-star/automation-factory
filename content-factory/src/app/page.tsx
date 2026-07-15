import Link from "next/link";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClapperboardIcon,
  FilmIcon,
  ImageIcon,
  Layers3Icon,
  PlayCircleIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrackClicks, TrackPageView } from "@/components/product-event-tracker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const audiences = [
  {
    title: "短视频创作者",
    description: "从一个选题生成短剧脚本、角色、分镜和视频任务，快速验证账号方向。",
  },
  {
    title: "内容团队",
    description: "把选题、脚本、图片、视频和分发任务统一沉淀成可复用内容资产。",
  },
  {
    title: "营销团队",
    description: "把产品卖点改写成剧情冲突、口播脚本、视觉素材和投放内容。",
  },
];

const workflow = [
  "输入主题",
  "生成剧情",
  "设计角色",
  "规划分镜",
  "生成图片",
  "生成视频",
  "沉淀资产",
];

const templates = [
  {
    icon: ClapperboardIcon,
    name: "AI 短剧生产",
    description: "主题 → 剧情 → 角色 → 分镜 → 图片 → 视频，一条链路生成短剧资产。",
  },
  {
    icon: Layers3Icon,
    name: "内容营销",
    description: "面向营销、社媒、电商和口播的结构化文案生产。",
  },
  {
    icon: ImageIcon,
    name: "图片生成",
    description: "把分镜、产品卖点或创意描述转换成可视化素材。",
  },
  {
    icon: FilmIcon,
    name: "视频生成",
    description: "把图片或提示词推进到视频片段任务，适配短视频工作流。",
  },
];

const demoScenes = [
  "Scene 01：爆款账号深夜断更，团队发现内容产能瓶颈。",
  "Scene 02：AI 工作流拆解选题、角色和冲突，生成第一版剧情。",
  "Scene 03：分镜自动进入图片与视频任务，素材开始沉淀。",
];

const faqs = [
  {
    question: "新用户可以免费试用吗？",
    answer: "可以。新账号初始化后会获得体验 Credits，可以直接生成第一个短剧或内容作品。",
  },
  {
    question: "我需要懂 Agent 或 Workflow 吗？",
    answer: "不需要。用户只需要选择模板并输入主题，底层 Agent、Workflow、Provider 会在后台完成生产链路。",
  },
  {
    question: "适合什么团队购买？",
    answer: "适合短视频创作者、内容团队、营销团队，以及需要批量生产脚本、图片、视频素材的业务团队。",
  },
  {
    question: "Credits 用完后怎么办？",
    answer: "工作台会引导进入 Billing 页面升级套餐，后续生产继续通过 Credits 计费和追踪。",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <TrackPageView surface="landing" properties={{ page: "home" }} />
      <TrackClicks surface="landing" />
      <header className="border-b bg-background/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <SparklesIcon />
            </span>
            Automation Factory
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#workflow">短剧流程</a>
            <a href="#product">产品截图</a>
            <Link href="/showcase">Demo 案例</Link>
            <a href="#faq">FAQ</a>
          </nav>
          <Button data-analytics-event="cta_click" data-analytics-label="header_free_generate" render={<Link href="/dashboard/studio" />}>
            免费生成
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-24">
        <div className="flex flex-col gap-7">
          <Badge className="w-fit" variant="secondary">
            AI 短剧生产工作台
          </Badge>
          <div className="flex flex-col gap-5">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
              用 AI 把一个主题生成可发布的短剧内容资产
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              面向短视频创作者、内容团队和营销团队，Automation Factory 把剧情、角色、分镜、图片、视频和分发任务串成一条可试用、可购买、可复用的内容生产线。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button data-analytics-event="cta_click" data-analytics-label="hero_free_drama" render={<Link href="/dashboard/studio" />} size="lg">
              免费生成第一部短剧
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button data-analytics-event="cta_click" data-analytics-label="hero_showcase" render={<Link href="/showcase" />} size="lg" variant="outline">
              先看 Demo 案例
            </Button>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <span className="flex items-center gap-2">
              <CheckCircle2Icon />
              新用户体验 Credits
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2Icon />
              图片/视频任务自动衔接
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2Icon />
              套餐升级路径清晰
            </span>
          </div>
        </div>

        <Card className="border-foreground/10 shadow-sm">
          <CardHeader>
            <CardTitle>短剧生产 Demo</CardTitle>
            <CardDescription>无需登录也能先理解最终结果长什么样。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="rounded-xl bg-muted p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">《7天起号：AI 内容团队》</p>
                  <p className="mt-1 text-sm text-muted-foreground">都市创业 / 快节奏 / 90 秒</p>
                </div>
                <Badge variant="secondary">Demo ready</Badge>
              </div>
            </div>
            <div className="grid gap-3">
              {demoScenes.map((scene) => (
                <div className="rounded-lg border bg-background p-3 text-sm" key={scene}>
                  {scene}
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                <ImageIcon className="mr-2" />
                分镜图片预览
              </div>
              <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                <PlayCircleIcon className="mr-2" />
                视频片段入口
              </div>
            </div>
            <Button data-analytics-event="cta_click" data-analytics-label="demo_showcase" render={<Link href="/showcase" />} variant="outline">
              查看完整 Demo Showcase
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="border-y bg-muted/30" id="workflow">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-semibold tracking-tight">从访问到首次价值，只保留 3 个动作</h2>
            <p className="max-w-2xl text-muted-foreground">
              用户不用理解 Agent、Workflow、Provider，只需要选择模板、输入主题、查看生成结果。
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-7">
            {workflow.map((item, index) => (
              <div className="rounded-xl border bg-background p-4" key={item}>
                <p className="text-xs text-muted-foreground">Step {index + 1}</p>
                <p className="mt-2 font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[.95fr_1.05fr]" id="product">
        <div className="flex flex-col gap-4">
          <Badge className="w-fit" variant="outline">Product Screenshot</Badge>
          <h2 className="text-3xl font-semibold tracking-tight">一个工作台完成首次生成、查看资产和升级套餐</h2>
          <p className="leading-7 text-muted-foreground">
            首页承诺和登录后的首个价值体验保持一致：用户点击免费生成后，会进入模板选择、主题输入和任务创建流程；Credits 不足时直接进入 Billing 升级。
          </p>
          <div className="grid gap-3 text-sm">
            {["模板推荐", "体验 Credits 提醒", "Demo 成品预览", "Upgrade CTA"].map((item) => (
              <div className="flex items-center gap-2" key={item}>
                <CheckCircle2Icon />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Short Drama Studio</p>
                <p className="text-xl font-semibold">首次生成引导</p>
              </div>
              <Badge variant="secondary">1000 trial credits</Badge>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {["短剧创作", "内容营销", "图片生成"].map((item) => (
                <div className="rounded-xl border bg-background p-4" key={item}>
                  <p className="font-medium">{item}</p>
                  <p className="mt-2 text-sm text-muted-foreground">推荐模板</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border bg-background p-4">
              <p className="text-sm text-muted-foreground">主题</p>
              <p className="mt-1 font-medium">7天起号：AI 如何帮助内容团队稳定产出短剧</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16" id="templates">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">可购买的 AI 内容产品模板</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              把底层 AI 能力包装成清晰产品入口，让用户按“我要完成什么作品”来购买和使用。
            </p>
          </div>
          <Link className="text-sm font-medium text-primary" href="/dashboard/templates">
            进入模板展示页 →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {templates.map((template) => (
            <Card key={template.name}>
              <CardHeader>
                <span className="grid size-10 place-items-center rounded-xl bg-muted">
                  <template.icon />
                </span>
                <CardTitle>{template.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{template.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:grid-cols-[.8fr_1.2fr] md:items-center">
          <div className="flex flex-col gap-4">
            <UsersIcon />
            <h2 className="text-3xl font-semibold tracking-tight">适合从个人创作者扩展到团队生产</h2>
            <p className="leading-7 text-primary-foreground/75">
              Demo、模板、首次引导和升级路径共同降低第一次使用门槛，让产品从“技术系统”变成“能试、能买、能复购”的 SaaS。
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {audiences.map((audience) => (
              <div className="rounded-xl bg-primary-foreground/10 p-4" key={audience.title}>
                <h3 className="font-medium">{audience.title}</h3>
                <p className="mt-2 text-sm leading-6 text-primary-foreground/70">{audience.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16" id="faq">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight">FAQ</h2>
          <p className="mt-2 text-muted-foreground">消除用户注册和首次生成前的关键疑虑。</p>
        </div>
        <div className="mt-8 grid gap-3">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardHeader>
                <CardTitle>{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
