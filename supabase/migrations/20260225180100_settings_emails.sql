-- Table de configuration des templates d'emails système
create table if not exists public.settings_emails (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- 'welcome', 'matching', etc.
  subject text not null,
  body text not null,
  updated_at timestamp with time zone default now()
);

-- Exemples d'insertions initiales
insert into public.settings_emails (type, subject, body)
select 'welcome', 'Bienvenue sur SwipeTonPro !', '<h1>Bienvenue sur SwipeTonPro !</h1><p>Nous sommes ravis de vous accueillir...</p>'
where not exists (select 1 from public.settings_emails where type = 'welcome');

insert into public.settings_emails (type, subject, body)
select 'matching', 'Un professionnel est intéressé par votre projet !', '<h1>Bonne nouvelle !</h1><p>Un professionnel a manifesté son intérêt...</p>'
where not exists (select 1 from public.settings_emails where type = 'matching');
