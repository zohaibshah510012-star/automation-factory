"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Copy, LogOut, Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { ContentTask } from "@/lib/types";

type Prompt = { id: string; name: string; category: string; owner_type: "platform" | "user" | "company"; system_prompt: string; user_template: string; version: number };
type SessionState = { token: string; email: string; userId: string };
const taskTypes = [
  ["short_video_script", "短视频脚本"], ["marketing", "营销方案"], ["ecommerce", "电商内容"], ["social", "社媒内容"], ["drama", "短剧策划"],
] as const;

export default function CustomerApp() {
  const client = getSupabaseBrowserClient();
  const [session, setSession] = useState<SessionState | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [message, setMessage] = useState("");
  const [tasks, setTasks] = useState<ContentTask[]>([]); const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [credits, setCredits] = useState<number | null>(null); const [topic, setTopic] = useState(""); const [brief, setBrief] = useState("");
  const [taskType, setTaskType] = useState<(typeof taskTypes)[number][0]>("short_video_script"); const [promptId, setPromptId] = useState(""); const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Prompt | null>(null); const [systemPrompt, setSystemPrompt] = useState(""); const [userTemplate, setUserTemplate] = useState("");

  const headers = useMemo<Record<string, string>>(() => session ? { Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" } : ({} as Record<string, string>), [session]);
  const refresh = useCallback(async () => {
    if (!session || !client) return;
    const [taskResponse, promptResponse, profileResponse] = await Promise.all([
      fetch("/api/tasks", { headers, cache: "no-store" }), fetch("/api/prompts", { headers, cache: "no-store" }), client.from("profiles").select("credits_balance").eq("id", session.userId).maybeSingle(),
    ]);
    if (taskResponse.ok) setTasks((await taskResponse.json()).tasks);
    if (promptResponse.ok) { const available = (await promptResponse.json()).prompts as Prompt[]; setPrompts(available); if (!promptId) setPromptId(available.find((item) => item.name === "short_video_script_prompt")?.id ?? available[0]?.id ?? ""); }
    setCredits(profileResponse.data?.credits_balance ?? null);
  }, [client, headers, promptId, session]);

  useEffect(() => { if (!client) return; void client.auth.getSession().then(({ data }) => { const current = data.session; if (current?.access_token) setSession({ token: current.access_token, email: current.user.email ?? "", userId: current.user.id }); }); }, [client]);
  useEffect(() => { if (session) void fetch("/api/auth/bootstrap", { method: "POST", headers }).then(() => refresh()); }, [headers, refresh, session]);

  async function authenticate(event: FormEvent) {
    event.preventDefault(); if (!client) return; setLoading(true); setMessage("");
    const result = mode === "login" ? await client.auth.signInWithPassword({ email, password }) : await client.auth.signUp({ email, password });
    setLoading(false); if (result.error) return setMessage(result.error.message);
    if (!result.data.session) return setMessage("注册成功，请在邮箱完成验证后登录。");
    setSession({ token: result.data.session.access_token, email: result.data.session.user.email ?? email, userId: result.data.session.user.id });
  }

  async function createTask(event: FormEvent) {
    event.preventDefault(); if (!topic.trim()) return; setLoading(true); setMessage("");
    const response = await fetch("/api/tasks", { method: "POST", headers, body: JSON.stringify({ topic, brief, taskType, promptId }) });
    const payload = await response.json(); setLoading(false);
    if (!response.ok) return setMessage(payload.error === "INSUFFICIENT_CREDITS" ? "Credits 不足，暂不能生成。" : payload.error || "创建失败。");
    setTopic(""); setBrief(""); await refresh();
  }

  async function savePersonalPrompt() {
    if (!editing) return; setLoading(true);
    const response = await fetch("/api/prompts", { method: "POST", headers, body: JSON.stringify({ sourceId: editing.id, name: `${editing.name}_personal`, systemPrompt, userTemplate }) });
    setLoading(false); if (!response.ok) return setMessage("保存个人 Prompt 失败。"); setMessage("已保存为个人 Prompt 版本。"); setEditing(null); await refresh();
  }

  if (!client) return <main className="grid min-h-screen place-items-center p-6"><section className="max-w-md rounded-2xl border p-7"><h1 className="text-2xl font-semibold">需要完成用户认证配置</h1><p className="mt-3 text-sm text-muted-foreground">请设置 NEXT_PUBLIC_SUPABASE_ANON_KEY 后启用注册、登录与个人 Prompt。</p></section></main>;
  if (!session) return <main className="grid min-h-screen place-items-center bg-muted/30 p-6"><form onSubmit={authenticate} className="w-full max-w-md rounded-2xl border bg-background p-7 shadow-sm"><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Sparkles size={18}/></span><h1 className="text-xl font-semibold">Automation Factory</h1></div><h2 className="mt-8 text-2xl font-semibold">{mode === "login" ? "登录工作台" : "创建账号"}</h2><p className="mt-2 text-sm text-muted-foreground">用 Credits 驱动可追踪的内容生产。</p><input className="mt-6 w-full rounded-lg border px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="邮箱" type="email" required/><input className="mt-3 w-full rounded-lg border px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="密码（至少 6 位）" type="password" minLength={6} required/><button className="mt-5 w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60" disabled={loading}>{loading ? "处理中…" : mode === "login" ? "登录" : "注册"}</button><button className="mt-4 text-sm text-muted-foreground underline" type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "没有账号？注册" : "已有账号？登录"}</button>{message ? <p className="mt-4 text-sm text-destructive">{message}</p> : null}</form></main>;

  const latest = tasks.find((task) => task.status === "completed");
  return <main className="min-h-screen bg-muted/20"><header className="border-b bg-background"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><div><p className="font-semibold">Automation Factory</p><p className="text-xs text-muted-foreground">Customer workspace</p></div><div className="flex items-center gap-3 text-sm"><span className="rounded-full bg-muted px-3 py-1">{credits ?? "–"} Credits</span><a href="/admin" className="text-muted-foreground hover:text-foreground">Admin</a><button onClick={() => void client.auth.signOut().then(() => setSession(null))} title="退出登录"><LogOut size={18}/></button></div></div></header><div className="mx-auto grid max-w-7xl gap-6 p-5 lg:grid-cols-[1.25fr_.75fr]"><section className="space-y-6"><div><p className="text-sm text-muted-foreground">{session.email}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">把需求变成可复用内容资产</h1></div><form onSubmit={createTask} className="rounded-2xl border bg-background p-5"><label className="text-sm font-medium">内容需求</label><input className="mt-2 w-full rounded-lg border px-3 py-2" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="例如：AI 自动化如何帮助小团队增长" required/><textarea className="mt-3 min-h-24 w-full rounded-lg border p-3" value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="目标用户、语气或产品卖点（可选）"/><div className="mt-3 grid gap-3 sm:grid-cols-2"><select className="rounded-lg border p-2" value={taskType} onChange={(e) => setTaskType(e.target.value as typeof taskType)}>{taskTypes.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select className="rounded-lg border p-2" value={promptId} onChange={(e) => setPromptId(e.target.value)}>{prompts.map((prompt) => <option key={prompt.id} value={prompt.id}>{prompt.owner_type === "platform" ? "官方" : "我的"} · {prompt.name} v{prompt.version}</option>)}</select></div><button disabled={loading || !topic.trim()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-60">开始生成 <ArrowRight size={16}/></button>{message ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}</form><section className="rounded-2xl border bg-background p-5"><h2 className="font-semibold">生成历史</h2><div className="mt-3 divide-y">{tasks.map((task) => <article className="py-3" key={task.id}><div className="flex justify-between gap-3"><p className="font-medium">{task.topic}</p><span className="text-sm text-muted-foreground">{task.status}</span></div><p className="mt-1 text-sm text-muted-foreground">{task.title || task.error || "等待生成结果"}</p></article>)}{!tasks.length ? <p className="py-6 text-sm text-muted-foreground">还没有内容任务。</p> : null}</div></section>{latest ? <section className="rounded-2xl border bg-background p-5"><h2 className="font-semibold">最新内容包：{latest.title}</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{latest.script}</p><ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">{latest.storyboard?.map((scene) => <li key={scene}>{scene}</li>)}</ol></section> : null}</section><aside className="space-y-6"><section className="rounded-2xl border bg-background p-5"><h2 className="font-semibold">我的 Prompt Library</h2><p className="mt-1 text-sm text-muted-foreground">官方模板可复制为个人版本，再用于生成。</p><div className="mt-4 space-y-3">{prompts.map((prompt) => <div className="rounded-lg border p-3" key={prompt.id}><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-medium">{prompt.name}</p><p className="text-xs text-muted-foreground">{prompt.owner_type} · v{prompt.version}</p></div><button className="text-sm text-primary" onClick={() => { setEditing(prompt); setSystemPrompt(prompt.system_prompt); setUserTemplate(prompt.user_template); }}><Copy size={15}/></button></div></div>)}</div></section>{editing ? <section className="rounded-2xl border bg-background p-5"><h2 className="font-semibold">编辑个人 Prompt</h2><textarea className="mt-3 min-h-36 w-full rounded-lg border p-3 text-sm" value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}/><textarea className="mt-3 min-h-24 w-full rounded-lg border p-3 text-sm" value={userTemplate} onChange={(e) => setUserTemplate(e.target.value)}/><button className="mt-3 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" disabled={loading} onClick={() => void savePersonalPrompt()}>保存个人版本</button></section> : null}</aside></div></main>;
}
