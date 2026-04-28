create table if not exists public.company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  full_name text not null,
  role text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  contact_id uuid references public.company_contacts(id) on delete set null,
  title text not null,
  task_type text,
  due_date date,
  status text not null default 'open' check (status in ('open', 'done')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists company_contacts_company_id_idx on public.company_contacts(company_id);
create index if not exists follow_up_tasks_company_id_idx on public.follow_up_tasks(company_id);
create index if not exists follow_up_tasks_status_due_idx on public.follow_up_tasks(company_id, status, due_date);

alter table public.company_contacts enable row level security;
alter table public.follow_up_tasks enable row level security;

drop policy if exists "members can view company contacts" on public.company_contacts;
drop policy if exists "members can manage company contacts" on public.company_contacts;
drop policy if exists "members can view follow up tasks" on public.follow_up_tasks;
drop policy if exists "members can manage follow up tasks" on public.follow_up_tasks;

create policy "members can view company contacts"
on public.company_contacts for select
using (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
);

create policy "members can manage company contacts"
on public.company_contacts for all
using (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
);

create policy "members can view follow up tasks"
on public.follow_up_tasks for select
using (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
);

create policy "members can manage follow up tasks"
on public.follow_up_tasks for all
using (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
);
