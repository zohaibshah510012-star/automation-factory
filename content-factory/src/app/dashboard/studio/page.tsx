"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClapperboardIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrackPageView, trackProductEvent } from "@/components/product-event-tracker";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Drama = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  progress: { total: number; completed: number; failed: number };
};

type OnboardingTemplate = {
  id: "drama" | "content" | "image";
  title: string;
  description: string;
  recommendation: string;
  icon: typeof ClapperboardIcon;
  href: string;
  taskType?: "drama" | "short_video_script";
};

const onboardingTemplates: OnboardingTemplate[] = [
  {
    id: "drama",
    title: "短剧创作",
    description: "适合想快速验证短剧账号、IP栏目或品牌故事的用户。",
    recommendation: "推荐：先生成 90 秒竖屏短剧，查看剧情、角色、分镜和媒体任务。",
    icon: ClapperboardIcon,
    href: "/dashboard/studio",
    taskType: "drama",
  },
  {
    id: "content",
    title: "内容营销",
    description: "适合营销团队把卖点变成口播、社媒和电商内容。",
    recommendation: "推荐：先生成一条短视频脚本，再沉淀到内容资产中心。",
    icon: FileTextIcon,
    href: "/dashboard/content",
    taskType: "short_video_script",
  },
  {
    id: "image",
    title: "图片生成",
    description: "适合先做封面、分镜图、海报和产品视觉素材。",
    recommendation: "推荐：先把主题改写成一张竖屏短视频封面图。",
    icon: ImageIcon,
    href: "/dashboard/images",
  },
];

const demoScenes = [
  {
    number: 1,
    title: "账号断更危机",
    description: "主创团队发现选题、脚本、素材全部卡在人工协作里。",
    image: "completed",
    video: "completed",
  },
  {
    number: 2,
    title: "AI 工作流介入",
    description: "输入一个主题后，系统生成剧情、人物关系和冲突升级。",
    image: "completed",
    video: "processing",
  },
  {
    number: 3,
    title: "内容资产沉淀",
    description: "分镜、图片、视频和发布任务进入统一资产中心。",
    image: "pending",
    video: "pending",
  },
];

async function authorizationHeader() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function progressText(progress: Drama["progress"]) {
  if (!progress.total) return "等待分镜";
  return `${progress.completed}/${progress.total} 已完成`;
}

