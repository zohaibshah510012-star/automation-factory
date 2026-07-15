"use client";

import { useCallback, useEffect, useState } from "react";
import { ActivityIcon, AlertTriangleIcon, ClockIcon, CoinsIcon, RefreshCwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type MonitorData = {
  taskSuccessRate: number;
  taskFailureRate: number;
  tasks: { total: number; completed: number; failed: number; running: number };
  providerErrors: Array<{ level: string; event: string; metadata: Record<string, unknown>; created_at: string }>;
  aiLatencyMs: { average: number; samples: number };
  credits: { consumed: number; recentTransactions: Array<{ amount: number; type: string | null; status: string | null; created_at: string }> };
  queueStatus: { content: number; images: number; videos: number; distributions: number };
  generatedAt: string;
};

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

export default function AdminMonitorPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/monitor", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      setMessage("Unable to load production monitor.");
      return;
    }
    setData(await response.json());
    setMessage("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = [
    { label: "Task success rate", value: `${Math.round((data?.taskSuccessRate ?? 0) * 100)}%`, helper: `${data?.tasks.completed ?? 0}/${data?.tasks.total ?? 0} completed`, icon: ActivityIcon },
    { label: "Task failure rate", value: `${Math.round((data?.taskFailureRate ?? 0) * 100)}%`, helper: `${data?.tasks.failed ?? 0} failed`, icon: AlertTriangleIcon },
    { label: "AI latency", value: `${data?.aiLatencyMs.average ?? 0} ms`, helper: `${data?.aiLatencyMs.samples ?? 0} usage samples`, icon: ClockIcon },
    { label: "Credits usage", value: data?.credits.consumed ?? 0, helper: "Total usage_history credits", icon: CoinsIcon },
  ];

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Production Operations</p>
          <h1 className="text-3xl font-semibold">Production Monitor</h1>
          <p className="mt-1 text-sm text-muted-foreground">Task success/failure rate, provider errors, AI latency, credits usage, and queue status.</p>
        </div>
        <Button onClick={() => void load()} variant="outline">
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      {message ? <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p> : null}

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
            <CardTitle>Provider errors</CardTitle>
            <CardDescription>Recent provider-related errors from system logs.</CardDescription>
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
                {data?.providerErrors.map((error) => (
                  <TableRow key={`${error.event}:${error.created_at}`}>
                    <TableCell>{error.event}</TableCell>
                    <TableCell className="max-w-xl truncate">{JSON.stringify(error.metadata)}</TableCell>
                    <TableCell>{new Date(error.created_at).toLocaleString("zh-CN")}</TableCell>
                  </TableRow>
                ))}
                {!data?.providerErrors.length ? (
                  <TableRow><TableCell colSpan={3} className="text-muted-foreground">No recent provider errors.</TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Queue status</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between gap-3"><span>Content tasks</span><Badge variant="secondary">{data?.queueStatus.content ?? 0}</Badge></div>
              <div className="flex justify-between gap-3"><span>Image tasks</span><Badge variant="secondary">{data?.queueStatus.images ?? 0}</Badge></div>
              <div className="flex justify-between gap-3"><span>Video tasks</span><Badge variant="secondary">{data?.queueStatus.videos ?? 0}</Badge></div>
              <div className="flex justify-between gap-3"><span>Distribution jobs</span><Badge variant="secondary">{data?.queueStatus.distributions ?? 0}</Badge></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent credits</CardTitle>
              <CardDescription>Latest credit movements.</CardDescription>
            </CardHeader>
            <CardContent className="flex max-h-80 flex-col gap-2 overflow-auto">
              {data?.credits.recentTransactions.slice(0, 10).map((transaction, index) => (
                <div className="rounded-lg border p-3 text-sm" key={`${transaction.created_at}:${index}`}>
                  <div className="flex justify-between gap-3">
                    <span>{transaction.type ?? "credit"}</span>
                    <Badge variant={transaction.amount >= 0 ? "secondary" : "outline"}>{transaction.amount}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{transaction.status ?? "unknown"} · {new Date(transaction.created_at).toLocaleString("zh-CN")}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
