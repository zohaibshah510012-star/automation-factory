"use client";

import Link from "next/link";
import { CopyIcon, HeartIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Asset = {
  id: string; type: string; title: string; topic: string; status: string; createdAt: string; promptName: string | null; agentName: string | null; creditsCharged: number; favorite: boolean;
  content: { script: string | null };
};

async function authorizationHeader() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

export default function ContentCenter() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [message, setMessage] = useState("");

  async function load() {
    const headers = await authorizationHeader();
    const response = await fetch("/api/content", { headers, cache: "no-store" });
    if (response.ok) setAssets((await response.json()).assets);
  }

  useEffect(() => { void load(); }, []);
  const types = useMemo(() => [...new Set(assets.map((asset) => asset.type))], [assets]);
  const visible = assets.filter((asset) => (type === "all" || asset.type === type) && JSON.stringify(asset).toLowerCase().includes(query.toLowerCase()));

  async function copy(asset: Asset) {
    await navigator.clipboard.writeText(asset.content.script ?? asset.title);
    setMessage("内容已复制");
  }
  async function favorite(asset: Asset) {
    const headers = await authorizationHeader();
    const response = await fetch(`/api/content/${asset.id}/favorite`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ favorite: !asset.favorite }) });
    if (response.ok) setAssets((items) => items.map((item) => item.id === asset.id ? { ...item, favorite: !item.favorite } : item));
  }
  async function remove(asset: Asset) {
    if (!window.confirm(`删除「${asset.title}」？此操作不可撤销。`)) return;
    const headers = await authorizationHeader();
    const response = await fetch(`/api/content/${asset.id}`, { method: "DELETE", headers });
    if (response.ok) setAssets((items) => items.filter((item) => item.id !== asset.id));
  }

  return <main className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
    <header className="flex flex-col gap-2"><p className="text-sm text-muted-foreground">Content Factory</p><h1 className="text-3xl font-semibold">我的内容资产</h1><p className="text-sm text-muted-foreground">已完成的生成任务会自动沉淀为可搜索、收藏和复用的内容。</p></header>
    <section className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><SearchIcon className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground"/><Input className="pl-8" placeholder="搜索标题、主题或内容" value={query} onChange={(event) => setQuery(event.target.value)}/></div><select className="h-8 rounded-lg border bg-background px-2 text-sm" value={type} onChange={(event) => setType(event.target.value)}><option value="all">全部类型</option>{types.map((item) => <option key={item} value={item}>{item}</option>)}</select></section>
    {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    <section className="grid gap-4 md:grid-cols-2">{visible.map((asset) => <Card key={asset.id}>
      <CardHeader><CardTitle className="truncate">{asset.title}</CardTitle><CardDescription>{new Date(asset.createdAt).toLocaleString("zh-CN")}</CardDescription><CardAction><Badge variant="secondary">{asset.type}</Badge></CardAction></CardHeader>
      <CardContent className="flex flex-col gap-3"><p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{asset.content.script ?? asset.topic}</p><div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{asset.promptName ?? "默认 Prompt"}</span><span>{asset.agentName ?? "默认工作流"}</span><span>{asset.creditsCharged} Credits</span></div></CardContent>
      <div className="flex flex-wrap gap-2 px-4"><Button render={<Link href={`/dashboard/content/${asset.id}`}/> } variant="outline">查看详情</Button><Button variant="ghost" size="sm" onClick={() => void copy(asset)}><CopyIcon data-icon="inline-start"/>复制</Button><Button variant="ghost" size="sm" onClick={() => void favorite(asset)} aria-label="收藏"><HeartIcon data-icon="inline-start" fill={asset.favorite ? "currentColor" : "none"}/>{asset.favorite ? "已收藏" : "收藏"}</Button><Button variant="ghost" size="sm" onClick={() => void remove(asset)}><Trash2Icon data-icon="inline-start"/>删除</Button></div>
    </Card>)}</section>
    {!visible.length ? <Card><CardContent className="py-12 text-center text-muted-foreground">还没有匹配的内容资产。完成一次生成后会自动出现在这里。</CardContent></Card> : null}
  </main>;
}
