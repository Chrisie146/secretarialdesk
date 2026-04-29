create table if not exists public.trust_profiles (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  name text not null,
  registration_number text,
  master_reference text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shareholders
add column if not exists trust_profile_id uuid references public.trust_profiles(id) on delete set null;

alter table public.trust_reviews
add column if not exists trust_profile_id uuid references public.trust_profiles(id) on delete cascade;

alter table public.trust_reviews
alter column company_id drop not null;

create index if not exists trust_profiles_practice_idx
on public.trust_profiles(practice_id, name);

create index if not exists shareholders_trust_profile_idx
on public.shareholders(trust_profile_id);

create index if not exists trust_reviews_trust_profile_idx
on public.trust_reviews(trust_profile_id);

alter table public.trust_profiles enable row level security;

drop policy if exists "members can view trust profiles" on public.trust_profiles;
drop policy if exists "owners admins members can insert trust profiles" on public.trust_profiles;
drop policy if exists "owners admins members can update trust profiles" on public.trust_profiles;
drop policy if exists "owners admins can delete trust profiles" on public.trust_profiles;

create policy "members can view trust profiles"
on public.trust_profiles for select
to authenticated
using (public.is_practice_member(practice_id));

create policy "owners admins members can insert trust profiles"
on public.trust_profiles for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[])
);

create policy "owners admins members can update trust profiles"
on public.trust_profiles for update
to authenticated
using (public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[]))
with check (public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[]));

create policy "owners admins can delete trust profiles"
on public.trust_profiles for delete
to authenticated
using (public.has_practice_role(practice_id, array['owner','admin']::public.practice_role[]));

drop policy if exists "members can view trust reviews" on public.trust_reviews;
drop policy if exists "owners admins members can insert trust reviews" on public.trust_reviews;
drop policy if exists "owners admins members can update trust reviews" on public.trust_reviews;
drop policy if exists "owners admins can delete trust reviews" on public.trust_reviews;

create policy "members can view trust reviews"
on public.trust_reviews for select
to authenticated
using (
  (company_id is not null and public.is_company_practice_member(company_id))
  or (trust_profile_id is not null and exists (
    select 1 from public.trust_profiles tp
    where tp.id = trust_profile_id
    and public.is_practice_member(tp.practice_id)
  ))
);

create policy "owners admins members can insert trust reviews"
on public.trust_reviews for insert
to authenticated
with check (
  (company_id is not null and public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]))
  or (trust_profile_id is not null and exists (
    select 1 from public.trust_profiles tp
    where tp.id = trust_profile_id
    and public.has_practice_role(tp.practice_id, array['owner','admin','member']::public.practice_role[])
  ))
);

create policy "owners admins members can update trust reviews"
on public.trust_reviews for update
to authenticated
using (
  (company_id is not null and public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]))
  or (trust_profile_id is not null and exists (
    select 1 from public.trust_profiles tp
    where tp.id = trust_profile_id
    and public.has_practice_role(tp.practice_id, array['owner','admin','member']::public.practice_role[])
  ))
)
with check (
  (company_id is not null and public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]))
  or (trust_profile_id is not null and exists (
    select 1 from public.trust_profiles tp
    where tp.id = trust_profile_id
    and public.has_practice_role(tp.practice_id, array['owner','admin','member']::public.practice_role[])
  ))
);

create policy "owners admins can delete trust reviews"
on public.trust_reviews for delete
to authenticated
using (
  (company_id is not null and public.has_company_role(company_id, array['owner','admin']::public.practice_role[]))
  or (trust_profile_id is not null and exists (
    select 1 from public.trust_profiles tp
    where tp.id = trust_profile_id
    and public.has_practice_role(tp.practice_id, array['owner','admin']::public.practice_role[])
  ))
);
