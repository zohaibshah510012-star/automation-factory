"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangleIcon, RefreshCwIcon, RotateCcwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type MonitoredTask = {
  id: string;
  user_id: string | null;
  topic: string;
  task_type: string;
  status: string;
  error: string | null;
  credits_charged: number;
  created_at: string;
  updated_at: string;
  profiles?: { email?: string | null } | null;
};

type ErrorLog = { id: string; event: string; task_id: string | null; metadata: Record<string, unknown>; created_at: string };
type Provider = { provider_name: string; enabled: boolean; model: string | null };

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

export default function AdminTaskMonitorPage() {
  const [tasks, setTasks] = useState<MonitoredTask[]>([]);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/tasks", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      location.assign("/");
      return;
    }
    const payload = await response.json();
    setTasks(payload.tasks);
    setErrors(payload.errors);
    setProviders(payload.providers);
  }

  async function retry(taskId: string) {
    const response = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId }),
    });
    const payload = await response.json().catch(() => ({}));
    setMessage(response.ok ? "Retry started." : payload.error ?? "Unable to retry task.");
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  const summary = useMemo(() => ({
    running: tasks.filter((task) => ["running", "generating", "pending"].includes(task.status)).length,
    failed: tasks.filter((task) => task.status === "failed").length,
    errors: errors.length,
  }), [errors.length, tasks]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Beta Operations</p>
          <h1 className="text-3xl font-semibold">Task Monitoring</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor running tasks, failed tasks, AI errors, and provider errors.</p>
        </div>
        <Button onClick={() => void load()} variant="outline">
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>
      {message ? <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Running</CardTitle><CardAction><RefreshCwIcon /></CardAction></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{summary.running}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Failed</CardTitle><CardAction><AlertTriangleIcon /></CardAction></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{summary.failed}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Error logs</CardTitle><CardAction><AlertTriangleIcon /></CardAction></CardHeader>
          <CardContent><p className="text-3xl font-semibold">{summary.errors}</p></CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Running and failed content tasks</CardTitle>
            <CardDescription>Failed content tasks can be retried from here.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="max-w-64 truncate">{task.topic}</TableCell>
                    <TableCell>{task.profiles?.email ?? task.user_id ?? "-"}</TableCell>
                    <TableCell>{task.task_type}</TableCell>
                    <TableCell><Badge variant={task.status === "failed" ? "destructive" : "secondary"}>{task.status}</Badge></TableCell>
                    <TableCell className="max-w-64 truncate">{task.error ?? "-"}</TableCell>
                    <TableCell>{new Date(task.updated_at).toLocaleString("zh-CN")}</TableCell>
                    <TableCell>
                      <Button disabled={task.status !== "failed"} onClick={() => void retry(task.id)} size="sm" variant="outline">
                        <RotateCcwIcon data-icon="inline-start" />
                        Retry
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Provider status</CardTitle>
              <CardDescription>Current AI provider configuration snapshot.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {providers.map((provider) => (
                <div className="flex items-center justify-between gap-3" key={provider.provider_name}>
                  <span className="text-sm">{provider.provider_name}</span>
                  <Badge variant={provider.enabled ? "secondary" : "outline"}>{provider.enabled ? "enabled" : "disabled"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent AI / Provider errors</CardTitle>
            </CardHeader>
            <CardContent className="flex max-h-[28rem] flex-col gap-3 overflow-auto">
              {errors.map((error) => (
                <div className="rounded-lg border p-3 text-sm" key={error.id}>
                  <p className="font-medium">{error.event}</p>
                  <p className="mt-1 truncate text-muted-foreground">{JSON.stringify(error.metadata)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(error.created_at).toLocaleString("zh-CN")}</p>
                </div>
              ))}
              {!errors.length ? <p className="text-sm text-muted-foreground">No recent errors.</p> : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
