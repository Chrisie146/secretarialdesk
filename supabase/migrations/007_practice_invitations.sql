create table if not exists public.practice_invitations (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  email text not null,
  role public.practice_role not null default 'member',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (practice_id, email)
);

create index if not exists practice_invitations_practice_id_idx on public.practice_invitations(practice_id);

alter table public.practice_invitations enable row level security;

drop policy if exists "members can view invitations" on public.practice_invitations;
drop policy if exists "owners can manage invitations" on public.practice_invitations;

create policy "members can view invitations"
on public.practice_invitations for select
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
