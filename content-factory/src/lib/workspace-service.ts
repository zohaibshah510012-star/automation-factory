import { getSupabaseServerClient } from "@/lib/supabase/server";
import { trackProductEventOnce } from "@/lib/product-analytics";

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

function store() {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("WORKSPACE_STORE_UNAVAILABLE");
  return supabase;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `workspace-${Date.now()}`;
}

function defaultPermissions(role: WorkspaceRole) {
  return {
    manageBilling: role === "owner" || role === "admin",
    manageMembers: role === "owner" || role === "admin",
    createContent: role !== "viewer",
    viewContent: true,
  };
}

async function ensureWorkspaceManager(workspaceId: string, userId: string) {
  const supabase = store();
  const { data: workspace, error: workspaceError } = await supabase.from("workspaces").select("owner_id").eq("id", workspaceId).single();
  if (workspaceError) throw workspaceError;
  if (workspace.owner_id === userId) return;

  const { data: member, error } = await supabase
    .from("workspace_members")
    .select("role,status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (member?.status !== "active" || (member.role !== "owner" && member.role !== "admin")) throw new Error("WORKSPACE_PERMISSION_DENIED");
}

export async function listUserWorkspaces(userId: string) {
  const supabase = store();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role,permissions,status,workspaces(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createWorkspace(input: { userId: string; name: string; slug?: string }) {
  const supabase = store();
  const { count } = await supabase
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", input.userId)
    .eq("status", "active");
  const slug = input.slug?.trim() || slugify(input.name);
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({ owner_id: input.userId, name: input.name.trim(), slug })
    .select()
    .single();
  if (error) throw error;

  const { error: memberError } = await supabase.from("workspace_members").insert({
    workspace_id: workspace.id,
    user_id: input.userId,
    role: "owner",
    permissions: defaultPermissions("owner"),
    status: "active",
  });
  if (memberError) throw memberError;

  if ((count ?? 0) === 0) {
    await trackProductEventOnce({
      eventName: "first_workspace_created",
      userId: input.userId,
      surface: "workspace",
      path: "/api/workspaces",
      properties: { workspaceId: workspace.id },
    });
  }

  return workspace;
}

export async function listWorkspaceMembers(workspaceId: string, userId: string) {
  await ensureWorkspaceManager(workspaceId, userId);
  const { data, error } = await store()
    .from("workspace_members")
    .select("*,profiles(id,email,display_name,status)")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addWorkspaceMember(input: { workspaceId: string; operatorId: string; userId: string; role: WorkspaceRole }) {
  await ensureWorkspaceManager(input.workspaceId, input.operatorId);
  const { data, error } = await store()
    .from("workspace_members")
    .upsert(
      {
        workspace_id: input.workspaceId,
        user_id: input.userId,
        role: input.role,
        permissions: defaultPermissions(input.role),
        status: "active",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,user_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWorkspaceMember(input: { workspaceId: string; memberId: string; operatorId: string; role?: WorkspaceRole; status?: string }) {
  await ensureWorkspaceManager(input.workspaceId, input.operatorId);
  const payload = {
    ...(input.role ? { role: input.role, permissions: defaultPermissions(input.role) } : {}),
    ...(input.status ? { status: input.status } : {}),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await store()
    .from("workspace_members")
    .update(payload)
    .eq("id", input.memberId)
    .eq("workspace_id", input.workspaceId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
