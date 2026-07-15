"use client";

import { useEffect, useState } from "react";
import { RefreshCwIcon, WalletCardsIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type AdminUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  status: "active" | "frozen";
  credits_balance: number;
  created_at: string;
  last_activity_at: string;
  subscription: { status?: string; plans?: { name?: string; credits?: number; price?: number } | null } | null;
  tasks: { total: number; running: number; failed: number; completed: number };
};

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("zh-CN");
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("beta_test_credit_adjustment");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/users", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      location.assign("/");
      return;
    }
    setUsers((await response.json()).users);
  }

  async function updateStatus(userId: string, status: "active" | "frozen") {
    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, status }),
    });
    setMessage(response.ok ? "User status updated." : "Unable to update user.");
    await load();
  }

  async function adjustCredits() {
    if (!selectedUserId || !amount) {
      setMessage("Select a user and enter a non-zero credit amount.");
      return;
    }
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: selectedUserId, amount, reason }),
    });
    setMessage(response.ok ? "Credits adjusted." : "Unable to adjust credits.");
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Beta Operations</p>
          <h1 className="text-3xl font-semibold">Admin User Operations</h1>
          <p className="mt-1 text-sm text-muted-foreground">User status, credits, subscription, task count, and recent activity.</p>
        </div>
        <Button onClick={() => void load()} variant="outline">
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>
      {message ? <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p> : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Newest registered users first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Last activity</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{user.email ?? user.display_name ?? user.id}</span>
                        <span className="text-xs text-muted-foreground">{user.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>{formatDate(user.last_activity_at)}</TableCell>
                    <TableCell>{user.credits_balance}</TableCell>
                    <TableCell>{user.subscription?.plans?.name ?? "Free"}</TableCell>
                    <TableCell>{user.tasks.total} / failed {user.tasks.failed}</TableCell>
                    <TableCell><Badge variant={user.status === "active" ? "secondary" : "destructive"}>{user.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => setSelectedUserId(user.id)} size="sm" variant="outline">Adjust</Button>
                        <Button onClick={() => void updateStatus(user.id, user.status === "active" ? "frozen" : "active")} size="sm" variant="outline">
                          {user.status === "active" ? "Disable" : "Enable"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <WalletCardsIcon />
            <CardTitle>Manual Credits Adjustment</CardTitle>
            <CardDescription>Add or subtract credits for beta operations. Negative amounts are allowed if balance stays non-negative.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <select
              className="h-8 rounded-lg border bg-background px-2 text-sm"
              onChange={(event) => setSelectedUserId(event.target.value)}
              value={selectedUserId}
            >
              <option value="">Select user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.email ?? user.id}</option>
              ))}
            </select>
            <Input onChange={(event) => setAmount(Number(event.target.value))} type="number" value={amount} />
            <Input onChange={(event) => setReason(event.target.value)} value={reason} />
            <Button onClick={() => void adjustCredits()}>
              Adjust Credits
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
