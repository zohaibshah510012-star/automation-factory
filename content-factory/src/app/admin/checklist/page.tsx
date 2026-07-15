"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCheckIcon, RefreshCwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Status = "READY" | "WARNING" | "ERROR";
type ChecklistRow = { item: string; status: Status; reason: string };
type Checklist = { overall: Status; checklist: ChecklistRow[]; generatedAt: string };

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function statusVariant(status: Status) {
  if (status === "ERROR") return "destructive" as const;
  if (status === "WARNING") return "outline" as const;
  return "secondary" as const;
}

export default function AdminChecklistPage() {
  const [data, setData] = useState<Checklist | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/checklist", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      setMessage("Unable to load production checklist.");
      return;
    }
    setData(await response.json());
    setMessage("");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const rows = data?.checklist ?? [];
    return {
      ready: rows.filter((row) => row.status === "READY").length,
      warning: rows.filter((row) => row.status === "WARNING").length,
      error: rows.filter((row) => row.status === "ERROR").length,
    };
  }, [data]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Production Operations</p>
          <h1 className="text-3xl font-semibold">Production Checklist</h1>
          <p className="mt-1 text-sm text-muted-foreground">Automated launch checks for migration, environment, provider, payment, security, cron, webhook, and backup readiness.</p>
        </div>
        <Button onClick={() => void load()} variant="outline">
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      {message ? <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Overall</CardTitle><CardAction><ClipboardCheckIcon /></CardAction></CardHeader>
          <CardContent><Badge variant={statusVariant(data?.overall ?? "WARNING")}>{data?.overall ?? "WARNING"}</Badge></CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Ready</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{summary.ready}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Warning</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{summary.warning}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{summary.error}</p></CardContent></Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Checklist items</CardTitle>
          <CardDescription>{data?.generatedAt ? `Generated at ${new Date(data.generatedAt).toLocaleString("zh-CN")}` : "Loading checklist."}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Check</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.checklist.map((row) => (
                <TableRow key={row.item}>
                  <TableCell className="font-medium">{row.item}</TableCell>
                  <TableCell><Badge variant={statusVariant(row.status)}>{row.status}</Badge></TableCell>
                  <TableCell>{row.reason}</TableCell>
                </TableRow>
              ))}
              {!data?.checklist.length ? (
                <TableRow><TableCell colSpan={3} className="text-muted-foreground">No checklist data loaded.</TableCell></TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
