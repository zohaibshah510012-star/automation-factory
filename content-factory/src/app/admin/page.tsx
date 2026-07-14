"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const resources = [
  { key: "providers", title: "Providers", fields: ["provider_name", "model", "base_url", "secret_ref"] },
  { key: "agents", title: "Agents", fields: ["agent_name", "provider_name", "model", "prompt_template_name", "credit_cost"] },
  { key: "workflows", title: "Workflows", fields: ["name", "description"] },
  { key: "prompts", title: "Prompts", fields: ["name", "category", "type", "system_prompt", "user_template"] },
] as const;
type Row = Record<string, unknown> & { id: string; enabled?: boolean; status?: string };

export default function AdminPage() {
  const [token, setToken] = useState(""); const [active, setActive] = useState<(typeof resources)[number]>(resources[0]); const [rows, setRows] = useState<Row[]>([]); const [form, setForm] = useState<Record<string,string>>({}); const [editing, setEditing] = useState<Row | null>(null); const [message,setMessage]=useState("");
  useEffect(()=>{ const c=getSupabaseBrowserClient(); void c?.auth.getSession().then(({data})=>{const t=data.session?.access_token;if(!t) location.assign("/"); else setToken(t);});},[]);
  async function load(){if(!token)return;const r=await fetch(`/api/admin/${active.key}`,{headers:{Authorization:`Bearer ${token}`}});if(!r.ok){location.assign("/");return;}setRows((await r.json()).data);}
  useEffect(()=>{void load();},[token,active]);
  async function save(e:React.FormEvent){e.preventDefault();const payload=Object.fromEntries(Object.entries(form).filter(([,v])=>v!=="")); if(editing) Object.assign(payload,{id:editing.id}); const r=await fetch(`/api/admin/${active.key}`,{method:editing?"PATCH":"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(payload)});setMessage(r.ok?"已保存":"保存失败");if(r.ok){setForm({});setEditing(null);void load();}}
  async function remove(id:string){if(!confirm("确认删除？"))return;await fetch(`/api/admin/${active.key}?id=${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});void load();}
  function edit(row:Row){setEditing(row);setForm(Object.fromEntries(active.fields.map(k=>[k,String(row[k]??"")])));}
  return <main className="mx-auto max-w-7xl p-6"><h1 className="text-3xl font-semibold">Admin Console</h1><p className="mt-1 text-sm text-muted-foreground">内部运营配置，不向客户公开密钥或系统信息。</p><div className="mt-6 flex flex-wrap gap-2">{resources.map(x=><button key={x.key} onClick={()=>{setActive(x);setEditing(null);setForm({});}} className={`rounded-lg px-3 py-2 text-sm ${active.key===x.key?"bg-primary text-primary-foreground":"bg-muted"}`}>{x.title}</button>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]"><section className="rounded-xl border"><table className="w-full text-sm"><thead><tr className="border-b text-left"><th className="p-3">名称</th><th className="p-3">状态</th><th className="p-3">操作</th></tr></thead><tbody>{rows.map(row=><tr className="border-b" key={row.id}><td className="p-3">{String(row.provider_name||row.agent_name||row.name)}</td><td className="p-3">{row.enabled===false?"disabled":row.status||"enabled"}</td><td className="p-3"><button onClick={()=>edit(row)} className="mr-3 text-primary">编辑</button><button onClick={()=>void remove(row.id)} className="text-destructive">删除</button></td></tr>)}</tbody></table></section><form onSubmit={save} className="rounded-xl border p-4"><h2 className="font-semibold">{editing?"编辑":"新增"} {active.title}</h2>{active.fields.map(field=><label className="mt-3 block text-sm" key={field}>{field}<input className="mt-1 w-full rounded border p-2" value={form[field]||""} onChange={e=>setForm({...form,[field]:e.target.value})}/></label>)}{active.key!=="prompts"?<label className="mt-3 flex gap-2 text-sm"><input type="checkbox" checked={form.enabled!=="false"} onChange={e=>setForm({...form,enabled:String(e.target.checked)})}/>启用</label>:<label className="mt-3 text-sm">状态<select className="ml-2 rounded border p-1" value={form.status||"published"} onChange={e=>setForm({...form,status:e.target.value})}><option>published</option><option>draft</option><option>archived</option></select></label>}<button className="mt-4 rounded bg-primary px-3 py-2 text-sm text-primary-foreground">保存</button>{message&&<p className="mt-2 text-sm">{message}</p>}</form></div></main>;
}
