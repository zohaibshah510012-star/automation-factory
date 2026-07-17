"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClapperboardIcon,
  FileTextIcon,
  ImageIcon,
  Loader2Icon,
  PlayCircleIcon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { TrackPageView, trackProductEvent } from "@/components/product-event-tracker";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { capabilityLabels, workflowTemplates, type WorkflowCapability, type WorkflowTemplate } from "@/lib/workflow-templates";

type WizardStep = 1 | 2 | 3 | 4;

const capabilityIcons: Record<WorkflowCapability, typeof SparklesIcon> = {
  drama: ClapperboardIcon,
  video: VideoIcon,
  image: ImageIcon,
  content: FileTextIcon,
};

const wizardSteps = [
  { step: 1, label: "选择模板" },
  { step: 2, label: "输入需求" },
  { step: 3, label: "预览流程" },
  { step: 4, label: "启动任务" },
] as const;

const taskTypes: WorkflowCapability[] = ["drama", "video", "image", "content"];

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function endpointFor(capability: WorkflowCapability) {
  if (capability === "image") return "/api/images";
  if (capability === "video") return "/api/videos";
  return "/api/tasks";
}

function payloadFor(template: WorkflowTemplate, requirement: string, brief: string) {
  const prompt = requirement.trim();
  if (template.capability === "image" || template.capability === "video") return { prompt: `${prompt}\n\n${brief.trim()}`.trim() };
  return {
    topic: prompt,
    brief: brief.trim() || template.briefStarter,
    taskType: template.taskType,
  };
}

