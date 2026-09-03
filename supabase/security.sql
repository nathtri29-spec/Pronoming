alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.profiles
  add column if not exists rating integer not null default 900;

update public.profiles set rating = least(900 + coalesce(xp, 0), 3800) where rating = 900;

alter table public.profiles enable row level security;
alter table public.predictions enable row level security;
alter table public.matches enable row level security;

drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (
    auth.uid() = id
    and points = 1000
    and xp = 0
    and level = 1
    and is_admin = false
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table public.profiles
  add column if not exists avatar_key text;

revoke update on public.profiles from authenticated;
grant update (username, selected_title, onboarding_completed, avatar_key)
  on public.profiles to authenticated;

drop policy if exists "predictions_select_all" on public.predictions;
create policy "predictions_select_all"
  on public.predictions
  for select
  to authenticated
  using (true);

drop policy if exists "matches_select_all" on public.matches;
create policy "matches_select_all"
  on public.matches
  for select
  to authenticated
  using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, points, xp, level, onboarding_completed, is_admin)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'player'),
    1000,
    0,
    1,
    false,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.predictions
  add column if not exists max_stake_at_placement integer;

alter table public.predictions
  add column if not exists rating_delta integer;

alter table public.predictions
  add column if not exists resolved_at timestamptz;

alter table public.predictions
  add column if not exists insurance_applied boolean not null default false;

alter table public.predictions
  add column if not exists gain_boost_applied boolean not null default false;

alter table public.predictions
  add column if not exists xp_boost_applied boolean not null default false;

alter table public.predictions
  add column if not exists pr_gamble_applied boolean not null default false;

drop function if exists public.place_prediction(uuid, text, integer);

alter table public.profiles
  add column if not exists win_streak integer not null default 0;

alter table public.profiles
  add column if not exists total_wins integer not null default 0;

create table if not exists public.achievements (
  key text primary key,
  name text not null,
  description text not null,
  reward_type text not null check (reward_type in ('points', 'xp', 'title')),
  reward_value text not null
);

insert into public.achievements (key, name, description, reward_type, reward_value) values
  ('first_prediction', 'Premier Pronostic', 'Fais ton tout premier pronostic', 'points', '50'),
  ('first_purchase', 'Premier Achat', 'Achete ton premier titre dans le shop', 'points', '100'),
  ('win_streak_3', 'Sur sa Lancee', 'Gagne 3 pronostics d''affilee', 'title', 'Sur sa Lancée'),
  ('big_odds_win', 'Flair', 'Gagne un pronostic avec une cote de 3.0 ou plus', 'title', 'Flair'),
  ('total_wins_10', 'Confirme', 'Gagne 10 pronostics au total', 'title', 'Confirmé'),
  ('level_10', 'Habitue', 'Atteins le niveau 10', 'title', 'Habitué')
on conflict (key) do nothing;

alter table public.achievements enable row level security;

drop policy if exists "achievements_select_all" on public.achievements;
create policy "achievements_select_all"
  on public.achievements
  for select
  to authenticated
  using (true);

create table if not exists public.profile_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null references public.achievements(key),
  completed_at timestamptz not null default now(),
  claimed_at timestamptz,
  primary key (user_id, achievement_key)
);

alter table public.profile_achievements enable row level security;

