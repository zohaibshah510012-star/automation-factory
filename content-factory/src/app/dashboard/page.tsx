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

function typeIcon(type?: string | null) {
  if (type?.includes("image")) return ImageIcon;
  if (type?.includes("video")) return VideoIcon;
  if (type === "drama") return ClapperboardIcon;
  return FileTextIcon;
}

const quickActions = [
  {
    title: "Create Center",
    description: "Start a short drama, image, video, or content task from one product entry.",
    href: "/create",
    icon: SparklesIcon,
  },
  {
    title: "Templates",
    description: "Explore production templates for short drama, marketing, image, and video workflows.",
    href: "/dashboard/templates",
    icon: Layers3Icon,
  },
  {
    title: "My Assets",
    description: "Review generated text, image, and video results from your AI production pipeline.",
    href: "/assets",
    icon: FileTextIcon,
  },
  {
    title: "Billing",
    description: "Check credits, usage, subscription status, and upgrade path.",
    href: "/dashboard/billing",
    icon: CreditCardIcon,
  },
];

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
        setTasks((payload.tasks ?? []).slice(0, 5));
      }
      if (assetsResponse.ok) {
        const payload = await assetsResponse.json() as { assets?: Asset[] };
        setAssets((payload.assets ?? []).slice(0, 5));
      }
      setError("");
    } catch {
      setError("Sign in with a valid Beta invite to see your dashboard.");
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
  const completedTasks = tasks.filter((task) => task.status === "completed").length;

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.14),transparent_32%),linear-gradient(180deg,#050713_0%,#0b1020_42%,#f8fafc_42%,#f8fafc_100%)]">
      <TrackPageView surface="dashboard" properties={{ page: "dashboard_home" }} />
      <TrackPageView eventName="return_visit" surface="dashboard" properties={{ page: "dashboard_home" }} />

      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8 text-white lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline">
              Automation Factory
            </Badge>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
              Welcome back, {displayName}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68 md:text-base">
              Your AI SaaS workspace is ready: create new assets, monitor running tasks, and reuse completed results from one cockpit.
            </p>
          </div>
          <Button className="bg-white text-slate-950 hover:bg-white/90" render={<Link href="/create" />} size="lg">
            Create new asset
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <p className="text-sm text-white/60">Credits balance</p>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-4xl font-semibold">{loading ? "-" : credits}</p>
              {loading ? <Loader2Icon className="size-5 animate-spin text-white/60" /> : <WalletCardsIcon className="size-7 text-cyan-200" />}
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <p className="text-sm text-white/60">Current plan</p>
            <p className="mt-4 text-2xl font-semibold">{loading ? "-" : planName}</p>
            <p className="mt-2 text-sm text-white/55">{summary?.subscription?.status ?? "No active subscription"}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <p className="text-sm text-white/60">Recent tasks</p>
            <p className="mt-4 text-2xl font-semibold">{loading ? "-" : tasks.length}</p>
            <p className="mt-2 text-sm text-white/55">{completedTasks} completed in recent list.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <p className="text-sm text-white/60">Recent usage</p>
            <p className="mt-4 text-2xl font-semibold">{loading ? "-" : `${summary?.credits.consumed ?? 0} credits`}</p>
            <p className="mt-2 text-sm text-white/55">Track spend from Billing anytime.</p>
          </div>
        </section>

        {error ? (
          <p className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
            {error}
          </p>
        ) : null}
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

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-12 lg:grid-cols-2 lg:px-8">
        <Card className="bg-white/95 shadow-xl shadow-slate-950/5">
          <CardHeader>
            <CardTitle>Recent tasks</CardTitle>
            <CardDescription>Live work moving through the AI production pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {tasks.map((task) => {
              const Icon = typeIcon(task.taskType);
              return (
                <Link className="rounded-xl border bg-background p-4 transition hover:bg-muted/50" href={`/tasks/${task.id}`} key={task.id}>
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
            {!tasks.length ? <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">No tasks yet. Start from the Create Center.</p> : null}
          </CardContent>
        </Card>

        <Card className="bg-white/95 shadow-xl shadow-slate-950/5">
          <CardHeader>
            <CardTitle>Recent assets</CardTitle>
            <CardDescription>Completed outputs ready to reuse in campaigns and demos.</CardDescription>
            <CardAction>
              <Button render={<Link href="/assets" />} size="sm" variant="outline">
                View all
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {assets.map((asset) => {
              const Icon = typeIcon(asset.type);
              return (
                <Link className="rounded-xl border bg-background p-4 transition hover:bg-muted/50" href={`/dashboard/content/${asset.id}`} key={asset.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{asset.title}</p>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{asset.content.script ?? asset.topic}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{asset.type}</Badge>
                  </div>
                </Link>
              );
            })}
            {!assets.length ? <p className="rounded-xl border bg-background p-4 text-sm text-muted-foreground">No completed assets yet.</p> : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
