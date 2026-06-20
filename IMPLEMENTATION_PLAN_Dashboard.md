# IMPLEMENTATION PLAN — Pastler Dashboard
**10 Steps. One at a time. Security audit before every commit.**

---

## Rule

```
Complete step → npm run build → run checklist → fix → commit → next step
```

Never skip the audit. Never combine steps. Every commit is one step.

---

## STEP 0 — Project Init
⏱ ~30 min

### Tasks
```bash
cd "C:\RAIS_VAULT\RAIS\Demos\Pastler Immobilienberatung\01_dashboard"
git clone https://github.com/ritzaisolutions-dotcom/Immo_Pastler_Dashboard.git .
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
npm install @supabase/ssr @supabase/supabase-js
```
- [ ] Copy `CLAUDE_Dashboard.md`, `BRAND.md`, `IMPLEMENTATION_PLAN_Dashboard.md` to project root
- [ ] Add brand tokens to `tailwind.config.ts` (see BRAND.md — colours + fonts)
- [ ] Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`
- [ ] Create folder `app/(dashboard)/` and `app/login/`

### Security Audit ✓
- [ ] `.env.local` is in `.gitignore` — `git status` does not show it
- [ ] `SUPABASE_SERVICE_ROLE_KEY` has no `NEXT_PUBLIC_` prefix anywhere in the repo
- [ ] `npm audit --audit-level=high` — zero HIGH or CRITICAL
- [ ] `npm run build` passes

### Commit
```bash
git add . && git commit -m "step(0): project init, tailwind brand tokens, supabase deps"
```

---

## STEP 1 — Supabase: Schema + RLS
⏱ ~1.5h

### Tasks
- [ ] Create Supabase project — **Region: eu-central-1 (Frankfurt) — non-negotiable**
- [ ] Run the 4-table SQL from `CLAUDE_Dashboard.md` in the Supabase SQL editor
- [ ] Immediately run `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all 4 tables
- [ ] Add all 3 RLS policies from `CLAUDE_Dashboard.md`
- [ ] Verify with: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
- [ ] Insert manual test data: 2 Inserate, 3 Mieter, 5 Todos (Supabase Table Editor)
- [ ] Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` into `.env.local`

### Security Audit ✓
- [ ] All 4 tables show `rowsecurity = TRUE` in the SQL query above
- [ ] Anon key cannot SELECT from `inserate` — test in Supabase REST API explorer → must return 0 rows (not an error, just empty due to RLS)
- [ ] Anon key cannot SELECT from `emails` — no policy exists → empty result
- [ ] Supabase project region shows `eu-central-1` in Settings → Database → Host URL
- [ ] `npm run build` passes

### Commit
```bash
git commit -m "step(1): supabase schema, rls enabled all tables, test data" --allow-empty
```

---

## STEP 2 — Auth: Middleware + Login Page
⏱ ~1.5h

### Tasks
- [ ] Create `utils/supabase/server.ts` using `createServerClient` from `@supabase/ssr`
- [ ] Create `utils/supabase/client.ts` using `createBrowserClient` from `@supabase/ssr`
- [ ] Create `middleware.ts` at project root — refreshes session, redirects unauthenticated users from `(dashboard)` routes to `/login`
- [ ] Create `app/login/page.tsx` — Client Component, email + password fields, calls `supabase.auth.signInWithPassword()`
- [ ] On success → `router.push('/dashboard')`
- [ ] On error → show "Ungültige Anmeldedaten" (same message for wrong email AND wrong password)
- [ ] Create `app/auth/callback/route.ts` — handles Supabase auth redirect

```typescript
// middleware.ts matcher — protect dashboard routes only
export const config = {
  matcher: ['/(dashboard)/:path*', '/dashboard/:path*'],
};
```

### Security Audit ✓
- [ ] Open incognito → navigate to `/dashboard` → must redirect to `/login` (not a 404 or 500)
- [ ] Wrong email and wrong password return the **same** error message — no user enumeration
- [ ] Session cookie in DevTools → Application → Cookies: must be `HttpOnly` and `Secure`
- [ ] Supabase Auth → Email → "Enable email confirmations" is configured intentionally (disable for internal tool, enable for Eigentümer portal)
- [ ] `npm run build` passes

### Commit
```bash
git add . && git commit -m "step(2): auth middleware, login page, session handling, callback route"
```

---

## STEP 3 — Dashboard Layout + Sidebar
⏱ ~1h

### Tasks
- [ ] Create `app/(dashboard)/layout.tsx`
  - Navy sidebar `240px` fixed width
  - Logo: `PASTLER.` in Playfair Display + gold period
  - Nav items: Dashboard, Todos, Mieter, Inserate — with active state (gold left border + gold text)
  - Logout button at bottom → calls `supabase.auth.signOut()` + redirect to `/login`
  - Content area: fluid, `--warm-white` background
- [ ] Apply Inter font to sidebar nav items, Playfair Display to logo only (see BRAND.md)

### Security Audit ✓
- [ ] Logout button: clicking it destroys the session — verify in DevTools that the `sb-*` cookie is cleared after click
- [ ] After logout, pressing browser back button → redirects to `/login` (session is actually gone, not just hidden)
- [ ] Sidebar renders no user data other than what's needed for navigation
- [ ] `npm run build` passes

### Commit
```bash
git add . && git commit -m "step(3): dashboard layout, navy sidebar, nav items, logout"
```

---

## STEP 4 — Dashboard Page (KPI Overview)
⏱ ~1.5h

### Tasks
- [ ] Create `app/(dashboard)/dashboard/page.tsx` — Server Component
- [ ] Four parallel Supabase queries (use `Promise.all`):
  1. `COUNT` todos WHERE `status = 'offen'`
  2. `COUNT` todos WHERE `prioritaet = 'hoch'` AND `status != 'erledigt'`
  3. `COUNT` todos WHERE `faellig_at = CURRENT_DATE`
  4. `COUNT` mieter WHERE `status = 'aktiv'`
- [ ] Metric cards: large number (Playfair Display 38px), label below (Inter 12px, muted)
- [ ] Recent Todos list: last 10 by `created_at DESC` — show Titel, Kategorie badge, Priorität badge, Fälligkeit

### Security Audit ✓
- [ ] All 4 Supabase queries use the **session-scoped server client** (not service role)
- [ ] RLS is filtering: log in as a test Eigentümer → KPI numbers must reflect only their inserate data, not the full database
- [ ] No `emails.inhalt_text` is fetched or rendered anywhere on this page
- [ ] `npm run build` passes

### Commit
```bash
git add . && git commit -m "step(4): dashboard kpi cards, recent todos list, server component"
```

---

## STEP 5 — Todos Page + Inline Status Toggle
⏱ ~2.5h

### Tasks
- [ ] Create `app/(dashboard)/todos/page.tsx` — Server Component, reads `?kategorie=`, `?status=`, `?prioritaet=` from URL params → passes to Supabase `.eq()` filter
- [ ] Create `components/TodoFilterBar.tsx` — Client Component, updates URL params on dropdown change (no page reload needed — `router.push` with updated searchParams)
- [ ] Create `components/TodoCard.tsx` — shows Titel, Beschreibung, Kategorie badge, Priorität badge, Fälligkeit, linked Mieter name (if any)
- [ ] Inline status toggle on each card — calls PATCH `/api/todos/[id]`
- [ ] Create `app/api/todos/[id]/route.ts` — PATCH handler:
  1. Get session → 401 if no session
  2. SELECT todo (RLS filters) → 404 if not found or not owned
  3. Validate `status` is one of: `offen`, `in_bearbeitung`, `erledigt`, `abgelehnt`
  4. UPDATE `status` + set `erledigt_at = NOW()` if status = `erledigt`, else `NULL`

### Security Audit ✓
- [ ] PATCH without auth cookie → 401 (test with `curl -X PATCH /api/todos/some-id`)
- [ ] PATCH with valid auth but wrong todo ID (another user's) → 404 not 403 (don't leak existence)
- [ ] Sending `{ status: "INJECTED" }` → rejected by Supabase CHECK constraint (test this directly)
- [ ] `erledigt_at` is set server-side — sending a custom timestamp in the body must be ignored
- [ ] Filter bar URL params are passed as Supabase parameterised filters — no string concatenation into SQL
- [ ] `npm run build` passes

### Commit
```bash
git add . && git commit -m "step(5): todos page, url-param filters, inline status toggle, patch api"
```

---

## STEP 6 — Mieter Page
⏱ ~1.5h

### Tasks
- [ ] Create `app/(dashboard)/mieter/page.tsx` — Server Component
- [ ] Fetch all Mieter with `inserat_id` joined to get `inserate.adresse` + `inserate.stadt`
- [ ] For each Mieter: also fetch count of todos WHERE `mieter_id = mieter.id` AND `status != 'erledigt'`
- [ ] Display: Name, E-Mail, Inserat-Adresse + Einheit, Status badge, open Todos count badge
- [ ] Search: URL param `?q=` → Supabase `.ilike('name', '%${q}%')` — not client-side filter
- [ ] Clicking a row: link to `/todos?mieter_id={id}` (add `mieter_id` filter to todos page in step 5 if not already done)

### Security Audit ✓
- [ ] Mieter list is RLS-filtered — Eigentümer sees only mieter linked to their inserate
- [ ] Search param `?q=` is passed to Supabase `.ilike()` — not interpolated into a raw query string
- [ ] E-mail addresses rendered as plain text, NOT as `<a href="mailto:...">` links (prevents accidental data export)
- [ ] `npm run build` passes

### Commit
```bash
git add . && git commit -m "step(6): mieter list, inserat join, open todos badge, url search"
```

---

## STEP 7 — Inserate List + Detail Page
⏱ ~2h

### Tasks
- [ ] Create `app/(dashboard)/inserate/page.tsx` — Server Component
  - List all inserate: Adresse, Typ badge, Mieter count, open Todos count
- [ ] Create `app/(dashboard)/inserate/[id]/page.tsx` — Server Component
  - Three sections:
    1. Eigentümer info (name, email)
    2. Mieter table for this inserat
    3. Statusboard: todos split into three columns by `kategorie` (extern / mieter / intern)
  - Each todo card in the statusboard shows status badge + drag-to-update or click-to-update

### Security Audit ✓
- [ ] GET `/inserate/{random-uuid}` while logged out → redirect to `/login` (middleware handles)
- [ ] GET `/inserate/{valid-uuid-owned-by-another-user}` while logged in → page renders but ALL sections empty (RLS returns 0 rows) — no error exposed, no 500
- [ ] `eigentuemer_email` is visible on detail page — confirm it shows only the email of the Eigentümer whose inserat this is, not all Eigentümer emails
- [ ] `emails.inhalt_text` does NOT appear anywhere in the detail page (todos show only `titel` and `beschreibung`)
- [ ] `npm run build` passes

### Commit
```bash
git add . && git commit -m "step(7): inserate list, detail page, statusboard by kategorie"
```

---

## STEP 8 — n8n Email Workflow
⏱ ~3h

### Tasks (in n8n at n8n.ritz-ai.solutions)

- [ ] **Node 1 — IMAP Trigger:** configure Pastler IMAP credentials (in n8n Credentials, not hardcoded). Poll: every 5 min. Mark as read: yes.
- [ ] **Node 2 — Supabase getAll:** `emails` WHERE `message_id = {{ $json.messageId }}` → returns array
- [ ] **Node 3 — IF:** `{{ $json.length > 0 }}` → true branch = Stop (NoOp); false branch = continue
- [ ] **Node 4 — Supabase insert:** `emails` table — map `message_id`, `von_email`, `von_name`, `betreff`, `inhalt_text`, `empfangen_at`
- [ ] **Node 5 — Supabase getAll:** `mieter` WHERE `email = {{ $('Node 4').item.json.von_email }}`
- [ ] **Node 6 — LLM Chain:** Mistral `small-latest`, `continueOnFail: true`. Prompt:
```
Du bist Assistent einer deutschen Hausverwaltung. Analysiere diese E-Mail.

