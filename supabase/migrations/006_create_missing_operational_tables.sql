create table if not exists public.company_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  full_name text not null,
  role text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.follow_up_tasks (
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

create table if not exists public.filing_packs (
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

create index if not exists company_contacts_company_id_idx on public.company_contacts(company_id);
create index if not exists follow_up_tasks_company_id_idx on public.follow_up_tasks(company_id);
create index if not exists follow_up_tasks_status_due_idx on public.follow_up_tasks(company_id, status, due_date);
create index if not exists filing_packs_company_id_idx on public.filing_packs(company_id);

alter table public.company_contacts enable row level security;
alter table public.follow_up_tasks enable row level security;
alter table public.filing_packs enable row level security;
