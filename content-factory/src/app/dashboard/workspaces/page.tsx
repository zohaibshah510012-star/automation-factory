"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PlusIcon, RefreshCwIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type WorkspaceMembership = {
  role: string;
  status: string;
  workspaces: { id: string; name: string; slug: string; plan_tier: string; status: string; created_at: string } | null;
};

type Member = {
  id: string;
  role: string;
  status: string;
  permissions: Record<string, unknown>;
  profiles?: { email?: string | null; display_name?: string | null } | null;
};

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}`, "Content-Type": "application/json" };
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/workspaces", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) return setMessage("Please sign in to view workspaces.");
    const data = await response.json();
    setWorkspaces(data.workspaces ?? []);
    const firstWorkspace = data.workspaces?.[0]?.workspaces?.id;
    if (firstWorkspace && !activeWorkspaceId) setActiveWorkspaceId(firstWorkspace);
  }, [activeWorkspaceId]);

  const loadMembers = useCallback(async (workspaceId: string) => {
    if (!workspaceId) return;
    const response = await fetch(`/api/workspaces/${workspaceId}/members`, { headers: await authHeaders(), cache: "no-store" });
    if (response.ok) setMembers((await response.json()).members ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadMembers(activeWorkspaceId);
  }, [activeWorkspaceId, loadMembers]);

  async function create(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!response.ok) {
      setMessage("Unable to create workspace.");
      return;
    }
    setName("");
    setMessage("Workspace created.");
    await load();
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Enterprise</p>
          <h1 className="text-3xl font-semibold">Workspaces</h1>
          <p className="mt-1 text-sm text-muted-foreground">Team roles and permissions foundation for enterprise accounts.</p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          <RefreshCwIcon data-icon="inline-start" />
          Refresh
        </Button>
      </div>

      {message && <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p>}

      <section className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card>
          <CardHeader>
            <CardTitle>My workspaces</CardTitle>
            <CardDescription>Owned and joined team spaces.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {workspaces.map((membership) => {
              const workspace = membership.workspaces;
              if (!workspace) return null;
              return (
                <button
                  key={workspace.id}
                  className="rounded-lg border p-4 text-left hover:bg-muted"
                  onClick={() => setActiveWorkspaceId(workspace.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{workspace.name}</p>
                    <Badge variant={activeWorkspaceId === workspace.id ? "secondary" : "outline"}>{membership.role}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {workspace.slug} - {workspace.plan_tier} - {workspace.status}
                  </p>
                </button>
              );
            })}
            {!workspaces.length && <p className="text-sm text-muted-foreground">No workspace yet.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create workspace</CardTitle>
            <CardDescription>Creates an owner membership automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-3" onSubmit={create}>
              <Input placeholder="Workspace name" value={name} onChange={(event) => setName(event.target.value)} required />
              <Button type="submit">
                <PlusIcon data-icon="inline-start" />
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Role and permission snapshot for the selected workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.profiles?.email ?? member.profiles?.display_name ?? "unknown"}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.status}</TableCell>
                  <TableCell>{Object.keys(member.permissions ?? {}).join(", ") || "-"}</TableCell>
                </TableRow>
              ))}
              {!members.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No members selected.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
