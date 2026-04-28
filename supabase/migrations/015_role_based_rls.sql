alter type public.practice_role add value if not exists 'read_only';

create or replace function public.has_practice_role(target_practice_id uuid, allowed_roles public.practice_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.practice_memberships pm
    where pm.practice_id = target_practice_id
      and pm.user_id = auth.uid()
      and pm.role = any(allowed_roles)
  )
  or exists (
    select 1
    from public.practices p
    where p.id = target_practice_id
      and p.created_by = auth.uid()
      and 'owner'::public.practice_role = any(allowed_roles)
  );
$$;

create or replace function public.is_practice_member(target_practice_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.practice_memberships pm
    where pm.practice_id = target_practice_id
      and pm.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.practices p
    where p.id = target_practice_id
      and p.created_by = auth.uid()
  );
$$;

create or replace function public.has_company_role(target_company_id uuid, allowed_roles public.practice_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_profiles cp
    where cp.id = target_company_id
      and public.has_practice_role(cp.practice_id, allowed_roles)
  );
$$;

create or replace function public.guard_invitation_acceptance_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_practice_role(old.practice_id, array['owner']::public.practice_role[]) then
    return new;
  end if;

  if lower(old.email) = lower((auth.jwt() ->> 'email')) then
    if new.practice_id <> old.practice_id
      or lower(new.email) <> lower(old.email)
      or new.role <> old.role
      or coalesce(new.invited_by, '00000000-0000-0000-0000-000000000000'::uuid) <> coalesce(old.invited_by, '00000000-0000-0000-0000-000000000000'::uuid)
      or new.status <> 'accepted'
    then
      raise exception 'Invitees may only accept their own invitation';
    end if;
    return new;
  end if;

  raise exception 'Not allowed to update this invitation';
end;
$$;

drop trigger if exists guard_invitation_acceptance_update on public.practice_invitations;
create trigger guard_invitation_acceptance_update
before update on public.practice_invitations
for each row execute function public.guard_invitation_acceptance_update();

create or replace function public.is_company_practice_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_profiles cp
    where cp.id = target_company_id
      and public.is_practice_member(cp.practice_id)
  );
$$;

drop policy if exists "members can view practices" on public.practices;
drop policy if exists "authenticated users can create practices" on public.practices;
drop policy if exists "owners can update practices" on public.practices;

create policy "members can view practices"
on public.practices for select
to authenticated
using (public.is_practice_member(id));

create policy "authenticated users can create practices"
on public.practices for insert
to authenticated
with check (created_by = auth.uid());

create policy "owners can update practices"
on public.practices for update
to authenticated
using (public.has_practice_role(id, array['owner']::public.practice_role[]))
with check (public.has_practice_role(id, array['owner']::public.practice_role[]));

drop policy if exists "members can view memberships" on public.practice_memberships;
drop policy if exists "users can create owner membership for their own practice" on public.practice_memberships;
drop policy if exists "invitees can create their accepted membership" on public.practice_memberships;
drop policy if exists "owners can update memberships" on public.practice_memberships;
drop policy if exists "owners can delete memberships" on public.practice_memberships;

create policy "members can view memberships"
on public.practice_memberships for select
to authenticated
using (user_id = auth.uid() or public.is_practice_member(practice_id));

create policy "users can create owner membership for their own practice"
on public.practice_memberships for insert
to authenticated
with check (
  user_id = auth.uid()
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
  user_id = auth.uid()
  and exists (
    select 1
    from public.practice_invitations pi
    where pi.practice_id = practice_id
      and lower(pi.email) = lower((auth.jwt() ->> 'email'))
      and pi.role = role
      and pi.status in ('pending', 'accepted')
  )
);

create policy "owners can update memberships"
on public.practice_memberships for update
to authenticated
using (public.has_practice_role(practice_id, array['owner']::public.practice_role[]))
with check (public.has_practice_role(practice_id, array['owner']::public.practice_role[]));

create policy "owners can delete memberships"
on public.practice_memberships for delete
to authenticated
using (public.has_practice_role(practice_id, array['owner']::public.practice_role[]));

drop policy if exists "members can view invitations" on public.practice_invitations;
drop policy if exists "members and invitees can view invitations" on public.practice_invitations;
drop policy if exists "owners can manage invitations" on public.practice_invitations;
drop policy if exists "invitees can accept invitations" on public.practice_invitations;

create policy "members and invitees can view invitations"
on public.practice_invitations for select
to authenticated
using (
  public.is_practice_member(practice_id)
  or lower(email) = lower((auth.jwt() ->> 'email'))
);

