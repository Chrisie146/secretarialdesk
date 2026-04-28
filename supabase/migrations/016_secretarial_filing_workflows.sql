create table if not exists public.director_changes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  change_type text not null check (change_type in ('appointment', 'resignation', 'removal', 'details_correction')),
  existing_director_id uuid references public.directors(id) on delete set null,
  full_name text,
  id_number text,
  effective_date date,
  board_resolution_received boolean not null default false,
  signed_cor39_received boolean not null default false,
  submission_status text not null default 'draft' check (submission_status in ('draft', 'submitted', 'accepted', 'rejected')),
  cipc_reference text,
  notes text,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.share_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('transfer', 'allotment', 'cancellation')),
  from_shareholder_id uuid references public.shareholders(id) on delete set null,
  to_shareholder_id uuid references public.shareholders(id) on delete set null,
  to_shareholder_type public.shareholder_type,
  to_shareholder_name text,
  to_shareholder_id_number text,
  ownership_percentage numeric(7,4) not null check (ownership_percentage > 0 and ownership_percentage <= 100),
  share_class text not null default 'Ordinary',
  transaction_date date,
  consideration text,
  supporting_docs_received boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'approved', 'accepted', 'rejected')),
  notes text,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists director_changes_company_id_idx on public.director_changes(company_id);
create index if not exists director_changes_status_idx on public.director_changes(company_id, submission_status);
create index if not exists share_transactions_company_id_idx on public.share_transactions(company_id);
create index if not exists share_transactions_status_idx on public.share_transactions(company_id, status);

alter table public.director_changes enable row level security;
alter table public.share_transactions enable row level security;

drop policy if exists "members can view director changes" on public.director_changes;
drop policy if exists "owners admins members can manage director changes" on public.director_changes;
drop policy if exists "members can view share transactions" on public.share_transactions;
drop policy if exists "owners admins members can manage share transactions" on public.share_transactions;

create policy "members can view director changes"
on public.director_changes for select
to authenticated
using (public.is_company_practice_member(company_id));

create policy "owners admins members can manage director changes"
on public.director_changes for all
to authenticated
using (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]))
with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));

create policy "members can view share transactions"
on public.share_transactions for select
to authenticated
using (public.is_company_practice_member(company_id));

create policy "owners admins members can manage share transactions"
on public.share_transactions for all
to authenticated
using (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]))
with check (public.has_company_role(company_id, array['owner','admin','member']::public.practice_role[]));
