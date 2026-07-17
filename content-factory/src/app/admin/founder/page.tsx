"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  BarChart3Icon,
  CheckCircle2Icon,
  ClipboardListIcon,
  CoinsIcon,
  FlagIcon,
  AlertTriangleIcon,
  MessageSquareTextIcon,
  RefreshCwIcon,
  RocketIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type FounderData = {
  setup: {
    targetUsers: number;
    hasActiveCohort: boolean;
    recommendedWorkflow: string;
    demoInvitePath: string;
    userJourney: string[];
    timingGoals: Array<{ label: string; goal: string }>;
  };
  cohorts: Array<{
    id: string;
    name: string;
    target_users: number;
    status: "draft" | "running" | "completed";
    description: string | null;
    progress: {
      invited: number;
      signup: number;
      firstGeneration: number;
      feedback: number;
      completed: number;
      targetUsers: number;
    };
  }>;
  metrics: {
    betaUsers: { invited: number; activated: number; completed: number; registered: number; target: number };
    product: {
      firstGenerationRate: number;
      completionRate: number;
      averageTimeToValueMinutes: number;
      mostUsedWorkflow: { name: string; count: number } | null;
      totalTasks: number;
      completedTasks: number;
      failedTasks: number;
    };
    business: {
      creditsUsed: number;
      estimatedCost: number;
      feedbackScore: number;
      resultQuality: number;
      upgradeInterest: number;
      feedbackCount: number;
    };
    latestActivity: string | null;
  };
  reviewNotes: {
    notes: Array<{
      id: string;
      userEmail: string | null;
      category: string;
      priority: string;
      note: string;
      status: "open" | "reviewing" | "resolved";
      created_at: string;
    }>;
    open: number;
    reviewing: number;
    resolved: number;
    byCategory: Array<{ category: string; count: number }>;
  };
  monitoring: {
    launchChecklist: Record<string, { passed: boolean; count: number }>;
    failedGenerations: Array<{
      id: string;
      userEmail: string | null;
      taskType: string;
      title: string;
      error: string;
      updatedAt: string;
    }>;
    recentErrors: Array<{
      id: string;
      event: string;
      userEmail: string | null;
      taskId: string | null;
      message: string;
      createdAt: string;
    }>;
    blockingPoints: Array<{
      stage: string;
      count: number;
      users: Array<{ email?: string | null; since: string }>;
    }>;
    feedbackLoop: {
      categories: Array<{ category: string; count: number }>;
      mostUsedWorkflow: { name: string; count: number } | null;
      biggestPainPoints: Array<{ category: string; priority: string; note: string; status: string }>;
      mostWantedCapabilities: Array<{ priority: string; note: string; status: string }>;
      willingnessToPaySignals: Array<{ source: string; priority: string; note: string; status: string }>;
    };
  };
  generatedAt: string;
};

type NoteForm = {
  category: "feedback" | "need" | "bug" | "feature_request" | "business_signal";
  priority: "low" | "medium" | "high";
  note: string;
};

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "-";
}

function percentLabel(value: number) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed" || status === "resolved") return "default";
  if (status === "running" || status === "reviewing") return "secondary";
  if (status === "high" || status === "open") return "destructive";
  return "outline";
}

