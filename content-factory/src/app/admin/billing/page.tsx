"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CoinsIcon, PencilIcon, PlusIcon, RefreshCwIcon, SaveIcon, ToggleLeftIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  credits: number;
  features: Record<string, unknown>;
  enabled: boolean;
  created_at: string;
};

type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  created_at: string;
  profiles?: { email?: string | null; display_name?: string | null; credits_balance?: number | null } | null;
  plans?: { name?: string | null; credits?: number | null; price?: number | null } | null;
};

type CreditAccount = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  status: string;
  credits_balance: number;
  created_at: string;
};

type CreditTransaction = {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  reason: string;
  type: string | null;
  status: string | null;
  subscription_id: string | null;
  created_at: string;
};

const emptyPlan = {
  name: "",
  description: "",
  price: "0",
  credits: "0",
  features: "{}",
  enabled: true,
};

const statuses = ["active", "trialing", "past_due", "canceled", "expired"];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function userLabel(user?: { email?: string | null; display_name?: string | null } | null, fallback?: string) {
  return user?.email || user?.display_name || fallback || "Unknown user";
}

export default function AdminBillingPage() {
  const [token, setToken] = useState("");
  const [tab, setTab] = useState<"plans" | "subscriptions" | "credits">("plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [accounts, setAccounts] = useState<CreditAccount[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [subscriptionForm, setSubscriptionForm] = useState({ plan_id: "", status: "active", expires_at: "", note: "" });
  const [grantSubscriptionId, setGrantSubscriptionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token],
  );

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    void client?.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        location.assign("/");
        return;
      }
      setToken(accessToken);
    });
  }, []);

  async function load() {
    if (!token) return;
    setLoading(true);

    const [plansResponse, subscriptionsResponse, creditsResponse] = await Promise.all([
      fetch("/api/admin/billing/plans", { headers: authHeaders, cache: "no-store" }),
      fetch("/api/admin/billing/subscriptions", { headers: authHeaders, cache: "no-store" }),
      fetch("/api/admin/billing/credits", { headers: authHeaders, cache: "no-store" }),
    ]);

    if (!plansResponse.ok || !subscriptionsResponse.ok || !creditsResponse.ok) {
      location.assign("/");
      return;
    }

    const [plansData, subscriptionsData, creditsData] = await Promise.all([
      plansResponse.json(),
      subscriptionsResponse.json(),
      creditsResponse.json(),
    ]);

    setPlans(plansData.plans ?? []);
    setSubscriptions(subscriptionsData.subscriptions ?? []);
    setAccounts(creditsData.accounts ?? []);
    setTransactions(creditsData.transactions ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [token]);

  function editPlan(plan: Plan) {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      description: plan.description ?? "",
      price: String(plan.price ?? 0),
      credits: String(plan.credits ?? 0),
      features: JSON.stringify(plan.features ?? {}, null, 2),
      enabled: plan.enabled,
    });
  }

  async function savePlan(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    const endpoint = editingPlanId ? `/api/admin/billing/plans/${editingPlanId}` : "/api/admin/billing/plans";
    const method = editingPlanId ? "PATCH" : "POST";
    const response = await fetch(endpoint, { method, headers: authHeaders, body: JSON.stringify(planForm) });

    if (!response.ok) {
      setMessage("Unable to save plan.");
      return;
    }

    setPlanForm(emptyPlan);
    setEditingPlanId(null);
    setMessage("Plan saved.");
    await load();
  }

  async function disablePlan(planId: string) {
    setMessage("");
    const response = await fetch(`/api/admin/billing/plans/${planId}`, { method: "DELETE", headers: authHeaders });
    setMessage(response.ok ? "Plan disabled." : "Unable to disable plan.");
    await load();
  }

  function editSubscription(subscription: Subscription) {
    setEditingSubscription(subscription);
    setSubscriptionForm({
      plan_id: subscription.plan_id,
      status: subscription.status,
      expires_at: subscription.expires_at ? subscription.expires_at.slice(0, 10) : "",
      note: "",
    });
  }

  async function saveSubscription(event: FormEvent) {
    event.preventDefault();
    if (!editingSubscription) return;

    const response = await fetch(`/api/admin/billing/subscriptions/${editingSubscription.id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify(subscriptionForm),
    });

    if (!response.ok) {
      setMessage("Unable to update subscription.");
      return;
    }

    setEditingSubscription(null);
    setSubscriptionForm({ plan_id: "", status: "active", expires_at: "", note: "" });
    setMessage("Subscription updated.");
    await load();
  }

  async function grantCredits() {
    if (!grantSubscriptionId) {
      setMessage("Select a subscription first.");
      return;
    }

    const response = await fetch("/api/admin/billing/credits", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ subscription_id: grantSubscriptionId }),
    });

    setMessage(response.ok ? "Subscription credits granted." : "Unable to grant credits.");
    await load();
  }

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === "active");

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Billing Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage plans, subscriptions, and subscription credit grants.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["plans", "subscriptions", "credits"] as const).map((item) => (
          <Button key={item} variant={tab === item ? "default" : "outline"} onClick={() => setTab(item)}>
            {item[0].toUpperCase() + item.slice(1)}
          </Button>
        ))}
      </div>

      {message && <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p>}

      {tab === "plans" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <Card>
            <CardHeader>
              <CardTitle>Plans</CardTitle>
              <CardDescription>Commercial packaging and included credits.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>{plan.name}</TableCell>
                      <TableCell>${Number(plan.price).toFixed(2)}</TableCell>
                      <TableCell>{plan.credits}</TableCell>
                      <TableCell>
                        <Badge variant={plan.enabled ? "secondary" : "outline"}>{plan.enabled ? "enabled" : "disabled"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => editPlan(plan)}>
                            <PencilIcon data-icon="inline-start" />
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => void disablePlan(plan.id)} disabled={!plan.enabled}>
                            <ToggleLeftIcon data-icon="inline-start" />
                            Disable
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!plans.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        No plans yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{editingPlanId ? "Edit plan" : "Create plan"}</CardTitle>
              <CardDescription>Features must be valid JSON.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-3" onSubmit={savePlan}>
                <Input placeholder="Name" value={planForm.name} onChange={(event) => setPlanForm({ ...planForm, name: event.target.value })} />
                <Input
                  placeholder="Description"
                  value={planForm.description}
                  onChange={(event) => setPlanForm({ ...planForm, description: event.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price"
                    value={planForm.price}
                    onChange={(event) => setPlanForm({ ...planForm, price: event.target.value })}
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Credits"
                    value={planForm.credits}
                    onChange={(event) => setPlanForm({ ...planForm, credits: event.target.value })}
                  />
                </div>
                <Textarea value={planForm.features} onChange={(event) => setPlanForm({ ...planForm, features: event.target.value })} />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={planForm.enabled}
                    onChange={(event) => setPlanForm({ ...planForm, enabled: event.target.checked })}
                  />
                  Enabled
                </label>
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingPlanId ? <SaveIcon data-icon="inline-start" /> : <PlusIcon data-icon="inline-start" />}
                    {editingPlanId ? "Save" : "Create"}
                  </Button>
                  {editingPlanId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingPlanId(null);
                        setPlanForm(emptyPlan);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "subscriptions" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
              <CardDescription>Admin adjustments are written to subscription adjustments and audit logs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>{userLabel(subscription.profiles, subscription.user_id)}</TableCell>
                      <TableCell>{subscription.plans?.name ?? subscription.plan_id}</TableCell>
                      <TableCell>
                        <Badge variant={subscription.status === "active" ? "secondary" : "outline"}>{subscription.status}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(subscription.started_at)}</TableCell>
                      <TableCell>{formatDate(subscription.expires_at)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => editSubscription(subscription)}>
                          <PencilIcon data-icon="inline-start" />
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!subscriptions.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No subscriptions yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adjust subscription</CardTitle>
              <CardDescription>{editingSubscription ? userLabel(editingSubscription.profiles) : "Select a subscription."}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-3" onSubmit={saveSubscription}>
                <select
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                  disabled={!editingSubscription}
                  value={subscriptionForm.plan_id}
                  onChange={(event) => setSubscriptionForm({ ...subscriptionForm, plan_id: event.target.value })}
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
                <select
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                  disabled={!editingSubscription}
                  value={subscriptionForm.status}
                  onChange={(event) => setSubscriptionForm({ ...subscriptionForm, status: event.target.value })}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <Input
                  type="date"
                  disabled={!editingSubscription}
                  value={subscriptionForm.expires_at}
                  onChange={(event) => setSubscriptionForm({ ...subscriptionForm, expires_at: event.target.value })}
                />
                <Textarea
                  disabled={!editingSubscription}
                  placeholder="Adjustment note"
                  value={subscriptionForm.note}
                  onChange={(event) => setSubscriptionForm({ ...subscriptionForm, note: event.target.value })}
                />
                <Button type="submit" disabled={!editingSubscription}>
                  <SaveIcon data-icon="inline-start" />
                  Save adjustment
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "credits" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          <Card>
            <CardHeader>
              <CardTitle>User balances</CardTitle>
              <CardDescription>Current profile credit balances.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>{userLabel(account, account.id)}</TableCell>
                      <TableCell>{account.status}</TableCell>
                      <TableCell>{account.credits_balance}</TableCell>
                    </TableRow>
                  ))}
                  {!accounts.length && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        No users yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Grant subscription credits</CardTitle>
                <CardDescription>Uses the idempotent billing RPC, never direct balance edits.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <select
                  className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={grantSubscriptionId}
                  onChange={(event) => setGrantSubscriptionId(event.target.value)}
                >
                  <option value="">Select active subscription</option>
                  {activeSubscriptions.map((subscription) => (
                    <option key={subscription.id} value={subscription.id}>
                      {userLabel(subscription.profiles, subscription.user_id)} - {subscription.plans?.name ?? subscription.plan_id}
                    </option>
                  ))}
                </select>
                <Button onClick={() => void grantCredits()}>
                  <CoinsIcon data-icon="inline-start" />
                  Grant credits
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent credit transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex max-h-80 flex-col gap-2 overflow-auto">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span>{transaction.type ?? "credit"}</span>
                        <Badge variant={transaction.amount >= 0 ? "secondary" : "outline"}>{transaction.amount}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{transaction.reason}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Balance {transaction.balance_after} - {formatDate(transaction.created_at)}
                      </p>
                    </div>
                  ))}
                  {!transactions.length && <p className="text-sm text-muted-foreground">No credit transactions yet.</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
