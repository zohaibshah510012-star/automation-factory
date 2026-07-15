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
  const [category, setCategory] = useState("short_drama");
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
        category,
        content_feedback: contentFeedback,
        suggestion,
        source: "dashboard_feedback",
      }),
    });
    setLoading(false);
    setMessage(response.ok ? "感谢反馈，我们会用它优化模板和首次生成体验。" : "反馈提交失败，请确认已登录后重试。");
    if (response.ok) {
      setContentFeedback("");
      setSuggestion("");
    }
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <TrackPageView surface="feedback" properties={{ page: "dashboard_feedback" }} />
      <header className="flex flex-col gap-3">
        <Badge className="w-fit" variant="secondary">Customer Validation</Badge>
        <h1 className="text-3xl font-semibold tracking-tight">告诉我们第一次生成体验怎么样</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          这份反馈会进入 Admin 反馈队列，用来判断短剧模板、内容输出和升级路径是否真的解决用户问题。
        </p>
      </header>

      <Card>
        <CardHeader>
          <MessageSquareIcon />
          <CardTitle>提交反馈</CardTitle>
          <CardDescription>满意度、内容反馈和建议都可以直接提交。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-5" onSubmit={submit}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="satisfaction">满意度 1-5</label>
                <Input
                  id="satisfaction"
                  max={5}
                  min={1}
                  onChange={(event) => setSatisfaction(Number(event.target.value))}
                  type="number"
                  value={satisfaction}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="category">反馈分类</label>
                <select
                  className="h-8 rounded-lg border bg-background px-2 text-sm"
                  id="category"
                  onChange={(event) => setCategory(event.target.value)}
                  value={category}
                >
                  <option value="short_drama">短剧生成</option>
                  <option value="content_marketing">内容营销</option>
                  <option value="image_generation">图片生成</option>
                  <option value="billing">套餐/付费</option>
                  <option value="general">其他建议</option>
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="content_feedback">内容反馈</label>
              <Textarea
                id="content_feedback"
                onChange={(event) => setContentFeedback(event.target.value)}
                placeholder="生成结果哪里好、哪里不准、哪里不能直接使用？"
                value={contentFeedback}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="suggestion">建议</label>
              <Textarea
                id="suggestion"
                onChange={(event) => setSuggestion(event.target.value)}
                placeholder="你希望下一个版本优先改什么？"
                value={suggestion}
              />
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
