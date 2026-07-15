"use client";

import Image from "next/image";
import { ImageIcon, RefreshCwIcon, SendIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ImageTask = {
  id: string;
  prompt: string;
  provider: string | null;
  model: string | null;
  status: "pending" | "running" | "completed" | "failed";
  resultUrl: string | null;
  error: string | null;
  createdAt: string;
};

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

export default function ImagesPage() {
  const [tasks, setTasks] = useState<ImageTask[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/images", { headers: await authHeaders(), cache: "no-store" });
    if (response.ok) setTasks((await response.json()).tasks ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!prompt.trim()) return;
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/images", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (response.ok) {
      setPrompt("");
      setMessage("Image task created.");
      setTimeout(() => void load(), 800);
    } else {
      setMessage((await response.json()).error ?? "Unable to create image task.");
    }
    setLoading(false);
  }

  async function regenerate(id: string) {
    const response = await fetch(`/api/images/${id}/regenerate`, { method: "POST", headers: await authHeaders() });
    if (response.ok) {
      setMessage("New image task created.");
      setTimeout(() => void load(), 800);
    } else {
      setMessage("Unable to regenerate image.");
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <header>
        <p className="text-sm text-muted-foreground">Multimodal Content Engine</p>
        <h1 className="text-3xl font-semibold">Image Generation</h1>
        <p className="mt-2 text-sm text-muted-foreground">Create image tasks with the configured server-side image provider.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Create image task</CardTitle>
          <CardDescription>Provider secrets stay server-side and are never exposed to the browser.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Example: cinematic product poster, dark background, studio lighting" />
          <Button disabled={loading || !prompt.trim()} onClick={() => void create()}>
            <SendIcon data-icon="inline-start" />
            {loading ? "Creating..." : "Generate image"}
          </Button>
        </CardContent>
      </Card>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <CardTitle className="line-clamp-2">{task.prompt}</CardTitle>
              <CardDescription>{new Date(task.createdAt).toLocaleString("zh-CN")}</CardDescription>
              <CardAction><Badge variant={task.status === "failed" ? "destructive" : "secondary"}>{task.status}</Badge></CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {task.resultUrl && !task.resultUrl.startsWith("mock://") ? (
                <Image unoptimized className="aspect-square rounded-lg object-cover" src={task.resultUrl} alt={task.prompt} width={512} height={512} />
              ) : (
                <div className="flex aspect-square items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
                  <ImageIcon className="mr-2 size-4" />
                  {task.status === "completed" ? "Image saved" : "Waiting for image result"}
                </div>
              )}
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>{task.provider ?? "Waiting for provider"}{task.model ? ` · ${task.model}` : ""}</span>
                {task.error ? <span className="text-destructive">{task.error}</span> : null}
              </div>
              <Button size="sm" variant="outline" onClick={() => void regenerate(task.id)}>
                <RefreshCwIcon data-icon="inline-start" />
                Regenerate
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
      {!tasks.length ? <Card><CardContent className="py-12 text-center text-muted-foreground">No image tasks yet.</CardContent></Card> : null}
    </main>
  );
}
