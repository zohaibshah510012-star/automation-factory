"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const resources = [
  { key: "providers", title: "Providers", fields: ["provider_name", "model", "base_url", "secret_ref"] },
  { key: "agents", title: "Agents", fields: ["agent_name", "provider_name", "model", "prompt_template_name", "credit_cost"] },
  { key: "workflows", title: "Workflows", fields: ["name", "description"] },
  { key: "prompts", title: "Prompts", fields: ["name", "category", "type", "system_prompt", "user_template"] },
] as const;

type Resource = (typeof resources)[number];
type Row = Record<string, unknown> & { id: string; enabled?: boolean; status?: string };

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [active, setActive] = useState<Resource>(resources[0]);
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    void client?.auth.getSession().then(({ data }) => {
      const accessToken = data.session?.access_token;
      if (!accessToken) location.assign("/");
      else setToken(accessToken);
    });
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    const response = await fetch(`/api/admin/${active.key}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) {
      location.assign("/");
      return;
    }
    setRows((await response.json()).data ?? []);
  }, [active.key, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(event: FormEvent) {
    event.preventDefault();
    const payload = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ""));
    if (editing) Object.assign(payload, { id: editing.id });
    const response = await fetch(`/api/admin/${active.key}`, {
      method: editing ? "PATCH" : "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setMessage(response.ok ? "Saved." : "Save failed.");
    if (response.ok) {
      setForm({});
      setEditing(null);
      void load();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/admin/${active.key}?id=${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    void load();
  }

  function edit(row: Row) {
    setEditing(row);
    setForm(Object.fromEntries(active.fields.map((field) => [field, String(row[field] ?? "")])));
  }

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-3xl font-semibold">Admin Console</h1>
      <p className="mt-1 text-sm text-muted-foreground">Internal operations configuration. Secrets are referenced server-side only.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {resources.map((resource) => (
          <button
            key={resource.key}
            onClick={() => {
              setActive(resource);
              setEditing(null);
              setForm({});
            }}
            className={`rounded-lg px-3 py-2 text-sm ${active.key === resource.key ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {resource.title}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-b" key={row.id}>
                  <td className="p-3">{String(row.provider_name || row.agent_name || row.name)}</td>
                  <td className="p-3">{row.enabled === false ? "disabled" : row.status || "enabled"}</td>
                  <td className="p-3">
                    <button onClick={() => edit(row)} className="mr-3 text-primary">Edit</button>
                    <button onClick={() => void remove(row.id)} className="text-destructive">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <form onSubmit={save} className="rounded-xl border p-4">
          <h2 className="font-semibold">{editing ? "Edit" : "Create"} {active.title}</h2>
          {active.fields.map((field) => (
            <label className="mt-3 block text-sm" key={field}>
              {field}
              <input className="mt-1 w-full rounded border p-2" value={form[field] || ""} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />
            </label>
          ))}
          {active.key !== "prompts" ? (
            <label className="mt-3 flex gap-2 text-sm">
              <input type="checkbox" checked={form.enabled !== "false"} onChange={(event) => setForm({ ...form, enabled: String(event.target.checked) })} />
              Enabled
            </label>
          ) : (
            <label className="mt-3 text-sm">
              Status
              <select className="ml-2 rounded border p-1" value={form.status || "published"} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option>published</option>
                <option>draft</option>
                <option>archived</option>
              </select>
            </label>
          )}
          <button className="mt-4 rounded bg-primary px-3 py-2 text-sm text-primary-foreground">Save</button>
          {message ? <p className="mt-2 text-sm">{message}</p> : null}
        </form>
      </div>
    </main>
  );
}
