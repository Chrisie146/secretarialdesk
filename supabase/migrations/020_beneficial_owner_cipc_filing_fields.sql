alter table public.beneficial_owners
add column if not exists date_of_birth date,
add column if not exists address text,
add column if not exists email text,
add column if not exists nationality_status text not null default 'unknown'
  check (nationality_status in ('south_african', 'foreign_national', 'unknown')),
add column if not exists country_of_birth text,
add column if not exists passport_issuing_country text,
add column if not exists verification_status text not null default 'not_required'
  check (verification_status in ('not_required', 'required', 'submitted', 'verified')),
add column if not exists verification_document_id uuid references public.documents(id) on delete set null,
add column if not exists interest_held text not null default 'direct'
  check (interest_held in ('direct', 'indirect', 'direct_and_indirect', 'control')),
add column if not exists last_changed_at timestamptz not null default now(),
add column if not exists cipc_filing_due_date date,
add column if not exists cipc_filing_status text not null default 'not_started'
  check (cipc_filing_status in ('not_started', 'ready', 'filed', 'overdue'));

create index if not exists beneficial_owners_cipc_due_date_idx
on public.beneficial_owners(cipc_filing_due_date);
