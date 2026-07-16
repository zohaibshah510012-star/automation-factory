"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RefreshCwIcon, SendIcon, VideoIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Task = {
  id: string;
  prompt: string;
  provider: string | null;
  model: string | null;
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
  createdAt: string;
};

async function headers() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function isImagePreview(url: string) {
  return url.endsWith(".svg") || url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".webp");
}

export default function VideosPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/videos", { headers: await headers(), cache: "no-store" });
    if (response.ok) {
      setTasks((await response.json()).tasks ?? []);
      setMessage("");
      return;
    }
    setMessage("Open the Create Center to launch your first video workflow.");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!prompt.trim()) return;
    const response = await fetch("/api/videos", {
      method: "POST",
      headers: { ...(await headers()), "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (response.ok) {
      setPrompt("");
      setMessage("Video workflow created. Result will appear shortly.");
      setTimeout(() => void load(), 800);
    } else {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setMessage(payload.error ?? "Create your video workflow from the Create Center.");
    }
  }

  async function regenerate(id: string) {
    const response = await fetch(`/api/videos/${id}/regenerate`, { method: "POST", headers: await headers() });
    if (response.ok) {
      setMessage("A new video workflow is running.");
      setTimeout(() => void load(), 800);
    } else {
      setMessage("Unable to regenerate. Try creating a new workflow instead.");
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Multimodal Content Engine</p>
        <h1 className="text-3xl font-semibold">Video Generation</h1>
        <p className="text-sm text-muted-foreground">Create video workflows with the configured server-side video provider.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Create video workflow</CardTitle>
          <CardDescription>Describe the scene, hook, or product moment you want to create.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Example: cinematic product promo, vertical, premium lighting, fast hook" />
          <Button disabled={!prompt.trim()} onClick={() => void create()}>
            <SendIcon data-icon="inline-start" />
            Generate video
          </Button>
        </CardContent>
      </Card>

      {message ? <p className="rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <CardTitle className="line-clamp-2">{task.prompt}</CardTitle>
              <CardDescription>{new Date(task.createdAt).toLocaleString("zh-CN")}</CardDescription>
              <CardAction><Badge variant={task.status === "failed" ? "destructive" : "secondary"}>{task.status}</Badge></CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {task.videoUrl && !task.videoUrl.startsWith("mock://") && isImagePreview(task.videoUrl) ? (
                <Image unoptimized alt={task.prompt} className="aspect-video w-full rounded-lg object-cover" height={360} src={task.videoUrl} width={640} />
              ) : task.videoUrl && !task.videoUrl.startsWith("mock://") ? (
                <video className="aspect-video w-full rounded-lg object-cover" controls preload="metadata" src={task.videoUrl} />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <VideoIcon className="mr-2 size-4" />
                  {task.videoUrl ? "Video ready" : "Result will appear here"}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {task.provider ?? "Waiting for provider"}{task.model ? ` · ${task.model}` : ""}
              </p>
              {task.error ? <p className="text-xs text-destructive">{task.error}</p> : null}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" render={<Link href={`/dashboard/videos/${task.id}`}/>}>View detail</Button>
                <Button variant="ghost" size="sm" onClick={() => void regenerate(task.id)}>
                  <RefreshCwIcon data-icon="inline-start" />
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {!tasks.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Create your first video workflow from the Create Center.
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
