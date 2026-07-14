-- V1 operating model: configurable workflows, platform settings and richer task metadata.
create table public.credits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 1000 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.workflow_steps (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  position integer not null check (position > 0),
  agent_name text not null references public.agents(agent_name) on update cascade,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  unique(workflow_id, position)
);
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.content_tasks add column if not exists input_payload jsonb not null default '{}'::jsonb;
alter table public.content_tasks add column if not exists workflow_id uuid references public.workflows(id) on delete set null;
alter table public.content_tasks add column if not exists prompt_template_id uuid references public.prompt_templates(id) on delete set null;
alter table public.content_tasks add column if not exists duration_ms integer;

create or replace view public.generation_tasks as
  select id, user_id, task_type, topic, brief, input_payload, prompt_template_id, workflow_id,
         status, title, script, storyboard, error, credits_charged, duration_ms, created_at, updated_at
  from public.content_tasks;

create or replace function public.sync_credit_account()
returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.credits(user_id, balance) values(new.id, new.credits_balance) on conflict (user_id) do update set balance = excluded.balance, updated_at = now(); return new; end; $$;
create trigger profiles_credit_account after insert or update of credits_balance on public.profiles for each row execute function public.sync_credit_account();

alter table public.credits enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_steps enable row level security;
alter table public.platform_settings enable row level security;
create policy "credits own or admin" on public.credits for select using (user_id = auth.uid() or public.is_admin());
create policy "admin manages workflows" on public.workflows for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages workflow steps" on public.workflow_steps for all using (public.is_admin()) with check (public.is_admin());
create policy "admin manages platform settings" on public.platform_settings for all using (public.is_admin()) with check (public.is_admin());

insert into public.agents(agent_name, provider_name, model, prompt_template_name, credit_cost) values
 ('Marketing Agent','deepseek','deepseek-chat','marketing_agent_prompt',25),
 ('SEO Agent','deepseek','deepseek-chat','seo_content_prompt',25),
 ('Brand Story Agent','deepseek','deepseek-chat','brand_story_prompt',25)
on conflict (agent_name) do nothing;
insert into public.workflows(name, description) values ('short_video_production','Marketing → Script → Image → Video → Publish') on conflict (name) do nothing;
insert into public.workflow_steps(workflow_id, position, agent_name)
select w.id, s.position, s.agent_name from public.workflows w cross join (values (1,'Marketing Agent'),(2,'Text Agent'),(3,'Image Agent'),(4,'Video Agent'),(5,'Publishing Agent')) as s(position,agent_name)
where w.name='short_video_production' on conflict do nothing;
insert into public.platform_settings(key,value,description) values
 ('default_credits','1000','新用户默认 Credits'),('default_workflow','"short_video_production"','默认生成工作流'),('feature_flags','{"image":false,"video":false,"publishing":false}','功能开关') on conflict (key) do nothing;
insert into public.prompt_templates(name,category,type,owner_type,system_prompt,user_template,variables,status) values
 ('brand_story_prompt','brand','text','platform','你是一名品牌叙事总监。基于品牌使命、受众、差异化价值与情绪张力，创作可传播的品牌故事。','品牌需求：{{topic}}\n背景：{{brief}}','["topic","brief"]','published'),
 ('seo_content_prompt','seo','text','platform','你是一名 SEO 内容策略师。围绕搜索意图、关键词主题簇、结构化标题、事实准确性与自然转化生成内容策略。','主题：{{topic}}\n补充：{{brief}}','["topic","brief"]','published') on conflict do nothing;
