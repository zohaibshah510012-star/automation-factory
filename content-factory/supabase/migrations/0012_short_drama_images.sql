create table public.drama_scene_images (
  id uuid primary key default gen_random_uuid(),
  drama_id uuid not null references public.content_tasks(id) on delete cascade,
  scene_number integer not null,
  image_prompt text not null,
  image_task_id uuid references public.image_tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(drama_id, scene_number)
);
alter table public.drama_scene_images enable row level security;
create policy "drama scene images own or admin" on public.drama_scene_images for select using (exists(select 1 from public.content_tasks t where t.id=drama_id and (t.user_id=auth.uid() or public.is_admin())));
update public.workflow_steps set position=5 where workflow_id=(select id from public.workflows where name='short_drama_pipeline') and position=4 and config->>'type'='save_result';
insert into public.workflow_steps(workflow_id, position, agent_name, enabled, config)
select w.id, 4, 'Short Drama Producer', true, '{"name":"Scene images","type":"image_generate","config":{}}'::jsonb from public.workflows w where w.name='short_drama_pipeline'
on conflict (workflow_id, position) do update set config=excluded.config, enabled=true;
