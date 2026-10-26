alter table public.profiles
  add column if not exists season_level integer not null default 1;

alter table public.profiles
  add column if not exists season_xp integer not null default 0;

alter table public.profiles
  add column if not exists referred_by uuid references auth.users(id);

update public.profiles
  set season_level = level, season_xp = xp
  where season_level = 1 and season_xp = 0 and level > 1;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referred_by uuid;
begin
  begin
    v_referred_by := (new.raw_user_meta_data->>'referred_by')::uuid;
  exception when others then
    v_referred_by := null;
  end;

  if v_referred_by = new.id then
    v_referred_by := null;
  end if;

  if v_referred_by is not null and not exists (select 1 from public.profiles where id = v_referred_by) then
    v_referred_by := null;
  end if;

  insert into public.profiles (id, username, points, xp, level, onboarding_completed, is_admin, referred_by)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'player'),
    1000,
    0,
    1,
    false,
    false,
    v_referred_by
  )
  on conflict (id) do nothing;

  if v_referred_by is not null then
    update public.profiles set points = points + 200 where id = v_referred_by;
  end if;

  return new;
end;
$$;

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

  if v_match.cancelled_at is not null then
    raise exception 'Ce match a ete annule';
  end if;

  if v_match.start_time is not null and v_match.start_time <= now() then
    raise exception 'Les paris sont fermes, ce match a deja commence';
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

  v_max_percent := least(0.15 + floor((v_profile.season_level - 1) / 5) * 0.02, 0.25);
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
    insurance_applied, gain_boost_applied, xp_boost_applied, pr_gamble_applied,
    insurance_boost_id, gain_boost_id, xp_boost_id, pr_gamble_boost_id
  )
  values (
    v_user_id, p_match_id, p_selected_team, p_stake, v_odds, 'pending', v_max_stake,
    v_insurance_applied, v_gain_boost_applied, v_xp_boost_applied, v_pr_gamble_applied,
    v_insurance_id, v_gain_boost_id, v_xp_boost_id, v_pr_gamble_id
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
  v_current_season_xp integer;
  v_current_season_level integer;
  v_current_streak integer;
  v_current_total_wins integer;
  v_current_rating integer;
  v_new_xp integer;
  v_new_level integer;
  v_new_season_xp integer;
  v_new_season_level integer;
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
    select xp, level, season_xp, season_level, win_streak, total_wins, rating
      into v_current_xp, v_current_level, v_current_season_xp, v_current_season_level,
           v_current_streak, v_current_total_wins, v_current_rating
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

      update public.predictions set status = 'won', rating_delta = v_rating_gain, xp_delta = v_xp_gain, resolved_at = now() where id = v_pred.id;

      v_new_xp := v_current_xp + v_xp_gain;
      v_new_level := v_current_level;

      while v_new_xp >= (v_new_level * (v_new_level + 1) * 100) / 2 loop
        v_new_level := v_new_level + 1;
      end loop;

      v_new_season_xp := v_current_season_xp + v_xp_gain;
      v_new_season_level := v_current_season_level;

      while v_new_season_xp >= (v_new_season_level * (v_new_season_level + 1) * 100) / 2 loop
        v_new_season_level := v_new_season_level + 1;
      end loop;

      v_new_streak := v_current_streak + 1;
      v_new_total_wins := v_current_total_wins + 1;
      v_new_rating := v_current_rating + v_rating_gain;

      update public.profiles
        set points = points + v_gain,
            xp = v_new_xp,
            level = v_new_level,
            season_xp = v_new_season_xp,
            season_level = v_new_season_level,
            win_streak = v_new_streak,
            total_wins = v_new_total_wins,
            rating = v_new_rating
        where id = v_pred.user_id;

      if v_new_season_level > v_current_season_level then
        insert into public.profile_level_events (user_id, new_level)
        values (v_pred.user_id, v_new_season_level);
      end if;

      if public.rank_tier(v_new_rating) <> public.rank_tier(v_current_rating) then
        insert into public.profile_rank_events (user_id, new_rank)
        values (v_pred.user_id, public.rank_tier(v_new_rating));
      end if;

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

      v_new_season_xp := v_current_season_xp + v_xp_gain;
      v_new_season_level := v_current_season_level;

      while v_new_season_xp >= (v_new_season_level * (v_new_season_level + 1) * 100) / 2 loop
        v_new_season_level := v_new_season_level + 1;
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

      update public.predictions set status = 'lost', rating_delta = -v_rating_loss, xp_delta = v_xp_gain, resolved_at = now() where id = v_pred.id;

      update public.profiles
        set xp = v_new_xp,
            level = v_new_level,
            season_xp = v_new_season_xp,
            season_level = v_new_season_level,
            win_streak = 0,
            rating = v_new_rating,
            points = points + v_insurance_refund
        where id = v_pred.user_id;

      if v_new_season_level > v_current_season_level then
        insert into public.profile_level_events (user_id, new_level)
        values (v_pred.user_id, v_new_season_level);
      end if;

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
            rating = v_new_rating,
            points = 1000,
            season_level = 1,
            season_xp = 0
        where id = v_profile.id;
    else
      update public.profiles
        set rating = v_new_rating,
            points = 1000,
            season_level = 1,
            season_xp = 0
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
