"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircleIcon,
  ArrowLeftIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ClockIcon,
  CopyIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrackPageView } from "@/components/product-event-tracker";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type TaskStatus = "pending" | "running" | "generating" | "completed" | "failed";

type Task = {
  id: string;
  topic: string;
  brief?: string | null;
  taskType?: string | null;
  status: TaskStatus;
  title?: string | null;
  script?: string | null;
  storyboard?: string[] | null;
  assets?: Array<{ id: string; type: string; name: string; url: string; provider: string }>;
  error?: string | null;
  creditsCharged?: number | null;
  createdAt: string;
  updatedAt: string;
};

const pipeline = [
  { key: "pending", label: "步骤 1", title: "需求已接收", description: "系统已收到你的创作需求，并准备生成任务。" },
  { key: "running", label: "步骤 2", title: "AI 正在生成", description: "AI 正在生成结构、脚本、分镜或媒体提示词。" },
  { key: "completed", label: "步骤 3", title: "结果已完成", description: "最终结果已保存，可以查看、复制或复用。" },
] as const;

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function normalizeStatus(status?: string | null): TaskStatus {
  if (status === "completed" || status === "failed" || status === "pending" || status === "running" || status === "generating") return status;
  if (status === "processing") return "generating";
  return "pending";
}

function statusProgress(status: TaskStatus) {
  if (status === "completed") return 100;
  if (status === "failed") return 100;
  if (status === "running" || status === "generating") return 68;
  return 24;
}

function statusVariant(status: TaskStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "running" || status === "generating") return "secondary";
  return "outline";
}

function statusLabel(status: TaskStatus | string) {
  const labels: Record<string, string> = {
    pending: "等待中",
    running: "生成中",
    generating: "生成中",
    completed: "已完成",
    failed: "失败",
  };
  return labels[status] ?? status;
}

function pipelineState(step: (typeof pipeline)[number], status: TaskStatus) {
  if (status === "failed") return step.key === "completed" ? "failed" : "done";
  if (status === "completed") return "done";
  if ((status === "running" || status === "generating") && step.key === "pending") return "done";
  if ((status === "running" || status === "generating") && step.key === "running") return "active";
  if (status === "pending" && step.key === "pending") return "active";
  return "waiting";
}

function iconForAsset(type: string) {
  if (type.includes("image")) return ImageIcon;
  if (type.includes("video")) return VideoIcon;
  return FileTextIcon;
}

function isImagePreview(url: string) {
  return url.endsWith(".svg") || url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".webp");
}

