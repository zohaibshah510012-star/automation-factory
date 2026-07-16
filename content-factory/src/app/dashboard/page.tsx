"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  ClapperboardIcon,
  CreditCardIcon,
  Layers3Icon,
  Loader2Icon,
  SparklesIcon,
  WalletCardsIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const quickActions = [
  {
    title: "Create content",
    description: "Start from a topic and let the AI workflow produce your first content pack.",
    href: "/dashboard/studio",
    icon: SparklesIcon,
  },
  {
    title: "Templates",
    description: "Choose a short drama, marketing, image, or video generation template.",
    href: "/dashboard/templates",
    icon: Layers3Icon,
  },
  {
    title: "Studio",
    description: "Manage short drama production, generated assets, and creative workflows.",
    href: "/dashboard/studio?template=drama",
    icon: ClapperboardIcon,
  },
  {
    title: "Billing",
    description: "Review your credits balance, usage, subscription, and upgrade path.",
    href: "/dashboard/billing",
    icon: CreditCardIcon,
  },
];

export default function DashboardHomePage() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadBilling() {
      try {
        await bootstrapAccount();
        const response = await fetch("/api/billing", {
          headers: await authorizationHeader(),
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Unable to load dashboard summary.");
        const payload = await response.json() as BillingSummary;
        if (mounted) setSummary(payload);
      } catch {
        if (mounted) setError("Sign in to see your dashboard summary.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadBilling();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = useMemo(() => {
    const name = summary?.profile?.display_name?.trim();
    if (name) return name;
    return summary?.profile?.email?.split("@")[0] ?? "Creator";
  }, [summary]);

  const planName = summary?.subscription?.plans?.name ?? "Free workspace";
  const credits = summary?.credits.balance ?? summary?.profile?.credits_balance ?? 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.14),transparent_32%),linear-gradient(180deg,#050713_0%,#0b1020_48%,#f8fafc_48%,#f8fafc_100%)]">
      <TrackPageView surface="dashboard" properties={{ page: "dashboard_home" }} />

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
              Your AI production workspace is ready. Create a short drama, explore templates, or check the credits powering your next generation.
            </p>
          </div>
          <Button className="bg-white text-slate-950 hover:bg-white/90" render={<Link href="/dashboard/studio?template=drama" />} size="lg">
            Create first asset
            <ArrowRightIcon data-icon="inline-end" />
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
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

      <section className="mx-auto grid max-w-7xl gap-4 px-6 pb-12 pt-2 lg:grid-cols-4 lg:px-8">
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
    </main>
  );
}
