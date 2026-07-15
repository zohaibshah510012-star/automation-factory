"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Scene = {
  id: string;
  scene_number: number;
  content: unknown;
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

export default function StudioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [drama, setDrama] = useState<DramaAsset | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/dramas/${id}`, { headers: await authHeaders(), cache: "no-store" });
    if (response.ok) {
      setDrama(await response.json());
      setError("");
    } else {
      setError("Drama asset does not exist or you do not have access.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <main className="p-6 text-destructive">{error}</main>;
  if (!drama) return <main className="p-6 text-muted-foreground">Loading drama asset...</main>;

  return (
    <main className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-semibold">{drama.drama.title}</h1>
      <Badge className="mt-3" variant="secondary">{drama.drama.status}</Badge>
      <p className="mt-3 text-sm text-muted-foreground">Progress: {drama.progress.completed}/{drama.progress.total}</p>

      <Card className="mt-6">
        <CardHeader><CardTitle>Story</CardTitle></CardHeader>
        <CardContent><pre className="whitespace-pre-wrap text-sm">{JSON.stringify(drama.drama.story, null, 2)}</pre></CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Characters</CardTitle></CardHeader>
        <CardContent><pre className="whitespace-pre-wrap text-sm">{JSON.stringify(drama.drama.characters, null, 2)}</pre></CardContent>
      </Card>

      <section className="mt-6 grid gap-4">
        {drama.scenes.map((scene) => (
          <Card key={scene.id}>
            <CardHeader><CardTitle>Scene {scene.scene_number}</CardTitle></CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(scene.content, null, 2)}</pre>
              <p className="mt-3 text-sm">Image: {scene.image?.status ?? "pending"}</p>
              {scene.image?.url ? (
                <Image unoptimized className="mt-2 max-h-64 rounded object-cover" src={scene.image.url} alt={`Scene ${scene.scene_number} image`} width={512} height={512} />
              ) : null}
              <p className="mt-3 text-sm">Video: {scene.video?.status ?? "pending"}</p>
              {scene.video?.url ? <a className="text-primary" href={scene.video.url}>Play video →</a> : null}
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
