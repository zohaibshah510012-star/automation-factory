"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RefreshCwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Task>();

  useEffect(() => {
    void (async () => {
      const response = await fetch(`/api/videos/${id}`, { headers: await headers(), cache: "no-store" });
      if (response.ok) setTask(((await response.json()) as { task: Task }).task);
    })();
  }, [id]);

  const regenerate = async () => {
    await fetch(`/api/videos/${id}/regenerate`, { method: "POST", headers: await headers() });
  };

  if (!task) return <main className="p-6 text-sm text-muted-foreground">Loading video task...</main>;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <Link className="text-sm text-primary" href="/dashboard/videos">← Back to videos</Link>
      <header>
        <Badge variant="secondary">{task.status}</Badge>
        <h1 className="mt-3 text-3xl font-semibold">Video task</h1>
        <p className="mt-2 text-muted-foreground">{task.prompt}</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Video result</CardTitle>
        </CardHeader>
        <CardContent>
          {task.videoUrl && !task.videoUrl.startsWith("mock://") ? (
            isImagePreview(task.videoUrl) ? (
              <Image unoptimized alt="Generated video preview" className="aspect-video w-full rounded-lg object-cover" height={720} src={task.videoUrl} width={1280} />
            ) : (
              <video className="w-full rounded-lg" controls poster={task.thumbnailUrl ?? undefined} src={task.videoUrl} />
            )
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-muted-foreground">
              {task.status === "completed" ? "Video asset saved" : "Video generation in progress"}
            </div>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            {task.provider ?? "—"}{task.model ? ` · ${task.model}` : ""}
          </p>
          {task.error ? <p className="mt-2 text-sm text-destructive">{task.error}</p> : null}
          <Button className="mt-4" onClick={() => void regenerate()} variant="outline">
            <RefreshCwIcon data-icon="inline-start" />
            Regenerate
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
