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

  return v_prediction;
end;
$$;

grant execute on function public.place_prediction(bigint, text, integer) to authenticated;

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
  v_new_xp integer;
  v_new_level integer;
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
    select xp, level into v_current_xp, v_current_level
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

      update public.profiles
        set points = points + v_gain, xp = v_new_xp, level = v_new_level
        where id = v_pred.user_id;
    else
      update public.predictions set status = 'lost' where id = v_pred.id;

      v_new_xp := v_current_xp + 5;
      v_new_level := v_current_level;

      while v_new_xp >= (v_new_level * (v_new_level + 1) * 100) / 2 loop
        v_new_level := v_new_level + 1;
      end loop;

      update public.profiles
        set xp = v_new_xp, level = v_new_level
        where id = v_pred.user_id;
    end if;
  end loop;
end;
$$;

grant execute on function public.resolve_match(bigint, text) to authenticated;
