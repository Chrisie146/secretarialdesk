alter table public.filing_packs
add column if not exists submission_status text not null default 'not_submitted',
add column if not exists submitted_at date,
add column if not exists cipc_reference text,
add column if not exists submission_notes text;
