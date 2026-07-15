import { NextResponse } from "next/server";

import { trackProductEvent, type ProductEventName } from "@/lib/product-analytics";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedEvents = new Set<ProductEventName>([
  "page_view",
  "cta_click",
  "signup_complete",
  "template_view",
  "template_select",
  "task_create",
  "task_complete",
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

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      eventName?: ProductEventName;
      anonymousId?: string;
      surface?: string;
      path?: string;
      referrer?: string | null;
      properties?: Record<string, unknown>;
    };

    if (!body.eventName || !allowedEvents.has(body.eventName)) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    await trackProductEvent({
      eventName: body.eventName,
      userId: await optionalUserId(request),
      anonymousId: body.anonymousId,
      surface: body.surface ?? "web",
      path: body.path,
      referrer: body.referrer,
      userAgent: request.headers.get("user-agent"),
      properties: body.properties ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to track event" }, { status: 400 });
  }
}
