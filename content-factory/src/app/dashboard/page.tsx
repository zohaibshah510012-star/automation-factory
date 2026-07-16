"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  ClapperboardIcon,
  CreditCardIcon,
  FileTextIcon,
  ImageIcon,
  Layers3Icon,
  Loader2Icon,
  SparklesIcon,
  VideoIcon,
  WalletCardsIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackPageView } from "@/components/product-event-tracker";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { workflowTemplates, type WorkflowCapability } from "@/lib/workflow-templates";

type BillingSummary = {
  profile: { email: string | null; display_name: string | null; credits_balance: number; status: string } | null;
  subscription: {
    status: string;
    plans?: { name: string; credits: number } | null;
  } | null;
  credits: {
    balance: number;
    consumed: number;
  };
};

type Task = {
  id: string;
  topic: string;
  taskType?: string | null;
  status: string;
  title?: string | null;
  creditsCharged?: number | null;
  updatedAt: string;
};

type Asset = {
  id: string;
  type: string;
  title: string;
  topic: string;
  status: string;
  createdAt: string;
  creditsCharged: number;
  content: { script: string | null };
};

const capabilityIcons: Record<WorkflowCapability | "default", typeof SparklesIcon> = {
  drama: ClapperboardIcon,
  video: VideoIcon,
  image: ImageIcon,
  content: FileTextIcon,
  default: FileTextIcon,
};

const quickActions = [
  {
    title: "Create",
    description: "Open the Workflow Wizard and launch a new AI asset.",
    href: "/create",
    icon: SparklesIcon,
  },
  {
    title: "Templates",
    description: "Browse creator templates and proven content workflows.",
    href: "/dashboard/templates",
    icon: Layers3Icon,
  },
  {
    title: "Assets",
    description: "Review generated text, image, and video outputs.",
    href: "/assets",
    icon: FileTextIcon,
  },
  {
    title: "Billing",
    description: "Check credits, plan, usage, and upgrade options.",
    href: "/dashboard/billing",
    icon: CreditCardIcon,
  },
];

async function authorizationHeader() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

async function bootstrapAccount() {
  const headers = await authorizationHeader();
  const params = new URLSearchParams(window.location.search);
  const inviteCode = params.get("invite_code") ?? window.localStorage.getItem("automation_factory_beta_invite_code") ?? undefined;
  const response = await fetch("/api/auth/bootstrap", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ inviteCode }),
  });
  if (response.ok && inviteCode) window.localStorage.removeItem("automation_factory_beta_invite_code");
  if (!response.ok) throw new Error("Beta invite required");
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "failed") return "destructive";
  if (status === "running" || status === "processing" || status === "generating") return "secondary";
  return "outline";
}

function iconForType(type?: string | null) {
  if (type?.includes("image")) return ImageIcon;
  if (type?.includes("video")) return VideoIcon;
  if (type === "drama") return ClapperboardIcon;
  return FileTextIcon;
}

