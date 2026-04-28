drop policy if exists "members can create companies" on public.company_profiles;

create policy "members can create companies"
on public.company_profiles for insert
to authenticated
with check (
  auth.uid() = created_by
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

drop policy if exists "members can view companies" on public.company_profiles;

create policy "members can view companies"
on public.company_profiles for select
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

drop policy if exists "members can update companies" on public.company_profiles;

create policy "members can update companies"
on public.company_profiles for update
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
)
with check (
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
