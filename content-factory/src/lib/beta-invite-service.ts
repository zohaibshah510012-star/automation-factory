import { getSupabaseServerClient } from "@/lib/supabase/server";

type InviteStatus = "pending" | "used" | "revoked";

function store() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("BETA_INVITE_STORE_UNAVAILABLE");
  return supabase;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function createInviteCode() {
  return `BETA-${crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

export async function listBetaInvites() {
  const { data, error } = await store()
    .from("beta_invites")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function createBetaInvite(input: { email: string; inviteCode?: string }) {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) throw new Error("INVALID_EMAIL");

  const inviteCode = normalizeCode(input.inviteCode || createInviteCode());
  const { data, error } = await store()
    .from("beta_invites")
    .insert({ email, invite_code: inviteCode, status: "pending" satisfies InviteStatus })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to create invite");
  return data;
}

export async function updateBetaInviteStatus(input: { id: string; status: InviteStatus }) {
  const patch = {
    status: input.status,
    used_at: input.status === "used" ? new Date().toISOString() : null,
  };
  const { data, error } = await store()
    .from("beta_invites")
    .update(patch)
    .eq("id", input.id)
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to update invite");
  return data;
}

export async function verifyBetaInvite(input: { email: string; inviteCode: string }) {
  const email = normalizeEmail(input.email);
  const inviteCode = normalizeCode(input.inviteCode);
  const { data, error } = await store()
    .from("beta_invites")
    .select("*")
    .eq("invite_code", inviteCode)
    .eq("status", "pending")
    .maybeSingle();
  if (error) throw error;
  if (!data || normalizeEmail(data.email as string) !== email) throw new Error("INVALID_BETA_INVITE");
  return data;
}

export async function consumeBetaInvite(input: { email: string; inviteCode: string }) {
  const email = normalizeEmail(input.email);
  const inviteCode = normalizeCode(input.inviteCode);
  const { data: invite, error: inviteError } = await store()
    .from("beta_invites")
    .select("*")
    .eq("invite_code", inviteCode)
    .in("status", ["pending", "used"])
    .maybeSingle();
  if (inviteError) throw inviteError;
  if (!invite || normalizeEmail(invite.email as string) !== email) throw new Error("INVALID_BETA_INVITE");
  if (invite.status === "used") return invite;
  const { data, error } = await store()
    .from("beta_invites")
    .update({ status: "used" satisfies InviteStatus, used_at: new Date().toISOString() })
    .eq("id", invite.id)
    .eq("status", "pending")
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Unable to consume beta invite");
  return data;
}