export default function DashboardHomePage() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      await bootstrapAccount();
      const headers = await authorizationHeader();
      const [billingResponse, tasksResponse, assetsResponse] = await Promise.all([
        fetch("/api/billing", { headers, cache: "no-store" }),
        fetch("/api/tasks", { headers, cache: "no-store" }),
        fetch("/api/content", { headers, cache: "no-store" }),
      ]);

      if (!billingResponse.ok) throw new Error("Unable to load dashboard summary.");
      setSummary(await billingResponse.json() as BillingSummary);

      if (tasksResponse.ok) {
        const payload = await tasksResponse.json() as { tasks?: Task[] };
        setTasks((payload.tasks ?? []).slice(0, 6));
      }
      if (assetsResponse.ok) {
        const payload = await assetsResponse.json() as { assets?: Asset[] };
        setAssets((payload.assets ?? []).slice(0, 6));
      }
      setError("");
    } catch {
      setError("Sign in with a valid Beta invite to see your creator workspace.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const displayName = useMemo(() => {
    const name = summary?.profile?.display_name?.trim();
    if (name) return name;
    return summary?.profile?.email?.split("@")[0] ?? "Creator";
  }, [summary]);

  const planName = summary?.subscription?.plans?.name ?? "Free workspace";
  const credits = summary?.credits.balance ?? summary?.profile?.credits_balance ?? 0;
  const currentProject = tasks[0]?.title ?? tasks[0]?.topic ?? "Start your first AI workflow";
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_80%_12%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(180deg,#050713_0%,#0b1020_48%,#f8fafc_48%,#f8fafc_100%)]">
      <TrackPageView surface="dashboard" properties={{ page: "creator_dashboard" }} />
      <TrackPageView eventName="return_visit" surface="dashboard" properties={{ page: "creator_dashboard" }} />

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 text-white lg:grid-cols-[1.08fr_.92fr] lg:px-8">
        <header className="flex min-h-[32rem] flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl md:p-8">
          <div>
            <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline">
              AI Creator Workspace
            </Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
              Welcome back, {displayName}. What are we creating today?
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/68 md:text-base">
              Choose a workflow, write one focused brief, and watch Automation Factory turn it into a task, pipeline, and reusable asset.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button className="bg-white text-slate-950 hover:bg-white/90" render={<Link href="/create" />} size="lg">
                Start creating
                <SparklesIcon data-icon="inline-end" />
              </Button>
              <Button className="border-white/20 text-white hover:bg-white/10" render={<Link href="/assets" />} size="lg" variant="outline">
                View recent works
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-sm text-white/55">Credits</p>
              <div className="mt-3 flex items-end justify-between">
                <p className="text-3xl font-semibold">{loading ? "-" : credits}</p>
                {loading ? <Loader2Icon className="size-5 animate-spin text-white/60" /> : <WalletCardsIcon className="size-6 text-cyan-200" />}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-sm text-white/55">Current project</p>
              <p className="mt-3 line-clamp-2 text-lg font-semibold">{currentProject}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4">
              <p className="text-sm text-white/55">Plan</p>
              <p className="mt-3 text-lg font-semibold">{loading ? "-" : planName}</p>
              <p className="mt-1 text-xs text-white/45">{summary?.subscription?.status ?? "No active subscription"}</p>
            </div>
          </div>
        </header>

        <Card className="border-white/10 bg-white/[0.08] text-white shadow-2xl shadow-black/25 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Recommended creator workflows</CardTitle>
            <CardDescription className="text-white/55">Pick a template to start the wizard with a useful brief.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {workflowTemplates.slice(0, 5).map((template) => {
              const Icon = capabilityIcons[template.capability];
              return (
                <Link className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 transition hover:bg-white/10" href={`/create?template=${template.id}`} key={template.id}>
                  <div className="flex gap-3">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${template.accent} text-white`}>
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{template.title}</p>
                        <Badge className="border-white/15 bg-white/10 text-white" variant="outline">{template.channel}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/55">{template.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 pb-8 lg:px-8">
        <Card className="bg-white/95 shadow-xl shadow-slate-950/5">
          <CardHeader>
            <CardTitle>New here? Start in 3 steps</CardTitle>
            <CardDescription>We designed the first session so a new user can get to value quickly without needing help.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {[
              { step: "1", title: "Pick a workflow", description: "Choose TikTok Ad, short drama, image, video, or content from the Create Center." },
              { step: "2", title: "Describe your need", description: "Add one clear brief and let the wizard shape the right AI task." },
              { step: "3", title: "Review your result", description: "Open the task page, inspect the result, and save it to My Assets." },
            ].map((item) => (
              <div className="rounded-2xl border bg-background p-4" key={item.step}>
                <p className="text-xs text-muted-foreground">Step {item.step}</p>
                <p className="mt-2 font-medium">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            ))}
            <div className="md:col-span-3">
              <Button render={<Link href="/create" />}>
                Start creating
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-6 pb-8 pt-2 lg:grid-cols-4 lg:px-8">
        {quickActions.map((action) => (
          <Card className="group border-slate-200/80 bg-white/90 shadow-xl shadow-slate-950/5 transition duration-200 hover:-translate-y-1 hover:shadow-2xl" key={action.title}>
            <CardHeader>
              <span className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white transition group-hover:bg-violet-600">
                <action.icon className="size-5" />
              </span>
              <CardTitle>{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button render={<Link href={action.href} />} variant="outline">
                Open
                <ArrowRightIcon data-icon="inline-end" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      {error ? <p className="mx-auto max-w-7xl px-6 pb-4 text-sm text-destructive lg:px-8">{error}</p> : null}

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-12 lg:grid-cols-[1fr_1fr] lg:px-8">
        <Card className="bg-white/95 shadow-xl shadow-slate-950/5">
          <CardHeader>
            <CardTitle>Recent tasks</CardTitle>
            <CardDescription>{completedTasks} completed · {tasks.length} recent workflow runs.</CardDescription>
            <CardAction>
              <Button render={<Link href="/create" />} size="sm" variant="outline">New task</Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-3">
            {tasks.map((task) => {
              const Icon = iconForType(task.taskType);
              return (
                <Link className="rounded-2xl border bg-background p-4 transition hover:bg-muted/50" href={`/tasks/${task.id}`} key={task.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{task.title ?? task.topic}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{new Date(task.updatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
                  </div>
                </Link>
              );
            })}
            {!tasks.length ? <p className="rounded-2xl border bg-background p-5 text-sm text-muted-foreground">Your first workflow run will appear here after you create it from the wizard.</p> : null}
          </CardContent>
        </Card>

        <Card className="bg-white/95 shadow-xl shadow-slate-950/5">
          <CardHeader>
            <CardTitle>Recent works</CardTitle>
            <CardDescription>Completed assets ready to review, copy, and reuse.</CardDescription>
            <CardAction>
              <Button render={<Link href="/assets" />} size="sm" variant="outline">View all</Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-3">
            {assets.map((asset) => {
              const Icon = iconForType(asset.type);
              return (
                <Link className="rounded-2xl border bg-background p-4 transition hover:bg-muted/50" href={`/dashboard/content/${asset.id}`} key={asset.id}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-medium">{asset.title}</p>
                        <Badge variant="outline">{asset.type}</Badge>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{asset.content.script ?? asset.topic}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {!assets.length ? <p className="rounded-2xl border bg-background p-5 text-sm text-muted-foreground">Completed results appear here automatically after generation finishes.</p> : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
