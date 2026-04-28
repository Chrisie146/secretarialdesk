-- Use this only on a fresh Supabase project or when you intentionally want
-- to remove the SecretarialDesk setup and run the initial migration again.

drop table if exists public.filing_packs cascade;
drop table if exists public.activity_log cascade;
drop table if exists public.follow_up_tasks cascade;
drop table if exists public.company_contacts cascade;
drop table if exists public.documents cascade;
drop table if exists public.beneficial_owners cascade;
drop table if exists public.shareholders cascade;
drop table if exists public.directors cascade;
drop table if exists public.company_profiles cascade;
drop table if exists public.practice_invitations cascade;
drop table if exists public.practice_memberships cascade;
drop table if exists public.practices cascade;

drop function if exists public.is_company_practice_member(uuid) cascade;
drop function if exists public.is_practice_member(uuid) cascade;
drop function if exists public.set_updated_at() cascade;

drop type if exists public.document_status cascade;
drop type if exists public.document_type cascade;
drop type if exists public.shareholder_type cascade;
drop type if exists public.compliance_status cascade;
drop type if exists public.company_type cascade;
drop type if exists public.practice_role cascade;