Von: {{ $('Node 4').item.json.von_email }}
Betreff: {{ $('Node 4').item.json.betreff }}
Inhalt: {{ $('Node 4').item.json.inhalt_text }}

Antworte NUR mit validem JSON, kein Markdown, keine Erklärung:
{
  "titel": "Kurztitel max. 80 Zeichen",
  "beschreibung": "Was ist zu tun",
  "kategorie": "extern",
  "prioritaet": "mittel",
  "faellig_at": null
}
Regeln — kategorie: extern/mieter/intern. prioritaet: hoch/mittel/niedrig. faellig_at: YYYY-MM-DD oder null.
```
- [ ] **Node 7 — Code Node:** JSON parse + fallback (see `CLAUDE_Dashboard.md`)
- [ ] **Node 8 — Supabase insert:** `todos` table — map all fields from Node 7 output
- [ ] **Node 9 — Supabase update:** `emails` SET `verarbeitet = true` WHERE `id = {{ $('Node 4').item.json.id }}`
- [ ] **Node 10 (optional) — IF hoch + Telegram:** IF `{{ $json.prioritaet === 'hoch' }}` → `sendMessage` to Pastler Mitarbeiter Telegram

Additionally:
- [ ] Create a **separate n8n Cron Workflow** (runs daily at 02:00): `UPDATE emails SET inhalt_text = NULL WHERE created_at < NOW() - INTERVAL '90 days'`

### Security Audit ✓
- [ ] IMAP credentials are stored in **n8n Credentials vault** — not visible in the workflow JSON export
- [ ] n8n instance is only reachable via HTTPS (test: `http://n8n.ritz-ai.solutions` redirects to `https://`)
- [ ] The Supabase connection in n8n uses the **service role key** — this is correct (n8n is a server-side process)
- [ ] Run the workflow twice with the same email → second run must produce NO duplicate in `emails` (`message_id` UNIQUE constraint rejects it — verify in n8n execution log, should show a Supabase error that is caught and stopped by the IF node)
- [ ] `continueOnFail: true` on Node 6 — disable Mistral credentials temporarily → workflow must still reach Node 9 with fallback values
- [ ] 90-day cron workflow is ACTIVE and has run at least once (check executions log)
- [ ] Telegram alert (if enabled) does NOT include `inhalt_text` — only `titel`, `beschreibung`, `kategorie`, `prioritaet`

