"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusinessIcon, CoinsIcon, DollarSignIcon, PackageCheckIcon, RefreshCwIcon, RocketIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProjectStatus = "planned" | "generating" | "reviewing" | "ready_to_sell" | "delivered" | "won" | "lost";

type FounderProject = {
  id: string;
  customer_brand: string;
  project_name: string;
  workflow_used: string;
  product_info: string | null;
  business_need: string | null;
  content_task_ids: string[];
  distribution_job_ids: string[];
  generated_assets: unknown[];
  deliverables: Record<string, unknown>;
  generation_cost: number;
  credits_used: number;
  status: ProjectStatus;
  result_notes: string | null;
  updated_at: string;
};

type RevenueData = {
  summary: {
    projectCount: number;
    generationCount: number;
    deliveredAssets: number;
    creditsUsed: number;
    aiCost: number;
    workflowUsage: Record<string, number>;
    statusCounts: Record<string, number>;
    readyToSell: number;
  };
  projects: FounderProject[];
  demoCase: {
    input: string;
    output: string[];
    status: "created" | "not_created";
  };
};

type ProjectForm = {
  customerBrand: string;
  projectName: string;
  workflowUsed: string;
  productInfo: string;
  businessNeed: string;
  resultNotes: string;
};

async function authHeaders() {
  const session = await getSupabaseBrowserClient()?.auth.getSession();
  return { Authorization: `Bearer ${session?.data.session?.access_token ?? ""}` };
}

function money(value: number) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : "-";
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "won" || status === "delivered" || status === "ready_to_sell") return "default";
  if (status === "reviewing" || status === "generating") return "secondary";
  if (status === "lost") return "destructive";
  return "outline";
}

