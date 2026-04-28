create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  company_id uuid references public.company_profiles(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  subject_type text,
  subject_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_practice_created_idx on public.activity_log(practice_id, created_at desc);
create index if not exists activity_log_company_created_idx on public.activity_log(company_id, created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists "members can view activity" on public.activity_log;
drop policy if exists "members can create activity" on public.activity_log;

create policy "members can view activity"
on public.activity_log for select
to authenticated
using (
  practice_id in (
    select pm.practice_id
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
  )
  or practice_id in (
    select p.id
    from public.practices p
    where p.created_by = auth.uid()
  )
);

create policy "members can create activity"
on public.activity_log for insert
to authenticated
with check (
  actor_id = auth.uid()
  and (
    practice_id in (
      select pm.practice_id
      from public.practice_memberships pm
      where pm.user_id = auth.uid()
    )
    or practice_id in (
      select p.id
      from public.practices p
      where p.created_by = auth.uid()
    )
  )
);