export default function FounderBetaPage() {
  const [data, setData] = useState<FounderData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [noteForm, setNoteForm] = useState<NoteForm>({ category: "feedback", priority: "medium", note: "" });
  const [targetUsers, setTargetUsers] = useState("5");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/founder", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      if (response.status === 403) location.assign("/");
      setMessage("Unable to load Founder View.");
      setLoading(false);
      return;
    }
    setData(await response.json());
    setMessage("");
    setLoading(false);
  }

  async function createCohort() {
    const response = await fetch("/api/admin/founder", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_default_cohort", targetUsers: Number(targetUsers) || 5 }),
    });
    setMessage(response.ok ? "Founder Beta cohort created." : "Unable to create cohort.");
    await load();
  }

  async function createNote() {
    if (!noteForm.note.trim()) {
      setMessage("Write a review note before saving.");
      return;
    }
    const response = await fetch("/api/admin/founder", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_review_note", ...noteForm }),
    });
    setMessage(response.ok ? "Review note saved." : "Unable to save review note.");
    if (response.ok) setNoteForm({ category: "feedback", priority: "medium", note: "" });
    await load();
  }

  async function updateNoteStatus(id: string, status: FounderData["reviewNotes"]["notes"][number]["status"]) {
    const response = await fetch("/api/admin/founder", {
      method: "PATCH",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_review_note_status", noteId: id, status }),
    });
    setMessage(response.ok ? "Review note updated." : "Unable to update review note.");
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  const metricCards = useMemo(() => [
    { label: "Invited", value: data?.metrics.betaUsers.invited ?? "-", helper: `target ${data?.metrics.betaUsers.target ?? 5}`, icon: TicketIcon },
    { label: "Activated", value: data?.metrics.betaUsers.activated ?? "-", helper: `${percentLabel(data?.metrics.product.firstGenerationRate ?? 0)} first-gen rate`, icon: RocketIcon },
    { label: "Completed", value: data?.metrics.betaUsers.completed ?? "-", helper: "result + feedback", icon: CheckCircle2Icon },
    { label: "Time to value", value: `${data?.metrics.product.averageTimeToValueMinutes ?? 0}m`, helper: "signup to first result", icon: ActivityIcon },
    { label: "Credits used", value: data?.metrics.business.creditsUsed ?? "-", helper: `$${(data?.metrics.business.estimatedCost ?? 0).toFixed(2)} est. cost`, icon: CoinsIcon },
    { label: "Feedback score", value: `${data?.metrics.business.feedbackScore ?? 0}/5`, helper: `${data?.metrics.business.feedbackCount ?? 0} submissions`, icon: MessageSquareTextIcon },
    { label: "Upgrade signals", value: data?.metrics.business.upgradeInterest ?? "-", helper: "pricing + billing intent", icon: ArrowUpRightIcon },
  ], [data]);
  const launchChecklist = [
    ["Invite flow", data?.monitoring.launchChecklist.inviteToSignup],
    ["Signup completed", data?.monitoring.launchChecklist.signupCompleted],
    ["Workspace created", data?.monitoring.launchChecklist.workspaceCreated],
    ["First generation started", data?.monitoring.launchChecklist.firstGenerationStarted],
    ["First generation completed", data?.monitoring.launchChecklist.firstGenerationCompleted],
    ["Feedback submitted", data?.monitoring.launchChecklist.feedbackSubmitted],
    ["Founder view", data?.monitoring.launchChecklist.founderViewReady],
  ] as const;

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Founder Beta Run</p>
          <h1 className="text-3xl font-semibold">Founder View</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            One operating page for the first five users: invite them, get them to first value, collect evidence, and decide the next product bet.
          </p>
        </div>
        <Button onClick={() => void load()} variant="outline">
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      {message ? <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {metricCards.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-sm">{metric.label}</CardTitle>
              <CardDescription>{metric.helper}</CardDescription>
              <CardAction><metric.icon /></CardAction>
            </CardHeader>
            <CardContent><p className="text-3xl font-semibold">{loading ? "…" : metric.value}</p></CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Beta cohort setup</CardTitle>
            <CardDescription>Keep the experiment small and observable. The recommended test workflow is Short Drama.</CardDescription>
            <CardAction><UsersIcon /></CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Target users</p>
                <p className="mt-1 text-2xl font-semibold">{data?.setup.targetUsers ?? 5}</p>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Recommended workflow</p>
                <p className="mt-1 text-sm font-semibold">{data?.setup.recommendedWorkflow ?? "short_drama"}</p>
              </div>
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Latest activity</p>
                <p className="mt-1 text-sm font-semibold">{formatDate(data?.metrics.latestActivity)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/40 p-3">
              <label className="grid gap-1 text-sm">
                Cohort size
                <Input min={1} max={50} onChange={(event) => setTargetUsers(event.target.value)} type="number" value={targetUsers} />
              </label>
              <Button disabled={Boolean(data?.setup.hasActiveCohort)} onClick={() => void createCohort()}>
                <FlagIcon data-icon="inline-start" />
                {data?.setup.hasActiveCohort ? "Cohort ready" : "Create Founder Cohort"}
              </Button>
              <Button render={<a href={data?.setup.demoInvitePath ?? "/admin/beta"} />} variant="outline">
                <TicketIcon data-icon="inline-start" />
                Create Demo Invite
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-5">
              {(data?.setup.userJourney ?? ["Invite", "Signup", "Workspace", "First Generation", "Result", "Feedback"]).map((step, index) => (
                <div className="flex items-center gap-2 rounded-lg border bg-background/60 px-3 py-2 text-sm" key={step}>
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{index + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {(data?.setup.timingGoals ?? []).map((goal) => (
                <div className="rounded-lg border-l-2 border-primary bg-background/60 p-3" key={goal.label}>
                  <p className="text-sm font-semibold">{goal.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{goal.goal}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product signal</CardTitle>
            <CardDescription>Use this to decide whether the product is delivering first value without hand-holding.</CardDescription>
            <CardAction><BarChart3Icon /></CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              ["First generation rate", percentLabel(data?.metrics.product.firstGenerationRate ?? 0)],
              ["Task completion rate", percentLabel(data?.metrics.product.completionRate ?? 0)],
              ["Most used workflow", data?.metrics.product.mostUsedWorkflow ? `${data.metrics.product.mostUsedWorkflow.name} (${data.metrics.product.mostUsedWorkflow.count})` : "-"],
              ["Completed / failed tasks", `${data?.metrics.product.completedTasks ?? 0} / ${data?.metrics.product.failedTasks ?? 0}`],
              ["Result quality", `${data?.metrics.business.resultQuality ?? 0}/5`],
            ].map(([label, value]) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2" key={label}>
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Beta launch checklist</CardTitle>
            <CardDescription>Daily gate for invite, signup, workspace, generation, result, and feedback readiness.</CardDescription>
            <CardAction><CheckCircle2Icon /></CardAction>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {launchChecklist.map(([label, item]) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2" key={label}>
                <span className="text-sm text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={item?.passed ? "secondary" : "outline"}>{item?.count ?? 0}</Badge>
                  <span className={item?.passed ? "text-emerald-600" : "text-amber-600"}>{item?.passed ? "Ready" : "Watch"}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User blocking points</CardTitle>
            <CardDescription>Where invited Beta users are currently stuck in the first-session funnel.</CardDescription>
            <CardAction><AlertTriangleIcon /></CardAction>
          </CardHeader>
          <CardContent className="grid gap-3">
            {(data?.monitoring.blockingPoints ?? []).map((block) => (
              <div className="rounded-lg border bg-background/60 p-3" key={block.stage}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">{block.stage}</p>
                  <Badge variant={block.count ? "destructive" : "secondary"}>{block.count}</Badge>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {block.users.length ? block.users.map((user) => user.email ?? "Unknown user").join(", ") : "No users blocked here."}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Failed generations</CardTitle>
            <CardDescription>Recent failed Beta tasks that may block user activation.</CardDescription>
            <CardAction><AlertTriangleIcon /></CardAction>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-2">Updated</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Workflow</th>
                  <th className="p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {(data?.monitoring.failedGenerations ?? []).map((task) => (
                  <tr className="border-b align-top" key={task.id}>
                    <td className="whitespace-nowrap p-2">{formatDate(task.updatedAt)}</td>
                    <td className="p-2">{task.userEmail ?? "-"}</td>
                    <td className="p-2"><Badge variant="outline">{task.taskType}</Badge></td>
                    <td className="max-w-[24rem] whitespace-pre-wrap p-2">{task.error}</td>
                  </tr>
                ))}
                {!data?.monitoring.failedGenerations.length ? (
                  <tr><td className="p-3 text-muted-foreground" colSpan={4}>No failed Beta generations in the recent task window.</td></tr>
                ) : null}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent error logs</CardTitle>
            <CardDescription>Provider, task, and generation errors surfaced from system logs.</CardDescription>
            <CardAction><AlertTriangleIcon /></CardAction>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-2">Time</th>
                  <th className="p-2">Event</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Message</th>
                </tr>
              </thead>
              <tbody>
                {(data?.monitoring.recentErrors ?? []).map((log) => (
                  <tr className="border-b align-top" key={log.id}>
                    <td className="whitespace-nowrap p-2">{formatDate(log.createdAt)}</td>
                    <td className="p-2"><Badge variant="outline">{log.event}</Badge></td>
                    <td className="p-2">{log.userEmail ?? "-"}</td>
                    <td className="max-w-[24rem] whitespace-pre-wrap p-2">{log.message}</td>
                  </tr>
                ))}
                {!data?.monitoring.recentErrors.length ? (
                  <tr><td className="p-3 text-muted-foreground" colSpan={4}>No recent error logs for Beta users.</td></tr>
                ) : null}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[20rem_1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Feedback categories</CardTitle>
            <CardDescription>Founder notes grouped by decision type.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {(data?.monitoring.feedbackLoop.categories ?? []).map((item) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2" key={item.category}>
                <span className="text-sm text-muted-foreground">{item.category}</span>
                <span className="text-sm font-semibold">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biggest pain points</CardTitle>
            <CardDescription>Bugs, needs, and high-priority notes to review after each test.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(data?.monitoring.feedbackLoop.biggestPainPoints ?? []).map((item, index) => (
              <div className="rounded-lg border bg-background/60 p-3" key={`${item.note}-${index}`}>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="outline">{item.category}</Badge>
                  <Badge variant={statusVariant(item.priority)}>{item.priority}</Badge>
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.note}</p>
              </div>
            ))}
            {!data?.monitoring.feedbackLoop.biggestPainPoints.length ? <p className="text-sm text-muted-foreground">No pain-point notes yet.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature & payment signals</CardTitle>
            <CardDescription>Most wanted capabilities and willingness-to-pay evidence.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(data?.monitoring.feedbackLoop.mostWantedCapabilities ?? []).map((item, index) => (
              <div className="rounded-lg border bg-background/60 p-3" key={`feature-${index}`}>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant={statusVariant(item.priority)}>{item.priority}</Badge>
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.note}</p>
              </div>
            ))}
            {(data?.monitoring.feedbackLoop.willingnessToPaySignals ?? []).map((item, index) => (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-950 dark:bg-emerald-950/20" key={`pay-${index}`}>
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">{item.source}</Badge>
                  <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.note}</p>
              </div>
            ))}
            {!data?.monitoring.feedbackLoop.mostWantedCapabilities.length && !data?.monitoring.feedbackLoop.willingnessToPaySignals.length ? (
              <p className="text-sm text-muted-foreground">No feature or payment signals yet.</p>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Founder Beta cohorts</CardTitle>
            <CardDescription>Operational progress from invite to feedback.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-2">Cohort</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Invited</th>
                  <th className="p-2">Signup</th>
                  <th className="p-2">First value</th>
                  <th className="p-2">Feedback</th>
                  <th className="p-2">Completed</th>
                </tr>
              </thead>
              <tbody>
                {(data?.cohorts ?? []).map((cohort) => (
                  <tr className="border-b" key={cohort.id}>
                    <td className="p-2 font-medium">{cohort.name}</td>
                    <td className="p-2"><Badge variant={statusVariant(cohort.status)}>{cohort.status}</Badge></td>
                    <td className="p-2">{cohort.progress.invited}/{cohort.progress.targetUsers}</td>
                    <td className="p-2">{cohort.progress.signup}</td>
                    <td className="p-2">{cohort.progress.firstGeneration}</td>
                    <td className="p-2">{cohort.progress.feedback}</td>
                    <td className="p-2">{cohort.progress.completed}</td>
                  </tr>
                ))}
                {!data?.cohorts.length ? (
                  <tr><td className="p-3 text-muted-foreground" colSpan={7}>Create the Founder cohort, then add the first five invites from Beta Invitations.</td></tr>
                ) : null}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Experiment guardrails</CardTitle>
            <CardDescription>Keep the founder run focused on evidence, not scope expansion.</CardDescription>
            <CardAction><ClipboardListIcon /></CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>Use the Short Drama template as the default test workflow.</p>
            <p>Capture one review note for every meaningful bug, need, or commercial signal.</p>
            <p>Do not add providers or new publishing integrations during this run.</p>
            <p>Invite five users before making the next roadmap decision.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add review note</CardTitle>
            <CardDescription>Turn a conversation into an actionable evidence trail.</CardDescription>
            <CardAction><MessageSquareTextIcon /></CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <label className="grid gap-1 text-sm">
              Category
              <select className="h-9 rounded-lg border bg-background px-2" onChange={(event) => setNoteForm({ ...noteForm, category: event.target.value as NoteForm["category"] })} value={noteForm.category}>
                <option value="feedback">Feedback</option>
                <option value="need">Need</option>
                <option value="bug">Bug</option>
                <option value="feature_request">Feature request</option>
                <option value="business_signal">Business signal</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Priority
              <select className="h-9 rounded-lg border bg-background px-2" onChange={(event) => setNoteForm({ ...noteForm, priority: event.target.value as NoteForm["priority"] })} value={noteForm.priority}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <Textarea onChange={(event) => setNoteForm({ ...noteForm, note: event.target.value })} placeholder="What did the user say or do? What should we learn from it?" value={noteForm.note} />
            <Button onClick={() => void createNote()}>Save Review Note</Button>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-muted p-2"><p className="font-semibold">{data?.reviewNotes.open ?? 0}</p><p className="text-muted-foreground">open</p></div>
              <div className="rounded-lg bg-muted p-2"><p className="font-semibold">{data?.reviewNotes.reviewing ?? 0}</p><p className="text-muted-foreground">reviewing</p></div>
              <div className="rounded-lg bg-muted p-2"><p className="font-semibold">{data?.reviewNotes.resolved ?? 0}</p><p className="text-muted-foreground">resolved</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beta Review Notes</CardTitle>
            <CardDescription>Feedback, needs, bugs, feature requests, and commercial signals from the founder run.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-2">Created</th>
                  <th className="p-2">User</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Priority</th>
                  <th className="p-2">Note</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.reviewNotes.notes ?? []).map((note) => (
                  <tr className="border-b align-top" key={note.id}>
                    <td className="whitespace-nowrap p-2">{formatDate(note.created_at)}</td>
                    <td className="p-2">{note.userEmail ?? "-"}</td>
                    <td className="p-2"><Badge variant="outline">{note.category}</Badge></td>
                    <td className="p-2"><Badge variant={statusVariant(note.priority)}>{note.priority}</Badge></td>
                    <td className="max-w-[26rem] whitespace-pre-wrap p-2">{note.note}</td>
                    <td className="p-2">
                      <select className="h-8 rounded-lg border bg-background px-2 text-xs" onChange={(event) => void updateNoteStatus(note.id, event.target.value as FounderData["reviewNotes"]["notes"][number]["status"])} value={note.status}>
                        <option value="open">open</option>
                        <option value="reviewing">reviewing</option>
                        <option value="resolved">resolved</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {!data?.reviewNotes.notes.length ? (
                  <tr><td className="p-3 text-muted-foreground" colSpan={6}>No review notes yet. Add the first observation after the next Beta conversation.</td></tr>
                ) : null}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
