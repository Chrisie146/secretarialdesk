# SecretarialDesk

SaaS prototype for South African Chartered Accountants managing CIPC Beneficial Ownership compliance.

## Run Locally

```bash
npm install
npm run dev
```

## Supabase Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env`.
3. Fill in:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

4. Run `supabase/migrations/001_initial_schema.sql` in the Supabase SQL editor.
5. Run `supabase/storage_policies.sql` in the Supabase SQL editor to create the private `company-documents` bucket and access policies.
6. Restart the dev server.

The app will then use Supabase Auth, create the first practice workspace after signup, and store company profiles in `company_profiles`.

Do not paste API keys or service-role keys into chat or commit them to the repo.
