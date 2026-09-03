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
