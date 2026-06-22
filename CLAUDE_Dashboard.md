# CLAUDE.md — Pastler Dashboard (Internal Tool)

This file scopes Claude Code to the **internal dashboard only** (`app/(dashboard)/`).
For the public website, see `CLAUDE_Website.md`.

---

## What This Part Is

Protected internal tool for **Immobilienverwaltung Pastler UG** Mitarbeiter.
n8n reads Pastler's email inbox via IMAP → Mistral extracts action items → they appear here as Todos linked to Mieter and Inserate.

**DSGVO applies to every line of code here.** Personal data of private tenants is processed. EU data residency is non-negotiable.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, App Router, TypeScript, Tailwind CSS v4 |
| Database + Auth | Supabase Frankfurt — `eu-central-1` (MANDATORY region) |
| Email Ingestion | n8n self-hosted at `n8n.ritz-ai.solutions` via IMAP |
| LLM | Mistral `small-latest` — EU-hosted, DSGVO-compliant |
| Package | `@supabase/ssr` — NOT the deprecated `auth-helpers-nextjs` |

---

## Route Structure (Dashboard Scope Only)

```
app/
├── proxy.ts                        ← auth + rate-limit + Mitarbeiter-only routes (Node.js runtime)
├── login/page.tsx                  ← Supabase Auth UI
├── auth/callback/route.ts          ← Supabase redirect handler
├── api/
│   ├── todos/[id]/route.ts         ← PATCH status (Mitarbeiter)
│   ├── partner/…                   ← Partner CRUD (Mitarbeiter)
│   ├── inserate/…                  ← POST/PATCH + bild upload (Mitarbeiter)
│   └── mieter/…                    ← POST/PATCH (Mitarbeiter)
└── (dashboard)/
    ├── layout.tsx                  ← sidebar + content area
    ├── dashboard/page.tsx          ← KPI overview (Eigentümer: eingeschränkter Lesezugriff)
    ├── todos/page.tsx              ← todos, filter by URL params (mieter_id, inserat_id, …)
    ├── mieter/
    │   ├── page.tsx                ← tenant list
    │   ├── neu/                    ← create (Mitarbeiter)
    │   ├── [id]/page.tsx           ← profile + kategorie status board
    │   └── [id]/bearbeiten/        ← edit (Mitarbeiter)
    ├── inserate/
    │   ├── page.tsx                ← list with InseratAvatar
    │   ├── neu/                    ← create (Mitarbeiter)
    │   ├── [id]/page.tsx           ← profile header + status board + linked mieter
    │   └── [id]/bearbeiten/        ← edit + image upload (Mitarbeiter)
    ├── partner/…                   ← Partner CRUD (Mitarbeiter only)
    ├── emails/                       ← list + detail with inhalt_text (Mitarbeiter only)
    └── datenschutz/page.tsx
```

---

## Supabase Schema

All Pastler tables use the `pastler_` prefix (see `lib/supabase/tables.ts`). Migrations in `supabase/migrations/`.

```sql
CREATE TABLE pastler_inserate (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adresse           TEXT NOT NULL,
  plz               TEXT,
  stadt             TEXT,
  typ               TEXT CHECK (typ IN ('WEG','Mietsverwaltung','Sondereigentum')),
  eigentuemer_name  TEXT,
  eigentuemer_email TEXT,
  einheiten         INTEGER DEFAULT 1,
  notizen           TEXT,
  bild_url          TEXT,              -- public Supabase Storage URL (bucket pastler-inserate)
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pastler_mieter ( … );
CREATE TABLE pastler_emails ( … inhalt_text TEXT … );
CREATE TABLE pastler_todos ( … );
CREATE TABLE pastler_partner ( … );
CREATE TABLE pastler_partner_nachrichten ( … );
```

**Storage:** bucket `pastler-inserate` — public read; upload/update/delete only `app_metadata.role = mitarbeiter` (migration `009`).

---

## RLS Policies