export default function FounderRevenueValidationPage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [demoForm, setDemoForm] = useState({
    customerBrand: "Founder Demo Brand",
    productInfo: "",
    businessNeed: "",
  });
  const [projectForm, setProjectForm] = useState<ProjectForm>({
    customerBrand: "",
    projectName: "",
    workflowUsed: "short_drama",
    productInfo: "",
    businessNeed: "",
    resultNotes: "",
  });

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/revenue", { headers: await authHeaders(), cache: "no-store" });
    if (!response.ok) {
      if (response.status === 403) location.assign("/");
      setMessage("无法加载商业验证数据。");
      setLoading(false);
      return;
    }
    setData(await response.json());
    setMessage("");
    setLoading(false);
  }

  async function createDemoCase() {
    const response = await fetch("/api/admin/revenue", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_demo_case", ...demoForm }),
    });
    setMessage(response.ok ? "Founder Demo Case 已创建。" : "无法创建 Demo Case。");
    await load();
  }

  async function createProject() {
    const response = await fetch("/api/admin/revenue", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(projectForm),
    });
    setMessage(response.ok ? "客户项目已记录。" : "无法记录项目，请填写客户、项目和工作流。");
    if (response.ok) {
      setProjectForm({
        customerBrand: "",
        projectName: "",
        workflowUsed: "short_drama",
        productInfo: "",
        businessNeed: "",
        resultNotes: "",
      });
    }
    await load();
  }

  async function updateProjectStatus(projectId: string, status: ProjectStatus) {
    const response = await fetch("/api/admin/revenue", {
      method: "PATCH",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, status }),
    });
    setMessage(response.ok ? "项目状态已更新。" : "无法更新项目状态。");
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  const metricCards = useMemo(() => [
    { label: "项目数", value: data?.summary.projectCount ?? 0, helper: `${data?.summary.readyToSell ?? 0} 个可销售`, icon: BriefcaseBusinessIcon },
    { label: "生成次数", value: data?.summary.generationCount ?? 0, helper: "已关联内容任务", icon: RocketIcon },
    { label: "交付资产", value: data?.summary.deliveredAssets ?? 0, helper: "已关联 + 已记录资产", icon: PackageCheckIcon },
    { label: "Credits 消耗", value: data?.summary.creditsUsed ?? 0, helper: "商业验证成本", icon: CoinsIcon },
    { label: "AI 成本", value: money(data?.summary.aiCost ?? 0), helper: "手动或估算", icon: DollarSignIcon },
  ], [data]);

  const workflowUsage = Object.entries(data?.summary.workflowUsage ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Founder 商业验证</p>
          <h1 className="text-3xl font-semibold">商业验证看板</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            记录客户项目、生成资产、AI 成本、Credits 消耗和可销售状态，不修改 AI Runtime。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/create" />} variant="outline">创建资产</Button>
          <Button render={<Link href="/assets" />} variant="outline">查看资产</Button>
          <Button onClick={() => void load()} variant="outline">
            <RefreshCwIcon data-icon="inline-start" />
            刷新
          </Button>
        </div>
      </div>

      {message ? <p className="rounded-lg border bg-muted px-3 py-2 text-sm">{message}</p> : null}

      <section className="grid gap-4 md:grid-cols-5">
        {metricCards.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-sm">{metric.label}</CardTitle>
              <CardDescription>{metric.helper}</CardDescription>
              <CardAction><metric.icon /></CardAction>
            </CardHeader>
            <CardContent><p className="text-3xl font-semibold">{loading ? "…" : metric.value}</p></CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Card>
          <CardHeader>
            <CardTitle>Founder Demo Case 流程</CardTitle>
            <CardDescription>使用现有工作流，生成一个可销售的客户案例样本。</CardDescription>
            <CardAction><PackageCheckIcon /></CardAction>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-5">
              {["产品信息", "营销策略", "脚本", "图片资产", "视频预览", "发布包"].map((step, index) => (
                <div className="rounded-lg border bg-background/70 p-3" key={step}>
                  <p className="text-xs text-muted-foreground">步骤 {index + 1}</p>
                  <p className="mt-1 text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                onChange={(event) => setDemoForm({ ...demoForm, customerBrand: event.target.value })}
                placeholder="客户 / 品牌"
                value={demoForm.customerBrand}
              />
              <Input
                onChange={(event) => setDemoForm({ ...demoForm, productInfo: event.target.value })}
                placeholder="产品信息"
                value={demoForm.productInfo}
              />
              <Input
                onChange={(event) => setDemoForm({ ...demoForm, businessNeed: event.target.value })}
                placeholder="商业需求"
                value={demoForm.businessNeed}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
              <div>
                <p className="text-sm font-medium">Demo Case 状态：{data?.demoCase.status === "created" ? "已创建" : "未创建"}</p>
                <p className="text-xs text-muted-foreground">这里记录销售案例计划。先用现有创作工作流生成资产，再把任务 ID 写入项目备注。</p>
              </div>
              <Button disabled={data?.demoCase.status === "created"} onClick={() => void createDemoCase()}>
                创建 Demo Case
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>工作流使用情况</CardTitle>
            <CardDescription>哪些工作流正在支撑商业验证。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {workflowUsage.map(([workflow, count]) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/70 px-3 py-2 text-sm" key={workflow}>
                <span>{workflow}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
            {!workflowUsage.length ? <p className="text-sm text-muted-foreground">暂无商业项目记录。</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>记录客户项目</CardTitle>
            <CardDescription>用于记录 Founder 主导的付费或售前项目。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input onChange={(event) => setProjectForm({ ...projectForm, customerBrand: event.target.value })} placeholder="客户 / 品牌" value={projectForm.customerBrand} />
            <Input onChange={(event) => setProjectForm({ ...projectForm, projectName: event.target.value })} placeholder="项目名称" value={projectForm.projectName} />
            <Input onChange={(event) => setProjectForm({ ...projectForm, workflowUsed: event.target.value })} placeholder="使用的工作流" value={projectForm.workflowUsed} />
            <Textarea onChange={(event) => setProjectForm({ ...projectForm, productInfo: event.target.value })} placeholder="产品信息" value={projectForm.productInfo} />
            <Textarea onChange={(event) => setProjectForm({ ...projectForm, businessNeed: event.target.value })} placeholder="商业需求" value={projectForm.businessNeed} />
            <Textarea onChange={(event) => setProjectForm({ ...projectForm, resultNotes: event.target.value })} placeholder="结果备注 / 关联任务 ID / 交付说明" value={projectForm.resultNotes} />
            <Button onClick={() => void createProject()}>记录项目</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>客户项目</CardTitle>
            <CardDescription>商业验证案例、交付资产和销售准备状态。</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>项目</TableHead>
                  <TableHead>工作流</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>AI 成本</TableHead>
                  <TableHead>资产</TableHead>
                  <TableHead>更新时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.projects ?? []).map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <p className="font-medium">{project.project_name}</p>
                      <p className="text-xs text-muted-foreground">{project.customer_brand}</p>
                    </TableCell>
                    <TableCell>{project.workflow_used}</TableCell>
                    <TableCell>
                      <select
                        className="h-8 rounded-lg border bg-background px-2 text-xs"
                        onChange={(event) => void updateProjectStatus(project.id, event.target.value as ProjectStatus)}
                        value={project.status}
                      >
                        <option value="planned">planned</option>
                        <option value="generating">generating</option>
                        <option value="reviewing">reviewing</option>
                        <option value="ready_to_sell">ready_to_sell</option>
                        <option value="delivered">delivered</option>
                        <option value="won">won</option>
                        <option value="lost">lost</option>
                      </select>
                      <Badge className="ml-2" variant={statusVariant(project.status)}>{project.status}</Badge>
                    </TableCell>
                    <TableCell>{project.credits_used}</TableCell>
                    <TableCell>{money(project.generation_cost)}</TableCell>
                    <TableCell>{project.generated_assets.length + project.content_task_ids.length}</TableCell>
                    <TableCell>{formatDate(project.updated_at)}</TableCell>
                  </TableRow>
                ))}
                {!data?.projects.length ? (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={7}>暂无客户项目记录。请先创建 Founder Demo Case。</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
