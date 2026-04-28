create extension if not exists pgcrypto;

create type public.practice_role as enum ('owner', 'admin', 'member');
create type public.company_type as enum ('Pty Ltd', 'Public Company', 'Non-Profit Company', 'Personal Liability Company');
create type public.compliance_status as enum ('Compliant', 'Due Soon', 'Action Required');
create type public.shareholder_type as enum ('natural_person', 'company', 'trust');
create type public.document_type as enum ('share_register', 'trust_deed', 'moi', 'mandate_to_file', 'cipc_filing_pack');
create type public.document_status as enum ('queued', 'analyzing', 'review_required', 'complete', 'failed');

create table public.practices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.practice_memberships (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.practice_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (practice_id, user_id)
);

create table public.practice_invitations (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  email text not null,
  role public.practice_role not null default 'member',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (practice_id, email)
);

create table public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  name text not null,
  registration_number text not null,
  company_type public.company_type not null default 'Pty Ltd',
  incorporation_date date,
  registered_address text,
  compliance_status public.compliance_status not null default 'Action Required',
  next_due_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (practice_id, registration_number)
);

create table public.directors (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  full_name text not null,
  id_number text,
  appointment_date date,
  resignation_date date,
  created_at timestamptz not null default now()
);

create table public.shareholders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  shareholder_type public.shareholder_type not null,
  name text not null,
  id_number text,
  registration_number text,
  ownership_percentage numeric(7,4) check (ownership_percentage >= 0 and ownership_percentage <= 100),
  is_trust boolean generated always as (shareholder_type = 'trust') stored,
  trust_deed_required boolean generated always as (shareholder_type = 'trust') stored,
  created_at timestamptz not null default now()
);

create table public.beneficial_owners (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  shareholder_id uuid references public.shareholders(id) on delete set null,
  full_name text not null,
  id_number text,
  ownership_percentage numeric(7,4) check (ownership_percentage >= 0 and ownership_percentage <= 100),
  control_basis text not null,
  notes text,
  exceeds_five_percent boolean generated always as (coalesce(ownership_percentage, 0) > 5) stored,
  created_at timestamptz not null default now()
);

create table public.trust_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  shareholder_id uuid references public.shareholders(id) on delete cascade,
  trustees jsonb not null default '[]'::jsonb,
  beneficiaries jsonb not null default '[]'::jsonb,
  founders jsonb not null default '[]'::jsonb,
  controllers jsonb not null default '[]'::jsonb,
  notes text,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.entity_ownership_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  shareholder_id uuid references public.shareholders(id) on delete cascade,
  owners jsonb not null default '[]'::jsonb,
  notes text,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  company_id uuid references public.company_profiles(id) on delete cascade,
  document_type public.document_type not null,
  file_path text,
  original_filename text,
  status public.document_status not null default 'queued',
  extracted_data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  full_name text not null,
  role text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.follow_up_tasks (
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

create table public.activity_log (
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

create table public.filing_packs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  generated_by uuid references auth.users(id) on delete set null,
  bo_register_pdf_path text,
  bo_register_csv_path text,
  mandate_pdf_path text,
  submission_status text not null default 'not_submitted',
  submitted_at date,
  cipc_reference text,
  submission_notes text,
  generated_at timestamptz not null default now()
);

create index company_profiles_practice_id_idx on public.company_profiles(practice_id);
create index practice_invitations_practice_id_idx on public.practice_invitations(practice_id);
create index company_profiles_status_idx on public.company_profiles(practice_id, compliance_status);
create index directors_company_id_idx on public.directors(company_id);
create index shareholders_company_id_idx on public.shareholders(company_id);
create index beneficial_owners_company_id_idx on public.beneficial_owners(company_id);
create index trust_reviews_company_id_idx on public.trust_reviews(company_id);
create index trust_reviews_shareholder_id_idx on public.trust_reviews(shareholder_id);
create index entity_ownership_reviews_company_id_idx on public.entity_ownership_reviews(company_id);
create index entity_ownership_reviews_shareholder_id_idx on public.entity_ownership_reviews(shareholder_id);
create index documents_practice_company_idx on public.documents(practice_id, company_id);
create index company_contacts_company_id_idx on public.company_contacts(company_id);
create index follow_up_tasks_company_id_idx on public.follow_up_tasks(company_id);
create index follow_up_tasks_status_due_idx on public.follow_up_tasks(company_id, status, due_date);
create index activity_log_practice_created_idx on public.activity_log(practice_id, created_at desc);
create index activity_log_company_created_idx on public.activity_log(company_id, created_at desc);
create index filing_packs_company_id_idx on public.filing_packs(company_id);

alter table public.practices enable row level security;
alter table public.practice_memberships enable row level security;
alter table public.practice_invitations enable row level security;
alter table public.company_profiles enable row level security;
alter table public.directors enable row level security;
alter table public.shareholders enable row level security;
alter table public.beneficial_owners enable row level security;
alter table public.trust_reviews enable row level security;
alter table public.entity_ownership_reviews enable row level security;
alter table public.documents enable row level security;
alter table public.company_contacts enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.activity_log enable row level security;
alter table public.filing_packs enable row level security;

create policy "members can view practices"
on public.practices for select
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
with check (auth.uid() is not null and created_by = auth.uid());

create policy "members can view memberships"
on public.practice_memberships for select
using (
  user_id = auth.uid()
  or practice_id in (
    select pm.practice_id
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
  )
);

create policy "users can create owner membership for their own practice"
on public.practice_memberships for insert
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

create policy "members can view invitations"
on public.practice_invitations for select
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

create policy "members can view companies"
on public.company_profiles for select
using (
  practice_id in (
    select pm.practice_id
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
  )
);

create policy "members can create companies"
on public.company_profiles for insert
with check (
  auth.uid() = created_by
  and practice_id in (
    select pm.practice_id
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
  )
);

create policy "members can update companies"
on public.company_profiles for update
using (
  practice_id in (
    select pm.practice_id
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
  )
)
with check (
  practice_id in (
    select pm.practice_id
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
  )
);

create policy "members can view directors"
on public.directors for select
using (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
);

create policy "members can manage directors"
on public.directors for all
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

create policy "members can view shareholders"
on public.shareholders for select
using (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
);

create policy "members can manage shareholders"
on public.shareholders for all
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

create policy "members can view beneficial owners"
on public.beneficial_owners for select
using (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
);

create policy "members can manage beneficial owners"
on public.beneficial_owners for all
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

create policy "members can view trust reviews"
on public.trust_reviews for select
using (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
);

create policy "members can manage trust reviews"
on public.trust_reviews for all
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

create policy "members can view entity ownership reviews"
on public.entity_ownership_reviews for select
using (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
);

create policy "members can manage entity ownership reviews"
on public.entity_ownership_reviews for all
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

create policy "members can view documents"
on public.documents for select
using (
  practice_id in (
    select pm.practice_id
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
  )
);

create policy "members can manage documents"
on public.documents for all
using (
  practice_id in (
    select pm.practice_id
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
  )
)
with check (
  practice_id in (
    select pm.practice_id
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
  )
);

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

create policy "members can view activity"
on public.activity_log for select
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

create policy "members can view filing packs"
on public.filing_packs for select
using (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
);

create policy "members can manage filing packs"
on public.filing_packs for all
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
