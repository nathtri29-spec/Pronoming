create table if not exists public.friendships (
  id bigint generated always as identity primary key,
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);

create unique index if not exists friendships_unique_pair
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

alter table public.friendships enable row level security;

drop policy if exists "friendships_select_own" on public.friendships;
create policy "friendships_select_own"
  on public.friendships
  for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create or replace function public.send_friend_request(
  p_addressee_id uuid
)
returns public.friendships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_existing public.friendships%rowtype;
  v_row public.friendships%rowtype;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  if p_addressee_id = v_user_id then
    raise exception 'Tu ne peux pas t''ajouter toi-meme';
  end if;

  if not exists (select 1 from public.profiles where id = p_addressee_id) then
    raise exception 'Joueur introuvable';
  end if;

  select * into v_existing
    from public.friendships
    where (requester_id = v_user_id and addressee_id = p_addressee_id)
       or (requester_id = p_addressee_id and addressee_id = v_user_id)
    limit 1;

  if found then
    raise exception 'Une relation existe deja avec ce joueur';
  end if;

  insert into public.friendships (requester_id, addressee_id, status)
  values (v_user_id, p_addressee_id, 'pending')
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.send_friend_request(uuid) to authenticated;

create or replace function public.respond_friend_request(
  p_requester_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.friendships%rowtype;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  select * into v_row
    from public.friendships
    where requester_id = p_requester_id and addressee_id = v_user_id and status = 'pending'
    for update;

  if not found then
    raise exception 'Demande introuvable';
  end if;

  if p_accept then
    update public.friendships set status = 'accepted', responded_at = now() where id = v_row.id;
  else
    delete from public.friendships where id = v_row.id;
  end if;
end;
$$;

grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;

create or replace function public.remove_friend(
  p_other_id uuid
)
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

  delete from public.friendships
    where (requester_id = v_user_id and addressee_id = p_other_id)
       or (requester_id = p_other_id and addressee_id = v_user_id);
end;
$$;

grant execute on function public.remove_friend(uuid) to authenticated;
