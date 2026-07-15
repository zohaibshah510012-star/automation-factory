"use client";

import { useEffect, useState } from "react";
import { BarChart3Icon, DollarSignIcon, RefreshCwIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type AnalyticsData = {
  users: number;
  tasks: number;
  successRate: number;
  revenue: { paid: number; pending: number; arpu: number; activeSubscriptions: number };
  credits: { consumed: number; estimatedValue: number };
  providerCost: number;
  grossProfit: number;
  grossMargin: number;
  providerUsage: Array<{ provider: string; model: string | null; credits: number; requests: number; estimatedCost: number }>;
  productAnalytics: {
    eventCounts: Record<string, number>;
    recentEvents: Array<{ event_name: string; surface: string; path: string | null; created_at: string }>;
    funnel: {
      pageView: number;
      ctaClick: number;
      signupComplete: number;
      templateSelect: number;
      taskCreate: number;
      taskComplete: number;
      upgradeClick: number;
    };
  };
  feedback: { total: number; averageSatisfaction: number; newCount: number };
};

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function currency(value: number) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  async function load() {
    const response = await fetch("/api/admin/analytics", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      location.assign("/");
      return;
    }
    setData(await response.json());
  }

  useEffect(() => {
    void load();
  }, []);

  const metrics = [
    { label: "Revenue", value: currency(data?.revenue.paid ?? 0), helper: `${currency(data?.revenue.pending ?? 0)} pending`, icon: DollarSignIcon },
    { label: "Gross profit", value: currency(data?.grossProfit ?? 0), helper: `${data?.grossMargin ?? 0}% margin`, icon: BarChart3Icon },
    { label: "Users", value: data?.users ?? "-", helper: `${data?.revenue.activeSubscriptions ?? 0} active subscriptions`, icon: UsersIcon },
    { label: "Credits consumed", value: data?.credits.consumed ?? "-", helper: `${currency(data?.credits.estimatedValue ?? 0)} credit value`, icon: BarChart3Icon },
  ];
  const funnel = [
    { label: "Page views", value: data?.productAnalytics.funnel.pageView ?? 0 },
    { label: "CTA clicks", value: data?.productAnalytics.funnel.ctaClick ?? 0 },
    { label: "Signup complete", value: data?.productAnalytics.funnel.signupComplete ?? 0 },
    { label: "Template select", value: data?.productAnalytics.funnel.templateSelect ?? 0 },
    { label: "Task create", value: data?.productAnalytics.funnel.taskCreate ?? 0 },
    { label: "Task complete", value: data?.productAnalytics.funnel.taskComplete ?? 0 },
    { label: "Upgrade click", value: data?.productAnalytics.funnel.upgradeClick ?? 0 },
  ];

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Commercial Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Revenue, credits, provider cost, and margin indicators.</p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle>{metric.label}</CardTitle>
              <CardDescription>{metric.helper}</CardDescription>
              <CardAction>
                <metric.icon />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Product funnel</CardTitle>
            <CardDescription>Lightweight Customer Validation events from landing, product, and billing.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funnel.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>{row.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User feedback</CardTitle>
            <CardDescription>Customer satisfaction and open feedback queue.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Average satisfaction</span>
              <Badge variant="secondary">{data?.feedback.averageSatisfaction ?? 0}/5</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Total feedback</span>
              <span className="text-sm font-medium">{data?.feedback.total ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">New items</span>
              <span className="text-sm font-medium">{data?.feedback.newCount ?? 0}</span>
            </div>
            <Button render={<a href="/admin/feedback" />} variant="outline">
              View feedback
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Provider cost</CardTitle>
            <CardDescription>Estimated by credits consumed. Tune with PROVIDER_COST_PER_CREDIT_USD.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Estimated cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.providerUsage.map((row) => (
                  <TableRow key={`${row.provider}:${row.model ?? "default"}`}>
                    <TableCell>{row.provider}</TableCell>
                    <TableCell>{row.model ?? "-"}</TableCell>
                    <TableCell>{row.requests}</TableCell>
                    <TableCell>{row.credits}</TableCell>
                    <TableCell>{currency(row.estimatedCost)}</TableCell>
                  </TableRow>
                ))}
                {!data?.providerUsage.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No provider usage yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business health</CardTitle>
            <CardDescription>Launch readiness snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Task success rate</span>
              <Badge variant="secondary">{Math.round((data?.successRate ?? 0) * 100)}%</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Tasks</span>
              <span className="text-sm font-medium">{data?.tasks ?? 0}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">ARPU</span>
              <span className="text-sm font-medium">{currency(data?.revenue.arpu ?? 0)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">Provider cost</span>
              <span className="text-sm font-medium">{currency(data?.providerCost ?? 0)}</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
