-- Targeted log capture.
--
-- Some parsing bugs only happen in situations we cannot reproduce: a direct
-- challenge you did not start, a Midweek Magic event that ran for two days, a
-- GRE message Arena summarised away. The commander bug fixed in the desktop
-- was diagnosed from database ratios rather than from a log, because no log of
-- the failing case existed anywhere we could reach.
--
-- This lets us ask, from admin, for a specific log label — and stop asking as
-- soon as we have enough. It is deliberately small: a handful of events, one
-- per user, and the client goes quiet for the rest of its session the moment
-- it has contributed.

create table if not exists public.log_captures (
  id uuid primary key default gen_random_uuid(),
  -- What this capture is for, in words, so a stale one is recognisable later.
  name text not null,
  -- entry.label values to match, exactly as the log parser sees them.
  labels text[] not null,
  -- Across the whole system, not per user. Five is usually plenty: these are
  -- for reading, not for statistics.
  max_events integer not null default 5 check (max_events between 1 and 100),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create table if not exists public.log_capture_events (
  id uuid primary key default gen_random_uuid(),
  capture_id uuid not null references public.log_captures (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The log entry, in the shape the parser hands to logEntrySwitch.
  label text not null,
  entry_hash text,
  entry_timestamp text,
  arrow text,
  entry_type text,
  json_string text,
  size integer,
  position bigint,
  created_at timestamptz not null default now(),
  -- One per user per capture: five events from five people is a far better
  -- sample than five from whoever happened to play first.
  unique (capture_id, user_id)
);

create index if not exists log_capture_events_capture_idx
  on public.log_capture_events (capture_id, created_at desc);

alter table public.log_captures enable row level security;
alter table public.log_capture_events enable row level security;

-- Clients read the active captures to know what to watch for. The rows carry
-- no user data — they are a list of log labels — and every client needs them.
drop policy if exists "log_captures readable" on public.log_captures;
create policy "log_captures readable" on public.log_captures
  for select to authenticated using (true);

-- Nobody writes captured events directly: submission goes through the function
-- below, which enforces the limit. No select policy at all, so the events are
-- reachable only with the service role (i.e. the admin panel).
drop policy if exists "log_capture_events no direct access" on public.log_capture_events;

/**
 * Submit one captured log entry.
 *
 * Returns true when it was stored. False means "we have enough, stop sending"
 * — the capture filled up, went inactive, or this user already contributed.
 * The client treats both the same way: drop the capture for the session.
 *
 * The row is locked before counting so two clients submitting at the same
 * moment cannot both see four events and both insert a fifth.
 */
create or replace function public.submit_log_capture(
  p_capture_id uuid,
  p_label text,
  p_hash text,
  p_timestamp text,
  p_arrow text,
  p_type text,
  p_json_string text,
  p_size integer,
  p_position bigint
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_max integer;
  v_count integer;
begin
  if auth.uid() is null then
    return false;
  end if;

  select max_events into v_max
    from log_captures
   where id = p_capture_id and active
     for update;

  if v_max is null then
    return false;
  end if;

  select count(*) into v_count
    from log_capture_events
   where capture_id = p_capture_id;

  if v_count >= v_max then
    return false;
  end if;

  insert into log_capture_events (
    capture_id, user_id, label, entry_hash, entry_timestamp,
    arrow, entry_type, json_string, size, position
  ) values (
    p_capture_id, auth.uid(), p_label, p_hash, p_timestamp,
    p_arrow, p_type, p_json_string, p_size, p_position
  )
  on conflict (capture_id, user_id) do nothing;

  -- A conflict means this user already contributed; either way they should
  -- stop sending, so the answer is the same.
  return found;
end;
$$;

revoke all on function public.submit_log_capture from public;
grant execute on function public.submit_log_capture to authenticated;

-- Which direction of a label to capture.
--
-- Request/response labels are logged twice, `==>` then `<==`, and a client
-- claims a capture on the FIRST match it sees — which is always the outbound
-- request. For EventGetCoursesV2 that is a 60-byte `{"request":"{}"}` and the
-- response carrying every course is never captured at all.
--
-- Null or empty means either direction, which is right for the labels that
-- have no arrow (the GRE messages take the decoder's other branch and carry
-- none).
alter table public.log_captures
  add column if not exists arrows text[];
