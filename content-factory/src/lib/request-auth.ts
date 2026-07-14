import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const supabase = getSupabaseServerClient();
  if (!token || !supabase) throw new Error("AUTH_REQUIRED");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error("AUTH_REQUIRED");
  return data.user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  const supabase = getSupabaseServerClient()!;
  const { data } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  const bootstrapEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim()).filter(Boolean);
  const isBootstrapAdmin = !!user.email && bootstrapEmails.includes(user.email);
  if (isBootstrapAdmin && data?.role !== "admin") await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id);
  if (data?.role !== "admin" && !isBootstrapAdmin) throw new Error("ADMIN_REQUIRED");
  return user;
}
