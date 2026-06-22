# Audit-Arbeitsplan — Pastler Dashboard

**Security + DSGVO · Schritt für Schritt abarbeiten**

| | |
|---|---|
| **Stand** | 2026-06-20 |
| **Scope** | Dashboard (Vercel), Supabase `htyeflqymmbcjhvknjoe`, n8n, Mistral |
| **Hinweis** | Arbeitsgrundlage — keine Rechtsberatung |
| **Production** | https://immo-pastler-dashboard.vercel.app |

---

## Fortschritt (Übersicht)

| Phase | Thema | Status |
|-------|--------|--------|
| A | Kontext & Ist-Zustand | ✅ |
| B | Bereits umgesetzt (verifizieren) | ✅ Code/Doku |
| C | Deployment & Supabase | ☐ Preview-Env + Prod-Redeploy |
| D | Security-Tests | ✅ lokal / ☐ Prod nach Redeploy |
| E | RLS & Zugriffstests | ✅ Schema+Anon / ☐ Rollen manuell |
| F | n8n Workflows | ☐ manuell importieren |
| G | DSGVO organisatorisch | ☐ AV-Verträge, Team |
| H | Release & Abschluss | ☐ |

**Regel:** Ein Schritt erledigen → abhaken → nächster Schritt. Bei Fehlern: Befund-ID im [Anhang B](#anhang-b-befund-register) notieren.

---

## Phase A — Kontext (15 Min.)

### A1 Verantwortlicher

- [ ] **Verantwortlicher:** Immobilienverwaltung Pastler UG (haftungsbeschränkt)
- [ ] **Kontakt:** hausverwaltung@pastler.com · 0261 1349 4710
- [ ] **Öffentliche Website:** [pastler.com](https://pastler.com/) — eigene Datenschutzhinweise
- [ ] **Internes Dashboard:** `/datenschutz` im eingeloggten Bereich

### A2 System & Datenflüsse

```
Mitarbeiter/Eigentümer → Vercel (Next.js) → Supabase pastler_*
IMAP → n8n → pastler_emails → Mistral → pastler_todos
```

| Verarbeitung | Speicher | Wer sieht es? |
|--------------|----------|---------------|
| Mieter-PII | `pastler_mieter` | Mitarbeiter; Eigentümer (nur eigene Objekte, RLS) |
| Eigentümer-PII | `pastler_inserate` | wie oben |
| E-Mail-Volltext | `pastler_emails.inhalt_text` | **Mitarbeiter** (`/emails`, RLS migration 009); **nicht** Eigentümer; n8n Service Role |
| Todo-Extrakt | `pastler_todos.beschreibung` | Mitarbeiter; Eigentümer **nur Titel** (UI maskiert) |
| Auth | Supabase Cookie | eingeloggter User |

### A3 Getrennte Systeme

- [ ] **Pastler-Tabellen:** `pastler_inserate`, `pastler_mieter`, `pastler_todos`, `pastler_emails`
- [ ] **Haller-Tabellen (unberührt):** `inserate`, `leads`, `besichtigungsslots`
- [ ] Gleiche Supabase-Instanz — logische Trennung via Prefix + RLS dokumentiert

---

## Phase B — Bereits umgesetzt (verifizieren)

Diese Punkte sind im Code/Doku erledigt — einmal gegenprüfen und abhaken.

### B1 App-Security (Code)

- [x] Auth-Proxy für Dashboard-Routen (`proxy.ts`, Node.js-Runtime)
- [x] PATCH `/api/todos` → 401 ohne Session
- [x] Partner-Routen `/partner`, `/api/partner*` → 403 für Eigentümer, 401 ohne Session
- [x] Partner-Link in Sidebar nur für Mitarbeiter
- [x] Rate Limit: 30 PATCH/POST/DELETE/min/IP auf `/api/todos`, `/api/partner`, `/api/partner-nachrichten`, `/api/inserate`, `/api/mieter` (`lib/rate-limit-paths.ts` + `proxy.ts`)
- [x] Security-Headers: CSP, HSTS, X-Frame-Options (`next.config.ts`)
- [x] `inhalt_text` nur auf `/emails/[id]` für Mitarbeiter (`requireMitarbeiterPage` + RLS `mitarbeiter_select_pastler_emails`)
- [x] Kein `console.log` in `app/`
- [x] Keine Secrets in `.ts`/`.tsx` (git grep)
- [x] Eigentümer sehen keine Todo-`beschreibung` (`isMitarbeiter` in UI)
- [x] Seite `/datenschutz` in Sidebar verlinkt

### B2 Supabase-Schema (Migrationen)

- [x] `002` — Tabellen `pastler_*` + RLS enabled
- [x] `003` — Eigentümer- + Mitarbeiter-Policies
- [x] `004` — Broad `staff_* USING (true)` entfernt
- [x] `005a` — Eigentümer read-only SELECT (ehem. `005_retention_and_eigentuemer_readonly.sql`)
- [x] `005b` — Retention-Kommentare (ehem. `005_retention_policies.sql`)
- [x] `006` — Eigentümer read-only SELECT (Supabase angewendet)
- [x] `007` — Partner, Partner-Nachrichten, Todo-Erweiterungen (Supabase angewendet)
- [x] `008` — Retention-RPC für n8n ohne Postgres (Supabase angewendet)

### B3 Dokumentation (erstellt)

- [x] `docs/SECURITY_DSGVO_AUDIT.md` — Befundbericht
- [x] `docs/VERARBEITUNGSVERZEICHNIS.md`
- [x] `docs/AV_VERTRAEGE.md`
- [x] `docs/BETROFFENENRECHTE.md`
- [x] `docs/TOMs.md`
- [x] `docs/RLS_TEST.md`
- [x] `n8n/README.md` — Workflows 1–3 + Partner + Import + E2E-Test
- [x] `n8n/workflows/*.json` — importierbare Workflow-Dateien (Credentials Platzhalter)

### B4 Vercel Production

- [x] `NEXT_PUBLIC_SUPABASE_URL` — Production + Development
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Production + Development
- [x] `SUPABASE_SERVICE_ROLE_KEY` — Production (sensitive) + Development
- [x] `NEXT_PUBLIC_SITE_URL` — Production + Development
- [x] `vercel deploy --prod` erfolgreich
- [ ] Preview-Env für **alle** Git-Branches (optional, siehe Phase C1)

---

## Phase C — Deployment & Supabase (30–45 Min.)

### C1 Vercel — offene Env-Vars (Preview)

Im [Vercel Dashboard](https://vercel.com/ritzaisolutions-6158s-projects/immo-pastler-dashboard/settings/environment-variables) oder CLI:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` → Preview (alle Branches)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Preview
- [ ] `SUPABASE_SERVICE_ROLE_KEY` → Preview (sensitive)

Prüfen:

```bash
vercel env ls
```

### C2 Supabase Auth — URL-Konfiguration

Supabase → Authentication → URL Configuration:

- [ ] **Site URL:** `https://immo-pastler-dashboard.vercel.app`
- [ ] **Redirect URLs:**
  - `https://immo-pastler-dashboard.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

### C3 Supabase — Migrationen 005–008 ausführen

SQL Editor → nacheinander ausführen (falls noch nicht angewendet):

- [x] `supabase/migrations/005a_eigentumer_readonly.sql`
- [x] `supabase/migrations/005b_retention_policies.sql`
- [x] `supabase/migrations/006_eigentuemer_select_only.sql`
- [x] `supabase/migrations/007_partner_and_nachrichten.sql`
- [x] `supabase/migrations/008_retention_rpc.sql`

### C4 Supabase Admin — Zugriffskontrolle

- [ ] MFA für alle Supabase-Dashboard-Zugänge aktiviert
- [ ] Nur notwendige Personen haben Projekt-Admin
- [ ] Service-Role-Key **nur** in Vercel (server) + n8n — nirgends im Client

---

## Phase D — Security-Tests (20 Min.)

### D1 Automatisiert

```bash
cd "01_dashboard"
npm run audit:security
```

- [x] `npm run build` — grün (2026-06-21)
- [x] `npm run type-check` — grün
- [x] `npm audit --audit-level=high` — kein HIGH/CRITICAL (2× moderate postcss via next)
- [x] Secret-Scan — keine Treffer in Source
- [x] Anon-Key RLS — alle `pastler_*` Tabellen → `[]` (2026-06-21)
- [ ] Production API 401 — ✅ auf Team-URL; Kurz-Alias prüfen (siehe S19)

### D2 API ohne Auth

```bash
curl -X PATCH https://immo-pastler-dashboard.vercel.app/api/todos/00000000-0000-0000-0000-000000000001 \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"erledigt\"}"
```

- [ ] Antwort: **HTTP 401** (lokal OK; Production nach Redeploy prüfen)

### D3 Production Smoke

- [ ] https://immo-pastler-dashboard.vercel.app/login öffnet sich
- [ ] Login mit Mitarbeiter-Account → Dashboard
- [ ] `/todos` — Liste lädt
- [ ] Status-Toggle → speichert
- [ ] Abmelden → zurück zu `/login`
- [ ] Browser Zurück nach Logout → kein Zugriff ohne erneuten Login

### D4 Security-Headers (optional)

```bash
curl -I https://immo-pastler-dashboard.vercel.app/login
```

- [ ] `Strict-Transport-Security` vorhanden
- [ ] `Content-Security-Policy` vorhanden
- [ ] `X-Frame-Options: DENY`

---

## Phase E — RLS & Zugriffstests (30 Min.)

### E1 Schema-Check (SQL Editor)

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'pastler_%';
-- Erwartung: alle rowsecurity = true

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename LIKE 'pastler_%'
ORDER BY tablename, policyname;
```

- [x] Alle `pastler_*` haben RLS = true (2026-06-21, Supabase MCP)
- [x] Policies: `eigentümer_*`, `mitarbeiter_*` vorhanden
- [x] `pastler_partner` / `pastler_partner_nachrichten`: nur `mitarbeiter_*` (kein Eigentümer)
- [x] `pastler_emails`: **keine** authenticated Policy

### E2 Anon-Key (ohne Login)

```bash
curl "https://htyeflqymmbcjhvknjoe.supabase.co/rest/v1/pastler_inserate?select=id" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
```

Wiederholen für `pastler_mieter`, `pastler_todos`, `pastler_emails`.

- [x] Alle Antworten: `[]` (leer) — inkl. `pastler_partner`, `pastler_partner_nachrichten` (2026-06-21)

### E3 Eigentümer-Test

Test-User: `hans.mueller@example.com` (Seed in `supabase/seed.sql`)

- [ ] `/dashboard` — KPIs nur für **eigene** Inserate
- [ ] `/inserate` — nur eigene Objekte
- [ ] `/inserate/<fremde-uuid>` — leere Sections, **kein** 500
- [ ] Todos: **Titel** sichtbar, **Beschreibung ausgeblendet**, **kein Status-Toggle**

### E4 Mitarbeiter-Test

User mit `app_metadata.role = "mitarbeiter"` (Supabase Auth → User → Raw App Meta).

- [ ] Sieht alle Pastler-Datensätze
- [ ] Todo-**Beschreibung** sichtbar
- [ ] Status-PATCH funktioniert

### E5 Haller-Daten unberührt

```sql
SELECT COUNT(*) FROM inserate;  -- erwartet: 4
SELECT COUNT(*) FROM leads;     -- erwartet: 7
```

- [ ] Counts unverändert

### E6 Protokoll

| Datum | Tester | Anon | Eigentümer | Mitarbeiter | API 401 | Notizen |
|-------|--------|------|------------|-------------|---------|---------|
| 2026-06-21 | Agent | ✅ | ☐ | ☐ | ✅ lokal/Team-URL | Prod redeployed; proxy.ts |

---

## Phase F — n8n Workflows (45–60 Min.)

**Instanz:** https://n8n.ritz-ai.solutions  
**Doku:** `n8n/README.md`

### F1 Workflow 1 — E-Mail → Todo + Partner (15 Nodes)

**JSON:** `n8n/workflows/email-ingestion-partner.json`

- [ ] IMAP Trigger: Poll 5 min, Credentials nur im Vault
- [ ] Duplicate-Check via `message_id`
- [ ] Insert `pastler_emails` (service role)
- [ ] Mieter-Lookup `pastler_mieter`
- [ ] Mistral `small-latest`, `continueOnFail: true` — inkl. `use_case`, `gewerk`, `partner_noetig`
- [ ] Code Node: JSON-Fallback inkl. Partner-Felder; `gewerk` wird auf valide CHECK-Werte geprüft
- [ ] Insert `pastler_todos` — inkl. `gewerk` (Spalte via Migration 007 hinzugefügt)
- [ ] `verarbeitet = true` setzen
- [ ] IF `partner_noetig` → Partner-Lookup `pastler_partner` (aktiv, passendes Gewerk)
- [ ] LLM Partner-Entwurf → Insert `pastler_partner_nachrichten` status=`entwurf`
- [ ] Update `pastler_todos.partner_id`, `use_case`
- [ ] Test: gleiche E-Mail zweimal → **kein** Duplikat

### F1b Partner End-to-End (Dashboard)

- [ ] Partner anlegen unter `/partner/neu` (Gewerk z.B. `elektriker`)
- [ ] Test-E-Mail „Glühbirne defekt“ → Todo + Entwurf in DB
- [ ] `/todos`: Entwurf sichtbar, Senden/Bearbeiten/Ablehnen
- [ ] Kein passender Partner → Todo ohne Entwurf, kein Fehler
- [ ] Eigentümer: kein `/partner`, keine Entwürfe
- [ ] SMTP-Env in Vercel (`SMTP_*`) für Produktiv-Versand

### F2 Workflow 2 — 90-Tage Volltext-Löschung

**JSON:** `n8n/workflows/retention-90d.json`  
**Aufruf:** Supabase RPC `pastler_retention_purge_email_body_90d` (HTTP, Service Role — **kein Postgres in n8n**)

- [ ] Cron täglich 02:00 aktiv
- [x] Migration `008_retention_rpc.sql` angewendet
- [ ] RPC-Test per curl (siehe `n8n/README.md`)

### F3 Workflow 3 — Erweiterte Retention

**JSON:** `n8n/workflows/retention-extended.json`  
**Aufruf:** drei Supabase-RPC-Funktionen (HTTP, Service Role)

### F4 n8n Security & DSGVO

- [ ] IMAP-Credentials nur in n8n Vault
- [ ] Supabase Service Role nur serverseitig in n8n
- [ ] Execution-Log-Retention: **7–14 Tage** (Settings → Executions)
- [ ] n8n-Zugang nur für autorisierte Admins
- [ ] Telegram (optional): nur `titel`, `prioritaet` — **kein** `inhalt_text`

---

## Phase G — DSGVO organisatorisch (1–2 Std.)

### G1 Verarbeitungsverzeichnis (Art. 30)

Einträge in internes VV übernehmen (Vorlage: `docs/VERARBEITUNGSVERZEICHNIS.md`):

- [ ] **VV-1** Internes Dashboard (Mieter, Eigentümer, Todos)
- [ ] **VV-2** E-Mail-Ingestion → Todo-Automatisierung (+ Partner-Entwürfe)
- [ ] **VV-3** Benutzer-Authentifizierung
- [ ] **VV-4** Partner-Verwaltung & Partner-Kommunikation
- [ ] Trennung Haller/Pastler dokumentiert
- [ ] Rechtsgrundlagen mit Verantwortlichem bestätigt (Art. 6(1)(b) vs. (f))

### G2 Auftragsverarbeitung (Art. 28) — AV-Verträge

| Anbieter | DPA/AV | Status | Ablageort |
|----------|--------|--------|-----------|
| Supabase | [supabase.com/legal/dpa](https://supabase.com/legal/dpa) | ☐ | |
| Vercel | [vercel.com/legal/dpa](https://vercel.com/legal/dpa) | ☐ | |
| Mistral AI | Enterprise DPA | ☐ | |
| n8n (ritz-ai.solutions) | Mit Betreiber | ☐ | |
| IMAP-Provider | Provider-AV | ☐ | |
| Telegram (optional) | Prüfen | ☐ | |

**Pro Vertrag prüfen:**

- [ ] Verarbeitung nur auf Weisung
- [ ] Vertraulichkeit
- [ ] Unterauftragsverarbeiter gelistet
- [ ] Löschung nach Vertragsende
- [ ] Unterstützung Betroffenenanfragen
- [ ] TOMs referenziert
- [ ] Drittlandtransfer (SCC) dokumentiert falls relevant

### G3 Betroffenenrechte — Prozess etablieren

Kontakt: hausverwaltung@pastler.com · Frist: 1 Monat

- [ ] Interne Checkliste `docs/BETROFFENENRECHTE.md` im Team bekannt
- [ ] Auskunft (Art. 15): SQL-Vorlagen getestet
- [ ] Löschung (Art. 17): Reihenfolge Todos → Mieter → E-Mails verstanden
- [ ] Beschwerde-Hinweis: [lda.rlp.de](https://www.lda.rlp.de/)

**Auskunft Mieter (SQL-Vorlage):**

```sql
SELECT m.*, i.adresse, i.stadt
FROM pastler_mieter m
LEFT JOIN pastler_inserate i ON i.id = m.inserat_id
WHERE m.email ILIKE '%<email>%' OR m.name ILIKE '%<name>%';
```

**Löschung (SQL-Vorlage):**

```sql
DELETE FROM pastler_todos WHERE mieter_id = '<uuid>';
DELETE FROM pastler_mieter WHERE id = '<uuid>';
DELETE FROM pastler_emails WHERE von_email = '<email>';
```

### G4 Informationspflicht Mieter (organisatorisch)

- [ ] Hinweis in Mietvertrag / WEG-Unterlagen / E-Mail-Signatur geprüft
- [ ] Abgleich: öffentliche [Datenschutzhinweise pastler.com](https://pastler.com/datenschutzhinweise/) vs. Dashboard-Prozesse

### G5 TOMs dokumentiert

- [ ] `docs/TOMs.md` gelesen und als interne Referenz abgelegt
- [ ] Jährliche oder release-bezogene Wiederholung des Audits geplant

---

## Phase H — Release & Abschluss (15 Min.)

### H1 Final Scan

```bash
git grep -i "eyJ\|service_role\|sk_live\|sb_secret" -- "*.ts" "*.tsx" "*.js"
npm run build && npm run type-check
npm audit --audit-level=high
```

- [ ] Alles grün

### H2 Git Tag (optional)

```bash
git tag v1.0.0-dashboard
git push origin main --tags
```

- [ ] Tag gesetzt und gepusht

### H3 Abschluss-Protokoll

- [ ] Alle Phasen A–H abgehakt oder offene Punkte mit Verantwortlichem + Termin notiert
- [ ] Nächster Audit-Termin: _______________

---

## Anhang A — Retention-Matrix (Kurz)

| Daten | Max. Dauer | Mechanismus |
|-------|------------|-------------|
| `pastler_emails.inhalt_text` | 90 Tage | n8n Workflow 2 |
| E-Mail-Metadaten | 180d anonymisiert, 365d gelöscht | n8n Workflow 3 |
| `pastler_todos.beschreibung` (erledigt) | 365 Tage | n8n Workflow 3c |
| Mieter/Eigentümer-Stammdaten | Vertragslaufzeit + gesetzl. Fristen | manuell |
| Auth-Session | bis Logout | Supabase |

---

## Anhang B — Befund-Register

| ID | Schwere | Thema | Status | Erledigt am |
|----|---------|-------|--------|-------------|
| S1 | Hoch | Vercel Env-Vars | ✅ Prod+Dev / ☐ Preview | |
| S2 | Mittel | Security-Headers | ✅ Code | |
| S3 | Mittel | API Middleware 401 | ✅ Code | |
| S4 | Mittel | Rate Limiting PATCH | ✅ Code | |
| S5 | Niedrig | npm moderate (postcss) | ℹ️ Info | |
| S6–S7 | Info | Secrets / console.log | ✅ OK | |
| S8 | Mittel | Shared DB Haller — Admin MFA | ☐ manuell | |
| S9–S13 | Info | RLS Migrationen | ✅ Code | |
| S14 | — | Anon → leer | ✅ getestet 2026-06-21 | |
| S18 | **Hoch** | Prod Middleware crash | ✅ Fix | `middleware.ts` → `proxy.ts` (Node.js); Edge `__dirname`-Bug |
| S19 | Mittel | Kurz-Alias 404 | ☐ Vercel | `immo-pastler-dashboard.vercel.app` NOT_FOUND; Team-Alias OK |
| S15 | Hoch | n8n Workflow live | ☐ manuell | |
| S16 | Mittel | n8n Log-Retention | ☐ manuell | |
| S17 | Info | Telegram ohne Volltext | ☐ manuell | |
| D1 | — | Verantwortlicher `/datenschutz` | ✅ | |
| D2 | — | Verarbeitungsverzeichnis | ✅ Vorlage inkl. VV-4 | |
| D3 | — | E-Mail-Volltext nur Mitarbeiter | ✅ RLS 009 + `/emails` | Eigentümer ausgeschlossen |
| D4 | — | Retention 90/180/365 | ☐ n8n Cron | |
| D5 | — | TOMs | ✅ Doku | |
| D6 | — | AV-Verträge | ☐ einholen | |
| D7 | — | Drittlandtransfer | ☐ prüfen | |
| D8 | — | Betroffenenrechte-Prozess | ☐ Team einweisen | |
| D9 | — | Mieter-Information | ☐ organisatorisch | |
| D10 | Mittel | Eigentümer keine Beschreibung/Partner | ✅ UI + Middleware 403 | |
| D11 | — | Cookie-Hinweis | ✅ `/datenschutz` | |
| D12 | — | Haller/Pastler Trennung | ✅ Doku | |

---

## Anhang C — Wichtige Dateien & Links

| Was | Wo |
|-----|-----|
| Audit-Befundbericht | `docs/SECURITY_DSGVO_AUDIT.md` |
| Verarbeitungsverzeichnis | `docs/VERARBEITUNGSVERZEICHNIS.md` |
| AV-Checkliste | `docs/AV_VERTRAEGE.md` |
| Betroffenenrechte | `docs/BETROFFENENRECHTE.md` |
| TOMs | `docs/TOMs.md` |
| RLS-Tests | `docs/RLS_TEST.md` |
| n8n Workflows | `n8n/README.md` |
| Migrationen | `supabase/migrations/002`–`008` |
| Deploy-Anleitung | `DEPLOYMENT.md` |
| Audit-Script | `npm run audit:security` |
| Vercel Dashboard | https://vercel.com/ritzaisolutions-6158s-projects/immo-pastler-dashboard |
| Supabase Dashboard | https://supabase.com/dashboard/project/htyeflqymmbcjhvknjoe |
| n8n | https://n8n.ritz-ai.solutions |

---

## Änderungshistorie

| Datum | Änderung |
|-------|----------|
| 2026-06-21 | Audit-Fortsetzung: Partner-Zugriffskontrolle, erweitertes audit:security, RLS verifiziert, S18 Prod-Middleware |
