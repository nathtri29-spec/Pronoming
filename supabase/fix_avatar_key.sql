alter table public.profiles
  add column if not exists avatar_key text;

grant update (username, selected_title, onboarding_completed, avatar_key)
  on public.profiles to authenticated;
