alter table public.document_analysis_jobs
drop constraint if exists document_analysis_jobs_analysis_type_check;

alter table public.document_analysis_jobs
add constraint document_analysis_jobs_analysis_type_check
check (analysis_type in ('company_onboarding', 'shareholder_intake', 'share_transfer', 'trust_deed'));