drop policy if exists "profile_achievements_select_own" on public.profile_achievements;
create policy "profile_achievements_select_own"
  on public.profile_achievements
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.place_prediction(
  p_match_id bigint,
  p_selected_team text,
  p_stake integer,
  p_use_insurance boolean default false,
  p_use_gain_boost boolean default false,
  p_use_pr_gamble boolean default false,
  p_use_xp_boost boolean default false
)
returns public.predictions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_match public.matches%rowtype;
  v_max_percent numeric;
  v_max_stake integer;
  v_odds numeric;
  v_existing integer;
  v_prediction public.predictions%rowtype;
  v_total_predictions integer;
  v_insurance_id bigint;
  v_gain_boost_id bigint;
  v_xp_boost_id bigint;
  v_xp_boost_uses integer;
  v_pr_gamble_id bigint;
  v_insurance_applied boolean := false;
  v_gain_boost_applied boolean := false;
  v_xp_boost_applied boolean := false;
  v_pr_gamble_applied boolean := false;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  if p_stake is null or p_stake <= 0 then
    raise exception 'Mise invalide';
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profil introuvable';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'Match introuvable';
  end if;

  if v_match.winner is not null then
    raise exception 'Ce match est deja termine';
  end if;

  if p_selected_team = v_match.team_a then
    v_odds := v_match.odds_team_a;
  elsif p_selected_team = v_match.team_b then
    v_odds := v_match.odds_team_b;
  else
    raise exception 'Equipe invalide';
  end if;

  select count(*) into v_existing
    from public.predictions
    where match_id = p_match_id and user_id = v_user_id;

  if v_existing > 0 then
    raise exception 'Tu as deja pronostique ce match';
  end if;

  v_max_percent := least(0.15 + floor((v_profile.level - 1) / 5) * 0.02, 0.25);
  v_max_stake := floor(v_profile.points * v_max_percent);

  if p_stake > v_profile.points then
    raise exception 'Pas assez de points';
  end if;

  if p_stake > v_max_stake then
    raise exception 'Mise maximum autorisee : % points', v_max_stake;
  end if;

  if p_use_insurance then
    select id into v_insurance_id
      from public.profile_boosts
      where user_id = v_user_id and boost_type = 'insurance' and status = 'pending'
      order by created_at
      limit 1
      for update;

    if v_insurance_id is not null then
      update public.profile_boosts set status = 'consumed', consumed_at = now() where id = v_insurance_id;
      v_insurance_applied := true;
    end if;
  end if;

  if p_use_gain_boost then
    select id into v_gain_boost_id
      from public.profile_boosts
      where user_id = v_user_id and boost_type = 'gain_boost' and status = 'pending'
      order by created_at
      limit 1
      for update;

    if v_gain_boost_id is not null then
      update public.profile_boosts set status = 'consumed', consumed_at = now() where id = v_gain_boost_id;
      v_gain_boost_applied := true;
    end if;
  end if;

  if p_use_pr_gamble then
    select id into v_pr_gamble_id
      from public.profile_boosts
      where user_id = v_user_id and boost_type = 'pr_gamble' and status = 'pending'
      order by created_at
      limit 1
      for update;

    if v_pr_gamble_id is not null then
      update public.profile_boosts set status = 'consumed', consumed_at = now() where id = v_pr_gamble_id;
      v_pr_gamble_applied := true;
    end if;
  end if;

  if p_use_xp_boost then
    select id, uses_remaining into v_xp_boost_id, v_xp_boost_uses
      from public.profile_boosts
      where user_id = v_user_id and boost_type = 'xp_boost' and status = 'pending' and uses_remaining > 0
      order by created_at
      limit 1
      for update;

    if v_xp_boost_id is not null then
      v_xp_boost_applied := true;

      if v_xp_boost_uses <= 1 then
        update public.profile_boosts set status = 'consumed', consumed_at = now(), uses_remaining = 0 where id = v_xp_boost_id;
      else
        update public.profile_boosts set uses_remaining = v_xp_boost_uses - 1 where id = v_xp_boost_id;
      end if;
    end if;
  end if;

  update public.profiles
    set points = points - p_stake
    where id = v_user_id;

  insert into public.predictions (
    user_id, match_id, selected_team, stake, odds, status, max_stake_at_placement,
    insurance_applied, gain_boost_applied, xp_boost_applied, pr_gamble_applied
  )
  values (
    v_user_id, p_match_id, p_selected_team, p_stake, v_odds, 'pending', v_max_stake,
    v_insurance_applied, v_gain_boost_applied, v_xp_boost_applied, v_pr_gamble_applied
  )
  returning * into v_prediction;

  select count(*) into v_total_predictions
    from public.predictions
    where user_id = v_user_id;

  if v_total_predictions >= 1 then
    insert into public.profile_achievements (user_id, achievement_key)
    values (v_user_id, 'first_prediction')
    on conflict (user_id, achievement_key) do nothing;
  end if;

  return v_prediction;
