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
| Framework | Next.js 15, App Router, TypeScript, Tailwind CSS |
| Database + Auth | Supabase Frankfurt — `eu-central-1` (MANDATORY region) |
| Email Ingestion | n8n self-hosted at `n8n.ritz-ai.solutions` via IMAP |
| LLM | Mistral `small-latest` — EU-hosted, DSGVO-compliant |
| Package | `@supabase/ssr` — NOT the deprecated `auth-helpers-nextjs` |

---

## Route Structure (Dashboard Scope Only)

```
app/
├── middleware.ts                   ← protects ALL (dashboard) routes
├── login/page.tsx                  ← Supabase Auth UI
├── auth/callback/route.ts          ← Supabase redirect handler
└── (dashboard)/
    ├── layout.tsx                  ← navy sidebar + content area
    ├── dashboard/page.tsx          ← KPI overview
    ├── todos/page.tsx              ← all todos, filter by URL params
    ├── mieter/page.tsx             ← tenant list
    └── inserate/
        ├── page.tsx                ← property list
        └── [id]/page.tsx           ← property detail + status board
```

---

## Supabase Schema

```sql
CREATE TABLE inserate (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adresse           TEXT NOT NULL,
  plz               TEXT,
  stadt             TEXT,
  typ               TEXT CHECK (typ IN ('WEG','Mietsverwaltung','Sondereigentum')),
  eigentuemer_name  TEXT,
  eigentuemer_email TEXT,
  einheiten         INTEGER DEFAULT 1,
  notizen           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mieter (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inserat_id    UUID REFERENCES inserate(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  email         TEXT,
  telefon       TEXT,
  einheit_nr    TEXT,
  einzug_datum  DATE,
  auszug_datum  DATE,
  status        TEXT DEFAULT 'aktiv' CHECK (status IN ('aktiv','ausgezogen','gekuendigt')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emails (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    TEXT UNIQUE NOT NULL,
  von_email     TEXT NOT NULL,
  von_name      TEXT,
  betreff       TEXT,
  inhalt_text   TEXT,              -- nulled after 90 days by n8n cron
  empfangen_at  TIMESTAMPTZ NOT NULL,
  verarbeitet   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE todos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id      UUID REFERENCES emails(id) ON DELETE SET NULL,
  mieter_id     UUID REFERENCES mieter(id) ON DELETE SET NULL,
  inserat_id    UUID REFERENCES inserate(id) ON DELETE SET NULL,
  titel         TEXT NOT NULL,
  beschreibung  TEXT,
  kategorie     TEXT CHECK (kategorie IN ('extern','mieter','intern')),
  prioritaet    TEXT DEFAULT 'mittel' CHECK (prioritaet IN ('hoch','mittel','niedrig')),
  status        TEXT DEFAULT 'offen' CHECK (status IN ('offen','in_bearbeitung','erledigt','abgelehnt')),
  faellig_at    DATE,
  erledigt_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

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

-- emails: NO policy for authenticated users — service role only
-- Eigentümer must NEVER see inhalt_text
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

// middleware.ts — refresh session on every request, redirect to /login if none
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

9 nodes in order:

1. **IMAP Trigger** — poll every 5 min
2. **Supabase getAll** — check `message_id` exists → IF duplicate → stop
3. **Supabase insert** → `emails` table
4. **Supabase getAll** — find `mieter` by `von_email` (nullable)
5. **LLM Chain** — Mistral `small-latest`, `continueOnFail: true`
6. **Code Node** — JSON parse with regex fallback, merge mieter_id + inserat_id
7. **Supabase insert** → `todos` table
8. **Supabase update** → `emails.verarbeitet = true`
9. **IF hoch** → Telegram alert (optional)

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
- Never show `emails.inhalt_text` in any UI component
- Never use `@supabase/auth-helpers-nextjs` (deprecated)
- Never create a Supabase table without an RLS policy
- Never allow a user to provide `erledigt_at` — always set server-side
