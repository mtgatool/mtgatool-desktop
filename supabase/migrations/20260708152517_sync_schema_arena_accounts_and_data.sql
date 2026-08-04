-- ===========================================================================
-- v6 sync schema. One app user (auth.uid) links many MTG Arena accounts
-- (arena_accounts); all game data is partitioned by (user_id, arena_id).
--
-- Anti-spoof: arena_id (MTGA personaId) is readable from logs and NOT secret,
-- so it is never a global identity. Rows are owned by (user_id, arena_id) and
-- RLS restricts every operation to auth.uid(). A client spoofing someone's
-- arena_id only ever writes into its own partition and can never read another
-- user's rows. arena_id is intentionally NOT globally unique.
-- ===========================================================================

-- Linked MTG Arena identities (also the source for the top-nav account switcher)
create table public.arena_accounts (
  user_id uuid not null references auth.users(id) on delete cascade,
  arena_id text not null,               -- MTGA personaId (stable join key)
  display_name text,                    -- e.g. "Manuel777#63494" (mutable)
  linked_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (user_id, arena_id)
);

create table public.matches (
  user_id uuid not null,
  match_id text not null,
  arena_id text not null,
  event_id text,
  played_at timestamptz,
  player_name text,
  player_deck_id text,
  player_deck_hash text,
  player_deck_colors int,
  opp_deck_colors int,
  player_wins int,
  player_losses int,
  duration int,
  internal_match jsonb not null,        -- full match document
  created_at timestamptz not null default now(),
  primary key (user_id, match_id),
  foreign key (user_id, arena_id)
    references public.arena_accounts(user_id, arena_id) on delete cascade
);
create index matches_user_arena_played_idx
  on public.matches (user_id, arena_id, played_at desc);

create table public.decks (
  user_id uuid not null,
  deck_id text not null,
  arena_id text not null,
  name text,
  deck jsonb not null,                  -- full deck (piles, attributes, ...)
  updated_at timestamptz not null default now(),
  primary key (user_id, deck_id),
  foreign key (user_id, arena_id)
    references public.arena_accounts(user_id, arena_id) on delete cascade
);
create index decks_user_arena_idx on public.decks (user_id, arena_id);

-- One current-state row per (user, arena account)
create table public.arena_collection (
  user_id uuid not null,
  arena_id text not null,
  cards jsonb not null default '{}',    -- grpId -> qty
  prev_cards jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, arena_id),
  foreign key (user_id, arena_id)
    references public.arena_accounts(user_id, arena_id) on delete cascade
);

create table public.arena_inventory (
  user_id uuid not null,
  arena_id text not null,
  gems int,
  gold int,
  total_vault_progress numeric,
  wc_track_position int,
  wc_common int,
  wc_uncommon int,
  wc_rare int,
  wc_mythic int,
  data jsonb not null default '{}',     -- extras (boosters, tokens, land sets)
  updated_at timestamptz not null default now(),
  primary key (user_id, arena_id),
  foreign key (user_id, arena_id)
    references public.arena_accounts(user_id, arena_id) on delete cascade
);

create table public.arena_ranks (
  user_id uuid not null,
  arena_id text not null,
  constructed jsonb,                    -- reader rank shape (class, level, ...)
  limited jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, arena_id),
  foreign key (user_id, arena_id)
    references public.arena_accounts(user_id, arena_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Row Level Security: owner-only on every table.
-- ---------------------------------------------------------------------------
alter table public.arena_accounts enable row level security;
alter table public.matches enable row level security;
alter table public.decks enable row level security;
alter table public.arena_collection enable row level security;
alter table public.arena_inventory enable row level security;
alter table public.arena_ranks enable row level security;

create policy arena_accounts_owner on public.arena_accounts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy matches_owner on public.matches
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy decks_owner on public.decks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy arena_collection_owner on public.arena_collection
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy arena_inventory_owner on public.arena_inventory
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy arena_ranks_owner on public.arena_ranks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
