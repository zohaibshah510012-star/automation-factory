import { NextResponse } from "next/server";
import { requireUser } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { consumeBetaInvite } from "@/lib/beta-invite-service";
import { trackProductEvent, trackProductEventOnce } from "@/lib/product-analytics";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request); const supabase = getSupabaseServerClient()!;
    const body = await request.json().catch(() => ({})) as { inviteCode?: string; invite_code?: string };
    const inviteCode = body.inviteCode ?? body.invite_code;
    const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
    const role = user.email && admins.includes(user.email.toLowerCase()) ? "admin" : "customer";
    const inviteOnly = (process.env.BETA_INVITE_ONLY ?? "true").toLowerCase() !== "false";
    const { data: existingSignupEvent } = await supabase.from("product_events").select("id").eq("user_id", user.id).in("event_name", ["signup_complete", "signup_completed"]).limit(1).maybeSingle();
    if (inviteOnly && role !== "admin" && !existingSignupEvent && !inviteCode) throw new Error("BETA_INVITE_REQUIRED");
    if (inviteCode && user.email) await consumeBetaInvite({ email: user.email, inviteCode });
    const { data, error } = await supabase.from("profiles").upsert({ id: user.id, email: user.email, display_name: user.user_metadata.full_name ?? user.email?.split("@")[0], role }, { onConflict: "id" }).select("id,email,role,status,credits_balance").single();
    if (!existingSignupEvent) await trackProductEvent({ eventName: "signup_complete", userId: user.id, surface: "auth", path: "/api/auth/bootstrap", properties: { role } });
    await trackProductEventOnce({ eventName: "signup_completed", userId: user.id, surface: "auth", path: "/api/auth/bootstrap", properties: { role, invited: Boolean(inviteCode) } });
    if (error) throw error; return NextResponse.json({ profile: data });
  } catch { return NextResponse.json({ error: "Unable to initialize account" }, { status: 401 }); }
}
