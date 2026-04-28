alter table public.practices
add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.practices enable row level security;
alter table public.practice_memberships enable row level security;

drop policy if exists "members can view practices" on public.practices;
drop policy if exists "authenticated users can create practices" on public.practices;
drop policy if exists "members can view memberships" on public.practice_memberships;
drop policy if exists "users can create owner membership for their own practice" on public.practice_memberships;
drop policy if exists "authenticated users can create their own owner membership" on public.practice_memberships;

create policy "members can view practices"
on public.practices for select
to authenticated
using (
  created_by = auth.uid()
  or id in (
    select pm.practice_id
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
  )
);

create policy "authenticated users can create practices"
on public.practices for insert
to authenticated
with check (
  auth.uid() is not null
  and created_by = auth.uid()
);

create policy "members can view memberships"
on public.practice_memberships for select
to authenticated
using (
  user_id = auth.uid()
);

create policy "users can create owner membership for their own practice"
on public.practice_memberships for insert
to authenticated
with check (
  auth.uid() = user_id
  and role = 'owner'
  and exists (
    select 1
    from public.practices p
    where p.id = practice_id
      and p.created_by = auth.uid()
  )
);
