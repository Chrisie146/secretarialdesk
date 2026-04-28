-- Run this after the initial schema if you want browser PDF uploads.
-- In Supabase Storage, create a private bucket named: company-documents

insert into storage.buckets (id, name, public)
values ('company-documents', 'company-documents', false)
on conflict (id) do nothing;

create policy "practice members can upload company documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'company-documents'
  and exists (
    select 1
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
      and pm.practice_id::text = split_part(name, '/', 1)
  )
);

create policy "practice members can read company documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'company-documents'
  and exists (
    select 1
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
      and pm.practice_id::text = split_part(name, '/', 1)
  )
);

create policy "practice members can update company documents"
on storage.objects for update
to authenticated
using (
  bucket_id = 'company-documents'
  and exists (
    select 1
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
      and pm.practice_id::text = split_part(name, '/', 1)
  )
)
with check (
  bucket_id = 'company-documents'
  and exists (
    select 1
    from public.practice_memberships pm
    where pm.user_id = auth.uid()
      and pm.practice_id::text = split_part(name, '/', 1)
  )
);
