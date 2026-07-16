"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRightIcon, CreditCardIcon, RefreshCwIcon, WalletCardsIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrackPageView, trackProductEvent } from "@/components/product-event-tracker";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type BillingSummary = {
  profile: { email: string | null; display_name: string | null; credits_balance: number; status: string } | null;
  subscription: {
    id: string;
    status: string;
    started_at: string;
    expires_at: string | null;
    plans?: { name: string; description: string | null; price: number; credits: number; features: Record<string, unknown> } | null;
  } | null;
  credits: {
    balance: number;
    consumed: number;
    transactions: Array<{ id: string; amount: number; balance_after: number; reason: string; type: string | null; status: string | null; created_at: string }>;
    usage: Array<{ id: string; capability: string; provider: string | null; model: string | null; credits_charged: number; created_at: string }>;
  };
  availablePlans: Array<{ id: string; name: string; description: string | null; price: number; credits: number; features: Record<string, unknown> }>;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

async function authorizationHeader() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

export default function BillingDashboard() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [pendingPaymentId, setPendingPaymentId] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/billing", { headers: await authorizationHeader(), cache: "no-store" });
    if (!response.ok) {
      setMessage("Please sign in to view billing.");
      setLoading(false);
      return;
    }
    setSummary(await response.json());
    setLoading(false);
  }

  async function checkout(planId: string) {
    setMessage("");
    await trackProductEvent("upgrade_click", { planId }, "billing");
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { ...(await authorizationHeader()), "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId, provider: "mock" }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Unable to create checkout.");
      return;
    }
    setPendingPaymentId(payload.payment.id);
    setCheckoutUrl(payload.payment.checkout_url ?? "");
    setMessage("Checkout created. Mock checkout is ready to verify.");
  }

  async function verifyCheckout() {
    if (!pendingPaymentId) return;
    const response = await fetch(`/api/payments/${pendingPaymentId}/verify`, {
      method: "POST",
      headers: await authorizationHeader(),
    });
    setMessage(response.ok ? "Payment verified and subscription activated." : "Unable to verify payment.");
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  const plan = summary?.subscription?.plans;
  const monthlyCredits = plan?.credits ?? Math.max(summary?.credits.balance ?? 0, 1);
  const usedPercent = useMemo(() => {
    if (!summary) return 0;
    const total = summary.credits.balance + summary.credits.consumed;
    return total > 0 ? Math.min(100, Math.round((summary.credits.consumed / total) * 100)) : 0;
  }, [summary]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <TrackPageView eventName="billing_view" surface="billing" properties={{ page: "dashboard_billing" }} />
      <TrackPageView eventName="pricing_view" surface="billing" properties={{ page: "dashboard_billing" }} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Billing</p>
          <h1 className="text-3xl font-semibold">Subscription and Credits</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your plan, balance, and credit consumption.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      {message && <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p>}

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current plan</CardTitle>
            <CardDescription>{plan?.description ?? "No active subscription yet."}</CardDescription>
            <CardAction>
              <Badge variant={summary?.subscription?.status === "active" ? "secondary" : "outline"}>
                {summary?.subscription?.status ?? "none"}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-2xl font-semibold">{plan?.name ?? "Free"}</p>
            <p className="text-sm text-muted-foreground">
              {summary?.subscription ? `Started ${formatDate(summary.subscription.started_at)}` : "Upgrade when you are ready."}
            </p>
            <p className="text-sm text-muted-foreground">Expires {formatDate(summary?.subscription?.expires_at)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credits balance</CardTitle>
            <CardDescription>Available generation budget.</CardDescription>
            <CardAction>
              <WalletCardsIcon />
            </CardAction>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary?.credits.balance ?? "-"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{summary?.credits.consumed ?? 0} credits consumed recently.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>Recent credit consumption.</CardDescription>
            <CardAction>
              <CreditCardIcon />
            </CardAction>
          </CardHeader>
          <CardContent>
            <Progress value={usedPercent}>
              <ProgressLabel>{usedPercent}% used</ProgressLabel>
            </Progress>
            <p className="mt-2 text-sm text-muted-foreground">
              {summary?.credits.consumed ?? 0} spent. Plan allowance reference: {monthlyCredits} credits.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Credit transactions</CardTitle>
            <CardDescription>Subscription grants, reservations, commits, and refunds.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary?.credits.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.created_at)}</TableCell>
                    <TableCell>{transaction.type ?? "credit"}</TableCell>
                    <TableCell>{transaction.reason}</TableCell>
                    <TableCell>{transaction.amount}</TableCell>
                    <TableCell>{transaction.balance_after}</TableCell>
                  </TableRow>
                ))}
                {!summary?.credits.transactions.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No credit transactions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upgrade plan</CardTitle>
            <CardDescription>Checkout is prepared in the payment module; this entry is ready for activation.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {summary?.availablePlans.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{item.name}</p>
                  <Badge variant="outline">${Number(item.price).toFixed(2)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.credits} credits included</p>
              </div>
            ))}
            {!summary?.availablePlans.length && <p className="text-sm text-muted-foreground">No paid plans are available yet.</p>}
            {summary?.availablePlans.map((item) => (
              <Button key={item.id} variant="outline" onClick={() => void checkout(item.id)}>
                <ArrowUpRightIcon data-icon="inline-start" />
                Checkout {item.name}
              </Button>
            ))}
            {checkoutUrl && <p className="text-sm text-muted-foreground">Checkout URL: {checkoutUrl}</p>}
            <Button onClick={() => void verifyCheckout()} disabled={!pendingPaymentId}>
              Verify mock payment
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
