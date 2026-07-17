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
      setMessage("Unable to load revenue validation.");
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
    setMessage(response.ok ? "Founder Demo Case created." : "Unable to create demo case.");
    await load();
  }

  async function createProject() {
    const response = await fetch("/api/admin/revenue", {
      method: "POST",
      headers: { ...(await authHeaders()), "Content-Type": "application/json" },
      body: JSON.stringify(projectForm),
    });
    setMessage(response.ok ? "Customer project recorded." : "Unable to record project. Customer, project, and workflow are required.");
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
    setMessage(response.ok ? "Project status updated." : "Unable to update project status.");
    await load();
  }

  useEffect(() => {
    void load();
  }, []);

  const metricCards = useMemo(() => [
    { label: "Projects", value: data?.summary.projectCount ?? 0, helper: `${data?.summary.readyToSell ?? 0} ready to sell`, icon: BriefcaseBusinessIcon },
    { label: "Generations", value: data?.summary.generationCount ?? 0, helper: "linked content tasks", icon: RocketIcon },
    { label: "Delivered assets", value: data?.summary.deliveredAssets ?? 0, helper: "linked + recorded assets", icon: PackageCheckIcon },
    { label: "Credits used", value: data?.summary.creditsUsed ?? 0, helper: "commercial validation cost", icon: CoinsIcon },
    { label: "AI cost", value: money(data?.summary.aiCost ?? 0), helper: "manual or estimated", icon: DollarSignIcon },
  ], [data]);

  const workflowUsage = Object.entries(data?.summary.workflowUsage ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Founder Revenue Validation</p>
          <h1 className="text-3xl font-semibold">Revenue Validation View</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Track founder-led customer projects, generated assets, AI cost, Credits, and sales readiness without changing the AI runtime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button render={<Link href="/create" />} variant="outline">Create assets</Button>
          <Button render={<Link href="/assets" />} variant="outline">Review assets</Button>
          <Button onClick={() => void load()} variant="outline">
            <RefreshCwIcon data-icon="inline-start" />
            Refresh
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
            <CardTitle>Founder Demo Case flow</CardTitle>
            <CardDescription>Use existing workflows to produce one sellable customer-facing example.</CardDescription>
            <CardAction><PackageCheckIcon /></CardAction>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-5">
              {["Product Info", "Marketing Strategy", "Script", "Image Assets", "Video Preview", "Distribution Package"].map((step, index) => (
                <div className="rounded-lg border bg-background/70 p-3" key={step}>
                  <p className="text-xs text-muted-foreground">Step {index + 1}</p>
                  <p className="mt-1 text-sm font-medium">{step}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                onChange={(event) => setDemoForm({ ...demoForm, customerBrand: event.target.value })}
                placeholder="Customer / Brand"
                value={demoForm.customerBrand}
              />
              <Input
                onChange={(event) => setDemoForm({ ...demoForm, productInfo: event.target.value })}
                placeholder="Product information"
                value={demoForm.productInfo}
              />
              <Input
                onChange={(event) => setDemoForm({ ...demoForm, businessNeed: event.target.value })}
                placeholder="Commercial need"
                value={demoForm.businessNeed}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
              <div>
                <p className="text-sm font-medium">Demo Case status: {data?.demoCase.status === "created" ? "created" : "not created"}</p>
                <p className="text-xs text-muted-foreground">This records the sales case plan. Generate assets from existing Create workflows, then link task IDs in project notes.</p>
              </div>
              <Button disabled={data?.demoCase.status === "created"} onClick={() => void createDemoCase()}>
                Create Demo Case
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow usage</CardTitle>
            <CardDescription>Which workflows support commercial validation.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {workflowUsage.map(([workflow, count]) => (
              <div className="flex items-center justify-between gap-3 rounded-lg border bg-background/70 px-3 py-2 text-sm" key={workflow}>
                <span>{workflow}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
            {!workflowUsage.length ? <p className="text-sm text-muted-foreground">No commercial projects recorded yet.</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Record customer project</CardTitle>
            <CardDescription>Use this for founder-led paid or pre-sales projects.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input onChange={(event) => setProjectForm({ ...projectForm, customerBrand: event.target.value })} placeholder="Customer / Brand" value={projectForm.customerBrand} />
            <Input onChange={(event) => setProjectForm({ ...projectForm, projectName: event.target.value })} placeholder="Project Name" value={projectForm.projectName} />
            <Input onChange={(event) => setProjectForm({ ...projectForm, workflowUsed: event.target.value })} placeholder="Workflow Used" value={projectForm.workflowUsed} />
            <Textarea onChange={(event) => setProjectForm({ ...projectForm, productInfo: event.target.value })} placeholder="Product information" value={projectForm.productInfo} />
            <Textarea onChange={(event) => setProjectForm({ ...projectForm, businessNeed: event.target.value })} placeholder="Business need" value={projectForm.businessNeed} />
            <Textarea onChange={(event) => setProjectForm({ ...projectForm, resultNotes: event.target.value })} placeholder="Result notes / linked task IDs / delivery notes" value={projectForm.resultNotes} />
            <Button onClick={() => void createProject()}>Record Project</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer projects</CardTitle>
            <CardDescription>Commercial validation cases, delivery assets, and sales readiness.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>AI Cost</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead>Updated</TableHead>
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
                    <TableCell className="text-muted-foreground" colSpan={7}>No customer projects recorded yet. Create the Founder Demo Case first.</TableCell>
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
