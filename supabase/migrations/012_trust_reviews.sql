create table if not exists public.trust_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.company_profiles(id) on delete cascade,
  shareholder_id uuid references public.shareholders(id) on delete cascade,
  trustees jsonb not null default '[]'::jsonb,
  beneficiaries jsonb not null default '[]'::jsonb,
  founders jsonb not null default '[]'::jsonb,
  controllers jsonb not null default '[]'::jsonb,
  notes text,
  reviewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists trust_reviews_company_id_idx on public.trust_reviews(company_id);
create index if not exists trust_reviews_shareholder_id_idx on public.trust_reviews(shareholder_id);

alter table public.trust_reviews enable row level security;

drop policy if exists "members can view trust reviews" on public.trust_reviews;
drop policy if exists "members can manage trust reviews" on public.trust_reviews;

create policy "members can view trust reviews"
on public.trust_reviews for select
to authenticated
using (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
);

create policy "members can manage trust reviews"
on public.trust_reviews for all
to authenticated
using (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.company_profiles cp
    join public.practice_memberships pm on pm.practice_id = cp.practice_id
    where cp.id = company_id
      and pm.user_id = auth.uid()
  )
);
