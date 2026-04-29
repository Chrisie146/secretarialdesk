create table if not exists public.document_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  company_id uuid references public.company_profiles(id) on delete set null,
  document_id uuid references public.documents(id) on delete cascade,
  analysis_type text not null check (analysis_type in ('company_onboarding', 'shareholder_intake', 'share_transfer')),
  status text not null default 'queued' check (status in ('queued', 'analyzing', 'review_required', 'applied', 'failed')),
  extracted_data jsonb not null default '{}'::jsonb,
  reviewed_data jsonb not null default '{}'::jsonb,
  confidence_summary jsonb not null default '{}'::jsonb,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists document_analysis_jobs_practice_created_idx
on public.document_analysis_jobs(practice_id, created_at desc);

create index if not exists document_analysis_jobs_company_idx
on public.document_analysis_jobs(company_id);

create index if not exists document_analysis_jobs_document_idx
on public.document_analysis_jobs(document_id);

alter table public.document_analysis_jobs enable row level security;

drop policy if exists "members can view document analysis jobs" on public.document_analysis_jobs;
drop policy if exists "owners admins members can insert document analysis jobs" on public.document_analysis_jobs;
drop policy if exists "owners admins members can update document analysis jobs" on public.document_analysis_jobs;
drop policy if exists "owners admins can delete document analysis jobs" on public.document_analysis_jobs;

create policy "members can view document analysis jobs"
on public.document_analysis_jobs for select
to authenticated
using (public.is_practice_member(practice_id));

create policy "owners admins members can insert document analysis jobs"
on public.document_analysis_jobs for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[])
  and (company_id is null or public.is_company_practice_member(company_id))
);

create policy "owners admins members can update document analysis jobs"
on public.document_analysis_jobs for update
to authenticated
using (public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[]))
with check (
  public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[])
  and (company_id is null or public.is_company_practice_member(company_id))
);

create policy "owners admins can delete document analysis jobs"
on public.document_analysis_jobs for delete
to authenticated
using (public.has_practice_role(practice_id, array['owner','admin']::public.practice_role[]));

drop policy if exists "owners admins members can insert documents" on public.documents;
drop policy if exists "owners admins members can update documents" on public.documents;

create policy "owners admins members can insert documents"
on public.documents for insert
to authenticated
with check (
  public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[])
  and (company_id is null or public.is_company_practice_member(company_id))
);

create policy "owners admins members can update documents"
on public.documents for update
to authenticated
using (public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[]))
with check (
  public.has_practice_role(practice_id, array['owner','admin','member']::public.practice_role[])
  and (company_id is null or public.is_company_practice_member(company_id))
);
