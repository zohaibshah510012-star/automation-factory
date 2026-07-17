"use client";

import { useEffect, useState } from "react";
import {
  ActivityIcon,
  AlertTriangleIcon,
  BarChart3Icon,
  CoinsIcon,
  HeartPulseIcon,
  RefreshCwIcon,
  SparklesIcon,
  TargetIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type LifecycleStatus = "NEW" | "ACTIVATED" | "ENGAGED" | "POWER_USER" | "AT_RISK";
type BetaOperationalStatus = "invited" | "active" | "completed" | "churned";

type BetaUser = {
  id: string;
  email: string | null;
  registeredAt: string;
  firstGenerationAt: string | null;
  timeToFirstValueMinutes: number | null;
  inviteSource: string;
  latestActivity: string | null;
  betaStatus: BetaOperationalStatus;
  betaStatusNote: string | null;
  betaStatusUpdatedAt: string | null;
  currentPlan: string;
  subscriptionStatus: string;
  lifecycleStatus: LifecycleStatus;
  betaHealthScore: number;
  generationCount: number;
  completedGenerations: number;
  workflowsUsed: string[];
  creditsConsumed: number;
  returnVisits: number;
  feedbackCount: number;
  upgradeIntent: number;
  activationChecklist: {
    signupCompleted: boolean;
    workspaceCreated: boolean;
    firstGenerationStarted: boolean;
    firstGenerationCompleted: boolean;
    feedbackSubmitted: boolean;
  };
};

type BetaInsights = {
  users: BetaUser[];
  activation: {
    registeredUsers: number;
    signupCompletedUsers: number;
    workspaceCreatedUsers: number;
    firstGenerationStartedUsers: number;
    firstGenerationCompletedUsers: number;
    feedbackSubmittedUsers: number;
    firstGenerationCompletionRate: number;
    averageFirstGenerationTimeMinutes: number;
  };
  usage: {
    totalGenerations: number;
    byType: { text: number; image: number; video: number };
    creditsConsumed: number;
  };
  retention: {
    returnedWithinSevenDays: number;
    activeUsers: number;
  };
  revenueReadiness: {
    plans: Array<{ plan: string; count: number }>;
    upgradeIntentRecords: number;
    upgradeClicks: number;
    billingFeedback: number;
  };
  experiment: {
    lifecycleCounts: Record<LifecycleStatus, number>;
    averageHealthScore: number;
    mostActive: BetaUser[];
    likelyToPay: BetaUser[];
    atRisk: BetaUser[];
  };
  feedbackIntelligence: {
    total: number;
    averageSatisfaction: number;
    averageResultQuality: number;
    recommendationRate: number;
    categories: Array<{ category: string; count: number }>;
    commonIssues: Array<{ issue: string; count: number }>;
    openCount: number;
  };
  generatedAt: string;
};

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function lifecycleVariant(status: LifecycleStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "POWER_USER") return "default";
  if (status === "ENGAGED" || status === "ACTIVATED") return "secondary";
  if (status === "AT_RISK") return "destructive";
  return "outline";
}

function betaStatusVariant(status: BetaOperationalStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "completed") return "default";
  if (status === "active") return "secondary";
  if (status === "churned") return "destructive";
  return "outline";
}

function healthTone(score: number) {
  if (score >= 75) return "text-emerald-600";
  if (score >= 45) return "text-amber-600";
  return "text-destructive";
}