export default function StudioPage() {
  const [dramas, setDramas] = useState<Drama[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<OnboardingTemplate["id"]>("drama");
  const [topic, setTopic] = useState("7天起号：AI 如何帮助内容团队稳定产出短剧");
  const [genre, setGenre] = useState("都市创业");
  const [style, setStyle] = useState("快节奏、强冲突、适合竖屏短视频");
  const [duration, setDuration] = useState("90 秒");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [needsUpgrade, setNeedsUpgrade] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentTemplate = useMemo(
    () => onboardingTemplates.find((item) => item.id === selectedTemplate) ?? onboardingTemplates[0],
    [selectedTemplate],
  );

  async function loadDramas() {
    const response = await fetch("/api/dramas", {
      headers: await authorizationHeader(),
      cache: "no-store",
    });
    if (response.ok) {
      setDramas((await response.json()).dramas);
      setError("");
    } else {
      setError("无法加载你的短剧资产，请确认已登录后重试。");
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const template = params.get("template");
    if (template === "content" || template === "image" || template === "drama") {
      setSelectedTemplate(template);
    }
    void loadDramas();
  }, []);

  async function createFirstWork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setNeedsUpgrade(false);

    setLoading(true);
    const brief = `类型：${genre}\n风格：${style}\n目标时长：${duration}\n请按可生产的短视频资产结构输出。`;
    const headers = { ...(await authorizationHeader()), "Content-Type": "application/json" };
    const prompt = `${topic}\n${brief}`;
    const response = currentTemplate.id === "image"
      ? await fetch("/api/images", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt }),
      })
      : await fetch("/api/tasks", {
        method: "POST",
        headers,
        body: JSON.stringify({
          topic,
          brief,
          taskType: currentTemplate.taskType,
        }),
      });
    setLoading(false);

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      const insufficientCredits = payload.error === "INSUFFICIENT_CREDITS" || response.status === 402;
      setNeedsUpgrade(insufficientCredits);
      setError(insufficientCredits ? "体验 Credits 不足。升级套餐后即可继续生成更多内容资产。" : payload.error ?? "创建作品失败，请稍后重试。");
      return;
    }

    setMessage(currentTemplate.id === "drama"
      ? "已创建短剧生成任务。系统会继续执行剧情、角色、分镜、图片和视频链路，稍后刷新即可在列表查看。"
      : `已创建${currentTemplate.title}任务，你可以进入对应工作台查看生成状态。`);
    window.setTimeout(() => void loadDramas(), 1200);
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 p-6">
      <TrackPageView surface="studio" properties={{ page: "studio_onboarding", selectedTemplate }} />
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Growth Onboarding</p>
            <h1 className="text-3xl font-semibold tracking-tight">选择一个目标，生成你的第一个作品</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button render={<Link href="/showcase" />} variant="outline">
              查看 Demo
            </Button>
            <Button render={<Link href="/dashboard/feedback" />} variant="outline">
              提交反馈
            </Button>
            <Button render={<Link href="/dashboard/templates" />} variant="outline">
              全部模板
            </Button>
          </div>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          新用户默认获得体验 Credits。第一次登录后建议先选择一个模板，输入主题，生成第一份可展示的内容资产。
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>首次登录引导</CardTitle>
            <CardDescription>系统会根据你的目标自动推荐模板和生成说明。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={createFirstWork}>
              <div className="grid gap-3 md:grid-cols-3">
                {onboardingTemplates.map((template) => (
                  <button
                    className={`rounded-xl border bg-background p-4 text-left transition hover:bg-muted ${selectedTemplate === template.id ? "ring-2 ring-primary" : ""}`}
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      void trackProductEvent("template_select", { template: template.id, title: template.title }, "studio");
                    }}
                    type="button"
                  >
                    <template.icon />
                    <p className="mt-3 font-medium">{template.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{template.description}</p>
                  </button>
                ))}
              </div>

              <div className="rounded-xl bg-muted p-4 text-sm leading-6 text-muted-foreground">
                {currentTemplate.recommendation}
              </div>

              <div className="grid gap-3">
                <label className="text-sm font-medium" htmlFor="topic">主题</label>
                <Input id="topic" onChange={(event) => setTopic(event.target.value)} value={topic} />
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="genre">类型</label>
                  <Input id="genre" onChange={(event) => setGenre(event.target.value)} value={genre} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="style">风格</label>
                  <Input id="style" onChange={(event) => setStyle(event.target.value)} value={style} />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="duration">时长</label>
                  <Input id="duration" onChange={(event) => setDuration(event.target.value)} value={duration} />
                </div>
              </div>
              <div className="grid gap-3">
                <label className="text-sm font-medium" htmlFor="brief">生成说明</label>
                <Textarea
                  id="brief"
                  onChange={(event) => setStyle(event.target.value)}
                  value={style}
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button disabled={loading || !topic.trim()} type="submit">
                  {loading ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
                  免费生成第一个作品
                </Button>
                {currentTemplate.id !== "drama" ? (
                  <Button render={<Link href={currentTemplate.href} />} type="button" variant="outline">
                    查看对应工作台
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                ) : null}
              </div>
              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
              {error ? (
                <div className="flex flex-col gap-3 rounded-xl border p-4">
                  <p className="text-sm text-destructive">{error}</p>
                  {needsUpgrade ? (
                    <Button render={<Link href="/dashboard/billing" />} variant="outline">
                      升级套餐继续生成
                      <ArrowRightIcon data-icon="inline-end" />
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo 成品预览</CardTitle>
            <CardDescription>示例短剧：《7天起号：AI 内容团队》</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-xl bg-muted p-4">
              <p className="font-medium">剧情简介</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                一个三人内容团队在连续断更后，把选题、脚本、分镜、图片和视频任务交给 AI 工作流，最终用一周时间建立稳定短剧生产节奏。
              </p>
            </div>
            <div className="grid gap-3">
              {demoScenes.map((scene) => (
                <div className="rounded-xl border p-4" key={scene.number}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">Scene {scene.number} · {scene.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{scene.description}</p>
                    </div>
                    <Badge variant="secondary">Demo</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>图片：{scene.image}</span>
                    <span>视频：{scene.video}</span>
                  </div>
                </div>
              ))}
            </div>
            <Button render={<Link href="/showcase" />} variant="outline">
              查看完整 Showcase
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">我的短剧资产</h2>
            <p className="mt-1 text-sm text-muted-foreground">真实生成完成后，会在这里显示标题、状态、进度和详情入口。</p>
          </div>
          <Button onClick={() => void loadDramas()} variant="outline">刷新</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {dramas.map((drama) => (
            <Card key={drama.id}>
              <CardHeader>
                <CardTitle>{drama.title}</CardTitle>
                <CardDescription>{new Date(drama.created_at).toLocaleString("zh-CN")}</CardDescription>
                <CardAction>
                  <Badge variant={drama.status === "failed" ? "destructive" : "secondary"}>{drama.status}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2Icon />
                  {progressText(drama.progress)}
                  {drama.progress.failed ? ` · 失败 ${drama.progress.failed}` : ""}
                </div>
                <Button render={<Link href={`/dashboard/studio/${drama.id}`} />} variant="outline">
                  查看短剧详情
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {!dramas.length && !error ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              还没有真实短剧资产。你可以先查看 Demo，或立即生成第一个作品。
            </CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
