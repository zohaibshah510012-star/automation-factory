-- Short Drama Producer configuration and its executable default workflow.
alter table public.agents
  add column if not exists role text,
  add column if not exists goal text,
  add column if not exists system_prompt text,
  add column if not exists workflow_id uuid references public.workflows(id) on delete set null;

insert into public.workflows(name, description, enabled)
values ('short_drama_pipeline', 'Generate a structured short-drama story and scene plan.', true)
on conflict (name) do update set description = excluded.description, enabled = true;

insert into public.agents(agent_name, provider_name, model, prompt_template_name, credit_cost, role, goal, system_prompt, workflow_id, enabled)
select 'Short Drama Producer', 'deepseek', 'deepseek-chat', 'short_drama_agent_prompt', 120,
       'short_drama_producer',
       'Turn a user theme into a structured, production-ready short drama.',
       'You are a professional short-drama producer. Create a clear story world, character relationships, conflict escalation, episode arc, and scene plan. Return JSON-compatible title, script, and exactly four scene strings.',
       w.id, true
from public.workflows w where w.name = 'short_drama_pipeline'
on conflict (agent_name) do update set role = excluded.role, goal = excluded.goal, system_prompt = excluded.system_prompt, workflow_id = excluded.workflow_id, enabled = true;

insert into public.workflow_steps(workflow_id, position, agent_name, enabled, config)
select w.id, s.position, 'Short Drama Producer', true, s.config
from public.workflows w cross join (values
  (1, '{"name":"Story generation","type":"story_generate","config":{}}'::jsonb),
  (2, '{"name":"Scene generation","type":"scene_generate","config":{}}'::jsonb),
  (3, '{"name":"Save drama result","type":"save_result","config":{}}'::jsonb)
) as s(position, config)
where w.name = 'short_drama_pipeline'
on conflict (workflow_id, position) do update set agent_name = excluded.agent_name, enabled = true, config = excluded.config;
