create table if not exists public.profile_rank_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  new_rank text not null,
  created_at timestamptz not null default now()
);

create index if not exists profile_rank_events_user_id_created_at_idx
  on public.profile_rank_events (user_id, created_at);

alter table public.profile_rank_events enable row level security;

drop policy if exists "profile_rank_events_select_all" on public.profile_rank_events;
create policy "profile_rank_events_select_all"
  on public.profile_rank_events
  for select
  to authenticated
  using (true);

create or replace function public.rank_tier(p_rating integer)
returns text
language sql
immutable
as $$
  select case
    when p_rating >= 3500 then 'Legend'
    when p_rating >= 3000 then 'Grandmaster'
    when p_rating >= 2600 then 'Master'
    when p_rating >= 2200 then 'Diamond'
    when p_rating >= 1800 then 'Platinum'
    when p_rating >= 1400 then 'Gold'
    when p_rating >= 1000 then 'Silver'
    else 'Bronze'
  end;
$$;

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

      update public.predictions set status = 'won', rating_delta = v_rating_gain, xp_delta = v_xp_gain, resolved_at = now() where id = v_pred.id;

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

      if v_new_level > v_current_level then
        insert into public.profile_level_events (user_id, new_level)
        values (v_pred.user_id, v_new_level);
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
            win_streak = 0,
            rating = v_new_rating,
            points = points + v_insurance_refund
        where id = v_pred.user_id;

      if v_new_level > v_current_level then
        insert into public.profile_level_events (user_id, new_level)
        values (v_pred.user_id, v_new_level);
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
