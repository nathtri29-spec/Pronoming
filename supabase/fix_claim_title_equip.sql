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
