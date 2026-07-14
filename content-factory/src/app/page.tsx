"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  Clock3Icon,
  FilmIcon,
  FolderOpenIcon,
  LayoutDashboardIcon,
  LoaderCircleIcon,
  PlusIcon,
  SparklesIcon,
  WandSparklesIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ContentTask, TaskStatus } from "@/lib/types";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboardIcon },
  { label: "Content Tasks", icon: SparklesIcon },
  { label: "Assets", icon: FolderOpenIcon },
  { label: "Results", icon: FilmIcon },
];

const statusCopy: Record<TaskStatus, string> = {
  pending: "等待生成",
  generating: "正在生成",
  completed: "已完成",
  failed: "生成失败",
};

function statusVariant(status: TaskStatus) {
  if (status === "completed") return "secondary";
  if (status === "failed") return "destructive";
  if (status === "generating") return "outline";
  return "ghost";
}

function statusIcon(status: TaskStatus) {
  if (status === "completed") return <CheckCircle2Icon data-icon="inline-start" />;
  if (status === "generating") return <LoaderCircleIcon data-icon="inline-start" />;
  return <Clock3Icon data-icon="inline-start" />;
}

export default function Home() {
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [topic, setTopic] = useState("");
  const [brief, setBrief] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const refreshTasks = useCallback(async () => {
    const response = await fetch("/api/tasks", { cache: "no-store" });
    if (!response.ok) return;
    const data = (await response.json()) as { tasks: ContentTask[] };
    setTasks(data.tasks);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void refreshTasks(), 0);
    const interval = window.setInterval(() => void refreshTasks(), 1800);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [refreshTasks]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      active: tasks.filter((task) => task.status === "generating").length,
      ready: tasks.filter((task) => task.status === "completed").length,
      assets: tasks.reduce((count, task) => count + task.assets.length, 0),
    }),
    [tasks],
  );

  const latestResult = useMemo(
    () => tasks.find((task) => task.status === "completed" && task.title && task.script && task.storyboard),
    [tasks],
  );

  async function createTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!topic.trim()) return;

    setIsCreating(true);
    setError("");
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), brief: brief.trim() }),
      });
      if (!response.ok) throw new Error("任务创建失败，请重试。");

      setTopic("");
      setBrief("");
      await refreshTasks();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "任务创建失败。");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <aside className="hidden w-60 shrink-0 border-r bg-sidebar px-5 py-6 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <WandSparklesIcon aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">Content Factory</p>
              <p className="text-xs text-muted-foreground">MVP workspace</p>
            </div>
          </div>
          <nav className="mt-10 flex flex-col gap-1">
            {navItems.map(({ label, icon: Icon }, index) => (
              <Button
                className="justify-start"
                key={label}
                variant={index === 0 ? "secondary" : "ghost"}
              >
                <Icon data-icon="inline-start" />
                {label}
              </Button>
            ))}
          </nav>
          <div className="mt-auto rounded-xl border bg-card p-4">
            <p className="text-sm font-medium">MVP 生成引擎</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              当前使用本地演示 Provider，可随时替换为正式模型服务。
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex min-h-18 items-center justify-between border-b px-5 py-4 sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <WandSparklesIcon aria-hidden="true" />
              </div>
              <span className="text-sm font-semibold">Content Factory</span>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium">内容自动化控制台</p>
              <p className="text-xs text-muted-foreground">主题 → 内容包 → 视频成片</p>
            </div>
            <Badge variant="outline">MVP / 本地演示模式</Badge>
          </header>

          <div className="flex flex-1 flex-col gap-7 p-5 sm:p-8">
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,.8fr)]">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  把一个主题变成一条完整内容
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  自动生成标题、短视频脚本、分镜、图片素材和配音任务；视频渲染接口已就绪，后续可直接接入 Remotion 或云渲染。
                </p>
              </div>
              <Card className="border-primary/20 bg-secondary/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">本轮生成内容</CardTitle>
                  <CardDescription>适合 30–60 秒中文口播短视频</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {["标题", "脚本", "分镜", "图片素材", "配音"].map((item) => (
                      <Badge key={item} variant="outline">{item}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardHeader>
                <CardTitle>新建内容任务</CardTitle>
                <CardDescription>填写主题后自动启动内容生产流程。</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="flex flex-col gap-4" onSubmit={createTask}>
                  <Input
                    aria-label="内容主题"
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="例如：为什么 AI 自动化能帮小团队提升效率？"
                    value={topic}
                  />
                  <Textarea
                    aria-label="补充要求"
                    className="min-h-22 resize-none"
                    onChange={(event) => setBrief(event.target.value)}
                    placeholder="补充目标受众、语气或产品卖点（可选）"
                    value={brief}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">生成会在后台进行，可继续创建其他任务。</p>
                    <Button disabled={isCreating || !topic.trim()} type="submit">
                      <PlusIcon data-icon="inline-start" />
                      {isCreating ? "正在创建…" : "开始生成"}
                    </Button>
                  </div>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                </form>
              </CardContent>
            </Card>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["内容任务", stats.total, SparklesIcon],
                ["生成中", stats.active, LoaderCircleIcon],
                ["可用结果", stats.ready, CheckCircle2Icon],
                ["素材资产", stats.assets, FolderOpenIcon],
              ].map(([label, value, Icon]) => {
                const StatIcon = Icon as typeof SparklesIcon;
                return (
                  <Card key={label as string}>
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <p className="text-sm text-muted-foreground">{label as string}</p>
                        <p className="mt-1 text-2xl font-semibold">{value as number}</p>
                      </div>
                      <StatIcon className="text-muted-foreground" aria-hidden="true" />
                    </CardContent>
                  </Card>
                );
              })}
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(19rem,.65fr)]">
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Content Tasks</CardTitle>
                    <CardDescription>实时查看内容生产状态。</CardDescription>
                  </div>
                  <Button onClick={() => void refreshTasks()} size="sm" variant="outline">刷新</Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>主题</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="hidden sm:table-cell">更新时间</TableHead>
                        <TableHead className="text-right">结果</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="max-w-52">
                            <p className="truncate font-medium">{task.topic}</p>
                            <p className="mt-1 truncate text-xs text-muted-foreground">{task.status === "failed" ? task.error : (task.title ?? "正在创建内容包")}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(task.status)}>
                              {statusIcon(task.status)}
                              {statusCopy[task.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground sm:table-cell">
                            {new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date(task.updatedAt))}
                          </TableCell>
                          <TableCell className="text-right">
                            {task.status === "completed" ? (
                              <Button size="sm" variant="ghost">
                                查看
                                <ArrowUpRightIcon data-icon="inline-end" />
                              </Button>
                            ) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {latestResult ? (
                    <div className="mt-6 flex flex-col gap-4 rounded-lg bg-muted/40 p-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">LATEST CONTENT PACK</p>
                        <h3 className="mt-1 text-base font-semibold">{latestResult.title}</h3>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{latestResult.script}</p>
                      <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-muted-foreground">
                        {latestResult.storyboard?.map((scene) => <li key={scene}>{scene}</li>)}
                      </ol>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Generation Pipeline</CardTitle>
                  <CardDescription>当前任务按固定且可追踪的流程执行。</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  {[
                    ["选题与标题", "文本 Provider"],
                    ["脚本与分镜", "文本 Provider"],
                    ["图片素材", "图片 Provider"],
                    ["配音任务", "语音 Provider"],
                    ["视频成片", "Renderer 接口预留"],
                  ].map(([label, provider], index) => (
                    <div className="flex gap-3" key={label}>
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{label}</p>
                          <span className="text-xs text-muted-foreground">{provider}</span>
                        </div>
                        <Progress className="mt-2" value={index < 4 ? 100 : 12} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
