import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type JsonRecord = Record<string, unknown>;

type FounderCustomerProjectRow = {
  id: string;
  customer_brand: string;
  project_name: string;
  workflow_used: string;
  product_info: string | null;
  business_need: string | null;
  content_task_ids: string[];
  distribution_job_ids: string[];
  generated_assets: unknown;
  deliverables: unknown;
  generation_cost: number;
  credits_used: number;
  status: "planned" | "generating" | "reviewing" | "ready_to_sell" | "delivered" | "won" | "lost";
  result_notes: string | null;
  created_at: string;
  updated_at: string;
};

type ContentTaskRow = {
  id: string;
  task_type: string | null;
  status: string;
  credits_charged: number | null;
};

type AssetRow = {
  id: string;
  content_task_id: string;
  type: string;
  name: string;
  url: string;
  provider: string | null;
};

const PROJECT_STATUSES = ["planned", "generating", "reviewing", "ready_to_sell", "delivered", "won", "lost"] as const;

function cleanText(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

function jsonRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function jsonArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isProjectStatus(value: unknown): value is FounderCustomerProjectRow["status"] {
  return PROJECT_STATUSES.includes(value as FounderCustomerProjectRow["status"]);
}

function estimateCostFromCredits(credits: number) {
  return Number((credits * Number(process.env.PROVIDER_COST_PER_CREDIT_USD ?? "0.01")).toFixed(4));
}

function summarizeProjects(projectRows: FounderCustomerProjectRow[], taskRows: ContentTaskRow[], assetRows: AssetRow[]) {
  const workflowUsage = projectRows.reduce<Record<string, number>>((counts, project) => {
    counts[project.workflow_used] = (counts[project.workflow_used] ?? 0) + 1;
    return counts;
  }, {});
  const statusCounts = projectRows.reduce<Record<string, number>>((counts, project) => {
    counts[project.status] = (counts[project.status] ?? 0) + 1;
    return counts;
  }, {});
  const contentTaskIds = new Set(projectRows.flatMap((project) => project.content_task_ids ?? []));
  const linkedTasks = taskRows.filter((task) => contentTaskIds.has(task.id));
  return {
    projectCount: projectRows.length,
    generationCount: linkedTasks.length,
    deliveredAssets: assetRows.length + projectRows.reduce((total, project) => total + jsonArray(project.generated_assets).length, 0),
    creditsUsed: projectRows.reduce((total, project) => total + Number(project.credits_used ?? 0), 0),
    aiCost: Number(projectRows.reduce((total, project) => total + Number(project.generation_cost ?? 0), 0).toFixed(4)),
    workflowUsage,
    statusCounts,
    readyToSell: projectRows.filter((project) => project.status === "ready_to_sell" || project.status === "delivered" || project.status === "won").length,
  };
}

function demoDeliverables(productInfo: string, businessNeed: string) {
  return {
    marketingStrategy: {
      status: "planned",
      output: "Position the product around one clear audience, pain point, transformation, and short-form content angle.",
    },
    script: {
      status: "planned",
      output: "Use existing Short Drama / Marketing Content workflow to produce the sales story, hooks, and CTA.",
    },
    imageAssets: {
      status: "planned",
      output: "Use existing Image workflow or Short Drama scene images for sales visuals.",
    },
    videoPreview: {
      status: "planned",
      output: "Use existing Video workflow fallback or configured provider for a preview asset.",
    },
    distributionPackage: {
      status: "planned",
      output: "Use existing Distribution MVP export package for TikTok, YouTube Shorts, and Xiaohongshu manual publishing prep.",
    },
    sourceInput: {
      productInfo,
      businessNeed,
    },
  };
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = getSupabaseServerClient()!;
    const [projects, tasks, assets] = await Promise.all([
      supabase.from("founder_customer_projects").select("*").order("updated_at", { ascending: false }).limit(100),
      supabase.from("content_tasks").select("id,task_type,status,credits_charged").limit(5000),
      supabase.from("assets").select("id,content_task_id,type,name,url,provider").limit(5000),
    ]);
    for (const result of [projects, tasks, assets]) {
      if (result.error) throw result.error;
    }
    const projectRows = (projects.data ?? []) as FounderCustomerProjectRow[];
    const taskRows = (tasks.data ?? []) as ContentTaskRow[];
    const assetRows = (assets.data ?? []) as AssetRow[];
    const linkedTaskIds = new Set(projectRows.flatMap((project) => project.content_task_ids ?? []));
    const linkedAssets = assetRows.filter((asset) => linkedTaskIds.has(asset.content_task_id));
    return NextResponse.json(
      {
        summary: summarizeProjects(projectRows, taskRows, linkedAssets),
        projects: projectRows,
        linkedAssets,
        demoCase: {
          input: "Product information / commercial need",
          output: ["Marketing Strategy", "Script", "Image Assets", "Video Preview", "Distribution Package"],
          status: projectRows.some((project) => project.project_name === "Founder Revenue Demo Case") ? "created" : "not_created",
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load revenue validation";
    console.error("[automation-factory] revenue_validation_load_failed", { message });
    return NextResponse.json({ error: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? "Admin access required" : "Unable to load revenue validation" }, { status: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? 403 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = (await request.json()) as JsonRecord;
    const action = cleanText(body.action, 80);
    const supabase = getSupabaseServerClient()!;

    if (action === "create_demo_case") {
      const productInfo = cleanText(body.productInfo, 2000) || "Founder-owned product or service offer to validate first paid customer delivery.";
      const businessNeed = cleanText(body.businessNeed, 2000) || "Create a sellable AI content package for the first customer conversation.";
      const { data, error } = await supabase
        .from("founder_customer_projects")
        .insert({
          customer_brand: cleanText(body.customerBrand, 200) || "Founder Demo Brand",
          project_name: "Founder Revenue Demo Case",
          workflow_used: "short_drama + image + video + distribution_mvp",
          product_info: productInfo,
          business_need: businessNeed,
          deliverables: demoDeliverables(productInfo, businessNeed),
          generated_assets: [],
          generation_cost: 0,
          credits_used: 0,
          status: "planned",
          result_notes: "Use existing workflows to generate strategy, script, images, video preview, and distribution package. Update linked task IDs after generation.",
          created_by: admin.id,
        })
        .select()
        .single();
      if (error || !data) throw error ?? new Error("Unable to create demo case");
      await supabase.from("audit_logs").insert({
        admin_id: admin.id,
        action: "founder_revenue_demo_case_created",
        resource_type: "founder_customer_project",
        resource_id: data.id,
        metadata: { projectName: "Founder Revenue Demo Case" },
      });
      return NextResponse.json({ project: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }

    const contentTaskIds = stringArray(body.contentTaskIds);
    const distributionJobIds = stringArray(body.distributionJobIds);
    const creditsUsed = Number(body.creditsUsed ?? 0);
    const explicitCost = Number(body.generationCost ?? 0);
    const projectPayload = {
      customer_brand: cleanText(body.customerBrand, 200),
      project_name: cleanText(body.projectName, 200),
      workflow_used: cleanText(body.workflowUsed, 200),
      product_info: cleanText(body.productInfo, 4000) || null,
      business_need: cleanText(body.businessNeed, 4000) || null,
      content_task_ids: contentTaskIds,
      distribution_job_ids: distributionJobIds,
      generated_assets: jsonArray(body.generatedAssets),
      deliverables: jsonRecord(body.deliverables),
      generation_cost: explicitCost > 0 ? explicitCost : estimateCostFromCredits(creditsUsed),
      credits_used: Number.isFinite(creditsUsed) ? Math.max(0, Math.round(creditsUsed)) : 0,
      status: isProjectStatus(body.status) ? body.status : "planned",
      result_notes: cleanText(body.resultNotes, 4000) || null,
      created_by: admin.id,
    };
    if (!projectPayload.customer_brand || !projectPayload.project_name || !projectPayload.workflow_used) {
      return NextResponse.json({ error: "Customer / Brand, Project Name, and Workflow Used are required" }, { status: 400 });
    }
    const { data, error } = await supabase.from("founder_customer_projects").insert(projectPayload).select().single();
    if (error || !data) throw error ?? new Error("Unable to create customer project");
    await supabase.from("audit_logs").insert({
      admin_id: admin.id,
      action: "founder_customer_project_created",
      resource_type: "founder_customer_project",
      resource_id: data.id,
      metadata: { projectName: projectPayload.project_name, customerBrand: projectPayload.customer_brand },
    });
    return NextResponse.json({ project: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create revenue validation project";
    console.error("[automation-factory] revenue_validation_create_failed", { message });
    return NextResponse.json({ error: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? "Admin access required" : message }, { status: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? 403 : 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin(request);
    const body = (await request.json()) as JsonRecord;
    const projectId = cleanText(body.projectId, 64);
    if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    const updates: JsonRecord = { updated_at: new Date().toISOString() };
    if (isProjectStatus(body.status)) updates.status = body.status;
    if (typeof body.resultNotes === "string") updates.result_notes = cleanText(body.resultNotes, 4000) || null;
    if (Array.isArray(body.contentTaskIds)) updates.content_task_ids = stringArray(body.contentTaskIds);
    if (Array.isArray(body.distributionJobIds)) updates.distribution_job_ids = stringArray(body.distributionJobIds);
    if (Array.isArray(body.generatedAssets)) updates.generated_assets = jsonArray(body.generatedAssets);
    if (body.deliverables && typeof body.deliverables === "object" && !Array.isArray(body.deliverables)) updates.deliverables = jsonRecord(body.deliverables);
    if (body.creditsUsed !== undefined) updates.credits_used = Math.max(0, Math.round(Number(body.creditsUsed) || 0));
    if (body.generationCost !== undefined) updates.generation_cost = Math.max(0, Number(body.generationCost) || 0);

    const supabase = getSupabaseServerClient()!;
    const { data, error } = await supabase.from("founder_customer_projects").update(updates).eq("id", projectId).select().single();
    if (error || !data) throw error ?? new Error("Unable to update project");
    await supabase.from("audit_logs").insert({
      admin_id: admin.id,
      action: "founder_customer_project_updated",
      resource_type: "founder_customer_project",
      resource_id: projectId,
      metadata: { updatedFields: Object.keys(updates).filter((key) => key !== "updated_at") },
    });
    return NextResponse.json({ project: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update revenue validation project";
    console.error("[automation-factory] revenue_validation_update_failed", { message });
    return NextResponse.json({ error: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? "Admin access required" : message }, { status: message === "AUTH_REQUIRED" || message === "ADMIN_REQUIRED" ? 403 : 400 });
  }
}