function UserSignalList({ users, empty, signal }: { users: BetaUser[]; empty: string; signal: (user: BetaUser) => string }) {
  if (!users.length) return <p className="text-sm text-muted-foreground">{empty}</p>;

  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => (
        <div className="rounded-lg border bg-background/60 p-3" key={user.id}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.email ?? "Unknown user"}</p>
              <p className="mt-1 text-xs text-muted-foreground">{signal(user)}</p>
            </div>
            <div className={`shrink-0 text-sm font-semibold ${healthTone(user.betaHealthScore)}`}>
              {user.betaHealthScore}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={lifecycleVariant(user.lifecycleStatus)}>{user.lifecycleStatus}</Badge>
            <Badge variant="outline">{user.generationCount} gens</Badge>
            <Badge variant="outline">{user.creditsConsumed} credits</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BetaInsightsPage() {
  const [data, setData] = useState<BetaInsights | null>(null);
  const [message, setMessage] = useState("");
  const [statusNote, setStatusNote] = useState("");

  async function load() {
    const response = await fetch("/api/admin/beta-insights", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      setMessage("Unable to load Beta insights.");
      if (response.status === 403) location.assign("/");
      return;
    }
    setData(await response.json());
    setMessage("");
  }

  async function updateBetaStatus(userId: string, status: BetaOperationalStatus) {
    const response = await fetch("/api/admin/beta-insights", {
      method: "PATCH",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status, note: statusNote }),
    });
    setMessage(response.ok ? "Beta user status updated." : "Unable to update Beta user status.");
    if (response.ok) setStatusNote("");
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  const metrics = [
    {
      label: "Registered",
      value: data?.activation.registeredUsers ?? "-",
      helper: "Beta users",
      icon: UsersIcon,
    },
    {
      label: "Activated",
      value: data?.activation.firstGenerationCompletedUsers ?? "-",
      helper: `${data?.activation.firstGenerationCompletionRate ?? 0}% first-gen rate`,
      icon: TrendingUpIcon,
    },
    {
      label: "Avg first-gen time",
      value: `${data?.activation.averageFirstGenerationTimeMinutes ?? 0}m`,
      helper: "signup to completion",
      icon: ActivityIcon,
    },
    {
      label: "Generations",
      value: data?.usage.totalGenerations ?? "-",
      helper: `${data?.usage.byType.text ?? 0} text / ${data?.usage.byType.image ?? 0} image / ${data?.usage.byType.video ?? 0} video`,
      icon: BarChart3Icon,
    },
    {
      label: "Credits",
      value: data?.usage.creditsConsumed ?? "-",
      helper: "consumed by Beta users",
      icon: CoinsIcon,
    },
    {
      label: "Health score",
      value: data?.experiment.averageHealthScore ?? "-",
      helper: "avg Beta health",
      icon: HeartPulseIcon,
    },
    {
      label: "Revenue signals",
      value: data?.revenueReadiness.upgradeIntentRecords ?? "-",
      helper: `${data?.revenueReadiness.upgradeClicks ?? 0} clicks / ${data?.revenueReadiness.billingFeedback ?? 0} feedback`,
      icon: TrendingUpIcon,
    },
  ];

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Beta Operations</p>
          <h1 className="text-3xl font-semibold">Beta Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Activation, usage, retention, and revenue-readiness metrics for the first Beta cohort.
          </p>
        </div>
        <Button onClick={() => void load()} variant="outline">
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      {message ? <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-sm">{metric.label}</CardTitle>
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

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Activation funnel</CardTitle>
            <CardDescription>Core Beta activation milestones from signup to feedback.</CardDescription>
            <CardAction>
              <TargetIcon />
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ["Signup completed", data?.activation.signupCompletedUsers ?? 0],
              ["Workspace created", data?.activation.workspaceCreatedUsers ?? 0],
              ["First generation started", data?.activation.firstGenerationStartedUsers ?? 0],
              ["First generation completed", data?.activation.firstGenerationCompletedUsers ?? 0],
              ["Feedback submitted", data?.activation.feedbackSubmittedUsers ?? 0],
            ].map(([label, value]) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2" key={label}>
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feedback intelligence</CardTitle>
            <CardDescription>Quality, speed, usability, use case, and payment-intent signals.</CardDescription>
            <CardAction>
              <HeartPulseIcon />
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Avg score</p>
                  <p className="text-2xl font-semibold">{data?.feedbackIntelligence.averageSatisfaction ?? 0}/5</p>
                </div>
                <div className="rounded-lg border bg-background/60 p-3">
                  <p className="text-xs text-muted-foreground">Recommend rate</p>
                  <p className="text-2xl font-semibold">{data?.feedbackIntelligence.recommendationRate ?? 0}%</p>
                </div>
              </div>
              {(data?.feedbackIntelligence.categories ?? []).map((item) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2" key={item.category}>
                  <span className="text-sm text-muted-foreground">{item.category}</span>
                  <span className="text-sm font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-3">
              <div className="rounded-lg border bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Avg result quality</p>
                <p className="text-2xl font-semibold">{data?.feedbackIntelligence.averageResultQuality ?? 0}/5</p>
                <p className="mt-1 text-xs text-muted-foreground">{data?.feedbackIntelligence.openCount ?? 0} open feedback items</p>
              </div>
              {(data?.feedbackIntelligence.commonIssues ?? []).map((item) => (
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2" key={item.issue}>
                  <span className="text-sm text-muted-foreground">{item.issue}</span>
                  <span className="text-sm font-semibold">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lifecycle distribution</CardTitle>
            <CardDescription>Where Beta users sit in the experiment funnel.</CardDescription>
            <CardAction>
              <TargetIcon />
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {(["NEW", "ACTIVATED", "ENGAGED", "POWER_USER", "AT_RISK"] as LifecycleStatus[]).map((status) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2" key={status}>
                <Badge variant={lifecycleVariant(status)}>{status}</Badge>
                <span className="text-sm font-semibold">{data?.experiment.lifecycleCounts[status] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most active users</CardTitle>
            <CardDescription>Highest usage and strongest engagement signals.</CardDescription>
            <CardAction>
              <SparklesIcon />
            </CardAction>
          </CardHeader>
          <CardContent>
            <UserSignalList
              empty="No active Beta users yet."
              signal={(user) => `${user.completedGenerations} completed / ${user.returnVisits} return visits`}
              users={data?.experiment.mostActive ?? []}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Likely to pay</CardTitle>
            <CardDescription>Upgrade intent ranked by clicks, feedback, and credits demand.</CardDescription>
            <CardAction>
              <TrendingUpIcon />
            </CardAction>
          </CardHeader>
          <CardContent>
            <UserSignalList
              empty="No upgrade-intent signals yet."
              signal={(user) => `${user.upgradeIntent} upgrade signals / ${user.currentPlan} plan`}
              users={data?.experiment.likelyToPay ?? []}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>At-risk users</CardTitle>
          <CardDescription>Activated users with low recent activity or weak Beta Health Score.</CardDescription>
          <CardAction>
            <AlertTriangleIcon />
          </CardAction>
        </CardHeader>
        <CardContent>
          <UserSignalList
            empty="No at-risk users detected."
            signal={(user) => `Last activity ${formatDate(user.latestActivity)} / ${user.feedbackCount} feedback items`}
            users={data?.experiment.atRisk ?? []}
          />
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader>
            <CardTitle>Beta users</CardTitle>
            <CardDescription>Email, invite source, recent activity, plan, and usage signals.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-2 md:grid-cols-[1fr_auto]">
              <Input
                onChange={(event) => setStatusNote(event.target.value)}
                placeholder="Optional status note, e.g. scheduled interview / needs help with video"
                value={statusNote}
              />
              <p className="self-center text-xs text-muted-foreground">Applied to the next status change.</p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Beta status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>First generation</TableHead>
                  <TableHead>TTFV</TableHead>
                  <TableHead>Invite source</TableHead>
                  <TableHead>Recent activity</TableHead>
                  <TableHead>Workflows</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Lifecycle</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Generations</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Returns</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Upgrade intent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="max-w-56 truncate">{user.email ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex min-w-36 flex-col gap-2">
                        <Badge className="w-fit" variant={betaStatusVariant(user.betaStatus)}>{user.betaStatus}</Badge>
                        <select
                          className="h-8 rounded-lg border bg-background px-2 text-xs"
                          onChange={(event) => void updateBetaStatus(user.id, event.target.value as BetaOperationalStatus)}
                          value={user.betaStatus}
                        >
                          <option value="invited">invited</option>
                          <option value="active">active</option>
                          <option value="completed">completed</option>
                          <option value="churned">churned</option>
                        </select>
                        {user.betaStatusNote ? <span className="max-w-44 truncate text-xs text-muted-foreground">{user.betaStatusNote}</span> : null}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.registeredAt)}</TableCell>
                    <TableCell>{formatDate(user.firstGenerationAt)}</TableCell>
                    <TableCell>{user.timeToFirstValueMinutes === null ? "-" : `${user.timeToFirstValueMinutes}m`}</TableCell>
                    <TableCell className="max-w-48 truncate">{user.inviteSource}</TableCell>
                    <TableCell>{formatDate(user.latestActivity)}</TableCell>
                    <TableCell className="max-w-56">
                      <div className="flex flex-wrap gap-1">
                        {user.workflowsUsed.length ? user.workflowsUsed.map((workflow) => (
                          <Badge key={workflow} variant="outline">{workflow}</Badge>
                        )) : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{user.currentPlan}</span>
                        <Badge className="w-fit" variant={user.subscriptionStatus === "active" ? "secondary" : "outline"}>
                          {user.subscriptionStatus}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={lifecycleVariant(user.lifecycleStatus)}>{user.lifecycleStatus}</Badge>
                    </TableCell>
                    <TableCell className={`font-semibold ${healthTone(user.betaHealthScore)}`}>{user.betaHealthScore}</TableCell>
                    <TableCell>{user.generationCount}</TableCell>
                    <TableCell>{user.creditsConsumed}</TableCell>
                    <TableCell>{user.returnVisits}</TableCell>
                    <TableCell>{user.feedbackCount}</TableCell>
                    <TableCell>{user.upgradeIntent}</TableCell>
                  </TableRow>
                ))}
                {!data?.users.length ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={16}>No Beta users yet.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Retention</CardTitle>
              <CardDescription>Signals that Beta users came back after the first moment.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">7-day returned users</span>
                <span className="text-lg font-semibold">{data?.retention.returnedWithinSevenDays ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">Active users</span>
                <span className="text-lg font-semibold">{data?.retention.activeUsers ?? 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue readiness</CardTitle>
              <CardDescription>Plans and upgrade-intent signals from clicks and feedback.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {data?.revenueReadiness.plans.map((plan) => (
                <div className="flex items-center justify-between gap-3" key={plan.plan}>
                  <span className="text-sm text-muted-foreground">{plan.plan}</span>
                  <span className="text-sm font-medium">{plan.count}</span>
                </div>
              ))}
              {!data?.revenueReadiness.plans.length ? <p className="text-sm text-muted-foreground">No plan data yet.</p> : null}
              <div className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                Upgrade intent = upgrade clicks + billing/plan/credits feedback mentions.
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
