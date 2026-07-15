"use client";

import { useEffect, useMemo, useState } from "react";
import { ActivityIcon, BarChart3Icon, RefreshCwIcon, ServerIcon, WalletCardsIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type HealthData = {
  aiCalls: number;
  successRate: number;
  failureRate: number;
  creditsConsumed: number;
  providers: Array<{ provider_name: string; enabled: boolean; model: string | null; updated_at: string }>;
  providerUsage: Record<string, { calls: number; credits: number }>;
  taskStatus: { total: number; completed: number; failed: number; running: number; imageFailed: number; videoFailed: number };
  recentErrors: Array<{ level: string; event: string; metadata: Record<string, unknown>; created_at: string }>;
};

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);

  async function load() {
    const response = await fetch("/api/admin/health", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      location.assign("/");
      return;
    }
    setData(await response.json());
  }

  useEffect(() => {
    void load();
  }, []);

  const providerUsage = useMemo(() => Object.entries(data?.providerUsage ?? {}), [data]);
  const metrics = [
    { label: "AI calls", value: data?.aiCalls ?? "-", helper: "usage_history rows", icon: ActivityIcon },
    { label: "Success rate", value: `${Math.round((data?.successRate ?? 0) * 100)}%`, helper: "content task completion", icon: BarChart3Icon },
    { label: "Failure rate", value: `${Math.round((data?.failureRate ?? 0) * 100)}%`, helper: "content task failures", icon: ServerIcon },
    { label: "Credits consumed", value: data?.creditsConsumed ?? "-", helper: "total provider usage credits", icon: WalletCardsIcon },
  ];

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Beta Operations</p>
          <h1 className="text-3xl font-semibold">System Health Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">AI calls, success rate, failure rate, credits consumption, and provider status.</p>
        </div>
        <Button onClick={() => void load()} variant="outline">
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
              <CardAction><metric.icon /></CardAction>
            </CardHeader>
            <CardContent><p className="text-3xl font-semibold">{metric.value}</p></CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Provider usage</CardTitle>
            <CardDescription>Calls and credits by provider.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Credits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providerUsage.map(([provider, usage]) => (
                  <TableRow key={provider}>
                    <TableCell>{provider}</TableCell>
                    <TableCell>{usage.calls}</TableCell>
                    <TableCell>{usage.credits}</TableCell>
                  </TableRow>
                ))}
                {!providerUsage.length ? (
                  <TableRow><TableCell className="text-muted-foreground" colSpan={3}>No provider usage yet.</TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Provider status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {data?.providers.map((provider) => (
                <div className="flex items-center justify-between gap-3" key={provider.provider_name}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{provider.provider_name}</span>
                    <span className="text-xs text-muted-foreground">{provider.model ?? "default model"}</span>
                  </div>
                  <Badge variant={provider.enabled ? "secondary" : "outline"}>{provider.enabled ? "enabled" : "disabled"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Task status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-3"><span>Total</span><span>{data?.taskStatus.total ?? 0}</span></div>
              <div className="flex justify-between gap-3"><span>Running</span><span>{data?.taskStatus.running ?? 0}</span></div>
              <div className="flex justify-between gap-3"><span>Failed</span><span>{data?.taskStatus.failed ?? 0}</span></div>
              <div className="flex justify-between gap-3"><span>Image failed</span><span>{data?.taskStatus.imageFailed ?? 0}</span></div>
              <div className="flex justify-between gap-3"><span>Video failed</span><span>{data?.taskStatus.videoFailed ?? 0}</span></div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent system errors</CardTitle>
          <CardDescription>Last 20 error logs from system_logs.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Metadata</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.recentErrors.map((error) => (
                <TableRow key={`${error.event}:${error.created_at}`}>
                  <TableCell>{error.event}</TableCell>
                  <TableCell className="max-w-xl truncate">{JSON.stringify(error.metadata)}</TableCell>
                  <TableCell>{new Date(error.created_at).toLocaleString("zh-CN")}</TableCell>
                </TableRow>
              ))}
              {!data?.recentErrors.length ? (
                <TableRow><TableCell className="text-muted-foreground" colSpan={3}>No recent system errors.</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
