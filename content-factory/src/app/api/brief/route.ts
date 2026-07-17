import { NextResponse } from "next/server";

import { requireUser } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;
type Platform = "douyin" | "xiaohongshu" | "youtube_shorts";

const ALLOWED_PLATFORMS: Record<Platform, string> = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  youtube_shorts: "YouTube Shorts",
};

function cleanText(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function parsePlatforms(value: unknown): Platform[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Platform => typeof item === "string" && item in ALLOWED_PLATFORMS);
}

function displayNameFromUser(user: Awaited<ReturnType<typeof requireUser>>) {
  const metadataName = user.user_metadata.full_name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  return user.email?.split("@")[0] ?? "customer";
}

async function ensureProfile(user: Awaited<ReturnType<typeof requireUser>>) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      display_name: displayNameFromUser(user),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    await ensureProfile(user);

    const body = (await request.json().catch(() => ({}))) as JsonRecord;
    const customerBrand = cleanText(body.customerBrand, 200);
    const productName = cleanText(body.productName, 200);
    const productIntro = cleanText(body.productIntro, 4000);
    const targetCustomer = cleanText(body.targetCustomer, 2000);
    const marketingGoal = cleanText(body.marketingGoal, 2000);
    const materialNotes = cleanText(body.materialNotes, 2000);
    const platforms = parsePlatforms(body.platforms);

    if (!customerBrand) return NextResponse.json({ error: "请填写公司/品牌名称" }, { status: 400 });
    if (!productName) return NextResponse.json({ error: "请填写产品名称" }, { status: 400 });
    if (!productIntro) return NextResponse.json({ error: "请填写产品介绍" }, { status: 400 });
    if (!targetCustomer) return NextResponse.json({ error: "请填写目标客户" }, { status: 400 });
    if (!marketingGoal) return NextResponse.json({ error: "请填写营销目标" }, { status: 400 });
    if (!platforms.length) return NextResponse.json({ error: "请至少选择一个发布平台" }, { status: 400 });

    const platformLabels = platforms.map((platform) => ALLOWED_PLATFORMS[platform]);
    const businessNeed = [
      `目标客户：${targetCustomer}`,
      `营销目标：${marketingGoal}`,
      `平台选择：${platformLabels.join("、")}`,
      materialNotes ? `素材链接/说明：${materialNotes}` : "素材链接/说明：客户暂未提供",
    ].join("\n");

    const supabase = getSupabaseServerClient();
    if (!supabase) throw new Error("SUPABASE_NOT_CONFIGURED");

    const { data, error } = await supabase
      .from("founder_customer_projects")
      .insert({
        customer_brand: customerBrand,
        project_name: `${productName} 内容营销 Brief`,
        workflow_used: "customer_brief_intake",
        product_info: productIntro,
        business_need: businessNeed,
        content_task_ids: [],
        distribution_job_ids: [],
        generated_assets: [],
        deliverables: {
          source: "customer_brief",
          productName,
          targetCustomer,
          marketingGoal,
          platforms,
          platformLabels,
          materialNotes: materialNotes || null,
          expectedOutputs: ["Marketing Strategy", "Script", "Image Assets", "Video Preview", "Distribution Package"],
        },
        generation_cost: 0,
        credits_used: 0,
        status: "planned",
        result_notes: "客户通过 /brief 提交，等待 Founder 确认交付方案并开始生产。",
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !data) throw error ?? new Error("Unable to create customer brief project");

    return NextResponse.json({ project: data }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit customer brief";
    console.error("[automation-factory] customer_brief_submit_failed", { message });
    const isAuthError = message === "AUTH_REQUIRED";
    return NextResponse.json(
      { error: isAuthError ? "请先登录后提交 Brief" : "提交失败，请稍后重试" },
      { status: isAuthError ? 401 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
