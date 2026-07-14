create type task_status as enum ('pending', 'generating', 'completed', 'failed');
create type asset_type as enum ('image', 'voice', 'video');

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table content_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  topic text not null,
  brief text,
  status task_status not null default 'pending',
  title text,
  script text,
  storyboard jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ai_generations (
  id uuid primary key default gen_random_uuid(),
  content_task_id uuid not null references content_tasks(id) on delete cascade,
  provider text not null,
  stage text not null,
  status task_status not null default 'pending',
  input jsonb,
  output jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_task_id, stage)
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  content_task_id uuid not null references content_tasks(id) on delete cascade,
  type asset_type not null,
  name text not null,
  url text not null,
  provider text not null,
  created_at timestamptz not null default now()
);

create index content_tasks_status_updated_at_idx on content_tasks(status, updated_at desc);
create index ai_generations_task_id_idx on ai_generations(content_task_id);
create index assets_task_id_idx on assets(content_task_id);
