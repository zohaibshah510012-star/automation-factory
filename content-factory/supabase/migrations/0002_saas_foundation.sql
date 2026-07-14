-- SaaS foundation: identity, credits, internal configuration and prompt assets.
create type public.profile_role as enum ('customer', 'admin');
create type public.profile_status as enum ('active', 'frozen');
create type public.prompt_status as enum ('draft', 'published', 'archived');
create type public.prompt_owner_type as enum ('platform', 'user', 'company');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role public.profile_role not null default 'customer',
  status public.profile_status not null default 'active',
  credits_balance integer not null default 1000 check (credits_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount <> 0),
  balance_after integer not null check (balance_after >= 0),
  reason text not null,
  content_task_id uuid references public.content_tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.usage_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content_task_id uuid references public.content_tasks(id) on delete set null,
  capability text not null,
  provider text,
  model text,
  credits_charged integer not null default 0,
  duration_ms integer,
  created_at timestamptz not null default now()
);

alter table public.content_tasks add column if not exists user_id uuid references public.profiles(id) on delete set null;
alter table public.content_tasks add column if not exists task_type text not null default 'short_video_script';
alter table public.content_tasks add column if not exists credits_charged integer not null default 0;
create index if not exists content_tasks_user_updated_idx on public.content_tasks(user_id, updated_at desc);

create table public.ai_providers (
  id uuid primary key default gen_random_uuid(),
  provider_name text not null unique,
  enabled boolean not null default false,
  model text,
  base_url text,
  -- Secrets stay in the cloud secret manager. This is the reference only.
  secret_ref text,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  type text not null,
  owner_type public.prompt_owner_type not null default 'platform',
  -- profile id for personal prompts; company id is reserved for enterprise workspaces.
  owner_id uuid,
  parent_template_id uuid references public.prompt_templates(id) on delete set null,
  system_prompt text not null,
  user_template text not null,
  variables jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  status public.prompt_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, owner_type, owner_id, version)
);
create unique index prompt_templates_one_published_platform_version on public.prompt_templates(name) where status = 'published' and owner_type = 'platform';

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null unique,
  provider_name text references public.ai_providers(provider_name) on update cascade,
  model text,
  prompt_template_name text not null,
  credit_cost integer not null default 25 check (credit_cost >= 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and status = 'active');
$$;

create or replace function public.consume_credits(p_user_id uuid, p_amount integer, p_reason text, p_task_id uuid default null)
returns integer language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  update public.profiles set credits_balance = credits_balance - p_amount, updated_at = now()
  where id = p_user_id and status = 'active' and credits_balance >= p_amount
  returning credits_balance into new_balance;
  if new_balance is null then raise exception 'INSUFFICIENT_CREDITS'; end if;
  insert into public.credit_transactions(user_id, amount, balance_after, reason, content_task_id)
  values (p_user_id, -p_amount, new_balance, p_reason, p_task_id);
  return new_balance;
end;
$$;

alter table public.profiles enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.usage_history enable row level security;
alter table public.ai_providers enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.agents enable row level security;
alter table public.content_tasks enable row level security;
alter table public.ai_generations enable row level security;
alter table public.assets enable row level security;

create policy "profiles own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles admin update" on public.profiles for update using (public.is_admin());
create policy "credits own or admin" on public.credit_transactions for select using (user_id = auth.uid() or public.is_admin());
create policy "usage own or admin" on public.usage_history for select using (user_id = auth.uid() or public.is_admin());
create policy "admin provider access" on public.ai_providers for all using (public.is_admin()) with check (public.is_admin());
create policy "admin prompt access" on public.prompt_templates for all using (public.is_admin()) with check (public.is_admin());
create policy "prompt visibility" on public.prompt_templates for select using (owner_type = 'platform' and status = 'published' or (owner_type = 'user' and owner_id = auth.uid()) or public.is_admin());
create policy "user manages own prompts" on public.prompt_templates for all using (owner_type = 'user' and owner_id = auth.uid()) with check (owner_type = 'user' and owner_id = auth.uid());
create policy "admin agent access" on public.agents for all using (public.is_admin()) with check (public.is_admin());
create policy "tasks own or admin" on public.content_tasks for select using (user_id = auth.uid() or public.is_admin());
create policy "tasks own insert" on public.content_tasks for insert with check (user_id = auth.uid());
create policy "generations task owner" on public.ai_generations for select using (exists(select 1 from public.content_tasks t where t.id = content_task_id and (t.user_id = auth.uid() or public.is_admin())));
create policy "assets task owner" on public.assets for select using (exists(select 1 from public.content_tasks t where t.id = content_task_id and (t.user_id = auth.uid() or public.is_admin())));

