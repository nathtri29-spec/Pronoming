revoke update on public.profiles from authenticated;
grant update (username, selected_title, onboarding_completed)
  on public.profiles to authenticated;

create table if not exists public.title_catalog (
  name text primary key,
  price integer not null
);

insert into public.title_catalog (name, price) values
  ('Rookie Predictor', 0),
  ('Risk Taker', 500),
  ('Underdog Hunter', 1000),
  ('Rocket Analyst', 2500),
  ('Clutch Master', 5000),
  ('GOAT Predictor', 10000)
on conflict (name) do nothing;

alter table public.title_catalog enable row level security;

drop policy if exists "title_catalog_select_all" on public.title_catalog;
create policy "title_catalog_select_all"
  on public.title_catalog
  for select
  to authenticated
  using (true);

create or replace function public.buy_title(
  p_title_name text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_price integer;
  v_owned jsonb;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  select price into v_price from public.title_catalog where name = p_title_name;
  if v_price is null then
    raise exception 'Titre inconnu';
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profil introuvable';
  end if;

  v_owned := coalesce(v_profile.owned_titles::jsonb, '["Rookie Predictor"]'::jsonb);

  if v_owned ? p_title_name then
    raise exception 'Titre deja possede';
  end if;

  if v_profile.points < v_price then
    raise exception 'Pas assez de points';
  end if;

  update public.profiles
    set points = points - v_price,
        owned_titles = (v_owned || to_jsonb(p_title_name))::text
    where id = v_user_id
    returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.buy_title(text) to authenticated;
