"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon, CheckCircle2Icon, ClockIcon, ImageIcon, MessageSquareTextIcon, RefreshCwIcon, VideoIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Scene = {
  id: string;
  scene_number: number;
  content: unknown;
  status: string;
  image: { status: string; url: string | null } | null;
  video: { status: string; url: string | null; thumbnail: string | null } | null;
};

type DramaAsset = {
  drama: { title: string; status: string; story: unknown; characters: unknown };
  progress: { completed: number; total: number; failed: number };
  scenes: Scene[];
};

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function textFrom(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function sceneDescription(scene: Scene) {
  const content = scene.content;
  if (!content || typeof content !== "object" || Array.isArray(content)) return textFrom(content);
  const record = content as Record<string, unknown>;
  const source = record.source;
  if (typeof source === "string") return source;
  if (source && typeof source === "object") {
    const sourceRecord = source as Record<string, unknown>;
    return [sourceRecord.title, sourceRecord.description, sourceRecord.synopsis, sourceRecord.conflict, sourceRecord.camera]
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .join(" · ");
  }
  return textFrom(content);
}

function promptFrom(scene: Scene, key: "image_prompt" | "video_prompt") {
  const content = scene.content;
  if (!content || typeof content !== "object" || Array.isArray(content)) return "";
  const value = (content as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function isImagePreview(url: string) {
  return url.endsWith(".svg") || url.endsWith(".png") || url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".webp");
}

function mediaStatusVariant(status?: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "running" || status === "processing") return "secondary";
  return "outline";
}

export default function StudioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [drama, setDrama] = useState<DramaAsset | null>(null);
  const [message, setMessage] = useState("Preparing your short drama package...");

  const load = useCallback(async () => {
    const response = await fetch(`/api/dramas/${id}`, { headers: await authHeaders(), cache: "no-store" });
    if (response.ok) {
      setDrama((await response.json()) as DramaAsset);
      setMessage("");
      return;
    }
    setMessage("Your short drama task is still preparing. This page will refresh automatically.");
  }, [id]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(interval);
  }, [load]);

  const progressValue = useMemo(() => {
    if (!drama?.progress.total) return 12;
    return Math.round((drama.progress.completed / drama.progress.total) * 100);
  }, [drama]);

  if (!drama) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-xl shadow-slate-950/5">
          <Badge variant="secondary">Short Drama MVP</Badge>
          <h1 className="mt-4 text-3xl font-semibold">Building your AI short drama...</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{message}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button onClick={() => void load()} variant="outline">
              <RefreshCwIcon data-icon="inline-start" />
              Refresh
            </Button>
            <Button render={<Link href="/create" />}>Create another</Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050713_0%,#0b1020_32%,#f8fafc_32%,#f8fafc_100%)]">
      <section className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-white">
          <Button className="border-white/20 text-white hover:bg-white/10" render={<Link href="/create" />} variant="outline">
            <ArrowLeftIcon data-icon="inline-start" />
            Create Center
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button className="border-white/20 text-white hover:bg-white/10" onClick={() => void load()} variant="outline">
              <RefreshCwIcon data-icon="inline-start" />
              Refresh
            </Button>
            <Button className="bg-white text-slate-950 hover:bg-white/90" render={<Link href="/assets" />}>Open Assets</Button>
          </div>
        </div>

        <header className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-6 text-white shadow-2xl shadow-black/25 backdrop-blur-xl md:p-8">
          <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline">Short Drama Result</Badge>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">{drama.drama.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                Story, characters, scene prompts, generated images, and video preview assets are collected in one production package.
              </p>
            </div>
            <Badge variant={mediaStatusVariant(drama.drama.status)}>{drama.drama.status}</Badge>
          </div>
          <div className="mt-7 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Progress value={progressValue} />
              <p className="mt-2 text-xs text-white/55">
                {drama.progress.completed}/{drama.progress.total || 1} scenes ready · {drama.progress.failed} failed
              </p>
            </div>
            <p className="text-3xl font-semibold">{progressValue}%</p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Story</CardTitle>
              <CardDescription>The core narrative generated from the user brief, product, or creative idea.</CardDescription>
            </CardHeader>
            <CardContent>
              <article className="whitespace-pre-wrap rounded-2xl border bg-background p-5 text-sm leading-7">{textFrom(drama.drama.story)}</article>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Characters</CardTitle>
              <CardDescription>Character setup and visual direction for consistent downstream assets.</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border bg-muted/30 p-5 text-sm leading-7">{textFrom(drama.drama.characters)}</pre>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5">
          {drama.scenes.map((scene) => (
            <Card className="overflow-hidden" key={scene.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Scene {scene.scene_number}</CardTitle>
                    <CardDescription>{sceneDescription(scene) || "Scene details are being prepared."}</CardDescription>
                  </div>
                  <Badge variant={mediaStatusVariant(scene.status)}>{scene.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <ImageIcon className="size-4" />
                    Generated image
                    <Badge variant={mediaStatusVariant(scene.image?.status)}>{scene.image?.status ?? "pending"}</Badge>
                  </div>
                  {scene.image?.url ? (
                    <Image unoptimized alt={`Scene ${scene.scene_number} image`} className="aspect-video w-full rounded-2xl object-cover" height={720} src={scene.image.url} width={1280} />
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">
                      <ClockIcon className="mr-2 size-4" />
                      Waiting for image provider
                    </div>
                  )}
                  <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{promptFrom(scene, "image_prompt")}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <VideoIcon className="size-4" />
                    Generated video
                    <Badge variant={mediaStatusVariant(scene.video?.status)}>{scene.video?.status ?? "pending"}</Badge>
                  </div>
                  {scene.video?.url ? (
                    isImagePreview(scene.video.url) ? (
                      <Image unoptimized alt={`Scene ${scene.scene_number} video preview`} className="aspect-video w-full rounded-2xl object-cover" height={720} src={scene.video.url} width={1280} />
                    ) : (
                      <video className="aspect-video w-full rounded-2xl object-cover" controls poster={scene.video.thumbnail ?? undefined} src={scene.video.url} />
                    )
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-2xl bg-muted text-sm text-muted-foreground">
                      <ClockIcon className="mr-2 size-4" />
                      Waiting for video provider
                    </div>
                  )}
                  <p className="line-clamp-3 text-xs leading-5 text-muted-foreground">{promptFrom(scene, "video_prompt")}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Next step</CardTitle>
            <CardDescription>Keep the Beta loop moving from generation to assets, feedback, and publishing preparation.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button render={<Link href="/assets" />}>
              View saved assets
              <CheckCircle2Icon data-icon="inline-end" />
            </Button>
            <Button render={<Link href="/dashboard/feedback" />} variant="outline">
              Send feedback
              <MessageSquareTextIcon data-icon="inline-end" />
            </Button>
            <Button render={<Link href="/create" />} variant="ghost">Create another drama</Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
