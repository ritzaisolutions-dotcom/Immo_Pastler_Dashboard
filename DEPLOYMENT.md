# Deployment — Pastler Dashboard

**Supabase:** Shared with Haller — project `htyeflqymmbcjhvknjoe` (eu-central-1).  
Pastler tables are prefixed: `pastler_inserate`, `pastler_mieter`, `pastler_todos`, `pastler_emails`.

## Vercel Setup

1. Project: `immo-pastler-dashboard` on Vercel
2. Set environment variables in [Vercel dashboard](https://vercel.com/ritzaisolutions-6158s-projects/immo-pastler-dashboard/settings/environment-variables):

| Variable | Scope |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | All (`https://htyeflqymmbcjhvknjoe.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** |
| `NEXT_PUBLIC_SITE_URL` | Production: `https://immo-pastler-dashboard.vercel.app` |

3. Redeploy after setting env vars: `vercel deploy --prod`

## Supabase Auth

Supabase → Authentication → URL Configuration:

- **Site URL:** `https://immo-pastler-dashboard.vercel.app`
- **Redirect URLs:** `https://immo-pastler-dashboard.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`

Use the same staff login as the Haller dashboard.

## Pre-Release Scan

```bash
git grep -i "eyJ\|service_role\|sk_live" -- "*.ts" "*.tsx" "*.js" "*.json"
grep -rn "console.log" app/
npm run build
npm run type-check
npm audit --audit-level=high
```

## Tag Release

```bash
git tag v1.0.0-dashboard
git push origin main --tags
```
