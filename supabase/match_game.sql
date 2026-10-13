alter table public.matches
  add column if not exists game text not null default 'Rocket League';
