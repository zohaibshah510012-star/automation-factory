"use client";

import { useCallback, useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProviderConfig = { id: string; platform: string; provider_type: string; mode: string; enabled: boolean };

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}`, "Content-Type": "application/json" };
}

export default function Providers() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [form, setForm] = useState({ platform: "", provider_type: "mock", mode: "sandbox", enabled: true });

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/distribution/providers", { headers: await authHeaders(), cache: "no-store" });
    if (response.ok) setProviders((await response.json()).providers ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    await fetch("/api/admin/distribution/providers", { method: "POST", headers: await authHeaders(), body: JSON.stringify(form) });
    setForm({ platform: "", provider_type: "mock", mode: "sandbox", enabled: true });
    void load();
  }

  async function toggle(provider: ProviderConfig) {
    await fetch(`/api/admin/distribution/providers/${provider.id}`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ ...provider, enabled: !provider.enabled }),
    });
    void load();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/distribution/providers/${id}`, { method: "DELETE", headers: await authHeaders() });
    void load();
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-semibold">Distribution Providers</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        <input className="border p-2" placeholder="platform" value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })} />
        <input className="border p-2" value={form.provider_type} onChange={(event) => setForm({ ...form, provider_type: event.target.value })} />
        <select className="border p-2" value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value })}>
          <option>sandbox</option>
          <option>production</option>
        </select>
        <button className="rounded bg-primary px-3 text-primary-foreground" onClick={() => void save()}>Add</button>
      </div>
      <div className="mt-6 divide-y rounded border">
        {providers.map((provider) => (
          <div className="flex items-center gap-4 p-3" key={provider.id}>
            <span>{provider.platform}</span>
            <span>{provider.provider_type}</span>
            <span>{provider.mode}</span>
            <span>{provider.enabled ? "enabled" : "disabled"}</span>
            <button onClick={() => void toggle(provider)}>Enable/Disable</button>
            <button onClick={() => void remove(provider.id)}>Delete</button>
          </div>
        ))}
      </div>
    </main>
  );
}
