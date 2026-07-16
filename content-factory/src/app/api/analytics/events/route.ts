import { NextResponse } from "next/server";

import { trackProductEvent, type ProductEventName } from "@/lib/product-analytics";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedEvents = new Set<ProductEventName>([
  "page_view",
  "cta_click",
  "signup_complete",
  "signup_completed",
  "first_workspace_created",
  "template_view",
  "template_select",
  "task_create",
  "first_generation_started",
  "task_complete",
  "first_generation_completed",
  "first_asset_created",
  "credits_consumed",
  "billing_view",
  "upgrade_click",
]);

async function optionalUserId(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const supabase = getSupabaseServerClient();
  if (!token || !supabase) return null;
  const { data } = await supabase.auth.getUser(token);
  return data.user?.id ?? null;
}

function safeString(value: unknown, maxLength: number) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : trimmed.slice(0, maxLength);
}

function safeProperties(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const json = JSON.stringify(value);
  if (json.length > 4_000) return { truncated: true };
  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit({ key: `analytics:${getClientIp(request)}`, limit: 120, windowMs: 60_000 });
    if (!rate.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

    const body = await request.json() as {
      eventName?: ProductEventName;
      anonymousId?: unknown;
      surface?: unknown;
      path?: unknown;
      referrer?: unknown;
      properties?: unknown;
    };

    if (!body.eventName || !allowedEvents.has(body.eventName)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    await trackProductEvent({
      eventName: body.eventName,
      userId: await optionalUserId(request),
      anonymousId: safeString(body.anonymousId, 128),
      surface: safeString(body.surface, 64) ?? "web",
      path: safeString(body.path, 512),
      referrer: safeString(body.referrer, 512),
      userAgent: request.headers.get("user-agent"),
      properties: safeProperties(body.properties),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to track event" }, { status: 400 });
  }
}
