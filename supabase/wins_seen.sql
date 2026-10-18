alter table public.profiles
  add column if not exists wins_seen_at timestamptz not null default now();

create or replace function public.mark_wins_seen()
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

  update public.profiles set wins_seen_at = now() where id = v_user_id;
end;
$$;

grant execute on function public.mark_wins_seen() to authenticated;
