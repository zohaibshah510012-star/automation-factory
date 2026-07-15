import { NextResponse } from "next/server";
import { requireUser } from "@/lib/request-auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { trackProductEvent } from "@/lib/product-analytics";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request); const supabase = getSupabaseServerClient()!;
    const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean);
    const role = user.email && admins.includes(user.email.toLowerCase()) ? "admin" : "customer";
    const { data, error } = await supabase.from("profiles").upsert({ id: user.id, email: user.email, display_name: user.user_metadata.full_name ?? user.email?.split("@")[0], role }, { onConflict: "id" }).select("id,email,role,status,credits_balance").single();
    const { data: existingSignupEvent } = await supabase.from("product_events").select("id").eq("user_id", user.id).eq("event_name", "signup_complete").maybeSingle();
    if (!existingSignupEvent) await trackProductEvent({ eventName: "signup_complete", userId: user.id, surface: "auth", path: "/api/auth/bootstrap", properties: { role } });
    if (error) throw error; return NextResponse.json({ profile: data });
  } catch { return NextResponse.json({ error: "Unable to initialize account" }, { status: 401 }); }
}
