alter table public.clubs
  add column if not exists description text;

create or replace function public.update_club_description(
  p_description text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_description text := nullif(trim(coalesce(p_description, '')), '');
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  if v_description is not null and length(v_description) > 120 then
    raise exception 'Description trop longue (120 caracteres max)';
  end if;

  update public.clubs
    set description = v_description
    where owner_id = v_user_id;

  if not found then
    raise exception 'Tu n''es pas chef de club';
  end if;
end;
$$;

grant execute on function public.update_club_description(text) to authenticated;
