"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRightIcon,
  ClapperboardIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TrackPageView, trackProductEvent } from "@/components/product-event-tracker";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { TaskType } from "@/lib/prompt-engine";

type CapabilityId = "drama" | "video" | "image" | "content";

type Capability = {
  id: CapabilityId;
  title: string;
  description: string;
  placeholder: string;
  helper: string;
  button: string;
  icon: typeof SparklesIcon;
  accent: string;
};

const capabilities: Capability[] = [
  {
    id: "drama",
    title: "AI Short Drama",
    description: "Generate a drama concept, story structure, scenes, and production-ready creative assets from one idea.",
    placeholder: "Example: A founder uses AI agents to rescue a failing content studio in 7 days",
    helper: "Best for short-video creators, content teams, and campaign storytelling.",
    button: "Create drama",
    icon: ClapperboardIcon,
    accent: "from-fuchsia-500 to-violet-500",
  },
  {
    id: "video",
    title: "AI Video",
    description: "Turn a scene prompt into a video generation task using the configured server-side video provider.",
    placeholder: "Example: Cinematic vertical video of a creator command center, neon lights, fast cuts",
    helper: "Best for demos, ad scenes, and social video experiments.",
    button: "Create video",
    icon: VideoIcon,
    accent: "from-sky-500 to-cyan-400",
  },
  {
    id: "image",
    title: "AI Image",
    description: "Generate posters, thumbnails, visual scenes, and image assets for content production.",
    placeholder: "Example: Premium SaaS hero image, AI production pipeline, dark cinematic lighting",
    helper: "Best for covers, storyboards, product visuals, and campaign images.",
    button: "Create image",
    icon: ImageIcon,
    accent: "from-emerald-400 to-teal-500",
  },
  {
    id: "content",
    title: "AI Content",
    description: "Create scripts, marketing copy, social posts, and reusable text assets for campaigns.",
    placeholder: "Example: Write a punchy short-video script for an AI automation product launch",
    helper: "Best for marketers, operators, and content teams that need fast drafts.",
    button: "Create content",
    icon: FileTextIcon,
    accent: "from-amber-400 to-orange-500",
  },
];

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function taskTypeFor(capability: CapabilityId): TaskType {
  if (capability === "drama") return "drama";
  if (capability === "content") return "marketing";
  if (capability === "image") return "image";
  return "video";
}

export default function CreateCenterPage() {
  const [selected, setSelected] = useState<CapabilityId>("drama");
  const [inputs, setInputs] = useState<Record<CapabilityId, string>>({
    drama: "",
    video: "",
    image: "",
    content: "",
  });
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState<CapabilityId | null>(null);
  const [message, setMessage] = useState("");

  async function create(capability: Capability) {
    const prompt = inputs[capability.id].trim();
    if (!prompt) return;

    setLoading(capability.id);
    setMessage("");
    await trackProductEvent("template_select", { capability: capability.id, title: capability.title }, "create");

    const headers = { ...(await authHeaders()), "Content-Type": "application/json" };
    const body = capability.id === "image"
      ? { prompt }
      : capability.id === "video"
        ? { prompt }
        : { topic: prompt, brief: brief.trim() || capability.helper, taskType: taskTypeFor(capability.id) };
    const endpoint = capability.id === "image" ? "/api/images" : capability.id === "video" ? "/api/videos" : "/api/tasks";
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    setLoading(null);

    const payload = (await response.json().catch(() => ({}))) as { task?: { id?: string }; error?: string };
    if (!response.ok || !payload.task?.id) {
      setMessage(payload.error ?? "Unable to create task. Please check your account and provider configuration.");
      return;
    }

    window.location.assign(`/tasks/${payload.task.id}`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_35%),linear-gradient(180deg,#050713_0%,#0b1020_38%,#f8fafc_38%,#f8fafc_100%)]">
      <TrackPageView surface="create" properties={{ page: "create_center" }} />
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 text-white lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline">
              Create Center
            </Badge>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
              Create AI content assets from one focused brief.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68 md:text-base">
              Choose a production capability, describe the result you want, and Automation Factory will route it through the existing AI task pipeline.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="bg-white text-slate-950 hover:bg-white/90" render={<Link href="/dashboard" />}>
              Dashboard
              <ArrowRightIcon data-icon="inline-end" />
            </Button>
            <Button className="border-white/20 text-white hover:bg-white/10" render={<Link href="/assets" />} variant="outline">
              My assets
            </Button>
          </div>
        </header>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 pb-12 lg:grid-cols-2 lg:px-8">
        {capabilities.map((capability) => {
          const active = selected === capability.id;
          return (
            <Card className={`overflow-hidden border-slate-200/80 bg-white/95 shadow-xl shadow-slate-950/5 transition ${active ? "ring-2 ring-violet-500" : ""}`} key={capability.id}>
              <CardHeader>
                <div className={`grid size-12 place-items-center rounded-2xl bg-gradient-to-br ${capability.accent} text-white shadow-lg`}>
                  <capability.icon className="size-5" />
                </div>
                <CardTitle>{capability.title}</CardTitle>
                <CardDescription>{capability.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <button
                  className="rounded-xl border bg-muted/40 p-3 text-left text-sm text-muted-foreground transition hover:bg-muted"
                  onClick={() => setSelected(capability.id)}
                  type="button"
                >
                  {capability.helper}
                </button>
                <Textarea
                  className="min-h-28"
                  onChange={(event) => setInputs((current) => ({ ...current, [capability.id]: event.target.value }))}
                  placeholder={capability.placeholder}
                  value={inputs[capability.id]}
                />
                {(capability.id === "drama" || capability.id === "content") ? (
                  <Input
                    onChange={(event) => setBrief(event.target.value)}
                    placeholder="Optional style / audience / channel notes"
                    value={brief}
                  />
                ) : null}
                <Button disabled={loading === capability.id || !inputs[capability.id].trim()} onClick={() => void create(capability)}>
                  {loading === capability.id ? <Loader2Icon className="animate-spin" data-icon="inline-start" /> : <SparklesIcon data-icon="inline-start" />}
                  {capability.button}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>
      {message ? <p className="mx-auto max-w-7xl px-6 pb-8 text-sm text-destructive lg:px-8">{message}</p> : null}
    </main>
  );
}
