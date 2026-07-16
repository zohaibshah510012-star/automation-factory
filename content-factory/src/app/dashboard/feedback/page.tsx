"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { MessageSquareIcon, SendIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TrackPageView } from "@/components/product-event-tracker";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

export default function FeedbackPage() {
  const [satisfaction, setSatisfaction] = useState(5);
  const [category, setCategory] = useState("short_drama");
  const [contentTaskId, setContentTaskId] = useState("");
  const [contentFeedback, setContentFeedback] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({
        satisfaction,
        category,
        content_task_id: contentTaskId.trim() || null,
        content_feedback: contentFeedback,
        suggestion,
        source: "dashboard_feedback",
      }),
    });
    setLoading(false);
    setMessage(response.ok ? "Thanks — your feedback is now in the Beta review queue." : "Feedback submission failed. Please sign in and try again.");
    if (response.ok) {
      setContentTaskId("");
      setContentFeedback("");
      setSuggestion("");
    }
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <TrackPageView surface="feedback" properties={{ page: "dashboard_feedback" }} />
      <header className="flex flex-col gap-3">
        <Badge className="w-fit" variant="secondary">Beta Feedback</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">How was your first AI production experience?</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Share a score, connect feedback to a task if relevant, and tell us what would make Automation Factory more useful for your real workflow.
        </p>
      </header>

      <Card>
        <CardHeader>
          <MessageSquareIcon />
          <CardTitle>Submit feedback</CardTitle>
          <CardDescription>Ratings, content quality notes, and product suggestions go directly to the admin Beta queue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-5" onSubmit={submit}>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="satisfaction">Score 1-5</label>
                <Input id="satisfaction" max={5} min={1} onChange={(event) => setSatisfaction(Number(event.target.value))} type="number" value={satisfaction} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="category">Category</label>
                <select className="h-8 rounded-lg border bg-background px-2 text-sm" id="category" onChange={(event) => setCategory(event.target.value)} value={category}>
                  <option value="short_drama">Short drama</option>
                  <option value="content_marketing">Content marketing</option>
                  <option value="image_generation">Image generation</option>
                  <option value="video_generation">Video generation</option>
                  <option value="billing">Billing / credits</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="content_task_id">Task ID optional</label>
                <Input id="content_task_id" onChange={(event) => setContentTaskId(event.target.value)} placeholder="Paste task id" value={contentTaskId} />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="content_feedback">Content feedback</label>
              <Textarea id="content_feedback" onChange={(event) => setContentFeedback(event.target.value)} placeholder="What was useful, inaccurate, slow, or not ready to use?" value={contentFeedback} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="suggestion">Suggestion</label>
              <Textarea id="suggestion" onChange={(event) => setSuggestion(event.target.value)} placeholder="What should we improve before public launch?" value={suggestion} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button disabled={loading} type="submit">
                <SendIcon data-icon="inline-start" />
                Submit feedback
              </Button>
              <Button render={<Link href="/dashboard/studio" />} type="button" variant="outline">
                Back to Studio
              </Button>
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
