"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Step = { id?: string; name: string; type: "prompt" | "ai_generate" | "save_result"; agent_name?: string; config?: Record<string, unknown> };
export default function WorkflowBuilder() {
  const { id } = useParams<{ id: string }>(); const [steps, setSteps] = useState<Step[]>([]); const [token, setToken] = useState("");
  useEffect(() => { void (async () => { const session = await getSupabaseBrowserClient()?.auth.getSession(); const accessToken = session?.data.session?.access_token ?? ""; setToken(accessToken); const response = await fetch(`/api/admin/workflows/${id}`, { headers: { Authorization: `Bearer ${accessToken}` } }); if (response.ok) { const data = await response.json(); setSteps(data.steps.map((step: Step & { config?: Step }) => ({ ...step, ...(step.config ?? {}) }))); } })(); }, [id]);
  async function save() { await fetch(`/api/admin/workflows/${id}`, { method: "PUT", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ steps }) }); }
  return <main className="mx-auto max-w-4xl p-6"><h1 className="text-3xl font-semibold">Workflow Builder</h1><div className="mt-6 space-y-3">{steps.map((step, index) => <div className="flex gap-2 rounded border p-3" key={step.id ?? index}><input className="border p-2" value={step.name} onChange={(e) => setSteps(steps.map((item, i) => i === index ? { ...item, name: e.target.value } : item))}/><select className="border p-2" value={step.type} onChange={(e) => setSteps(steps.map((item, i) => i === index ? { ...item, type: e.target.value as Step["type"] } : item))}><option value="prompt">prompt</option><option value="ai_generate">ai_generate</option><option value="save_result">save_result</option></select><button onClick={() => setSteps(steps.filter((_, i) => i !== index))}>删除</button></div>)}</div><button className="mt-4 rounded border px-3 py-2" onClick={() => setSteps([...steps, { name: "新步骤", type: "prompt", config: {} }])}>新增步骤</button><button className="ml-3 rounded bg-primary px-3 py-2 text-primary-foreground" onClick={() => void save()}>保存</button></main>;
}
