create table if not exists public.clubs (
  id bigint generated always as identity primary key,
  name text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  join_policy text not null default 'request' check (join_policy in ('open', 'request', 'friends_only')),
  created_at timestamptz not null default now()
);

alter table public.clubs enable row level security;

drop policy if exists "clubs_select_all" on public.clubs;
create policy "clubs_select_all"
  on public.clubs
  for select
  to authenticated
  using (true);

create table if not exists public.club_members (
  club_id bigint not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade unique,
  role text not null default 'member' check (role in ('leader', 'member')),
  joined_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

alter table public.club_members enable row level security;

drop policy if exists "club_members_select_all" on public.club_members;
create policy "club_members_select_all"
  on public.club_members
  for select
  to authenticated
  using (true);

create table if not exists public.club_join_requests (
  id bigint generated always as identity primary key,
  club_id bigint not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (club_id, user_id)
);

alter table public.club_join_requests enable row level security;

drop policy if exists "club_join_requests_select_own" on public.club_join_requests;
create policy "club_join_requests_select_own"
  on public.club_join_requests
  for select
  to authenticated
  using (
    auth.uid() = user_id
    or auth.uid() = (select owner_id from public.clubs where id = club_id)
  );

create or replace function public.create_club(
  p_name text,
  p_join_policy text
)
returns public.clubs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_price integer := 5000;
  v_profile public.profiles%rowtype;
  v_club public.clubs%rowtype;
  v_name text := trim(p_name);
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  if v_name = '' or length(v_name) > 24 then
    raise exception 'Nom de club invalide (1 a 24 caracteres)';
  end if;

  if p_join_policy not in ('open', 'request', 'friends_only') then
    raise exception 'Politique d''adhesion invalide';
  end if;

  if exists (select 1 from public.club_members where user_id = v_user_id) then
    raise exception 'Tu es deja dans un club';
  end if;

  if exists (select 1 from public.clubs where lower(name) = lower(v_name)) then
    raise exception 'Ce nom de club est deja pris';
  end if;

  select * into v_profile from public.profiles where id = v_user_id for update;
  if not found then
    raise exception 'Profil introuvable';
  end if;

  if v_profile.points < v_price then
    raise exception 'Pas assez de points (% requis)', v_price;
  end if;

  update public.profiles set points = points - v_price where id = v_user_id;

  insert into public.clubs (name, owner_id, join_policy)
  values (v_name, v_user_id, p_join_policy)
  returning * into v_club;

  insert into public.club_members (club_id, user_id, role)
  values (v_club.id, v_user_id, 'leader');

  return v_club;
end;
$$;

grant execute on function public.create_club(text, text) to authenticated;

create or replace function public.join_club(
  p_club_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_club public.clubs%rowtype;
  v_is_friend boolean;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  if exists (select 1 from public.club_members where user_id = v_user_id) then
    raise exception 'Tu es deja dans un club';
  end if;

  select * into v_club from public.clubs where id = p_club_id;
  if not found then
    raise exception 'Club introuvable';
  end if;

  if v_club.join_policy = 'open' then
    insert into public.club_members (club_id, user_id, role)
    values (p_club_id, v_user_id, 'member');

  elsif v_club.join_policy = 'friends_only' then
    select exists (
      select 1 from public.friendships
      where status = 'accepted'
        and ((requester_id = v_user_id and addressee_id = v_club.owner_id)
          or (requester_id = v_club.owner_id and addressee_id = v_user_id))
    ) into v_is_friend;

    if not v_is_friend then
      raise exception 'Tu dois etre ami avec le chef du club pour le rejoindre';
    end if;

    insert into public.club_members (club_id, user_id, role)
    values (p_club_id, v_user_id, 'member');

  else
    if exists (select 1 from public.club_join_requests where club_id = p_club_id and user_id = v_user_id) then
      raise exception 'Demande deja envoyee';
    end if;

    insert into public.club_join_requests (club_id, user_id)
    values (p_club_id, v_user_id);
  end if;
end;
$$;

grant execute on function public.join_club(bigint) to authenticated;

create or replace function public.cancel_club_request(
  p_club_id bigint
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

  delete from public.club_join_requests
    where club_id = p_club_id and user_id = v_user_id;
end;
$$;

grant execute on function public.cancel_club_request(bigint) to authenticated;

create or replace function public.respond_club_request(
  p_user_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.club_join_requests%rowtype;
  v_club public.clubs%rowtype;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  select r.* into v_request
    from public.club_join_requests r
    join public.clubs c on c.id = r.club_id
    where r.user_id = p_user_id and c.owner_id = v_user_id
    limit 1;

  if not found then
    raise exception 'Demande introuvable';
  end if;

  if p_accept then
    if exists (select 1 from public.club_members where user_id = p_user_id) then
      delete from public.club_join_requests where id = v_request.id;
      raise exception 'Ce joueur a deja rejoint un autre club';
    end if;

    insert into public.club_members (club_id, user_id, role)
    values (v_request.club_id, p_user_id, 'member');
  end if;

  delete from public.club_join_requests where id = v_request.id;
end;
$$;

grant execute on function public.respond_club_request(uuid, boolean) to authenticated;

create or replace function public.update_club_join_policy(
  p_join_policy text
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

  if p_join_policy not in ('open', 'request', 'friends_only') then
    raise exception 'Politique d''adhesion invalide';
  end if;

  update public.clubs
    set join_policy = p_join_policy
    where owner_id = v_user_id;

  if not found then
    raise exception 'Tu n''es pas chef de club';
  end if;
end;
$$;

grant execute on function public.update_club_join_policy(text) to authenticated;

create or replace function public.kick_member(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_club_id bigint;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  if p_user_id = v_user_id then
    raise exception 'Utilise "Quitter le club" pour toi-meme';
  end if;

  select id into v_club_id from public.clubs where owner_id = v_user_id;
  if v_club_id is null then
    raise exception 'Tu n''es pas chef de club';
  end if;

  delete from public.club_members where club_id = v_club_id and user_id = p_user_id;
end;
$$;

grant execute on function public.kick_member(uuid) to authenticated;

create or replace function public.leave_club()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_membership public.club_members%rowtype;
  v_next_leader uuid;
begin
  if v_user_id is null then
    raise exception 'Non authentifie';
  end if;

  select * into v_membership from public.club_members where user_id = v_user_id;
  if not found then
    raise exception 'Tu n''es dans aucun club';
  end if;

  if v_membership.role = 'leader' then
    select user_id into v_next_leader
      from public.club_members
      where club_id = v_membership.club_id and user_id <> v_user_id
      order by joined_at
      limit 1;

    if v_next_leader is null then
      delete from public.clubs where id = v_membership.club_id;
    else
      update public.club_members set role = 'leader' where club_id = v_membership.club_id and user_id = v_next_leader;
      update public.clubs set owner_id = v_next_leader where id = v_membership.club_id;
      delete from public.club_members where club_id = v_membership.club_id and user_id = v_user_id;
    end if;
  else
    delete from public.club_members where club_id = v_membership.club_id and user_id = v_user_id;
  end if;
end;
$$;

grant execute on function public.leave_club() to authenticated;

create or replace function public.disband_club()
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

  delete from public.clubs where owner_id = v_user_id;

  if not found then
    raise exception 'Tu n''es pas chef de club';
  end if;
end;
$$;

grant execute on function public.disband_club() to authenticated;
