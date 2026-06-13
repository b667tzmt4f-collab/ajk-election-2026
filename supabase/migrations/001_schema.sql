-- ============================================================
-- AJK GE 2026 — Supabase Schema
-- Run this in Supabase SQL Editor (one paste, one click)
-- ============================================================

-- 1. Constituencies (static reference)
create table if not exists constituencies (
  seat_id               text primary key,        -- e.g. 'LA-1'
  seat_name             text not null,
  region                text not null,           -- 'In-Region' | 'Refugee'
  refugee_bloc          text default 'None',     -- 'Jammu' | 'Kashmir Valley' | 'None'
  registered_2021       int,
  registered_male_2021  int,
  registered_female_2021 int,
  polled_2021           int,
  turnout_pct_2021      float,
  winner_2021           text,
  winner_party_2021     text,
  winner_votes_2021     int,
  runner_2021           text,
  runner_party_2021     text,
  runner_votes_2021     int,
  margin_2021           int,
  registered_2026       int,
  registered_male_2026  int,
  registered_female_2026 int
);

-- 2. Candidates (static reference + live votes)
create table if not exists candidates (
  id              bigserial primary key,
  seat_id         text references constituencies(seat_id),
  candidate_name  text not null,
  party_2021      text,
  party_2026      text not null,   -- PTI → 'IND (ex-PTI)'
  votes_2021      int default 0,
  rank_2021       int,
  votes_2026      int default 0,   -- LIVE — updated on election day
  updated_at      timestamptz default now()
);

-- 3. Live results log (audit trail)
create table if not exists results_log (
  id          bigserial primary key,
  seat_id     text references constituencies(seat_id),
  candidate_id bigint references candidates(id),
  votes       int not null,
  entered_by  text,                -- email of data-entry user
  entered_at  timestamptz default now()
);

-- ── Indexes ─────────────────────────────────────────────────
create index if not exists idx_candidates_seat on candidates(seat_id);
create index if not exists idx_candidates_party on candidates(party_2026);
create index if not exists idx_log_seat on results_log(seat_id);

-- ── Row-Level Security ───────────────────────────────────────
alter table constituencies enable row level security;
alter table candidates enable row level security;
alter table results_log enable row level security;

-- Public can read everything
create policy "public_read_constituencies" on constituencies
  for select using (true);

create policy "public_read_candidates" on candidates
  for select using (true);

create policy "public_read_log" on results_log
  for select using (true);

-- Only authenticated users can write votes
create policy "auth_update_candidates" on candidates
  for update using (auth.role() = 'authenticated');

create policy "auth_insert_log" on results_log
  for insert with check (auth.role() = 'authenticated');

-- ── Real-time ────────────────────────────────────────────────
-- Enable real-time for live dashboard updates
alter publication supabase_realtime add table candidates;
alter publication supabase_realtime add table constituencies;
