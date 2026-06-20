# Deployment — Pastler Dashboard

## Vercel Setup

1. Push `main` to `https://github.com/ritzaisolutions-dotcom/Immo_Pastler_Dashboard`
2. Connect Vercel project to the GitHub repo
3. Set environment variables in Vercel dashboard (NOT in `vercel.json`):

| Variable | Scope |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** |
| `NEXT_PUBLIC_SITE_URL` | All (production domain) |

4. Deploy from `main`

## Post-Deploy

1. Supabase Auth → URL Configuration → Site URL = Vercel production domain
2. Add redirect URL: `https://<domain>/auth/callback`
3. Use Supabase **pooler** connection URL in production
4. Smoke test: login → todos → status toggle → logout

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
