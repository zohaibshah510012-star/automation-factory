"use client";

import { useEffect, useState } from "react";
import { RefreshCwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type FeedbackRow = {
  id: string;
  satisfaction: number;
  category: string;
  content_feedback: string | null;
  suggestion: string | null;
  source: string;
  status: string;
  created_at: string;
  profiles?: { email?: string | null; display_name?: string | null } | null;
  content_tasks?: { topic?: string | null; title?: string | null; task_type?: string | null; status?: string | null } | null;
};

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/feedback", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      location.assign("/");
      return;
    }
    setFeedback((await response.json()).feedback);
  }

  async function updateStatus(id: string, status: string) {
    const response = await fetch("/api/admin/feedback", {
      method: "PATCH",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setMessage(response.ok ? "Feedback status updated." : "Unable to update feedback.");
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Customer Validation</p>
          <h1 className="text-3xl font-semibold">User Feedback</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review satisfaction, content feedback, and suggestions from users.</p>
        </div>
        <Button onClick={() => void load()} variant="outline">
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>
      {message ? <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p> : null}
      <Card>
        <CardHeader>
          <CardTitle>Feedback queue</CardTitle>
          <CardDescription>Newest feedback appears first.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Suggestion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.profiles?.email ?? item.profiles?.display_name ?? "-"}</TableCell>
                  <TableCell>{item.satisfaction}/5</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="max-w-48 truncate">{item.content_tasks?.title ?? item.content_tasks?.topic ?? "-"}</TableCell>
                  <TableCell className="max-w-64 whitespace-pre-wrap">{item.content_feedback ?? "-"}</TableCell>
                  <TableCell className="max-w-64 whitespace-pre-wrap">{item.suggestion ?? "-"}</TableCell>
                  <TableCell><Badge variant={item.status === "open" ? "secondary" : "outline"}>{item.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {["open", "reviewing", "resolved"].map((status) => (
                        <Button key={status} onClick={() => void updateStatus(item.id, status)} size="sm" variant="outline">
                          {status}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!feedback.length ? (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={8}>No feedback yet.</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