```sql
-- Enable on all tables immediately after creation
ALTER TABLE inserate ENABLE ROW LEVEL SECURITY;
ALTER TABLE mieter   ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails   ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos    ENABLE ROW LEVEL SECURITY;

-- Mitarbeiter: full access (managed via Supabase Auth roles or allowed email list)
-- Eigentümer: filtered access via eigentuemer_email = auth.email()

CREATE POLICY "eigentümer_inserate" ON inserate
  FOR ALL USING (eigentuemer_email = auth.email());

CREATE POLICY "eigentümer_todos" ON todos
  FOR ALL USING (
    inserat_id IN (SELECT id FROM inserate WHERE eigentuemer_email = auth.email())
  );

CREATE POLICY "eigentümer_mieter" ON mieter
  FOR ALL USING (
    inserat_id IN (SELECT id FROM inserate WHERE eigentuemer_email = auth.email())
  );

-- emails: SELECT only for Mitarbeiter (migration 009); Eigentümer have NO policy → no access
-- inhalt_text shown only on /emails/[id] behind requireMitarbeiterPage()
```

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=           # safe to expose
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # safe to expose
SUPABASE_SERVICE_ROLE_KEY=          # SERVER ONLY — never NEXT_PUBLIC_
NEXT_PUBLIC_SITE_URL=               # Vercel production domain
```

---

## Auth Pattern

```typescript
// utils/supabase/server.ts — use in Server Components + Route Handlers
import { createServerClient } from '@supabase/ssr';

// utils/supabase/client.ts — use in Client Components only
import { createBrowserClient } from '@supabase/ssr';

// proxy.ts — refresh session, redirect to /login, Mitarbeiter-only for /partner, /emails, CRUD pages
// lib/require-mitarbeiter.ts — API + page guards (app_metadata.role = "mitarbeiter")
// lib/auth-roles.ts — isMitarbeiter(user)
```

---

## Todo Status Update API

```typescript
// app/api/todos/[id]/route.ts — PATCH
// 1. Get session → 401 if missing
// 2. Supabase SELECT todo by id (RLS auto-filters) → 404 if not found
// 3. Validate status is a valid ENUM value
// 4. UPDATE status + erledigt_at (server-side timestamp, not client-provided)
```

---

## n8n Workflow — Email → Todo Pipeline

18 nodes (see `n8n/workflows/pastler-email-to-todo.json`). Key points:

1. **IMAP Trigger** — poll every 5 min
2. **Duplicate check** — `message_id` exists → stop before LLM
3. **Supabase insert** → `pastler_emails`
4. **Mieter lookup** by `von_email`
5. **LLM Chain** — Mistral `small-latest`, `continueOnFail: true`
6. **Code Node** — JSON parse with regex fallback
7. **Supabase insert** → `pastler_todos`
8. **Update** `verarbeitet = true`
9. **IF hoch** → Telegram alert (title/priority only, no `inhalt_text`)

**Mistral prompt must end with:** `Antworte NUR mit validem JSON. Kein Markdown. Keine Erklärung.`

**JSON fallback in Code Node (node 6):**
```javascript
const raw = $input.first().json.text || $input.first().json.output || '';
let todo;
try {
  const m = raw.match(/\{[\s\S]*\}/);
  todo = JSON.parse(m ? m[0] : raw);
} catch {
  todo = { titel: 'Unbekanntes Anliegen', beschreibung: raw.slice(0,200),
           kategorie: 'intern', prioritaet: 'mittel', faellig_at: null };
}
const mieter = $('Mieter-Lookup').all()?.[0]?.json ?? null;
return [{ json: { ...todo, email_id: $('Raw Email').item.json.id,
  mieter_id: mieter?.id ?? null, inserat_id: mieter?.inserat_id ?? null }}];
```

---

## Code Rules

- All Supabase reads → Server Components (no client-side fetching for data)
- Client Components only for: todo status toggle, filter bar
- No `any`, no `as unknown as X`
- No `console.log` in any file
- All German UI strings — Sie-form
- `npm run build` must pass after every change

---

## Commands

```bash
npm run dev
npm run build         # must pass before every commit
npm run type-check    # tsc --noEmit
npm audit --audit-level=high
```

---

## Never Do

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Never show `pastler_emails.inhalt_text` to Eigentümer (RLS + UI guard)
- Never use `@supabase/auth-helpers-nextjs` (deprecated)
- Never create a Supabase table without an RLS policy
- Never allow a user to provide `erledigt_at` — always set server-side
