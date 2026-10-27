alter table public.matches
  alter column odds_team_a drop not null;

alter table public.matches
  alter column odds_team_b drop not null;

alter table public.matches
  drop constraint if exists matches_odds_required_for_fixed;

alter table public.matches
  add constraint matches_odds_required_for_fixed
  check (odds_mode = 'community' or (odds_team_a is not null and odds_team_b is not null));
