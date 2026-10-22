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

revoke update (selected_title) on public.profiles from authenticated;

create or replace function public.equip_title(
  p_title text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_owned jsonb;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profil introuvable';
  end if;

  v_owned := coalesce(v_profile.owned_titles::jsonb, '["Rookie Predictor"]'::jsonb);

  if not (v_owned ? p_title) then
    raise exception 'Titre non possede';
  end if;

  update public.profiles
    set selected_title = p_title
    where id = v_user_id
    returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.equip_title(text) to authenticated;

alter table public.profiles
  drop constraint if exists profiles_username_length;

alter table public.profiles
  add constraint profiles_username_length
  check (username is null or char_length(username) between 2 and 20);

drop index if exists profiles_username_unique_idx;

create unique index profiles_username_unique_idx
  on public.profiles (lower(username));
