-- Table de configuration des notifications automatiques
create table if not exists public.settings_notifications (
  id uuid primary key default gen_random_uuid(),
  welcome boolean not null default true,
  matching boolean not null default true,
  updated_at timestamp with time zone default now()
);

-- Une seule ligne de config globale
insert into public.settings_notifications (welcome, matching)
select true, true
where not exists (select 1 from public.settings_notifications);
