alter table public.drama_scene_images add column if not exists video_status public.task_status not null default 'pending';
alter table public.drama_scene_images add column if not exists video_url text, add column if not exists thumbnail_url text, add column if not exists duration_seconds integer;
