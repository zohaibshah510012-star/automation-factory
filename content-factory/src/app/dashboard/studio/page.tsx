"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClapperboardIcon,
  FileTextIcon,
  FilmIcon,
  ImageIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type ProductTemplate = {
  id: "drama" | "content" | "image" | "video";
  title: string;
  description: string;
  icon: typeof ClapperboardIcon;
  href: string;
  taskType?: "drama" | "short_video_script";
};

const productTemplates: ProductTemplate[] = [
  {
    id: "drama",
    title: "AI 短剧生成",
    description: "生成剧情、角色、分镜，并自动衔接图片与视频任务。",
    icon: ClapperboardIcon,
    href: "/dashboard/studio",
    taskType: "drama",
  },
  {
    id: "content",
    title: "内容生成",
    description: "生成口播、营销、社媒和电商内容草稿。",
    icon: FileTextIcon,
    href: "/dashboard/content",
    taskType: "short_video_script",
  },
  {
    id: "image",
    title: "图片生成",
    description: "把创意描述转换成海报、分镜图或产品视觉。",
    icon: ImageIcon,
    href: "/dashboard/images",
  },
  {
    id: "video",
    title: "视频生成",
    description: "把提示词推进到视频生成任务，用于短视频片段。",
    icon: FilmIcon,
    href: "/dashboard/videos",
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
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate["id"]>("drama");
  const [topic, setTopic] = useState("7天起号：AI 如何帮助内容团队稳定产出短剧");
  const [genre, setGenre] = useState("都市创业");
  const [style, setStyle] = useState("快节奏、强冲突、适合竖屏短视频");
  const [duration, setDuration] = useState("90 秒");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentTemplate = useMemo(
    () => productTemplates.find((item) => item.id === selectedTemplate) ?? productTemplates[0],
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
    void loadDramas();
  }, []);

  async function createFirstWork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

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
      : currentTemplate.id === "video"
        ? await fetch("/api/videos", {
          method: "POST",
          headers,
          body: JSON.stringify({ prompt, durationSeconds: 5 }),
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
      setError(payload.error === "INSUFFICIENT_CREDITS" ? "Credits 不足，请先升级套餐或联系管理员。" : payload.error ?? "创建作品失败，请稍后重试。");
      return;
    }

    setMessage(currentTemplate.id === "drama"
      ? "已创建短剧生成任务。系统会继续执行剧情、角色、分镜、图片和视频链路，稍后刷新即可在列表查看。"
      : `已创建${currentTemplate.title}任务，你可以进入对应工作台查看生成状态。`);
    window.setTimeout(() => void loadDramas(), 1200);
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Short Drama Studio</p>
            <h1 className="text-3xl font-semibold tracking-tight">短剧工作室</h1>
          </div>
          <Button render={<Link href="/dashboard/templates" />} variant="outline">
            查看全部模板
          </Button>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          首次使用只需要三步：选择模板，输入主题，生成第一个作品。下方 Demo 会先展示完整成品结构，新用户无需等待真实任务完成也能理解产品价值。
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>首次生成引导</CardTitle>
            <CardDescription>选择一个可购买的 AI 内容模板，系统会调用现有任务流程。</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={createFirstWork}>
              <div className="grid gap-3 sm:grid-cols-2">
                {productTemplates.map((template) => (
                  <button
                    className={`rounded-xl border bg-background p-4 text-left transition hover:bg-muted ${selectedTemplate === template.id ? "ring-2 ring-primary" : ""}`}
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    type="button"
                  >
                    <template.icon />
                    <p className="mt-3 font-medium">{template.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{template.description}</p>
                  </button>
                ))}
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
              <Button disabled={loading || !topic.trim()} type="submit">
                {loading ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
                生成第一个作品
              </Button>
              {currentTemplate.id !== "drama" ? (
                <Button render={<Link href={currentTemplate.href} />} type="button" variant="outline">
                  查看对应工作台
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
              ) : null}
              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
              还没有真实短剧资产。你可以先查看上方 Demo，或立即生成第一个作品。
            </CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
