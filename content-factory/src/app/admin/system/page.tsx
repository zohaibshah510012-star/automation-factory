"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangleIcon, CheckCircle2Icon, RefreshCwIcon, ServerCogIcon, XCircleIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Status = "READY" | "WARNING" | "ERROR";
type DiagnosticItem = { name: string; status: Status; reason: string; details?: Record<string, unknown> };
type Diagnostics = { overall: Status; checks: DiagnosticItem[]; generatedAt: string };

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function statusVariant(status: Status) {
  if (status === "ERROR") return "destructive" as const;
  if (status === "WARNING") return "outline" as const;
  return "secondary" as const;
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "READY") return <CheckCircle2Icon className="size-4 text-green-600" />;
  if (status === "WARNING") return <AlertTriangleIcon className="size-4 text-amber-600" />;
  return <XCircleIcon className="size-4 text-destructive" />;
}

export default function AdminSystemPage() {
  const [data, setData] = useState<Diagnostics | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/system", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      setMessage("Unable to load system diagnostics.");
      return;
    }
    setData(await response.json());
    setMessage("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Production Operations</p>
          <h1 className="text-3xl font-semibold">System Diagnostics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Database, Supabase, providers, payment, email, webhooks, cron, and environment readiness.</p>
        </div>
        <Button onClick={() => void load()} variant="outline">
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      {message ? <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Overall status</CardTitle>
          <CardDescription>{data?.generatedAt ? `Generated at ${new Date(data.generatedAt).toLocaleString("zh-CN")}` : "Loading diagnostics."}</CardDescription>
          <CardAction><ServerCogIcon /></CardAction>
        </CardHeader>
        <CardContent>
          <Badge variant={statusVariant(data?.overall ?? "WARNING")}>{data?.overall ?? "WARNING"}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Component checks</CardTitle>
          <CardDescription>READY means production-ready, WARNING means launch review needed, ERROR means fix before launch.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.checks.map((check) => (
                <TableRow key={check.name}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2"><StatusIcon status={check.status} />{check.name}</span>
                  </TableCell>
                  <TableCell><Badge variant={statusVariant(check.status)}>{check.status}</Badge></TableCell>
                  <TableCell>{check.reason}</TableCell>
                  <TableCell className="max-w-80 truncate text-muted-foreground">{check.details ? JSON.stringify(check.details) : "-"}</TableCell>
                </TableRow>
              ))}
              {!data?.checks.length ? (
                <TableRow><TableCell colSpan={4} className="text-muted-foreground">No diagnostics loaded.</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