export default function CreateCenterPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<WorkflowTemplate["id"]>("short_drama");
  const [step, setStep] = useState<WizardStep>(1);
  const [requirement, setRequirement] = useState("");
  const [brief, setBrief] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedTemplate = useMemo(
    () => workflowTemplates.find((template) => template.id === selectedTemplateId) ?? workflowTemplates[0],
    [selectedTemplateId],
  );
  const Icon = capabilityIcons[selectedTemplate.capability];
  const canContinue = step === 1 || requirement.trim().length > 3;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get("template");
    const template = workflowTemplates.find((item) => item.id === templateId);
    if (template) {
      setSelectedTemplateId(template.id);
      setRequirement(template.promptStarter);
      setBrief(template.briefStarter);
    }
  }, []);

  function selectTemplate(template: WorkflowTemplate) {
    setSelectedTemplateId(template.id);
    setRequirement(template.promptStarter);
    setBrief(template.briefStarter);
    setMessage("");
    void trackProductEvent("template_select", { template: template.id, title: template.title }, "create");
  }

  function selectCapability(capability: WorkflowCapability) {
    const template = workflowTemplates.find((item) => item.capability === capability) ?? workflowTemplates[0];
    selectTemplate(template);
  }

  function nextStep() {
    if (step === 1) setStep(2);
    else if (step === 2 && canContinue) setStep(3);
    else if (step === 3) void createTask();
  }

  async function createTask() {
    if (!requirement.trim()) return;
    setStep(4);
    setLoading(true);
    setMessage("");

    const response = await fetch(endpointFor(selectedTemplate.capability), {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(payloadFor(selectedTemplate, requirement, brief)),
    });

    const payload = (await response.json().catch(() => ({}))) as { task?: { id?: string }; error?: string };
    if (!response.ok || !payload.task?.id) {
      setLoading(false);
      const error = payload.error ?? "无法创建任务。";
      setMessage(error === "INSUFFICIENT_CREDITS"
        ? "当前 Credits 不足，无法创建这个工作流。请打开额度与套餐页面，或联系管理员增加体验额度。"
        : error.includes("provider") || error.includes("Provider")
          ? `${error} 请联系管理员检查 Provider 配置。`
          : `${error} 请检查登录状态、Beta 邀请码，或缩短输入内容后重试。`);
      return;
    }

    window.location.assign(selectedTemplate.capability === "drama" ? `/dashboard/studio/${payload.task.id}` : `/tasks/${payload.task.id}`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_78%_10%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(180deg,#050713_0%,#0b1020_44%,#f8fafc_44%,#f8fafc_100%)]">
      <TrackPageView surface="create" properties={{ page: "workflow_wizard", template: selectedTemplate.id, step }} />
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 text-white lg:grid-cols-[.9fr_1.1fr] lg:px-8">
        <header className="flex flex-col justify-between gap-8">
          <div>
            <Badge className="border-white/15 bg-white/10 text-white hover:bg-white/15" variant="outline">
              创作向导
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
              先选模板，再让 AI 自动生成内容。
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/68 md:text-base">
              选择一个创作场景，写下你的产品或内容需求，预览 AI 执行流程，然后启动生成任务。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className="bg-white text-slate-950 hover:bg-white/90" render={<Link href="/dashboard" />}>
              工作台
            </Button>
            <Button className="border-white/20 text-white hover:bg-white/10" render={<Link href="/assets" />} variant="outline">
              我的资产
            </Button>
          </div>
        </header>

        <Card className="border-white/10 bg-white/[0.08] text-white shadow-2xl shadow-black/25 backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="grid gap-3 sm:grid-cols-4">
              {wizardSteps.map((item) => {
                const active = item.step === step;
                const done = item.step < step;
                return (
                  <div className={`rounded-2xl border p-3 ${active ? "border-white/50 bg-white/15" : "border-white/10 bg-white/5"}`} key={item.step}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-white/55">步骤 {item.step}</span>
                      {done ? <CheckCircle2Icon className="size-4 text-emerald-300" /> : null}
                    </div>
                    <p className="mt-2 text-sm font-medium">{item.label}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/55 p-5">
              <div className={`grid size-14 place-items-center rounded-2xl bg-gradient-to-br ${selectedTemplate.accent} text-white shadow-lg`}>
                <Icon className="size-6" />
              </div>
              <p className="mt-4 text-2xl font-semibold">{selectedTemplate.title}</p>
              <p className="mt-2 text-sm leading-6 text-white/60">{selectedTemplate.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedTemplate.outcome.map((item) => <Badge className="border-white/15 bg-white/10 text-white" key={item} variant="outline">{item}</Badge>)}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-12 lg:grid-cols-[.95fr_1.05fr] lg:px-8">
        <Card className="bg-white/95 shadow-xl shadow-slate-950/5">
          <CardHeader>
            <CardTitle>步骤 1：选择创作模板</CardTitle>
            <CardDescription>不用从空白开始，先选择最接近你业务目标的模板。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2 sm:grid-cols-4">
              {taskTypes.map((capability) => {
                const TypeIcon = capabilityIcons[capability];
                const active = selectedTemplate.capability === capability;
                return (
                  <button
                    className={`rounded-2xl border p-3 text-left transition hover:bg-muted/60 ${active ? "border-slate-950 bg-slate-950 text-white" : "bg-background"}`}
                    key={capability}
                    onClick={() => selectCapability(capability)}
                    type="button"
                  >
                    <TypeIcon className="size-5" />
                    <p className="mt-3 text-sm font-medium">{capabilityLabels[capability].title}</p>
                    <p className={`mt-1 text-xs leading-5 ${active ? "text-white/60" : "text-muted-foreground"}`}>
                      {capabilityLabels[capability].description}
                    </p>
                  </button>
                );
              })}
            </div>
            {workflowTemplates.map((template) => {
              const TemplateIcon = capabilityIcons[template.capability];
              const active = template.id === selectedTemplate.id;
              return (
                <button
                  className={`rounded-2xl border p-4 text-left transition hover:bg-muted/60 ${active ? "border-violet-300 bg-violet-50 shadow-lg shadow-violet-500/10" : "bg-background"}`}
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  type="button"
                >
                  <div className="flex items-start gap-3">
                    <span className={`grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${template.accent} text-white`}>
                      <TemplateIcon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{template.title}</p>
                        <Badge variant="outline">{template.channel}</Badge>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="bg-white/95 shadow-xl shadow-slate-950/5">
            <CardHeader>
            <CardTitle>步骤 2：输入你的创作需求</CardTitle>
              <CardDescription>{capabilityLabels[selectedTemplate.capability].description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Textarea
                className="min-h-36 text-base"
                onChange={(event) => setRequirement(event.target.value)}
                placeholder={selectedTemplate.promptStarter}
                value={requirement}
              />
              <Textarea
                className="min-h-24"
                onChange={(event) => setBrief(event.target.value)}
                placeholder={selectedTemplate.briefStarter}
                value={brief}
              />
              <div className="flex flex-wrap gap-2">
                <Button disabled={!canContinue || loading} onClick={nextStep}>
                  {step < 3 ? "继续" : "启动 AI 生成"}
                  <ArrowRightIcon data-icon="inline-end" />
                </Button>
                <Button onClick={() => setStep(1)} variant="outline">返回模板</Button>
              </div>
              {message ? <p className="text-sm text-destructive">{message}</p> : null}
            </CardContent>
          </Card>

          <Card className="bg-white/95 shadow-xl shadow-slate-950/5">
            <CardHeader>
              <CardTitle>步骤 3：AI 执行流程预览</CardTitle>
              <CardDescription>启动后，任务详情页会按这个流程展示生成进度。</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              {[
                ["1", "理解需求", "解析模板、渠道、目标客户和你想要的输出。"],
                ["2", "生成内容", "根据类型进入文案、图片、视频或短剧工作流。"],
                ["3", "保存结果", "保存任务状态和生成结果，方便后续查看与复用。"],
              ].map(([number, title, description]) => (
                <div className="rounded-2xl border bg-background p-4" key={number}>
                  <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary">步骤 {number}</Badge>
                    {step >= 3 ? <PlayCircleIcon className="size-4 text-violet-600" /> : null}
                  </div>
                  <p className="mt-3 font-medium">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {step === 4 ? (
            <Card className="border-violet-200 bg-violet-50 shadow-xl shadow-violet-500/10">
              <CardContent className="flex items-center gap-3 p-5">
                {loading ? <Loader2Icon className="size-5 animate-spin text-violet-600" /> : <SparklesIcon className="size-5 text-violet-600" />}
                <p className="text-sm text-violet-950">正在启动工作流，并打开任务详情页...</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>
    </main>
  );
}
