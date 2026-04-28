drop policy if exists "members can view directors" on public.directors;
drop policy if exists "members can manage directors" on public.directors;
drop policy if exists "members can view shareholders" on public.shareholders;
drop policy if exists "members can manage shareholders" on public.shareholders;
drop policy if exists "members can view beneficial owners" on public.beneficial_owners;
drop policy if exists "members can manage beneficial owners" on public.beneficial_owners;
drop policy if exists "members can view documents" on public.documents;
drop policy if exists "members can manage documents" on public.documents;
drop policy if exists "members can view company contacts" on public.company_contacts;
drop policy if exists "members can manage company contacts" on public.company_contacts;
drop policy if exists "members can view follow up tasks" on public.follow_up_tasks;
drop policy if exists "members can manage follow up tasks" on public.follow_up_tasks;
drop policy if exists "members can view filing packs" on public.filing_packs;
drop policy if exists "members can manage filing packs" on public.filing_packs;

create policy "members can view directors"
on public.directors for select
to authenticated
using (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can manage directors"
on public.directors for all
to authenticated
using (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())))
with check (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can view shareholders"
on public.shareholders for select
to authenticated
using (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can manage shareholders"
on public.shareholders for all
to authenticated
using (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())))
with check (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can view beneficial owners"
on public.beneficial_owners for select
to authenticated
using (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can manage beneficial owners"
on public.beneficial_owners for all
to authenticated
using (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())))
with check (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can view documents"
on public.documents for select
to authenticated
using (exists (select 1 from public.practices p left join public.practice_memberships pm on pm.practice_id = p.id and pm.user_id = auth.uid() where p.id = practice_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can manage documents"
on public.documents for all
to authenticated
using (exists (select 1 from public.practices p left join public.practice_memberships pm on pm.practice_id = p.id and pm.user_id = auth.uid() where p.id = practice_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())))
with check (exists (select 1 from public.practices p left join public.practice_memberships pm on pm.practice_id = p.id and pm.user_id = auth.uid() where p.id = practice_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can view company contacts"
on public.company_contacts for select
to authenticated
using (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can manage company contacts"
on public.company_contacts for all
to authenticated
using (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())))
with check (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can view follow up tasks"
on public.follow_up_tasks for select
to authenticated
using (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can manage follow up tasks"
on public.follow_up_tasks for all
to authenticated
using (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())))
with check (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can view filing packs"
on public.filing_packs for select
to authenticated
using (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));

create policy "members can manage filing packs"
on public.filing_packs for all
to authenticated
using (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())))
with check (exists (select 1 from public.company_profiles cp left join public.practice_memberships pm on pm.practice_id = cp.practice_id and pm.user_id = auth.uid() left join public.practices p on p.id = cp.practice_id where cp.id = company_id and (pm.user_id = auth.uid() or p.created_by = auth.uid())));