create policy "owners can create invitations"
on public.practice_invitations for insert
to authenticated
with check (
  invited_by = auth.uid()
  and public.has_practice_role(practice_id, array['owner']::public.practice_role[])
);

create policy "owners can update invitations"
on public.practice_invitations for update
to authenticated
using (public.has_practice_role(practice_id, array['owner']::public.practice_role[]))
with check (public.has_practice_role(practice_id, array['owner']::public.practice_role[]));

create policy "invitees can accept invitations"
on public.practice_invitations for update
to authenticated
using (lower(email) = lower((auth.jwt() ->> 'email')) and status = 'pending')
with check (lower(email) = lower((auth.jwt() ->> 'email')) and status = 'accepted');

create policy "owners can delete invitations"
on public.practice_invitations for delete
to authenticated
using (public.has_practice_role(practice_id, array['owner']::public.practice_role[]));

drop policy if exists "members can view companies" on public.company_profiles;
drop policy if exists "members can create companies" on public.company_profiles;
drop policy if exists "members can update companies" on public.company_profiles;
drop policy if exists "owners and admins can delete companies" on public.company_profiles;

create policy "members can view companies"
on public.company_profiles for select
to authenticated
using (public.is_practice_member(practice_id));

create policy "owners admins members can create companies"
on public.company_profiles for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[])
);

create policy "owners admins members can update companies"
on public.company_profiles for update
to authenticated
using (public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[]))
with check (public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[]));

create policy "owners and admins can delete companies"
on public.company_profiles for delete
to authenticated
using (public.has_practice_role(practice_id, array['owner','admin']::public.practice_role[]));

drop policy if exists "members can view directors" on public.directors;
drop policy if exists "members can manage directors" on public.directors;
drop policy if exists "members can view shareholders" on public.shareholders;
drop policy if exists "members can manage shareholders" on public.shareholders;
drop policy if exists "members can view beneficial owners" on public.beneficial_owners;
drop policy if exists "members can manage beneficial owners" on public.beneficial_owners;
drop policy if exists "members can view trust reviews" on public.trust_reviews;
drop policy if exists "members can manage trust reviews" on public.trust_reviews;
drop policy if exists "members can view entity ownership reviews" on public.entity_ownership_reviews;
drop policy if exists "members can manage entity ownership reviews" on public.entity_ownership_reviews;
drop policy if exists "members can view company contacts" on public.company_contacts;
drop policy if exists "members can manage company contacts" on public.company_contacts;
drop policy if exists "members can view follow up tasks" on public.follow_up_tasks;
drop policy if exists "members can manage follow up tasks" on public.follow_up_tasks;
drop policy if exists "members can view filing packs" on public.filing_packs;
drop policy if exists "members can manage filing packs" on public.filing_packs;

create policy "members can view directors" on public.directors for select to authenticated using (public.is_company_practice_member(company_id));
create policy "owners admins members can insert directors" on public.directors for insert to authenticated with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins members can update directors" on public.directors for update to authenticated using (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[])) with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins can delete directors" on public.directors for delete to authenticated using (public.has_company_role(company_id, array['owner','admin']::public.practice_role[]));

create policy "members can view shareholders" on public.shareholders for select to authenticated using (public.is_company_practice_member(company_id));
create policy "owners admins members can insert shareholders" on public.shareholders for insert to authenticated with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins members can update shareholders" on public.shareholders for update to authenticated using (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[])) with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins can delete shareholders" on public.shareholders for delete to authenticated using (public.has_company_role(company_id, array['owner','admin']::public.practice_role[]));

create policy "members can view beneficial owners" on public.beneficial_owners for select to authenticated using (public.is_company_practice_member(company_id));
create policy "owners admins members can insert beneficial owners" on public.beneficial_owners for insert to authenticated with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins members can update beneficial owners" on public.beneficial_owners for update to authenticated using (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[])) with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins can delete beneficial owners" on public.beneficial_owners for delete to authenticated using (public.has_company_role(company_id, array['owner','admin']::public.practice_role[]));

create policy "members can view trust reviews" on public.trust_reviews for select to authenticated using (public.is_company_practice_member(company_id));
create policy "owners admins members can insert trust reviews" on public.trust_reviews for insert to authenticated with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins members can update trust reviews" on public.trust_reviews for update to authenticated using (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[])) with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins can delete trust reviews" on public.trust_reviews for delete to authenticated using (public.has_company_role(company_id, array['owner','admin']::public.practice_role[]));

