"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRightIcon, FileTextIcon, ImageIcon, SearchIcon, VideoIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TrackPageView } from "@/components/product-event-tracker";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ContentAsset = {
  id: string;
  type: string;
  title: string;
  topic: string;
  status: string;
  createdAt: string;
  creditsCharged: number;
  content: { script: string | null; storyboard?: string[] };
};

type ImageTask = {
  id: string;
  prompt: string;
  status: string;
  resultUrl: string | null;
  provider: string | null;
  createdAt: string;
};

type VideoTask = {
  id: string;
  prompt: string;
  status: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  provider: string | null;
  createdAt: string;
};

type UnifiedAsset = {
  id: string;
  kind: "text" | "image" | "video";
  title: string;
  description: string;
  status: string;
  url: string | null;
  provider: string | null;
  createdAt: string;
  href: string;
};

const filters: Array<"all" | UnifiedAsset["kind"]> = ["all", "text", "image", "video"];

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function iconFor(kind: UnifiedAsset["kind"]) {
  if (kind === "image") return ImageIcon;
  if (kind === "video") return VideoIcon;
  return FileTextIcon;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "running" || status === "processing") return "secondary";
  return "outline";
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<UnifiedAsset[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const headers = await authHeaders();
    const [contentResponse, imageResponse, videoResponse] = await Promise.all([
      fetch("/api/content", { headers, cache: "no-store" }),
      fetch("/api/images", { headers, cache: "no-store" }),
      fetch("/api/videos", { headers, cache: "no-store" }),
    ]);

    const contentPayload = contentResponse.ok ? await contentResponse.json() as { assets?: ContentAsset[] } : { assets: [] };
    const imagePayload = imageResponse.ok ? await imageResponse.json() as { tasks?: ImageTask[] } : { tasks: [] };
    const videoPayload = videoResponse.ok ? await videoResponse.json() as { tasks?: VideoTask[] } : { tasks: [] };

    const textAssets: UnifiedAsset[] = (contentPayload.assets ?? [])
      .filter((asset) => asset.type !== "image" && asset.type !== "video")
      .map((asset) => ({
        id: asset.id,
        kind: "text",
        title: asset.title,
        description: asset.content.script ?? asset.topic,
        status: asset.status,
        url: null,
        provider: null,
        createdAt: asset.createdAt,
        href: `/dashboard/content/${asset.id}`,
      }));

    const imageAssets: UnifiedAsset[] = (imagePayload.tasks ?? []).map((task) => ({
      id: task.id,
      kind: "image",
      title: task.prompt,
      description: task.provider ?? "Image generation task",
      status: task.status,
      url: task.resultUrl,
      provider: task.provider,
      createdAt: task.createdAt,
      href: `/tasks/${task.id}`,
    }));

    const videoAssets: UnifiedAsset[] = (videoPayload.tasks ?? []).map((task) => ({
      id: task.id,
      kind: "video",
      title: task.prompt,
      description: task.provider ?? "Video generation task",
      status: task.status,
      url: task.videoUrl ?? task.thumbnailUrl,
      provider: task.provider,
      createdAt: task.createdAt,
      href: `/dashboard/videos/${task.id}`,
    }));

    setAssets([...textAssets, ...imageAssets, ...videoAssets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    if (!contentResponse.ok && !imageResponse.ok && !videoResponse.ok) setMessage("Open the Create Center to generate your first asset.");
    else setMessage("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesFilter = filter === "all" || asset.kind === filter;
      const matchesQuery = !search || `${asset.title} ${asset.description} ${asset.provider ?? ""}`.toLowerCase().includes(search);
      return matchesFilter && matchesQuery;
    });
  }, [assets, filter, query]);

  return (
    <main className="min-h-screen bg-slate-50">
      <TrackPageView surface="assets" properties={{ page: "asset_library" }} />
      <section className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <header className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl shadow-slate-950/20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline">
                My Assets
              </Badge>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">Your AI production library.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                Review generated text, image, and video results from the existing Automation Factory task pipeline.
              </p>
            </div>
            <Button className="bg-white text-slate-950 hover:bg-white/90" render={<Link href="/create" />}>
              Create asset
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </header>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Search assets, prompts, providers..." value={query} />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => (
                <Button key={item} onClick={() => setFilter(item)} variant={filter === item ? "default" : "outline"}>
                  {item}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {message ? <p className="rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">{message}</p> : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((asset) => {
            const Icon = iconFor(asset.kind);
            return (
              <Card className="overflow-hidden bg-white/95 shadow-xl shadow-slate-950/5" key={`${asset.kind}-${asset.id}`}>
                <div className="flex aspect-video items-center justify-center bg-muted">
                  {asset.kind === "image" && asset.url && !asset.url.startsWith("mock://") ? (
                    <Image unoptimized alt={asset.title} className="h-full w-full object-cover" height={360} src={asset.url} width={640} />
                  ) : asset.kind === "video" && asset.url && !asset.url.startsWith("mock://") ? (
                    <video className="h-full w-full object-cover" controls preload="metadata" src={asset.url} />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Icon className="size-8" />
                      <span className="text-sm">{asset.kind} asset</span>
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="line-clamp-2">{asset.title}</CardTitle>
                      <CardDescription>{new Date(asset.createdAt).toLocaleString()}</CardDescription>
                    </div>
                    <Badge variant={statusVariant(asset.status)}>{asset.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{asset.description}</p>
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline">{asset.kind}</Badge>
                    <Button render={<Link href={asset.href} />} size="sm" variant="outline">
                      Open
                      <ArrowRightIcon data-icon="inline-end" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        {!visible.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No matching assets yet. Try a different filter or create your first asset from the Create Center.
            </CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
