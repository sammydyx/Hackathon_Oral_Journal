-- Run once in this project's Supabase SQL Editor.
create table if not exists public.oj_task_work (
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, task_id)
);
create table if not exists public.oj_submissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  task_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.oj_task_work enable row level security;
alter table public.oj_submissions enable row level security;
revoke all on public.oj_task_work, public.oj_submissions from anon;
grant select, insert, update on public.oj_task_work, public.oj_submissions to authenticated;
drop policy if exists own_work on public.oj_task_work;
create policy own_work on public.oj_task_work for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists own_submissions on public.oj_submissions;
create policy own_submissions on public.oj_submissions for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- These are formative feedback snapshots, not authoritative teacher grades.
-- Clients may update feedback after an initially pending submission.