insert into public.ai_providers(provider_name, enabled, model, secret_ref) values
  ('deepseek', true, 'deepseek-chat', 'DEEPSEEK_API_KEY'),
  ('openai', false, 'gpt-4.1-mini', 'OPENAI_API_KEY'),
  ('claude', false, null, 'ANTHROPIC_API_KEY'),
  ('gemini', false, 'gemini-2.5-flash', 'GEMINI_API_KEY')
on conflict (provider_name) do nothing;

insert into public.prompt_templates(name, category, type, owner_type, system_prompt, user_template, variables, status) values
('marketing_agent_prompt','marketing','text','platform','你是一名拥有10年以上经验的全球品牌营销总监。分析目标用户、痛点、产品价值、竞争优势、消费场景、内容传播策略和转化路径。输出市场定位、用户画像、营销策略、内容方向和转化建议。','用户需求：{{topic}}\n补充信息：{{brief}}','["topic","brief"]','published'),
('short_video_script_prompt','short_video','text','platform','你是一名顶级短视频导演和爆款内容策划专家。根据主题生成30-60秒短视频脚本，必须包含黄金3秒开场、用户痛点、情绪设计、故事结构和行动号召。返回 JSON：title、script、storyboard（恰好4个镜头字符串）。','主题：{{topic}}\n需求：{{brief}}','["topic","brief"]','published'),
('video_generation_prompt','video','video','platform','你是一名电影级AI视频导演。Prompt 必须包括 Subject、Environment、Action、Camera、Lens、Lighting、Style、Mood、Quality，并默认 cinematic、ultra realistic、4K、professional lighting、film look。','主题：{{topic}}','["topic"]','published'),
('image_generation_prompt','image','image','platform','你是一名商业摄影师和视觉设计总监。生成产品图、电商图、海报、社交媒体图片或品牌视觉 Prompt，覆盖主体、场景、构图、摄影角度、镜头、光线、颜色、品牌风格和商业用途；默认 8K、high detail、professional photography、cinematic lighting。','主题：{{topic}}','["topic"]','published'),
('short_drama_agent_prompt','drama','text','platform','你是一名专业影视编剧和导演。生成第一季10集短剧：世界观、人物设定、人物关系、故事冲突、剧情节奏；每集标题、剧情简介、冲突点、场景、对白、镜头设计、情绪变化，并给出角色、场景、视频视觉 Prompt。','主题：{{topic}}','["topic"]','published'),
('ecommerce_content_prompt','ecommerce','text','platform','你是一名电商增长专家。生成产品卖点、详情页结构、广告文案、短视频脚本、直播话术和图片 Prompt，强调可验证利益点与转化动作。','产品与需求：{{topic}}\n补充：{{brief}}','["topic","brief"]','published'),
('social_media_agent_prompt','social','text','platform','你是一名跨平台社媒策略师。面向 TikTok、YouTube Shorts、Instagram、LinkedIn、小红书和抖音生成标题、描述、标签、发布时间建议和互动策略。','主题：{{topic}}','["topic"]','published'),
('prompt_quality_reviewer','review','text','platform','你是内容质量审核 Agent。检查需求匹配度、营销价值、重复内容、平台规则和优化空间；输出0-100评分与建议。低于80分标记为需重写。','待审核内容：{{topic}}','["topic"]','published')
on conflict do nothing;

insert into public.agents(agent_name, provider_name, model, prompt_template_name, credit_cost) values
  ('Text Agent','deepseek','deepseek-chat','short_video_script_prompt',25),
  ('Image Agent','deepseek',null,'image_generation_prompt',40),
  ('Video Agent','deepseek',null,'video_generation_prompt',100),
  ('Short Drama Agent','deepseek','deepseek-chat','short_drama_agent_prompt',120),
  ('Publishing Agent','deepseek','deepseek-chat','social_media_agent_prompt',20)
on conflict (agent_name) do nothing;
