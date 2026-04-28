drop policy if exists "members can view invitations" on public.practice_invitations;
drop policy if exists "owners can manage invitations" on public.practice_invitations;
drop policy if exists "invitees can accept invitations" on public.practice_invitations;
drop policy if exists "invitees can view their invitations" on public.practice_invitations;

create policy "members and invitees can view invitations"
on public.practice_invitations for select
to authenticated
using (
  lower(email) = lower((auth.jwt() ->> 'email'))
  or practice_id in (
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

create policy "owners can manage invitations"
on public.practice_invitations for all
to authenticated
using (
  practice_id in (
    select pm.practice_id
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
      and pm.role in ('owner', 'admin')
  )
  or practice_id in (
    select p.id
    from public.practices p
    where p.created_by = auth.uid()
  )
)
with check (
  invited_by = auth.uid()
  and (
    practice_id in (
      select pm.practice_id
      from public.practice_memberships pm
      where pm.user_id = auth.uid()
        and pm.role in ('owner', 'admin')
    )
    or practice_id in (
      select p.id
      from public.practices p
      where p.created_by = auth.uid()
    )
  )
);

create policy "invitees can accept invitations"
on public.practice_invitations for update
to authenticated
using (
  lower(email) = lower((auth.jwt() ->> 'email'))
  and status = 'pending'
)
with check (
  lower(email) = lower((auth.jwt() ->> 'email'))
  and status = 'accepted'
);

drop policy if exists "users can create owner membership for their own practice" on public.practice_memberships;
drop policy if exists "invitees can create their accepted membership" on public.practice_memberships;

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

create policy "invitees can create their accepted membership"
on public.practice_memberships for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.practice_invitations pi
    where pi.practice_id = practice_id
      and lower(pi.email) = lower((auth.jwt() ->> 'email'))
      and pi.status = 'pending'
      and pi.role = role
  )
);
