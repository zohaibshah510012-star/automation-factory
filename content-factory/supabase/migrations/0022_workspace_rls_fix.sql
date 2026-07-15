drop policy if exists "workspace visible to members" on public.workspaces;
drop policy if exists "workspace members visible to workspace" on public.workspace_members;

create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.workspace_members wm
    where wm.workspace_id = p_workspace_id
      and wm.user_id = auth.uid()
      and wm.status = 'active'
  );
$$;

create policy "workspace visible to members" on public.workspaces for select using (
  owner_id = auth.uid()
  or public.is_admin()
  or public.is_workspace_member(id)
);

create policy "workspace members visible to workspace" on public.workspace_members for select using (
  public.is_admin()
  or user_id = auth.uid()
  or public.is_workspace_member(workspace_id)
);