export default function PublicTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/tasks", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      setMessage("请先登录，再继续你的 AI 创作流程。");
      return;
    }
    const payload = (await response.json()) as { tasks?: Task[] };
    const found = (payload.tasks ?? []).find((item) => item.id === id);
    if (!found) {
      setMessage("没有在你的工作台找到这个任务。你可以创建一个新任务，或从工作台打开最近任务。");
      return;
    }
    setTask({ ...found, status: normalizeStatus(found.status) });
    setMessage("");
  }, [id]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [load]);

  const progress = statusProgress(task?.status ?? "pending");
  const generatedText = useMemo(() => task?.script ?? task?.storyboard?.join("\n") ?? "", [task]);
  const timeline = useMemo(() => {
    const status = task?.status ?? "pending";
    return [
      { label: "创作需求", detail: task?.topic ?? "等待你的输入", done: Boolean(task), active: status === "pending" },
      { label: "AI 执行", detail: status === "failed" ? "AI 生成遇到问题，任务已停止" : "执行提示词、工作流和 Provider 调用", done: status === "completed" || status === "failed", active: status === "running" || status === "generating" },
      { label: "结果包", detail: task?.assets?.length ? `已关联 ${task.assets.length} 个资产记录` : "文本和素材会在生成完成后显示", done: status === "completed", active: false },
    ];
  }, [task]);

  if (!task && message) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <section className="mx-auto flex max-w-3xl flex-col gap-5 rounded-3xl bg-white p-6 shadow-xl shadow-slate-950/5">
          <Badge className="w-fit" variant="secondary">任务工作台</Badge>
          <h1 className="text-3xl font-semibold">打开你的 AI 创作工作台</h1>
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
          <div className="flex flex-wrap gap-2">
            <Button render={<Link href="/dashboard" />}>返回工作台</Button>
            <Button render={<Link href="/create" />} variant="outline">创建新任务</Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050713_0%,#0b1020_34%,#f8fafc_34%,#f8fafc_100%)]">
      <TrackPageView surface="task" properties={{ page: "task_result", taskId: id }} />
      <section className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-white">
          <Button className="border-white/20 text-white hover:bg-white/10" render={<Link href="/dashboard" />} variant="outline">
            <ArrowLeftIcon data-icon="inline-start" />
            工作台
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button className="border-white/20 text-white hover:bg-white/10" onClick={() => void load()} variant="outline">
              刷新
            </Button>
            <Button className="bg-white text-slate-950 hover:bg-white/90" render={<Link href="/create" />}>
              再创作一个
              <SparklesIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>

        <header className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 text-white shadow-2xl shadow-black/25 backdrop-blur-xl md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline">
                {task?.taskType ?? "AI 工作流"}
              </Badge>
              <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">
                {task?.title ?? task?.topic ?? "正在准备你的 AI 结果..."}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                {task?.brief ?? "Automation Factory 正在把你的需求转成可复用的内容资产。"}
              </p>
            </div>
            <Badge variant={statusVariant(task?.status ?? "pending")}>{statusLabel(task?.status ?? "pending")}</Badge>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Progress value={progress} />
              <p className="mt-2 text-xs text-white/55">Creation progress · Live refresh every 3 seconds</p>
            </div>
            <p className="text-3xl font-semibold">{progress}%</p>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {pipeline.map((step) => {
            const state = pipelineState(step, task?.status ?? "pending");
            const Icon = state === "done" ? CheckCircle2Icon : state === "active" ? Loader2Icon : state === "failed" ? AlertCircleIcon : CircleDashedIcon;
            return (
              <Card className={state === "active" ? "border-violet-300 shadow-lg shadow-violet-500/10" : ""} key={step.key}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={state === "done" ? "default" : state === "active" ? "secondary" : state === "failed" ? "destructive" : "outline"}>{step.label}</Badge>
                    <Icon className={state === "active" ? "size-5 animate-spin text-violet-600" : "size-5 text-muted-foreground"} />
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <Card>
            <CardHeader>
              <CardTitle>AI 执行时间线</CardTitle>
              <CardDescription>用简单中文展示这个任务发生了什么。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {timeline.map((item, index) => (
                <div className="grid grid-cols-[auto_1fr] gap-3" key={item.label}>
                  <div className="flex flex-col items-center">
                    <span className={`grid size-9 place-items-center rounded-full ${item.done ? "bg-slate-950 text-white" : item.active ? "bg-violet-100 text-violet-700" : "bg-muted text-muted-foreground"}`}>
                      {item.done ? <CheckCircle2Icon className="size-4" /> : item.active ? <Loader2Icon className="size-4 animate-spin" /> : index + 1}
                    </span>
                    {index < timeline.length - 1 ? <span className="h-10 w-px bg-border" /> : null}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>生成结果</CardTitle>
              <CardDescription>工作流完成后，生成内容会显示在这里。</CardDescription>
              <CardAction>
                {generatedText ? (
                  <Button onClick={() => void navigator.clipboard.writeText(generatedText)} size="sm" variant="outline">
                    <CopyIcon data-icon="inline-start" />
                    复制
                  </Button>
                ) : null}
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <article className="min-h-56 whitespace-pre-wrap rounded-2xl border bg-background p-5 text-sm leading-7">
                {generatedText || task?.error || "AI 正在生成结果。你可以保持页面打开，也可以稍后从工作台回来查看。"}
              </article>
              {task?.storyboard?.length ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {task.storyboard.slice(0, 4).map((scene, index) => (
                    <div className="rounded-xl border bg-muted/40 p-3 text-sm" key={`${index}-${scene}`}>
                      <p className="text-xs text-muted-foreground">分镜 {index + 1}</p>
                      <p className="mt-1 line-clamp-3">{scene}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>关联资产</CardTitle>
              <CardDescription>这个工作流生成的文案、图片、语音或视频资产。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {task?.assets?.map((asset) => {
                const Icon = iconForAsset(asset.type);
                return (
                  <div className="rounded-2xl border bg-background p-4" key={asset.id}>
                    {asset.url && !asset.url.startsWith("mock://") ? (
                      <div className="mb-4 overflow-hidden rounded-xl bg-muted">
                        {asset.type.includes("image") || isImagePreview(asset.url) ? (
                          <Image unoptimized alt={asset.name} className="aspect-video w-full object-cover" height={360} src={asset.url} width={640} />
                        ) : asset.type.includes("video") ? (
                          <video className="aspect-video w-full object-cover" controls preload="metadata" src={asset.url} />
                        ) : null}
                      </div>
                    ) : null}
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-muted">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{asset.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{asset.type} · {asset.provider}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!task?.assets?.length ? (
                <div className="rounded-2xl border bg-muted/40 p-5 text-sm leading-6 text-muted-foreground md:col-span-2">
                  配置的 Provider 返回文件后，媒体资产会显示在这里。文本结果会先显示在上方结果区。
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>下一步</CardTitle>
              <CardDescription>查看资产、继续修改，或创建新的工作流。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">创建时间</span>
                <span>{task?.createdAt ? new Date(task.createdAt).toLocaleString() : "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">消耗 Credits</span>
                <span>{task?.creditsCharged ?? 0}</span>
              </div>
              <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                <ClockIcon className="mr-1 inline size-3" />
                已完成的内容会自动保存到“我的资产”。
              </div>
              <Button render={<Link href="/assets" />}>
                打开我的资产
                <FileTextIcon data-icon="inline-end" />
              </Button>
              <Button render={<Link href="/create" />} variant="outline">
                再创建一个工作流
              </Button>
              <Button render={<Link href="/dashboard/feedback" />} variant="ghost">
                提交反馈
              </Button>
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
