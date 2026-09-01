create table if not exists public.seasons (
  id bigserial primary key,
  number integer not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'active' check (status in ('active', 'ended'))
);

create table if not exists public.season_results (
  id bigserial primary key,
  season_id bigint not null references public.seasons(id),
  user_id uuid not null references public.profiles(id),
  final_rating integer not null,
  final_rank text not null,
  created_at timestamptz not null default now()
);

alter table public.seasons enable row level security;
alter table public.season_results enable row level security;

drop policy if exists "seasons_select_all" on public.seasons;
create policy "seasons_select_all"
  on public.seasons
  for select
  to authenticated
  using (true);

drop policy if exists "season_results_select_all" on public.season_results;
create policy "season_results_select_all"
  on public.season_results
  for select
  to authenticated
  using (true);

insert into public.seasons (number, status)
select 1, 'active'
where not exists (select 1 from public.seasons);

create or replace function public.close_season()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_is_admin boolean;
  v_season public.seasons%rowtype;
  v_profile record;
  v_rank text;
  v_title text;
  v_owned jsonb;
  v_new_rating integer;
begin
  if v_caller is null then
    raise exception 'Non authentifie';
  end if;

  select is_admin into v_is_admin from public.profiles where id = v_caller;
  if not coalesce(v_is_admin, false) then
    raise exception 'Acces refuse';
  end if;

  select * into v_season
    from public.seasons
    where status = 'active'
    order by number desc
    limit 1
    for update;

  if not found then
    raise exception 'Aucune saison active';
  end if;

  for v_profile in select id, rating, owned_titles from public.profiles for update loop
    v_rank := case
      when v_profile.rating >= 3500 then 'Legend'
      when v_profile.rating >= 3000 then 'Grandmaster'
      when v_profile.rating >= 2600 then 'Master'
      when v_profile.rating >= 2200 then 'Diamond'
      when v_profile.rating >= 1800 then 'Platinum'
      when v_profile.rating >= 1400 then 'Gold'
      when v_profile.rating >= 1000 then 'Silver'
      else 'Bronze'
    end;

    insert into public.season_results (season_id, user_id, final_rating, final_rank)
    values (v_season.id, v_profile.id, v_profile.rating, v_rank);

    v_title := v_rank || ' Saison ' || v_season.number;
    v_owned := coalesce(v_profile.owned_titles::jsonb, '["Rookie Predictor"]'::jsonb);
    v_new_rating := 900 + round((v_profile.rating - 900) * 0.5);

    if not (v_owned ? v_title) then
      update public.profiles
        set owned_titles = (v_owned || to_jsonb(v_title))::text,
            rating = v_new_rating
        where id = v_profile.id;
    else
      update public.profiles
        set rating = v_new_rating
        where id = v_profile.id;
    end if;
  end loop;

  update public.seasons
    set status = 'ended', ended_at = now()
    where id = v_season.id;

  insert into public.seasons (number, status)
  values (v_season.number + 1, 'active');
end;
$$;

grant execute on function public.close_season() to authenticated;