### Commit
```bash
git commit -m "step(8): n8n imap workflow 9 nodes, mistral prompt, 90d cron, telegram alert" --allow-empty
```

---

## STEP 9 — Dashboard Deployment
⏱ ~1h

### Tasks
- [ ] Push `main` branch to GitHub
- [ ] Connect Vercel to `ritzaisolutions-dotcom/Immo_Pastler_Dashboard`
- [ ] Set env vars in Vercel dashboard (NOT in `vercel.json`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`
- [ ] Run first deployment
- [ ] Update Supabase Auth → URL Configuration → Site URL = Vercel production domain
- [ ] Test full flow on production: login → view todos → status toggle → logout

### Security Audit ✓
- [ ] Vercel env vars: `SUPABASE_SERVICE_ROLE_KEY` must be set as **"Server-only"** (not exposed to browser runtime) — verify in Vercel → Settings → Environment Variables
- [ ] `NEXT_PUBLIC_` vars reviewed: must contain ONLY Supabase URL, anon key, site URL
- [ ] Security headers set in `next.config.ts`:
```typescript
async headers() {
  return [{ source: '/(.*)', headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ]}];
}
```
- [ ] HTTPS enforced: `http://` URL auto-redirects to `https://` (Vercel default — verify)
- [ ] `git grep -r "console.log" app/` — must return nothing
- [ ] `npm audit --audit-level=high` — zero findings
- [ ] Supabase connection uses the **pooler** URL for the production environment (avoids connection exhaustion)

### Commit + Tag
```bash
git tag v1.0.0-dashboard
git push origin main --tags
```

---

## Final Security Scan (Run Before Every Release)

```bash
# 1. No secrets committed
git grep -i "eyJ\|service_role\|sk_live" -- "*.ts" "*.tsx" "*.js" "*.json"

# 2. No console.log
grep -rn "console.log" app/ --include="*.ts" --include="*.tsx"

# 3. Clean build
npm run build

# 4. Types clean
npm run type-check

# 5. No high vulnerabilities
npm audit --audit-level=high
```

All five pass → safe to deploy.
