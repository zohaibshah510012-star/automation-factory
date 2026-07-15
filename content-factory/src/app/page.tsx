import Link from "next/link";
import {
  ArrowRightIcon,
  ClapperboardIcon,
  FilmIcon,
  ImageIcon,
  Layers3Icon,
  PlayCircleIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
    description: "从一个选题生成短剧脚本、角色、分镜和视频任务，减少从灵感到发布的断层。",
  },
  {
    title: "内容团队",
    description: "把选题、脚本、图片、视频和分发任务统一沉淀成可复用内容资产。",
  },
  {
    title: "营销团队",
    description: "快速把产品卖点改写成剧情冲突、口播脚本、视觉素材和投放内容。",
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
    name: "内容生成",
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

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
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
            <a href="#templates">模板能力</a>
            <a href="#demo">Demo</a>
          </nav>
          <Link
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
            href="/dashboard/studio"
          >
            开始创作
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-24">
        <div className="flex flex-col gap-7">
          <Badge className="w-fit" variant="secondary">
            AI 短剧生产工作台
          </Badge>
          <div className="flex flex-col gap-5">
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
              把一个主题，变成可发布的短剧内容资产
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Automation Factory 面向短视频创作者、内容团队和营销团队，把剧情、角色、分镜、图片、视频和分发任务串成一条可购买、可复用、可规模化的 AI 内容生产线。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/80"
              href="/dashboard/studio"
            >
              生成第一部短剧
              <ArrowRightIcon />
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-lg border bg-background px-5 text-sm font-medium transition hover:bg-muted"
              href="/dashboard/templates"
            >
              查看模板库
            </Link>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <span>剧情结构化</span>
            <span>图片/视频任务自动衔接</span>
            <span>Credits 商业化计费</span>
          </div>
        </div>

        <Card className="border-foreground/10 shadow-sm">
          <CardHeader>
            <CardTitle>短剧生产 Demo</CardTitle>
            <CardDescription>新用户无需等待，也能先理解最终结果长什么样。</CardDescription>
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
          </CardContent>
        </Card>
      </section>

      <section className="border-y bg-muted/30" id="workflow">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-semibold tracking-tight">从主题到成片资产的生产链路</h2>
            <p className="max-w-2xl text-muted-foreground">
              用户不用理解 Agent、Workflow、Provider 的底层概念，只需要选择模板、输入主题，然后查看生成结果。
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

      <section className="bg-primary text-primary-foreground" id="demo">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:grid-cols-[.8fr_1.2fr] md:items-center">
          <div className="flex flex-col gap-4">
            <UsersIcon />
            <h2 className="text-3xl font-semibold tracking-tight">适合从个人创作者扩展到团队生产</h2>
            <p className="leading-7 text-primary-foreground/75">
              Demo、模板、首次引导和资产展示共同降低用户第一次使用门槛，让产品从“技术系统”变成“能买、能试、能复购”的 SaaS。
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
    </main>
  );
}