create policy "members can view entity ownership reviews" on public.entity_ownership_reviews for select to authenticated using (public.is_company_practice_member(company_id));
create policy "owners admins members can insert entity ownership reviews" on public.entity_ownership_reviews for insert to authenticated with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins members can update entity ownership reviews" on public.entity_ownership_reviews for update to authenticated using (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[])) with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins can delete entity ownership reviews" on public.entity_ownership_reviews for delete to authenticated using (public.has_company_role(company_id, array['owner','admin']::public.practice_role[]));

create policy "members can view company contacts" on public.company_contacts for select to authenticated using (public.is_company_practice_member(company_id));
create policy "owners admins members can insert company contacts" on public.company_contacts for insert to authenticated with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins members can update company contacts" on public.company_contacts for update to authenticated using (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[])) with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins can delete company contacts" on public.company_contacts for delete to authenticated using (public.has_company_role(company_id, array['owner','admin']::public.practice_role[]));

create policy "members can view follow up tasks" on public.follow_up_tasks for select to authenticated using (public.is_company_practice_member(company_id));
create policy "owners admins members can insert follow up tasks" on public.follow_up_tasks for insert to authenticated with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins members can update follow up tasks" on public.follow_up_tasks for update to authenticated using (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[])) with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
create policy "owners admins can delete follow up tasks" on public.follow_up_tasks for delete to authenticated using (public.has_company_role(company_id, array['owner','admin']::public.practice_role[]));

create policy "members can view filing packs" on public.filing_packs for select to authenticated using (public.is_company_practice_member(company_id));
create policy "owners admins can insert filing packs" on public.filing_packs for insert to authenticated with check (public.has_company_role(company_id, array['owner','admin']::public.practice_role[]));
create policy "owners admins can update filing packs" on public.filing_packs for update to authenticated using (public.has_company_role(company_id, array['owner','admin']::public.practice_role[])) with check (public.has_company_role(company_id, array['owner','admin']::public.practice_role[]));
create policy "owners admins can delete filing packs" on public.filing_packs for delete to authenticated using (public.has_company_role(company_id, array['owner','admin']::public.practice_role[]));

drop policy if exists "members can view documents" on public.documents;
drop policy if exists "members can manage documents" on public.documents;

create policy "members can view documents"
on public.documents for select
to authenticated
using (public.is_practice_member(practice_id));

create policy "owners admins members can insert documents"
on public.documents for insert
to authenticated
with check (
  public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[])
  and public.is_company_practice_member(company_id)
);

create policy "owners admins members can update documents"
on public.documents for update
to authenticated
using (public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[]))
with check (
  public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[])
  and public.is_company_practice_member(company_id)
);

create policy "owners admins can delete documents"
on public.documents for delete
to authenticated
using (public.has_practice_role(practice_id, array['owner','admin']::public.practice_role[]));

drop policy if exists "members can view activity" on public.activity_log;
drop policy if exists "members can create activity" on public.activity_log;

create policy "members can view activity"
on public.activity_log for select
to authenticated
using (public.is_practice_member(practice_id));

create policy "members can create activity"
on public.activity_log for insert
to authenticated
with check (
  actor_id = auth.uid()
  and public.is_practice_member(practice_id)
);

insert into storage.buckets (id, name, public)
values ('company-documents', 'company-documents', false)
on conflict (id) do update set public = false;

drop policy if exists "practice members can read company documents" on storage.objects;
drop policy if exists "practice members can upload company documents" on storage.objects;
drop policy if exists "practice members can update company documents" on storage.objects;
drop policy if exists "practice members can delete company documents" on storage.objects;
drop policy if exists "practice admins can delete company documents" on storage.objects;

create policy "practice members can read company documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'company-documents'
  and public.is_practice_member(split_part(name, '/', 1)::uuid)
);

create policy "practice members can upload company documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'company-documents'
  and public.has_practice_role(split_part(name, '/', 1)::uuid, array['owner','admin','member']::public.practice_role[])
);

create policy "practice members can update company documents"
on storage.objects for update
to authenticated
using (
  bucket_id = 'company-documents'
  and public.has_practice_role(split_part(name, '/', 1)::uuid, array['owner','admin','member']::public.practice_role[])
)
with check (
  bucket_id = 'company-documents'
  and public.has_practice_role(split_part(name, '/', 1)::uuid, array['owner','admin','member']::public.practice_role[])
);

create policy "practice admins can delete company documents"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'company-documents'
  and public.has_practice_role(split_part(name, '/', 1)::uuid, array['owner','admin']::public.practice_role[])
);
