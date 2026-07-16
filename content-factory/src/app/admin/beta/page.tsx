"use client";

import { type FormEvent, useEffect, useState } from "react";
import { CopyIcon, RefreshCwIcon, TicketIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type BetaInvite = {
  id: string;
  email: string;
  invite_code: string;
  status: "pending" | "used" | "revoked";
  created_at: string;
  used_at: string | null;
};

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

export default function AdminBetaInvitesPage() {
  const [email, setEmail] = useState("");
  const [invites, setInvites] = useState<BetaInvite[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/beta/invites", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      location.assign("/");
      return;
    }
    setInvites((await response.json()).invites ?? []);
  }

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/beta/invites", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setMessage(response.ok ? "Invite created." : "Unable to create invite.");
    if (response.ok) setEmail("");
    await load();
  }

  async function updateStatus(id: string, status: BetaInvite["status"]) {
    const response = await fetch("/api/admin/beta/invites", {
      method: "PATCH",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setMessage(response.ok ? "Invite updated." : "Unable to update invite.");
    await load();
  }

  function inviteUrl(invite: BetaInvite) {
    if (typeof window === "undefined") return `/beta?invite_code=${invite.invite_code}&email=${encodeURIComponent(invite.email)}`;
    return `${window.location.origin}/beta?invite_code=${invite.invite_code}&email=${encodeURIComponent(invite.email)}`;
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Beta Operations</p>
          <h1 className="text-3xl font-semibold">Beta Invitations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create controlled invites for the first real user cohort.</p>
        </div>
        <Button onClick={() => void load()} variant="outline">
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <Card>
          <CardHeader>
            <TicketIcon />
            <CardTitle>Create invite</CardTitle>
            <CardDescription>Send the generated Beta URL to one specific email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={createInvite}>
              <Input onChange={(event) => setEmail(event.target.value)} placeholder="creator@example.com" required type="email" value={email} />
              <Button type="submit">Create invite</Button>
              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invite queue</CardTitle>
            <CardDescription>Pending invites can be revoked before they are used.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell className="font-mono text-xs">{invite.invite_code}</TableCell>
                    <TableCell><Badge variant={invite.status === "pending" ? "secondary" : "outline"}>{invite.status}</Badge></TableCell>
                    <TableCell>{new Date(invite.created_at).toLocaleString()}</TableCell>
                    <TableCell>{invite.used_at ? new Date(invite.used_at).toLocaleString() : "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => void navigator.clipboard.writeText(inviteUrl(invite))} size="sm" variant="outline">
                          <CopyIcon data-icon="inline-start" />
                          Copy URL
                        </Button>
                        {invite.status === "pending" ? (
                          <Button onClick={() => void updateStatus(invite.id, "revoked")} size="sm" variant="outline">Revoke</Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!invites.length ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={6}>No Beta invites yet.</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
