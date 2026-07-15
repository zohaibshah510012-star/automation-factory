import Link from "next/link";
import {
  ArrowRightIcon,
  ClapperboardIcon,
  FilmIcon,
  ImageIcon,
  SparklesIcon,
  UserRoundIcon,
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

const characters = [
  {
    name: "林舟",
    role: "内容团队主理人",
    personality: "焦虑但行动力强，负责推动团队转型。",
    visual: "都市创业者，黑色卫衣，深夜办公室，强对比光。",
  },
  {
    name: "阿珂",
    role: "剪辑师",
    personality: "执行能力强，但被重复剪辑和返工消耗。",
    visual: "年轻剪辑师，多屏工作台，蓝紫色屏幕光。",
  },
  {
    name: "周野",
    role: "增长负责人",
    personality: "数据敏感，关注选题效率和转化结果。",
    visual: "增长分析师，白板、数据图、短视频后台界面。",
  },
];

const categories = ["短剧起号", "内容团队", "营销转化", "AI 工作流"];

const generationFlow = [
  { step: "选择模板", detail: "用户选择短剧创作模板，系统推荐剧情、角色、分镜结构。" },
  { step: "输入主题", detail: "输入产品卖点或账号选题，例如“7天起号：AI 内容团队”。" },
  { step: "生成资产", detail: "Workflow 依次生成剧情、角色、分镜，并衔接图片和视频任务。" },
  { step: "复用结果", detail: "最终内容进入资产中心，可继续分发、复用或作为团队素材。" },
];

const outcomes = [
  { label: "剧情结构", value: "1 条完整短剧主线" },
  { label: "角色设定", value: "3 个可复用角色" },
  { label: "分镜", value: "4 个可生产 Scene" },
  { label: "媒体任务", value: "图片与视频状态可追踪" },
];

const scenes = [
  {
    number: 1,
    title: "断更前夜",
    description: "团队为了明天发布的短剧选题争执，所有脚本都停留在半成品。",
    camera: "手持近景，快速切换三人表情。",
    image: "completed",
    video: "completed",
  },
  {
    number: 2,
    title: "输入一个主题",
    description: "林舟把产品卖点输入 Automation Factory，系统生成剧情、角色和分镜。",
    camera: "屏幕特写转人物反应，中景推进。",
    image: "completed",
    video: "processing",
  },
  {
    number: 3,
    title: "分镜进入生产",
    description: "每个场景自动生成图片 Prompt，并进入视频片段任务。",
    camera: "俯拍工作台，任务卡片依次亮起。",
    image: "completed",
    video: "pending",
  },
  {
    number: 4,
    title: "第一个可发布版本",
    description: "团队拿到完整短剧结构、素材和发布任务，恢复稳定更新节奏。",
    camera: "明亮办公室，横移展示团队协作。",
    image: "pending",
    video: "pending",
  },
];

export default function ShowcasePage() {
  return (
    <main className="min-h-screen bg-background">
      <TrackPageView surface="showcase" properties={{ page: "short_drama_showcase", category: "short_drama" }} />
      <TrackClicks surface="showcase" />
      <header className="border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <SparklesIcon />
            </span>
            Automation Factory
          </Link>
          <Button data-analytics-event="cta_click" data-analytics-label="showcase_header_generate" render={<Link href="/dashboard/studio?template=drama" />}>
            免费生成同款短剧
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div className="flex flex-col gap-5">
          <Badge className="w-fit" variant="secondary">Demo Showcase</Badge>
          <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
            示例短剧：《7天起号：AI 内容团队》
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            这是一个无需登录即可查看的完整样例，展示 AI 短剧生成最终会沉淀出哪些结构化资产：剧情、角色、分镜、图片状态和视频结果。
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge key={category} variant="outline">{category}</Badge>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button data-analytics-event="cta_click" data-analytics-label="showcase_hero_generate" render={<Link href="/dashboard/studio?template=drama" />} size="lg">
              用体验 Credits 生成
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button data-analytics-event="cta_click" data-analytics-label="showcase_templates" render={<Link href="/dashboard/templates" />} size="lg" variant="outline">
              查看更多模板
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>剧情结构</CardTitle>
            <CardDescription>都市创业 / 快节奏 / 90 秒竖屏短剧</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm leading-6 text-muted-foreground">
              三人内容团队连续断更，选题、脚本、素材和发布协作全部卡住。主理人林舟决定用 AI 工作流重建生产线：从一个主题生成剧情冲突、角色关系、分镜、图片和视频任务。最后团队拿到第一个可发布版本，也确认了产品化生产的商业价值。
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {["痛点开场", "AI 介入", "资产交付"].map((item) => (
                <div className="rounded-xl bg-muted p-4 text-sm font-medium" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-semibold tracking-tight">生成流程展示</h2>
          <p className="max-w-2xl text-muted-foreground">把用户从“我有一个想法”带到“我有一组可生产资产”。</p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {generationFlow.map((item, index) => (
            <Card key={item.step}>
              <CardHeader>
                <Badge className="w-fit" variant="secondary">Step {index + 1}</Badge>
                <CardTitle>{item.step}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-semibold tracking-tight">角色结果</h2>
            <p className="max-w-2xl text-muted-foreground">角色设定可直接服务后续图片、视频和连续剧集生产。</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {characters.map((character) => (
              <Card key={character.name}>
                <CardHeader>
                  <UserRoundIcon />
                  <CardTitle>{character.name}</CardTitle>
                  <CardDescription>{character.role}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
                  <p>{character.personality}</p>
                  <p>视觉提示：{character.visual}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl font-semibold tracking-tight">分镜、图片和视频结果</h2>
          <p className="max-w-2xl text-muted-foreground">Showcase 用静态 Demo 展示最终形态，新用户无需等待真实 Provider 返回。</p>
        </div>
        <div className="mt-8 grid gap-4">
          {scenes.map((scene) => (
            <Card key={scene.number}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Scene {scene.number} · {scene.title}</CardTitle>
                    <CardDescription>{scene.camera}</CardDescription>
                  </div>
                  <Badge variant="secondary">Demo</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-[1fr_16rem_16rem]">
                <p className="text-sm leading-6 text-muted-foreground">{scene.description}</p>
                <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                  <ImageIcon className="mr-2" />
                  图片：{scene.image}
                </div>
                <div className="flex aspect-video items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground">
                  <FilmIcon className="mr-2" />
                  视频：{scene.video}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-semibold tracking-tight">成果展示</h2>
            <p className="max-w-2xl text-muted-foreground">Demo 用清晰结果帮助访客判断产品是否值得注册试用。</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {outcomes.map((outcome) => (
              <Card key={outcome.label}>
                <CardHeader>
                  <CardTitle>{outcome.label}</CardTitle>
                  <CardDescription>{outcome.value}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <ClapperboardIcon />
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">现在用你的主题生成第一部短剧</h2>
            <p className="mt-2 max-w-2xl text-primary-foreground/75">
              进入 Studio 后选择“短剧创作”，系统会自动推荐模板，并用体验 Credits 创建首次生成任务。
            </p>
          </div>
          <Button data-analytics-event="cta_click" data-analytics-label="showcase_bottom_generate" render={<Link href="/dashboard/studio?template=drama" />} variant="secondary">
            免费生成
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </div>
      </section>
    </main>
  );
}
