# Multi-Client Live Runbook (Isolierte Stacks)

**Ziel:** Reproduzierbare Live-Rollouts für mehrere Kunden mit jeweils eigener Infrastruktur.  
**Mandantenmodell:** `isolated_per_client` (eigene Supabase + eigene Vercel + eigene n8n-Credentials je Kunde).

---

## 1) Was pro Kunde immer isoliert ist

| Bereich | Pro Kunde getrennt |
|---|---|
| App Runtime | Eigenes Vercel-Projekt |
| Datenbank | Eigenes Supabase-Projekt |
| Automation | Eigene n8n-Credentials (mind. IMAP, Supabase, Mistral) |
| Mailkanäle | Eigene IMAP/SMTP-Zugänge |
| Domain | Eigene Subdomain (z. B. `dashboard.<kunde>.de`) |
| Secrets | Eigene Keys, kein Reuse zwischen Kunden |

---

## 2) Standard-Variablen (Template)

Diese Platzhalter pro Kunde befüllen:

- `<CLIENT_SLUG>` (z. B. `pastler`, `kunde-x`)
- `<CLIENT_DOMAIN>` (z. B. `dashboard.pastler.com`)
- `<SUPABASE_PROJECT_REF>`
- `<SUPABASE_URL>`
- `<SUPABASE_ANON_KEY>`
- `<SUPABASE_SERVICE_ROLE_KEY>`
- `<MISTRAL_API_KEY>`
- `<SMTP_HOST>`, `<SMTP_PORT>`, `<SMTP_USER>`, `<SMTP_PASS>`, `<SMTP_FROM>`
- `<IMAP_HOST>`, `<IMAP_PORT>`, `<IMAP_USER>`, `<IMAP_PASS>`

Empfohlene Server-Only-Secrets in Vercel:

- `SUPABASE_SERVICE_ROLE_KEY`
- `MISTRAL_API_KEY`
- `SMTP_*`

---

## 3) Schrittfolge pro Kunde (reproduzierbar)

### Schritt 1 — Kunde anlegen

1. `<CLIENT_SLUG>` und `<CLIENT_DOMAIN>` festlegen.
2. Projektordner/Runbook-Kopie für den Kunden anlegen (nur Konfigurationswerte unterscheiden).

### Schritt 2 — Supabase Provisioning

1. Neues Supabase-Projekt erstellen.
2. Migrationen aus `supabase/migrations` vollständig ausrollen.
3. Auth URL Configuration setzen:
   - Site URL: `https://<CLIENT_DOMAIN>`
   - Redirect URL: `https://<CLIENT_DOMAIN>/auth/callback`
4. Mitarbeiter-User anlegen und `app_metadata.role = "mitarbeiter"` setzen.

### Schritt 3 — Vercel Provisioning

1. Neues Vercel-Projekt aus `main` deployen.
2. Domain/Subdomain verbinden (`<CLIENT_DOMAIN>`).
3. Env-Variablen setzen:
   - `NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_URL>`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>`
   - `SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>`
   - `MISTRAL_API_KEY=<MISTRAL_API_KEY>`
   - `SMTP_HOST=<SMTP_HOST>` / `SMTP_PORT=<SMTP_PORT>` / `SMTP_USER=<SMTP_USER>` / `SMTP_PASS=<SMTP_PASS>` / `SMTP_FROM=<SMTP_FROM>`
   - `NEXT_PUBLIC_SITE_URL=https://<CLIENT_DOMAIN>`
4. Redeploy auslösen.

### Schritt 4 — n8n Provisioning

1. Workflow(s) importieren:
   - Email Ingestion + Partner Draft
   - Retention 90d
   - Retention Extended
2. Credentials je Kunde setzen:
   - IMAP (`<IMAP_*>`)
   - Supabase (`<SUPABASE_URL>`, `<SUPABASE_SERVICE_ROLE_KEY>`)
   - Mistral (`<MISTRAL_API_KEY>`)
3. Workflow aktivieren und erste Execution prüfen.
4. Duplicate-Check robust halten: Code-Node **Normalize Message ID** vor Duplicate Check (Hash-Fallback, keine Betreff-Strings — siehe [`n8n/code/normalize-message-id.js`](../n8n/code/normalize-message-id.js)).

### Schritt 5 — Stammdaten initialisieren

Reihenfolge:

1. Vermieter
2. Inserate
3. Mieter
4. Partner

Hinweis: Demo-Seed nicht ungeprüft in echte Kundenproduktion übernehmen.

### Schritt 6 — End-to-End-Abnahme

1. Login als Mitarbeiter
2. UI-Routen prüfen (`/dashboard`, `/objekte`, `/mieter`, `/todos`, `/chat`)
3. Testmail an IMAP-Postfach senden
4. Verifizieren:
   - `pastler_emails` Eintrag
   - `pastler_todos` Eintrag
   - optional `pastler_partner_nachrichten` Entwurf
5. Partner-Mailversand via SMTP testen

---

## 4) Go/No-Go Gates pro Kunde

Alle Punkte müssen grün sein:

- [ ] `npm run build` erfolgreich
- [ ] `npm run type-check` erfolgreich
- [ ] Mitarbeiter-Login funktioniert auf Kundendomain
- [ ] Chat antwortet (Mistral-Key gültig)
- [ ] E-Mail-Ingestion (IMAP -> n8n -> Supabase) funktioniert
- [ ] Partner-Versand (SMTP) funktioniert
- [ ] Retention-Workflows aktiv
- [ ] Keine Secrets im Repo gelandet

---

## 5) Security + Ops Mindeststandard

### Secrets

- Keine echten Keys in Git.
- `.env.example` nur mit Platzhaltern.
- Credentials-Rotation dokumentieren (Supabase, SMTP, Mistral, n8n).

### Script-Hygiene

- Lokale Debug-/Patch-Skripte nicht in Produkt-Deploy übernehmen.
- Nur kuratierte Ops-Skripte versionieren.

### Rollback

Je Kunde dokumentieren:

- letzte stabile App-Commit SHA
- zuletzt erfolgreich angewendete Migration
- n8n Workflow-Version/Export

### Monitoring

- n8n Fehler-Executions Alarm
- Chat API 5xx Alarm
- SMTP Sendefehler Alarm
- täglicher Healthcheck (`/login`, `/dashboard` mit Session)

---

## 6) Einfache Instruction (für neue Kunden)

1. Erstelle neue Instanzen: Supabase + Vercel + n8n-Credentials für den Kunden.
2. Rolle Migrationen aus und setze Domain/Redirect URLs.
3. Trage alle kundenbezogenen Env-Variablen in Vercel ein.
4. Aktiviere n8n Workflows mit den Kunden-Credentials.
5. Lege Stammdaten an (Vermieter -> Inserate -> Mieter -> Partner).
6. Führe einen End-to-End-Test (Mail In -> Todo -> Partner-Mail Out) durch.
7. Schalte erst nach vollständiger Gate-Checkliste live.

---

## 7) Referenzen

- [docs/GO_LIVE_CHECKLISTE.md](./GO_LIVE_CHECKLISTE.md)
- [DEPLOYMENT.md](../DEPLOYMENT.md)
- [supabase/README.md](../supabase/README.md)
- [docs/MANUAL_ERSTTEST_INFRASTRUKTUR.md](./MANUAL_ERSTTEST_INFRASTRUKTUR.md)
