create policy "practice members can delete company documents"
on storage.objects for delete
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
