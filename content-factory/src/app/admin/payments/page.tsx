"use client";

import { useEffect, useState } from "react";
import { RefreshCwIcon, SaveIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Provider = { id: string; provider: "mock" | "stripe" | "paypal"; enabled: boolean; mode: "sandbox" | "production"; status: string };
type Payment = { id: string; provider: string; amount: number; currency: string; status: string; checkout_url: string | null; created_at: string; profiles?: { email?: string | null } | null; plans?: { name?: string | null } | null };
type Event = { id: string; provider: string; event_type: string; status: string; created_at: string };

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}`, "Content-Type": "application/json" };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function AdminPaymentsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const headers = await authHeaders();
    const [providerResponse, paymentResponse] = await Promise.all([
      fetch("/api/admin/payments/providers", { headers, cache: "no-store" }),
      fetch("/api/admin/payments", { headers, cache: "no-store" }),
    ]);
    if (!providerResponse.ok || !paymentResponse.ok) {
      location.assign("/");
      return;
    }
    const providerData = await providerResponse.json();
    const paymentData = await paymentResponse.json();
    setProviders(providerData.providers ?? []);
    setPayments(paymentData.payments ?? []);
    setEvents(paymentData.events ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(provider: Provider, patch: Partial<Provider>) {
    const response = await fetch(`/api/admin/payments/providers/${provider.id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify(patch),
    });
    setMessage(response.ok ? "Payment provider updated." : "Unable to update payment provider.");
    await load();
  }

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Payment Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure payment provider status without storing secrets.</p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>
      {message && <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p>}

      <section className="grid gap-4 md:grid-cols-3">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardHeader>
              <CardTitle>{provider.provider}</CardTitle>
              <CardDescription>No API key, token, or secret is stored here.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Badge variant={provider.enabled ? "secondary" : "outline"}>{provider.status}</Badge>
              <select
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                value={provider.mode}
                onChange={(event) => void save(provider, { mode: event.target.value as Provider["mode"] })}
              >
                <option value="sandbox">sandbox</option>
                <option value="production">production</option>
              </select>
              <Button
                variant={provider.enabled ? "destructive" : "default"}
                onClick={() => void save(provider, { enabled: !provider.enabled, status: provider.enabled ? "disabled" : "configured" })}
              >
                <SaveIcon data-icon="inline-start" />
                {provider.enabled ? "Disable" : "Enable"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Recent checkout records and provider state.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.profiles?.email ?? "unknown"}</TableCell>
                  <TableCell>{payment.plans?.name ?? "-"}</TableCell>
                  <TableCell>{payment.provider}</TableCell>
                  <TableCell>
                    {payment.currency} {Number(payment.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>{payment.status}</TableCell>
                  <TableCell>{formatDate(payment.created_at)}</TableCell>
                </TableRow>
              ))}
              {!payments.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    No payments yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Events</CardTitle>
          <CardDescription>Webhook and verification event trail.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>{event.event_type}</span>
                  <Badge variant="outline">{event.status}</Badge>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {event.provider} - {formatDate(event.created_at)}
                </p>
              </div>
            ))}
            {!events.length && <p className="text-sm text-muted-foreground">No payment events yet.</p>}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