end;
$$;

grant execute on function public.place_prediction(bigint, text, integer, boolean, boolean, boolean, boolean) to authenticated;

drop function if exists public.resolve_match(uuid, text);

create or replace function public.resolve_match(
  p_match_id bigint,
  p_winner text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_is_admin boolean;
  v_match public.matches%rowtype;
  v_pred record;
  v_gain integer;
  v_xp_gain integer;
  v_current_xp integer;
  v_current_level integer;
  v_current_streak integer;
  v_current_total_wins integer;
  v_current_rating integer;
  v_new_xp integer;
  v_new_level integer;
  v_new_streak integer;
  v_new_total_wins integer;
  v_new_rating integer;
  v_rating_multiplier numeric;
  v_stake_ratio numeric;
  v_rating_base_gain integer;
  v_rating_gain integer;
  v_rating_loss integer;
  v_insurance_refund integer;
begin
  if v_caller is null then
    raise exception 'Non authentifie';
  end if;

  select is_admin into v_is_admin from public.profiles where id = v_caller;
  if not coalesce(v_is_admin, false) then
    raise exception 'Acces refuse';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'Match introuvable';
  end if;

  if p_winner <> v_match.team_a and p_winner <> v_match.team_b then
    raise exception 'Equipe invalide';
  end if;

  update public.matches set winner = p_winner where id = p_match_id;

  for v_pred in
    select * from public.predictions
    where match_id = p_match_id and status = 'pending'
    for update
  loop
    select xp, level, win_streak, total_wins, rating
      into v_current_xp, v_current_level, v_current_streak, v_current_total_wins, v_current_rating
      from public.profiles where id = v_pred.user_id for update;

    v_rating_multiplier := case
      when v_current_rating >= 3500 then 0.3
      when v_current_rating >= 3000 then 0.4
      when v_current_rating >= 2600 then 0.55
      when v_current_rating >= 2200 then 0.7
      when v_current_rating >= 1800 then 0.85
      else 1.0
    end;

    if v_pred.selected_team = p_winner then
      v_gain := round(v_pred.stake * v_pred.odds);

      if v_pred.gain_boost_applied then
        v_gain := round(v_gain * 1.2);
      end if;

      v_xp_gain := round(v_gain / 10.0);

      if v_pred.xp_boost_applied then
        v_xp_gain := round(v_xp_gain * 1.3);
      end if;

      v_stake_ratio := v_pred.stake::numeric / greatest(coalesce(v_pred.max_stake_at_placement, v_pred.stake), 1);
      v_rating_base_gain := round(10 * v_pred.odds * v_stake_ratio);
      v_rating_gain := round(v_rating_base_gain * v_rating_multiplier);

      if v_pred.pr_gamble_applied then
        v_rating_gain := v_rating_gain * 2;
      end if;

      update public.predictions set status = 'won', rating_delta = v_rating_gain, resolved_at = now() where id = v_pred.id;

      v_new_xp := v_current_xp + v_xp_gain;
      v_new_level := v_current_level;

      while v_new_xp >= (v_new_level * (v_new_level + 1) * 100) / 2 loop
        v_new_level := v_new_level + 1;
      end loop;

      v_new_streak := v_current_streak + 1;
      v_new_total_wins := v_current_total_wins + 1;
      v_new_rating := v_current_rating + v_rating_gain;

      update public.profiles
        set points = points + v_gain,
            xp = v_new_xp,
            level = v_new_level,
            win_streak = v_new_streak,
            total_wins = v_new_total_wins,
            rating = v_new_rating
        where id = v_pred.user_id;

      if v_new_streak >= 3 then
        insert into public.profile_achievements (user_id, achievement_key)
        values (v_pred.user_id, 'win_streak_3')
        on conflict (user_id, achievement_key) do nothing;
      end if;

      if v_pred.odds >= 3.0 then
        insert into public.profile_achievements (user_id, achievement_key)
        values (v_pred.user_id, 'big_odds_win')
        on conflict (user_id, achievement_key) do nothing;
      end if;

      if v_new_total_wins >= 10 then
        insert into public.profile_achievements (user_id, achievement_key)
        values (v_pred.user_id, 'total_wins_10')
        on conflict (user_id, achievement_key) do nothing;
      end if;

      if v_new_level >= 10 then
        insert into public.profile_achievements (user_id, achievement_key)
        values (v_pred.user_id, 'level_10')
        on conflict (user_id, achievement_key) do nothing;
      end if;
    else
      v_xp_gain := 5;

      if v_pred.xp_boost_applied then
        v_xp_gain := round(v_xp_gain * 1.3);
      end if;

      v_new_xp := v_current_xp + v_xp_gain;
      v_new_level := v_current_level;

      while v_new_xp >= (v_new_level * (v_new_level + 1) * 100) / 2 loop
        v_new_level := v_new_level + 1;
      end loop;

      v_rating_loss := case
        when v_current_rating >= 1800 then 20
        when v_current_rating >= 1400 then 5
        else 0
      end;

      if v_pred.pr_gamble_applied then
        v_rating_loss := v_rating_loss * 2;
      end if;

      v_new_rating := greatest(v_current_rating - v_rating_loss, 0);

      v_insurance_refund := case when v_pred.insurance_applied then round(v_pred.stake * 0.5) else 0 end;

      update public.predictions set status = 'lost', rating_delta = -v_rating_loss, resolved_at = now() where id = v_pred.id;

      update public.profiles
        set xp = v_new_xp,
            level = v_new_level,
            win_streak = 0,
            rating = v_new_rating,
            points = points + v_insurance_refund
        where id = v_pred.user_id;

      if v_new_level >= 10 then
        insert into public.profile_achievements (user_id, achievement_key)
        values (v_pred.user_id, 'level_10')
        on conflict (user_id, achievement_key) do nothing;
      end if;
    end if;
  end loop;
end;
$$;

grant execute on function public.resolve_match(bigint, text) to authenticated;

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
  v_is_first_purchase boolean;
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

  v_is_first_purchase := jsonb_array_length(v_owned) <= 1;

  update public.profiles
    set points = points - v_price,
        owned_titles = (v_owned || to_jsonb(p_title_name))::text
    where id = v_user_id
    returning * into v_profile;

  if v_is_first_purchase then
    insert into public.profile_achievements (user_id, achievement_key)
    values (v_user_id, 'first_purchase')
    on conflict (user_id, achievement_key) do nothing;
  end if;

  return v_profile;
end;
$$;

grant execute on function public.buy_title(text) to authenticated;

create table if not exists public.boost_catalog (
  key text primary key,
  price integer not null,
  max_uses integer not null default 1
);

insert into public.boost_catalog (key, price, max_uses) values
  ('xp_boost', 750, 3),
  ('insurance', 1000, 1),
  ('gain_boost', 1250, 1),
  ('pr_gamble', 2500, 1)
on conflict (key) do update set price = excluded.price, max_uses = excluded.max_uses;

alter table public.boost_catalog enable row level security;

drop policy if exists "boost_catalog_select_all" on public.boost_catalog;
create policy "boost_catalog_select_all"
  on public.boost_catalog
  for select
  to authenticated
  using (true);

create table if not exists public.profile_boosts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  boost_type text not null references public.boost_catalog(key),
  status text not null default 'pending' check (status in ('pending', 'consumed')),
  uses_remaining integer not null default 1,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

alter table public.profile_boosts enable row level security;

drop policy if exists "profile_boosts_select_own" on public.profile_boosts;
create policy "profile_boosts_select_own"
  on public.profile_boosts
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.buy_boost(
  p_boost_type text
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
  v_max_uses integer;
  v_existing integer;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  select price, max_uses into v_price, v_max_uses
    from public.boost_catalog where key = p_boost_type;

  if v_price is null then
    raise exception 'Boost inconnu';
  end if;

  select count(*) into v_existing
    from public.profile_boosts
    where user_id = v_user_id and boost_type = p_boost_type and status = 'pending';

  if v_existing > 0 then
    raise exception 'Tu as deja un boost de ce type actif';
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profil introuvable';
  end if;

  if v_profile.points < v_price then
    raise exception 'Pas assez de points';
  end if;

  update public.profiles
    set points = points - v_price
    where id = v_user_id
    returning * into v_profile;

  insert into public.profile_boosts (user_id, boost_type, status, uses_remaining)
  values (v_user_id, p_boost_type, 'pending', v_max_uses);

  return v_profile;
end;
$$;

grant execute on function public.buy_boost(text) to authenticated;

create or replace function public.claim_achievement(
  p_key text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_completed timestamptz;
  v_claimed timestamptz;
  v_achievement public.achievements%rowtype;
  v_profile public.profiles%rowtype;
  v_owned jsonb;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  select completed_at, claimed_at into v_completed, v_claimed
    from public.profile_achievements
    where user_id = v_user_id and achievement_key = p_key
    for update;

  if v_completed is null then
    raise exception 'Succes non complete';
  end if;

  if v_claimed is not null then
    raise exception 'Succes deja recupere';
  end if;

  select * into v_achievement from public.achievements where key = p_key;
  if not found then
    raise exception 'Succes inconnu';
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;

  if v_achievement.reward_type = 'points' then
    update public.profiles
      set points = points + v_achievement.reward_value::integer
      where id = v_user_id;
  elsif v_achievement.reward_type = 'xp' then
    update public.profiles
      set xp = xp + v_achievement.reward_value::integer
      where id = v_user_id;
  elsif v_achievement.reward_type = 'title' then
    v_owned := coalesce(v_profile.owned_titles::jsonb, '["Rookie Predictor"]'::jsonb);
    if not (v_owned ? v_achievement.reward_value) then
      update public.profiles
        set owned_titles = (v_owned || to_jsonb(v_achievement.reward_value))::text,
            selected_title = v_achievement.reward_value
        where id = v_user_id;
    else
      update public.profiles
        set selected_title = v_achievement.reward_value
        where id = v_user_id;
    end if;
  end if;

  update public.profile_achievements
    set claimed_at = now()
    where user_id = v_user_id and achievement_key = p_key;

  select * into v_profile from public.profiles where id = v_user_id;

  return v_profile;
end;
$$;

grant execute on function public.claim_achievement(text) to authenticated;

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

create table if not exists public.friendships (
  id bigint generated always as identity primary key,
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

create unique index if not exists friendships_unique_pair
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

alter table public.friendships enable row level security;

drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own"
  on public.friendships
  for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create or replace function public.send_friend_request(
  p_addressee_id uuid
)
returns public.friendships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.friendships%rowtype;
  v_row public.friendships%rowtype;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  if p_addressee_id = v_user_id then
    raise exception 'Tu ne peux pas t''ajouter toi-meme';
  end if;

  if not exists (select 1 from public.profiles where id = p_addressee_id) then
    raise exception 'Joueur introuvable';
  end if;

  select * into v_existing
    from public.friendships
    where (requester_id = v_user_id and addressee_id = p_addressee_id)
       or (requester_id = p_addressee_id and addressee_id = v_user_id)
    limit 1;

  if found then
    raise exception 'Une relation existe deja avec ce joueur';
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (v_user_id, p_addressee_id, 'pending')
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.send_friend_request(uuid) to authenticated;

create or replace function public.respond_friend_request(
  p_requester_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.friendships%rowtype;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  select * into v_row
    from public.friendships
    where requester_id = p_requester_id and addressee_id = v_user_id and status = 'pending'
    for update;

  if not found then
    raise exception 'Demande introuvable';
  end if;

  if p_accept then
    update public.friendships set status = 'accepted', responded_at = now() where id = v_row.id;
  else
    delete from public.friendships where id = v_row.id;
  end if;
end;
$$;

grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;

create or replace function public.remove_friend(
  p_other_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  delete from public.friendships
    where (requester_id = v_user_id and addressee_id = p_other_id)
       or (requester_id = p_other_id and addressee_id = v_user_id);
end;
$$;

grant execute on function public.remove_friend(uuid) to authenticated;
create table if not exists public.clubs (
  id bigint generated always as identity primary key,
  name text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  join_policy text not null default 'request' check (join_policy in ('open', 'request', 'friends_only')),
  created_at timestamptz not null default now()
);

alter table public.clubs enable row level security;

drop policy if exists "clubs_select_all" on public.clubs;
create policy "clubs_select_all"
  on public.clubs
  for select
  to authenticated
  using (true);

create table if not exists public.club_members (
  club_id bigint not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  role text not null default 'member' check (role in ('leader', 'member')),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

alter table public.club_members enable row level security;

drop policy if exists "club_members_select_all" on public.club_members;
create policy "club_members_select_all"
  on public.club_members
  for select
  to authenticated
  using (true);

create table if not exists public.club_join_requests (
  id bigint generated always as identity primary key,
  club_id bigint not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

alter table public.club_join_requests enable row level security;

drop policy if exists "club_join_requests_select_own" on public.club_join_requests;
create policy "club_join_requests_select_own"
  on public.club_join_requests
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or auth.uid() = (select owner_id from public.clubs where id = club_id)
  );

create or replace function public.create_club(
  p_name text,
  p_join_policy text
)
returns public.clubs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_price integer := 5000;
  v_profile public.profiles%rowtype;
  v_club public.clubs%rowtype;
  v_name text := trim(p_name);
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  if v_name = '' or length(v_name) > 24 then
    raise exception 'Nom de club invalide (1 a 24 caracteres)';
  end if;

  if p_join_policy not in ('open', 'request', 'friends_only') then
    raise exception 'Politique d''adhesion invalide';
  end if;

  if exists (select 1 from public.club_members where user_id = v_user_id) then
    raise exception 'Tu es deja dans un club';
  end if;

  if exists (select 1 from public.clubs where lower(name) = lower(v_name)) then
    raise exception 'Ce nom de club est deja pris';
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profil introuvable';
  end if;

  if v_profile.points < v_price then
    raise exception 'Pas assez de points (% requis)', v_price;
  end if;

  update public.profiles set points = points - v_price where id = v_user_id;

  insert into public.clubs (name, owner_id, join_policy)
  values (v_name, v_user_id, p_join_policy)
  returning * into v_club;

  insert into public.club_members (club_id, user_id, role)
  values (v_club.id, v_user_id, 'leader');

  return v_club;
end;
$$;

grant execute on function public.create_club(text, text) to authenticated;

create or replace function public.join_club(
  p_club_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_club public.clubs%rowtype;
  v_is_friend boolean;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  if exists (select 1 from public.club_members where user_id = v_user_id) then
    raise exception 'Tu es deja dans un club';
  end if;

  select * into v_club from public.clubs where id = p_club_id;
  if not found then
    raise exception 'Club introuvable';
  end if;

  if v_club.join_policy = 'open' then
    insert into public.club_members (club_id, user_id, role)
    values (p_club_id, v_user_id, 'member');

  elsif v_club.join_policy = 'friends_only' then
    select exists (
      select 1 from public.friendships
      where status = 'accepted'
        and ((requester_id = v_user_id and addressee_id = v_club.owner_id)
          or (requester_id = v_club.owner_id and addressee_id = v_user_id))
    ) into v_is_friend;

    if not v_is_friend then
      raise exception 'Tu dois etre ami avec le chef du club pour le rejoindre';
    end if;

    insert into public.club_members (club_id, user_id, role)
    values (p_club_id, v_user_id, 'member');

  else
    if exists (select 1 from public.club_join_requests where club_id = p_club_id and user_id = v_user_id) then
      raise exception 'Demande deja envoyee';
    end if;

    insert into public.club_join_requests (club_id, user_id)
    values (p_club_id, v_user_id);
  end if;
end;
$$;

grant execute on function public.join_club(bigint) to authenticated;

create or replace function public.cancel_club_request(
  p_club_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  delete from public.club_join_requests
    where club_id = p_club_id and user_id = v_user_id;
end;
$$;

grant execute on function public.cancel_club_request(bigint) to authenticated;

create or replace function public.respond_club_request(
  p_user_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.club_join_requests%rowtype;
  v_club public.clubs%rowtype;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  select r.* into v_request
    from public.club_join_requests r
    join public.clubs c on c.id = r.club_id
    where r.user_id = p_user_id and c.owner_id = v_user_id
    limit 1;

  if not found then
    raise exception 'Demande introuvable';
  end if;

  if p_accept then
    if exists (select 1 from public.club_members where user_id = p_user_id) then
      delete from public.club_join_requests where id = v_request.id;
      raise exception 'Ce joueur a deja rejoint un autre club';
    end if;

    insert into public.club_members (club_id, user_id, role)
    values (v_request.club_id, p_user_id, 'member');
  end if;

  delete from public.club_join_requests where id = v_request.id;
end;
$$;

grant execute on function public.respond_club_request(uuid, boolean) to authenticated;

create or replace function public.update_club_join_policy(
  p_join_policy text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  if p_join_policy not in ('open', 'request', 'friends_only') then
    raise exception 'Politique d''adhesion invalide';
  end if;

  update public.clubs
    set join_policy = p_join_policy
    where owner_id = v_user_id;

  if not found then
    raise exception 'Tu n''es pas chef de club';
  end if;
end;
$$;

grant execute on function public.update_club_join_policy(text) to authenticated;

create or replace function public.kick_member(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_club_id bigint;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  if p_user_id = v_user_id then
    raise exception 'Utilise "Quitter le club" pour toi-meme';
  end if;

  select id into v_club_id from public.clubs where owner_id = v_user_id;
  if v_club_id is null then
    raise exception 'Tu n''es pas chef de club';
  end if;

  delete from public.club_members where club_id = v_club_id and user_id = p_user_id;
end;
$$;

grant execute on function public.kick_member(uuid) to authenticated;

create or replace function public.leave_club()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_membership public.club_members%rowtype;
  v_next_leader uuid;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  select * into v_membership from public.club_members where user_id = v_user_id;
  if not found then
    raise exception 'Tu n''es dans aucun club';
  end if;

  if v_membership.role = 'leader' then
    select user_id into v_next_leader
      from public.club_members
      where club_id = v_membership.club_id and user_id <> v_user_id
      order by joined_at
      limit 1;

    if v_next_leader is null then
      delete from public.clubs where id = v_membership.club_id;
    else
      update public.club_members set role = 'leader' where club_id = v_membership.club_id and user_id = v_next_leader;
      update public.clubs set owner_id = v_next_leader where id = v_membership.club_id;
      delete from public.club_members where club_id = v_membership.club_id and user_id = v_user_id;
    end if;
  else
    delete from public.club_members where club_id = v_membership.club_id and user_id = v_user_id;
  end if;
end;
$$;

grant execute on function public.leave_club() to authenticated;

create or replace function public.disband_club()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  delete from public.clubs where owner_id = v_user_id;

  if not found then
    raise exception 'Tu n''es pas chef de club';
  end if;
end;
$$;

grant execute on function public.disband_club() to authenticated;
create table if not exists public.club_messages (
  id bigint generated always as identity primary key,
  club_id bigint not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists club_messages_club_id_created_at_idx
  on public.club_messages (club_id, created_at);

alter table public.club_messages enable row level security;

drop policy if exists "club_messages_select_members" on public.club_messages;
create policy "club_messages_select_members"
  on public.club_messages
  for select
  to authenticated
  using (
    exists (
      select 1 from public.club_members
      where club_members.club_id = club_messages.club_id
        and club_members.user_id = auth.uid()
    )
  );

do $$
begin
  alter publication supabase_realtime add table public.club_messages;
exception when duplicate_object then null;
end $$;

create or replace function public.send_club_message(
  p_content text
)
returns public.club_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_club_id bigint;
  v_content text := trim(p_content);
  v_row public.club_messages%rowtype;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  if v_content = '' or length(v_content) > 500 then
    raise exception 'Message invalide (1 a 500 caracteres)';
  end if;

  select club_id into v_club_id from public.club_members where user_id = v_user_id;
  if v_club_id is null then
    raise exception 'Tu n''es dans aucun club';
  end if;

  insert into public.club_messages (club_id, user_id, content)
  values (v_club_id, v_user_id, v_content)
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.send_club_message(text) to authenticated;
