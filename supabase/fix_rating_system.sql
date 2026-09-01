alter table public.profiles add column if not exists rating integer not null default 900;

update public.profiles set rating = least(900 + coalesce(xp, 0), 3800) where rating = 900;

alter table public.predictions add column if not exists max_stake_at_placement integer;

alter table public.predictions add column if not exists rating_delta integer;

alter table public.predictions add column if not exists resolved_at timestamptz;

drop function if exists public.place_prediction(uuid, text, integer);

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

  v_max_percent := least(0.15 + floor((v_profile.level - 1) / 5) * 0.02, 0.25);
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

  insert into public.predictions (user_id, match_id, selected_team, stake, odds, status, max_stake_at_placement)
  values (v_user_id, p_match_id, p_selected_team, p_stake, v_odds, 'pending', v_max_stake)
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

drop function if exists public.resolve_match(bigint, text);

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
      v_xp_gain := round(v_gain / 10.0);

      v_stake_ratio := v_pred.stake::numeric / greatest(coalesce(v_pred.max_stake_at_placement, v_pred.stake), 1);
      v_rating_base_gain := round(10 * v_pred.odds * v_stake_ratio);
      v_rating_gain := round(v_rating_base_gain * v_rating_multiplier);

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
      v_new_xp := v_current_xp + 5;
      v_new_level := v_current_level;

      while v_new_xp >= (v_new_level * (v_new_level + 1) * 100) / 2 loop
        v_new_level := v_new_level + 1;
      end loop;

      v_rating_loss := case
        when v_current_rating >= 1800 then 20
        when v_current_rating >= 1400 then 5
        else 0
      end;
      v_new_rating := greatest(v_current_rating - v_rating_loss, 0);

      update public.predictions set status = 'lost', rating_delta = -v_rating_loss, resolved_at = now() where id = v_pred.id;

      update public.profiles
        set xp = v_new_xp,
            level = v_new_level,
            win_streak = 0,
            rating = v_new_rating
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
