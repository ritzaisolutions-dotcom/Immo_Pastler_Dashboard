# Supabase Setup — Pastler Dashboard

## 1. Create Project

- **Region:** `eu-central-1` (Frankfurt) — mandatory for DSGVO
- **Name:** Pastler Dashboard

## 2. Run Migrations

In Supabase SQL Editor, run in order:

1. [`supabase/schema.sql`](./schema.sql) — tables + RLS
2. [`supabase/seed.sql`](./seed.sql) — test data

## 3. Verify RLS

```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

All 4 tables must show `rowsecurity = true`.

## 4. Create Auth Users

### Mitarbeiter (internal staff)

Create user in Supabase Auth → Users → Add user.

Set **App Metadata:**
```json
{ "role": "mitarbeiter" }
```

### Eigentümer (optional test)

Use email matching seed data, e.g. `hans.mueller@example.com`.

## 5. Environment Variables

Copy from Supabase → Settings → API:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 6. Auth Configuration

Supabase → Authentication → URL Configuration:

- **Site URL:** production domain (or `http://localhost:3000` for dev)
- **Redirect URLs:** add `/auth/callback`

For internal tool: disable email confirmations.

## 7. Security Verification

- Anon key + REST API → `inserate` returns 0 rows (RLS)
- Anon key + REST API → `emails` returns 0 rows (no policy)
- Project region shows `eu-central-1` in database host URL
