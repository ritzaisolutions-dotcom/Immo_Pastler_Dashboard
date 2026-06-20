# Supabase Setup — Pastler Dashboard (shared with Haller)

**Project:** `htyeflqymmbcjhvknjoe` (eu-central-1) — same instance as Haller IM24 dashboard.

Pastler uses **prefixed tables** so Haller data is untouched:

| Pastler | Haller (unchanged) |
|---------|-------------------|
| `pastler_inserate` | `inserate` (IS24) |
| `pastler_mieter` | `leads` |
| `pastler_todos` | `besichtigungsslots` |
| `pastler_emails` | — |

## RLS Policies (003 + 004)

Applied on `pastler_*` tables:

- **Eigentümer:** filtered by `eigentuemer_email = auth.email()`
- **Mitarbeiter:** full access via `app_metadata.role = 'mitarbeiter'`
- **pastler_emails:** no authenticated policy (service role / n8n only)

Broad `staff_* USING (true)` policies were removed (004) so Eigentümer filtering works per IMPLEMENTATION_PLAN Step 4 audit.

Migrations:

1. [`002_pastler_schema.sql`](./migrations/002_pastler_schema.sql)
2. [`003_pastler_rls_claude.sql`](./migrations/003_pastler_rls_claude.sql)
3. [`004_drop_staff_true_policies.sql`](./migrations/004_drop_staff_true_policies.sql)

## 2. Auth

Use the **same Supabase Auth users** as the Haller dashboard (staff login).

Supabase → Authentication → URL Configuration:

- **Site URL:** `https://immo-pastler-dashboard.vercel.app` (or `http://localhost:3000` for dev)
- **Redirect URLs:** add `/auth/callback` for each domain

## 3. Environment Variables

Copy from [`.env.example`](../.env.example) into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://htyeflqymmbcjhvknjoe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 4. Verify

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
-- Must include pastler_* AND original leads/inserate/besichtigungsslots
```
