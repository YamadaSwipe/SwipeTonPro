-- Table de configuration des chiffres clés et étapes homepage
create table if not exists public.settings_homepage (
  id uuid primary key default gen_random_uuid(),
  projects text not null default '500+',
  professionals text not null default '1200+',
  satisfaction text not null default '98%',
  response_time text not null default '24h',
  steps jsonb not null default '[{"title":"1. Description","description":"Diagnostic conversationnel IA"},{"title":"2. Photos","description":"Upload de la zone des travaux"},{"title":"3. Estimation","description":"Budget IA haute sécurité"},{"title":"4. Validation","description":"Confirmez votre budget"}]',
  updated_at timestamp with time zone default now()
);

-- Une seule ligne de config globale
insert into public.settings_homepage (projects, professionals, satisfaction, response_time, steps)
select '500+', '1200+', '98%', '24h', '[{"title":"1. Description","description":"Diagnostic conversationnel IA"},{"title":"2. Photos","description":"Upload de la zone des travaux"},{"title":"3. Estimation","description":"Budget IA haute sécurité"},{"title":"4. Validation","description":"Confirmez votre budget"}]'
where not exists (select 1 from public.settings_homepage);
