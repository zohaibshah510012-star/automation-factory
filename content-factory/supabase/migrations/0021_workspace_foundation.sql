create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  plan_tier text not null default 'team',
  status text not null default 'active' check (status in ('active','suspended','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  permissions jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','invited','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create index workspaces_owner_idx on public.workspaces(owner_id, created_at desc);
create index workspace_members_user_idx on public.workspace_members(user_id, status);
create index workspace_members_workspace_idx on public.workspace_members(workspace_id, role);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;

create policy "workspace visible to members" on public.workspaces for select using (
  owner_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = id and wm.user_id = auth.uid() and wm.status = 'active'
  )
);

create policy "workspace members visible to workspace" on public.workspace_members for select using (
  public.is_admin()
  or user_id = auth.uid()
  or exists (
    select 1 from public.workspace_members viewer
    where viewer.workspace_id = workspace_id and viewer.user_id = auth.uid() and viewer.status = 'active'
  )
);
