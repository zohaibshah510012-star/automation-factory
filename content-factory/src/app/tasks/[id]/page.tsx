"use client";

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
  { key: "pending", label: "Step 1", title: "Brief accepted", description: "The workflow received your creative request and prepared the task." },
  { key: "running", label: "Step 2", title: "AI Agent working", description: "The agent is generating the structure, script, scenes, or media prompt." },
  { key: "completed", label: "Step 3", title: "Result ready", description: "The final output is saved and ready for review or reuse." },
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

export default function PublicTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/tasks", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      setMessage("Sign in to continue your AI creation workflow.");
      return;
    }
    const payload = (await response.json()) as { tasks?: Task[] };
    const found = (payload.tasks ?? []).find((item) => item.id === id);
    if (!found) {
      setMessage("We could not find this task in your workspace. Start a new workflow or open a recent task from Dashboard.");
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
      { label: "Creator brief", detail: task?.topic ?? "Waiting for your request", done: Boolean(task), active: status === "pending" },
      { label: "AI Agent run", detail: status === "failed" ? "Agent stopped with a recoverable issue" : "Prompt, workflow, and provider execution", done: status === "completed" || status === "failed", active: status === "running" || status === "generating" },
      { label: "Result package", detail: task?.assets?.length ? `${task.assets.length} asset records connected` : "Text and assets appear here when ready", done: status === "completed", active: false },
    ];
  }, [task]);

  if (!task && message) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <section className="mx-auto flex max-w-3xl flex-col gap-5 rounded-3xl bg-white p-6 shadow-xl shadow-slate-950/5">
          <Badge className="w-fit" variant="secondary">Task workspace</Badge>
          <h1 className="text-3xl font-semibold">Open your AI creation workspace</h1>
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
          <div className="flex flex-wrap gap-2">
            <Button render={<Link href="/dashboard" />}>Go to Dashboard</Button>
            <Button render={<Link href="/create" />} variant="outline">Start a new workflow</Button>
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
            Dashboard
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button className="border-white/20 text-white hover:bg-white/10" onClick={() => void load()} variant="outline">
              Refresh
            </Button>
            <Button className="bg-white text-slate-950 hover:bg-white/90" render={<Link href="/create" />}>
              Create another
              <SparklesIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>

        <header className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 text-white shadow-2xl shadow-black/25 backdrop-blur-xl md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline">
                {task?.taskType ?? "AI workflow"}
              </Badge>
              <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">
                {task?.title ?? task?.topic ?? "Preparing your first AI result..."}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                {task?.brief ?? "Automation Factory is turning your brief into a reusable creative asset."}
              </p>
            </div>
            <Badge variant={statusVariant(task?.status ?? "pending")}>{task?.status ?? "pending"}</Badge>
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
              <CardTitle>AI Agent Timeline</CardTitle>
              <CardDescription>Plain-English view of what happened during this workflow.</CardDescription>
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
              <CardTitle>Result showcase</CardTitle>
              <CardDescription>Your generated result appears here as soon as the workflow completes.</CardDescription>
              <CardAction>
                {generatedText ? (
                  <Button onClick={() => void navigator.clipboard.writeText(generatedText)} size="sm" variant="outline">
                    <CopyIcon data-icon="inline-start" />
                    Copy
                  </Button>
                ) : null}
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <article className="min-h-56 whitespace-pre-wrap rounded-2xl border bg-background p-5 text-sm leading-7">
                {generatedText || task?.error || "Your AI result is being generated. You can keep this page open or return from Dashboard later."}
              </article>
              {task?.storyboard?.length ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {task.storyboard.slice(0, 4).map((scene, index) => (
                    <div className="rounded-xl border bg-muted/40 p-3 text-sm" key={`${index}-${scene}`}>
                      <p className="text-xs text-muted-foreground">Scene {index + 1}</p>
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
              <CardTitle>Assets connected to this task</CardTitle>
              <CardDescription>Text, image, voice, or video assets generated by the workflow.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {task?.assets?.map((asset) => {
                const Icon = iconForAsset(asset.type);
                return (
                  <div className="rounded-2xl border bg-background p-4" key={asset.id}>
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
                  Media assets will appear here when the configured provider returns files. Text results are already available in the showcase above.
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next best action</CardTitle>
              <CardDescription>Move from first value to reuse, iteration, or a new workflow.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Created</span>
                <span>{task?.createdAt ? new Date(task.createdAt).toLocaleString() : "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Credits used</span>
                <span>{task?.creditsCharged ?? 0}</span>
              </div>
              <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                <ClockIcon className="mr-1 inline size-3" />
                Completed work is saved to My Assets automatically.
              </div>
              <Button render={<Link href="/assets" />}>
                Open My Assets
                <FileTextIcon data-icon="inline-end" />
              </Button>
              <Button render={<Link href="/create" />} variant="outline">
                Create another workflow
              </Button>
              <Button render={<Link href="/dashboard/feedback" />} variant="ghost">
                Share feedback
              </Button>
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
