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
  FileTextIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  { key: "pending", label: "Step 1", title: "Task queued", description: "Your request has been accepted and prepared for the AI workflow." },
  { key: "running", label: "Step 2", title: "AI agents generating", description: "The provider and agent pipeline are creating scripts, scenes, or media assets." },
  { key: "completed", label: "Step 3", title: "Result saved", description: "Completed output is saved to your task and asset workspace." },
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
  if (status === "running" || status === "generating") return 66;
  return 18;
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

export default function PublicTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/tasks", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      setMessage("Sign in to view this task.");
      return;
    }
    const payload = (await response.json()) as { tasks?: Task[] };
    const found = (payload.tasks ?? []).find((item) => item.id === id);
    if (!found) {
      setMessage("Task not found or you do not have access.");
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
  const generatedText = useMemo(() => task?.script ?? task?.storyboard?.join("\n") ?? task?.error ?? "The AI pipeline is still working on this result.", [task]);

  return (
    <main className="min-h-screen bg-slate-50">
      <TrackPageView surface="task" properties={{ page: "task_detail", taskId: id }} />
      <section className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button render={<Link href="/dashboard" />} variant="outline">
            <ArrowLeftIcon data-icon="inline-start" />
            Dashboard
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void load()} variant="outline">
              Refresh
            </Button>
            <Button render={<Link href="/create" />}>
              Create another
              <SparklesIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>

        <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline">
                {task?.taskType ?? "AI task"}
              </Badge>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
                {task?.title ?? task?.topic ?? "Loading task..."}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                {task?.brief ?? "Watch the AI production pipeline move from queued work to generated output."}
              </p>
            </div>
            <Badge variant={statusVariant(task?.status ?? "pending")}>{task?.status ?? "pending"}</Badge>
          </div>
          <div className="mt-6">
            <Progress value={progress} />
            <p className="mt-2 text-xs text-white/55">Live status refreshes every 3 seconds.</p>
          </div>
        </header>

        {message ? <p className="rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}

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

        <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Generated result</CardTitle>
              <CardDescription>Text output, storyboard, or task error from the existing AI pipeline.</CardDescription>
            </CardHeader>
            <CardContent>
              <article className="min-h-48 whitespace-pre-wrap rounded-2xl border bg-background p-5 text-sm leading-7">
                {generatedText}
              </article>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task metadata</CardTitle>
              <CardDescription>Operational details for this generation.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Created</span>
                <span>{task?.createdAt ? new Date(task.createdAt).toLocaleString() : "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Updated</span>
                <span>{task?.updatedAt ? new Date(task.updatedAt).toLocaleString() : "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Credits</span>
                <span>{task?.creditsCharged ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Assets</span>
                <span>{task?.assets?.length ?? 0}</span>
              </div>
              <div className="mt-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                <ClockIcon className="mr-1 inline size-3" />
                Completed work appears automatically in My Assets.
              </div>
              {task?.status === "completed" ? (
                <Button render={<Link href="/assets" />}>
                  Open assets
                  <FileTextIcon data-icon="inline-end" />
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
