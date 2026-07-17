"use client";

import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";
import { ArrowRightIcon, CheckCircle2Icon, Loader2Icon, SendIcon, UploadCloudIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type Platform = "douyin" | "xiaohongshu" | "youtube_shorts";

type BriefFormState = {
  customerBrand: string;
  productName: string;
  productIntro: string;
  targetCustomer: string;
  marketingGoal: string;
  platforms: Platform[];
  materialNotes: string;
};

type CreatedProject = {
  id: string;
  customer_brand: string;
  project_name: string;
  status: string;
};

const platformOptions: Array<{ value: Platform; label: string; description: string }> = [
  { value: "douyin", label: "抖音", description: "短视频爆款、直播间引流、产品种草" },
  { value: "xiaohongshu", label: "小红书", description: "种草笔记、生活方式场景、搜索转化" },
  { value: "youtube_shorts", label: "YouTube Shorts", description: "海外短视频、英文内容、品牌曝光" },
];

const initialForm: BriefFormState = {
  customerBrand: "",
  productName: "",
  productIntro: "",
  targetCustomer: "",
  marketingGoal: "",
  platforms: ["douyin", "xiaohongshu"],
  materialNotes: "",
};

function fieldLabel(key: keyof BriefFormState) {
  const labels: Record<keyof BriefFormState, string> = {
    customerBrand: "公司/品牌名称",
    productName: "产品名称",
    productIntro: "产品介绍",
    targetCustomer: "目标客户",
    marketingGoal: "营销目标",
    platforms: "平台选择",
    materialNotes: "素材链接或说明",
  };
  return labels[key];
}

function validate(form: BriefFormState) {
  const requiredFields: Array<keyof Pick<BriefFormState, "customerBrand" | "productName" | "productIntro" | "targetCustomer" | "marketingGoal">> = [
    "customerBrand",
    "productName",
    "productIntro",
    "targetCustomer",
    "marketingGoal",
  ];
  const missing = requiredFields.find((key) => !form[key].trim());
  if (missing) return `请填写${fieldLabel(missing)}`;
  if (!form.platforms.length) return "请至少选择一个发布平台";
  return "";
}

export default function CustomerBriefPage() {
  const [form, setForm] = useState<BriefFormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdProject, setCreatedProject] = useState<CreatedProject | null>(null);

  const selectedPlatformText = useMemo(
    () => platformOptions.filter((option) => form.platforms.includes(option.value)).map((option) => option.label).join("、") || "未选择",
    [form.platforms],
  );

  function updateField(key: Exclude<keyof BriefFormState, "platforms">, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function togglePlatform(platform: Platform) {
    setForm((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform],
    }));
  }

  async function submitBrief(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const session = await getSupabaseBrowserClient()?.auth.getSession();
      const token = session?.data.session?.access_token;
      if (!token) {
        setError("请先登录后提交 Brief。");
        return;
      }
      const response = await fetch("/api/brief", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => ({}))) as { project?: CreatedProject; error?: string };
      if (!response.ok || !payload.project) {
        setError(payload.error ?? "提交失败，请稍后重试。");
        return;
      }
      setCreatedProject(payload.project);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.2),transparent_30%),linear-gradient(180deg,#050713_0%,#0b1020_52%,#f8fafc_52%,#f8fafc_100%)]">
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 text-white lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="flex min-h-[32rem] flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/25 backdrop-blur-xl md:p-8">
          <div>
            <Link className="text-sm text-white/60 transition hover:text-white" href="/">
              ← 返回首页
            </Link>
            <Badge className="mt-8 border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline">
              客户需求提交
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
              提交你的商业需求，Founder 开始交付
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-white/68 md:text-base">
              这里不是后台管理页。客户只需要填写产品、目标客户和营销目标，系统会生成一个待确认的客户项目，Founder 在 Revenue View 中接手生产。
            </p>
          </div>

          <div className="mt-8 grid gap-3">
            {[
              { title: "1. 提交 Brief", description: "告诉我们品牌、产品和你希望达成的营销目标。" },
              { title: "2. Founder 确认方案", description: "Founder 在后台查看项目，选择合适的工作流开始交付。" },
              { title: "3. 生成交付资产", description: "输出策略、脚本、图片、视频预览和发布包。" },
            ].map((item) => (
              <div className="rounded-3xl border border-white/10 bg-slate-950/45 p-4" key={item.title}>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-white/55">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-white/10 bg-white/95 shadow-2xl shadow-black/20">
          <CardHeader>
            <CardTitle className="text-2xl">商业 Brief</CardTitle>
            <CardDescription>
              提交后会生成一个客户项目草稿，Founder 可在 `/admin/revenue` 查看。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {createdProject ? (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                <CheckCircle2Icon className="size-10 text-emerald-600" />
                <h2 className="mt-4 text-2xl font-semibold text-emerald-950">Brief 已提交</h2>
                <p className="mt-2 text-sm leading-6 text-emerald-900">
                  项目已进入 Founder Revenue View，状态为「待确认」。Founder 可以开始制定交付方案。
                </p>
                <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700">
                  <p>品牌：{createdProject.customer_brand}</p>
                  <p className="mt-1">项目：{createdProject.project_name}</p>
                  <p className="mt-1">项目 ID：{createdProject.id}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button render={<Link href="/dashboard" />}>返回工作台</Button>
                  <Button onClick={() => { setCreatedProject(null); setForm(initialForm); }} type="button" variant="outline">
                    再提交一个 Brief
                  </Button>
                </div>
              </div>
            ) : (
              <form className="grid gap-5" onSubmit={submitBrief}>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    公司/品牌名称
                    <Input
                      placeholder="例如：Founder Demo"
                      value={form.customerBrand}
                      onChange={(event) => updateField("customerBrand", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    产品名称
                    <Input
                      placeholder="例如：AI Marketing Content Package"
                      value={form.productName}
                      onChange={(event) => updateField("productName", event.target.value)}
                    />
                  </label>
                </div>

                <label className="grid gap-2 text-sm font-medium">
                  产品介绍
                  <Textarea
                    className="min-h-28"
                    placeholder="产品是什么？解决什么问题？有什么差异化卖点？"
                    value={form.productIntro}
                    onChange={(event) => updateField("productIntro", event.target.value)}
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2 text-sm font-medium">
                    目标客户
                    <Textarea
                      className="min-h-24"
                      placeholder="例如：本地生活商家、知识付费创业者、跨境电商卖家"
                      value={form.targetCustomer}
                      onChange={(event) => updateField("targetCustomer", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium">
                    营销目标
                    <Textarea
                      className="min-h-24"
                      placeholder="例如：获客、转化、品牌曝光、短视频投放素材、私域引流"
                      value={form.marketingGoal}
                      onChange={(event) => updateField("marketingGoal", event.target.value)}
                    />
                  </label>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">平台选择</p>
                    <p className="text-xs text-muted-foreground">已选择：{selectedPlatformText}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {platformOptions.map((option) => {
                      const selected = form.platforms.includes(option.value);
                      return (
                        <button
                          className={`rounded-2xl border p-4 text-left transition ${selected ? "border-slate-950 bg-slate-950 text-white" : "bg-background hover:bg-muted/60"}`}
                          key={option.value}
                          onClick={() => togglePlatform(option.value)}
                          type="button"
                        >
                          <span className="font-medium">{option.label}</span>
                          <span className={`mt-2 block text-xs leading-5 ${selected ? "text-white/65" : "text-muted-foreground"}`}>{option.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="grid gap-2 text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <UploadCloudIcon className="size-4" />
                    上传素材入口
                  </span>
                  <Textarea
                    className="min-h-24"
                    placeholder="当前版本先填写网盘链接、官网链接、素材说明或已有脚本。后续如接入 Storage，可在这里升级为文件上传。"
                    value={form.materialNotes}
                    onChange={(event) => updateField("materialNotes", event.target.value)}
                  />
                </label>

                {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

                <div className="flex flex-wrap items-center gap-3">
                  <Button className="bg-slate-950 text-white hover:bg-slate-800" disabled={submitting} size="lg" type="submit">
                    {submitting ? <Loader2Icon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
                    提交 Brief
                  </Button>
                  <Button render={<Link href="/dashboard" />} size="lg" type="button" variant="outline">
                    返回工作台
                    <ArrowRightIcon data-icon="inline-end" />
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
