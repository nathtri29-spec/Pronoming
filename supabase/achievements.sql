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
  p_stake integer
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

  v_max_percent := least(0.1 + floor((v_profile.level - 1) / 5) * 0.02, 0.2);
  v_max_stake := floor(v_profile.points * v_max_percent);

  if p_stake > v_profile.points then
    raise exception 'Pas assez de points';
  end if;

  if p_stake > v_max_stake then
    raise exception 'Mise maximum autorisee : % points', v_max_stake;
  end if;

  update public.profiles
    set points = points - p_stake
    where id = v_user_id;

  insert into public.predictions (user_id, match_id, selected_team, stake, odds, status)
  values (v_user_id, p_match_id, p_selected_team, p_stake, v_odds, 'pending')
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

grant execute on function public.place_prediction(bigint, text, integer) to authenticated;

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
  v_new_xp integer;
  v_new_level integer;
  v_new_streak integer;
  v_new_total_wins integer;
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
    select xp, level, win_streak, total_wins
      into v_current_xp, v_current_level, v_current_streak, v_current_total_wins
      from public.profiles where id = v_pred.user_id for update;

    if v_pred.selected_team = p_winner then
      v_gain := round(v_pred.stake * v_pred.odds);
      v_xp_gain := round(v_gain / 10.0);

      update public.predictions set status = 'won' where id = v_pred.id;

      v_new_xp := v_current_xp + v_xp_gain;
      v_new_level := v_current_level;

      while v_new_xp >= (v_new_level * (v_new_level + 1) * 100) / 2 loop
        v_new_level := v_new_level + 1;
      end loop;

      v_new_streak := v_current_streak + 1;
      v_new_total_wins := v_current_total_wins + 1;

      update public.profiles
        set points = points + v_gain,
            xp = v_new_xp,
            level = v_new_level,
            win_streak = v_new_streak,
            total_wins = v_new_total_wins
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
      update public.predictions set status = 'lost' where id = v_pred.id;

      v_new_xp := v_current_xp + 5;
      v_new_level := v_current_level;

      while v_new_xp >= (v_new_level * (v_new_level + 1) * 100) / 2 loop
        v_new_level := v_new_level + 1;
      end loop;

      update public.profiles
        set xp = v_new_xp,
            level = v_new_level,
            win_streak = 0
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
