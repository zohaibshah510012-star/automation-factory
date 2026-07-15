-- Add Character Designer and upgrade the short-drama production pipeline.
insert into public.agents(agent_name, provider_name, model, prompt_template_name, credit_cost, role, goal, system_prompt, workflow_id, enabled)
select 'Character Designer', 'deepseek', 'deepseek-chat', 'short_drama_agent_prompt', 40,
       'character_designer', 'Create consistent dramatic character sheets and visual prompts.',
       'You are a character designer. From the drama story, define each character with name, appearance, personality, role, and a concise visual prompt.',
       w.id, true from public.workflows w where w.name = 'short_drama_pipeline'
on conflict (agent_name) do update set role=excluded.role, goal=excluded.goal, system_prompt=excluded.system_prompt, workflow_id=excluded.workflow_id, enabled=true;

insert into public.workflow_steps(workflow_id, position, agent_name, enabled, config)
select w.id, s.position, s.agent_name, true, s.config from public.workflows w cross join (values
 (1, 'Short Drama Producer', '{"name":"Story generation","type":"story_generate","config":{}}'::jsonb),
 (2, 'Character Designer', '{"name":"Character generation","type":"character_generate","config":{}}'::jsonb),
 (3, 'Short Drama Producer', '{"name":"Scene generation","type":"scene_generate","config":{}}'::jsonb),
 (4, 'Short Drama Producer', '{"name":"Save drama result","type":"save_result","config":{}}'::jsonb)
) as s(position, agent_name, config) where w.name='short_drama_pipeline'
on conflict (workflow_id, position) do update set agent_name=excluded.agent_name, enabled=true, config=excluded.config;
