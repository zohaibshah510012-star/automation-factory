"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { MessageSquareIcon, SendIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TrackPageView } from "@/components/product-event-tracker";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

export default function FeedbackPage() {
  const [satisfaction, setSatisfaction] = useState(5);
  const [resultQuality, setResultQuality] = useState(5);
  const [continueUse, setContinueUse] = useState("yes");
  const [useCase, setUseCase] = useState("");
  const [category, setCategory] = useState("short_drama");
  const [contentTaskId, setContentTaskId] = useState("");
  const [contentFeedback, setContentFeedback] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({
        satisfaction,
        result_quality: resultQuality,
        use_case: useCase,
        continue_use: continueUse === "yes",
        category,
        content_task_id: contentTaskId.trim() || null,
        content_feedback: contentFeedback,
        suggestion,
        source: "dashboard_feedback",
      }),
    });
    setLoading(false);
    setMessage(response.ok ? "感谢反馈，你的反馈已进入 Beta 复盘队列。" : "反馈提交失败，请确认已登录后重试。");
    if (response.ok) {
      setContentTaskId("");
      setUseCase("");
      setContentFeedback("");
      setSuggestion("");
    }
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <TrackPageView surface="feedback" properties={{ page: "dashboard_feedback" }} />
      <header className="flex flex-col gap-3">
        <Badge className="w-fit" variant="secondary">Beta 反馈</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">这次 AI 内容生成体验怎么样？</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          请给出评分，也可以关联具体任务。你的反馈会帮助我们判断这个产品是否真的能解决实际业务问题。
        </p>
      </header>

      <Card>
        <CardHeader>
          <MessageSquareIcon />
          <CardTitle>提交反馈</CardTitle>
          <CardDescription>评分、内容质量意见和产品建议会直接进入管理员 Beta 反馈队列。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-5" onSubmit={submit}>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="satisfaction">满意度 1-5</label>
                <Input id="satisfaction" max={5} min={1} onChange={(event) => setSatisfaction(Number(event.target.value))} type="number" value={satisfaction} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="result_quality">结果质量 1-5</label>
                <Input id="result_quality" max={5} min={1} onChange={(event) => setResultQuality(Number(event.target.value))} type="number" value={resultQuality} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="category">反馈类型</label>
                <select className="h-8 rounded-lg border bg-background px-2 text-sm" id="category" onChange={(event) => setCategory(event.target.value)} value={category}>
                  <option value="short_drama">AI 短剧</option>
                  <option value="content_marketing">内容营销</option>
                  <option value="image_generation">图片生成</option>
                  <option value="video_generation">视频生成</option>
                  <option value="billing">额度 / 套餐</option>
                  <option value="general">其他</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="continue_use">是否愿意继续用？</label>
                <select className="h-8 rounded-lg border bg-background px-2 text-sm" id="continue_use" onChange={(event) => setContinueUse(event.target.value)} value={continueUse}>
                  <option value="yes">愿意继续使用</option>
                  <option value="no">暂时不会</option>
                </select>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_18rem]">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="use_case">你的使用场景</label>
                <Input id="use_case" onChange={(event) => setUseCase(event.target.value)} placeholder="例如：抖音广告、短剧测试、产品宣传图" value={useCase} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="content_task_id">任务 ID（可选）</label>
                <Input id="content_task_id" onChange={(event) => setContentTaskId(event.target.value)} placeholder="粘贴任务 ID" value={contentTaskId} />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="content_feedback">内容反馈</label>
              <Textarea id="content_feedback" onChange={(event) => setContentFeedback(event.target.value)} placeholder="哪里有用？哪里不准？哪里太慢？哪些内容还不能直接交付？" value={contentFeedback} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="suggestion">改进建议</label>
              <Textarea id="suggestion" onChange={(event) => setSuggestion(event.target.value)} placeholder="正式上线前，你最希望我们改进什么？" value={suggestion} />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button disabled={loading} type="submit">
                <SendIcon data-icon="inline-start" />
                提交反馈
              </Button>
              <Button render={<Link href="/dashboard/studio" />} type="button" variant="outline">
                返回 Studio
              </Button>
            </div>
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
