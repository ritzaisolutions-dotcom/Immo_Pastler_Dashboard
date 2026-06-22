# Go-Live-Checkliste — Pastler Dashboard

**Ziel:** Von der aktuellen Demo-Version zur **aktiven Produktion** für Immobilienverwaltung Pastler.  
**Ein Dokument** — alle Pflicht-Schritte mit Abhängigkeiten und Abhak-Listen.

| | |
|---|---|
| **Stand Code** | `main` auf GitHub → Vercel Auto-Deploy |
| **Demo-URL** | https://01dashboard-three.vercel.app (bzw. aktuelles Vercel-Preview) |
| **Ziel-Domain** | z. B. `dashboard.pastler.com` oder Subdomain nach Wahl |
| **Datenbank** | Supabase `htyeflqymmbcjhvknjoe` (Tabellen `pastler_*`) |
| **Automation** | n8n @ `https://n8n.ritz-ai.solutions` |
| **Detaillierte Doku** | [`DEPLOYMENT.md`](../DEPLOYMENT.md) · [`n8n/README.md`](../n8n/README.md) · [`AUDIT_ARBEITSPLAN.md`](./AUDIT_ARBEITSPLAN.md) · [`03_docs/files/Input_Checkliste_Pastler_GoLive.md`](../../03_docs/files/Input_Checkliste_Pastler_GoLive.md) (Kunden-Input) · [`03_docs/README.md`](../../03_docs/README.md) |

**Empfohlene Reihenfolge:** Infrastruktur → Automation → SMTP → Stammdaten → Abnahme.

---

## Übersicht (Fortschritt)

| # | Bereich | Status |
|---|---------|--------|
| 1 | [Datenbank & Deployment](#1-datenbank--deployment-voraussetzung) | ☐ |
| 2 | [n8n-Workflows](#2-n8n-workflows-eigene-datenbank-anbinden) | ☐ |
| 3 | [SMTP (E-Mail-Versand)](#3-smtp-zugangsdaten-partner-mails) | ☐ |
| 4 | [Domain & Website](#4-domain-mit-dashboard-verbinden) | ☐ |
| 5 | [Stammdaten anlegen](#5-stammdaten-im-dashboard-anlegen) | ☐ |
| 6 | [Abnahme & Go-Live](#6-abnahme--go-live) | ☐ |

---

## 1. Datenbank & Deployment (Voraussetzung)

Ohne diese Schritte funktionieren weder Dashboard noch n8n zuverlässig.

### 1.1 Supabase-Migrationen

Alle Dateien unter `supabase/migrations/` auf dem Projekt `htyeflqymmbcjhvknjoe` ausführen (SQL Editor oder CLI), mindestens bis **012**:

- [ ] `001`–`008` — Basis-Tabellen, RLS, Retention-RPC
- [ ] `009` — Inserat-Bild, E-Mail-RLS, Storage-Bucket `pastler-inserate`
- [ ] `010` — Kundenprofile, `pastler_resolve_zuordnung`
- [ ] `011` — Mitarbeiter dürfen E-Mails manuell zuordnen
- [ ] `012` — Pipeline-Reparatur, verbesserte Objekt-Zuordnung

**Prüfung:**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'pastler_inserate' AND column_name = 'bild_url';
-- Erwartung: 1 Zeile

SELECT proname FROM pg_proc WHERE proname = 'pastler_resolve_zuordnung';
-- Erwartung: 1 Zeile
```

### 1.2 Vercel — Umgebungsvariablen

[Vercel → Environment Variables](https://vercel.com) für **Production** (und optional Preview):

| Variable | Wert / Hinweis |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://htyeflqymmbcjhvknjoe.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | **Nur Server** — niemals im Client |
| `NEXT_PUBLIC_SITE_URL` | Finale Produktions-URL (nach Domain-Schritt) |
| `NEXT_PUBLIC_INSERAT_STORAGE_BUCKET` | `pastler-inserate` |

- [ ] Variablen gesetzt
- [ ] Redeploy ausgelöst (`git push` auf `main` oder manuell)

### 1.3 Supabase Auth (Mitarbeiter-Login)

Supabase → **Authentication → URL Configuration**:

- [ ] **Site URL** = finale Dashboard-URL
- [ ] **Redirect URLs:** `https://<domain>/auth/callback`, `http://localhost:3000/auth/callback`

**Mitarbeiter anlegen** (Supabase → Users oder CLI):

- [ ] Jeder Mitarbeiter: `app_metadata.role = "mitarbeiter"`
- [ ] Test-Login im Dashboard erfolgreich
- [ ] Optional: Eigentümer mit `app_metadata.role = "eigentuemer"` + `eigentuemer_id` (nur Leserechte)

> Demo-Daten (`supabase/seed.sql`) **nicht** in Produktion übernehmen — nur für Sales-Demo. Produktion startet mit leeren oder echten Stammdaten (Abschnitt 5).

---

## 2. n8n-Workflows (eigene Datenbank anbinden)

**Instanz:** https://n8n.ritz-ai.solutions  
**Vollständige Anleitung:** [`n8n/README.md`](../n8n/README.md)

### 2.1 Credentials in n8n (einmalig)

| Credential | Zweck | Werte |
|------------|--------|--------|
| **Pastler IMAP** | Posteingang Hausverwaltung lesen | Host: `imap.hostinger.com`, Port: `993`, SSL |
| **Supabase Service Role (Pastler)** | Alle DB-Nodes + RPC | URL + Service-Role-Key von Projekt `htyeflqymmbcjhvknjoe` |
| **Mistral API** | Todo-Extraktion aus E-Mails | EU-Region, Modell `mistral-small-latest` |
| **Pastler Telegram Bot** (optional) | Alerts bei hoher Priorität | Bot-Token + Chat-ID |

- [ ] IMAP: Postfach der Verwaltung (z. B. `hausverwaltung@pastler.com` oder betriebliches Postfach)
- [ ] IMAP **nicht** `smtp.hostinger.com` — das ist nur zum Senden
- [ ] Supabase-Credential auf **dieses** Projekt zeigen (nicht Demo/Fremd-DB)
- [ ] Mistral API-Key hinterlegt

### 2.2 Workflow 1 — E-Mail → Todo + Partner-Entwurf

Datei: `n8n/workflows/email-ingestion-partner.json`

- [ ] JSON importieren
- [ ] Alle Nodes mit Credentials verknüpfen
- [ ] IMAP Trigger: Poll **5 Minuten**, „Mark as read“ aktiv
- [ ] Telegram Chat-ID gesetzt (oder Alert-Zweig deaktiviert)
- [ ] Workflow **aktiviert**

**Test:**

- [ ] Test-E-Mail an IMAP-Postfach senden (z. B. Mieter meldet Defekt mit Objektadresse)
- [ ] Nach ≤5 Min.: Zeile in `pastler_emails`, Todo in `pastler_todos`
- [ ] Bei Handwerker-Fall: Entwurf in `pastler_partner_nachrichten` (`status = entwurf`)
- [ ] Gleiche E-Mail erneut → **kein** Duplikat (Stop vor LLM)

### 2.3 Workflow 2 & 3 — Retention (DSGVO)

| Datei | Cron | Funktion |
|-------|------|----------|
| `retention-90d.json` | 02:00 | E-Mail-Volltext nach 90 Tagen löschen |
| `retention-extended.json` | 02:30 | Anonymisierung / Löschung älterer Metadaten |

- [ ] Beide importiert, RPC-Nodes mit Supabase-Credential
- [ ] Beide Workflows aktiviert
- [ ] n8n Execution-Retention auf **7–14 Tage** (Settings → Executions)

---

## 3. SMTP-Zugangsdaten (Partner-Mails)

**Zweck:** Mitarbeiter senden **freigegebene Partner-Entwürfe** aus dem Dashboard (`/todos` → „Senden“).  
**Nicht** für E-Mail-Eingang — Eingang läuft über IMAP/n8n (Abschnitt 2).

### 3.1 Vercel Production

| Variable | Beispiel Hostinger |
|----------|-------------------|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Postfach der Hausverwaltung |
| `SMTP_PASS` | Mailbox-Passwort |
| `SMTP_FROM` | `hausverwaltung@pastler.com` (Absender-Anzeige) |

- [ ] Alle fünf Variablen in Vercel **Production** gesetzt (niemals ins Git committen)
- [ ] Redeploy nach Setzen der Variablen

Lokal zum Testen: gleiche Werte in `.env.local` (nicht `.env.example` mit echten Passwörtern füllen).

### 3.2 Versand testen

- [ ] Als Mitarbeiter einloggen → `/todos`
- [ ] Todo mit Partner-Entwurf öffnen → **Senden** → bestätigen
- [ ] Kein Fehler „SMTP nicht konfiguriert“
- [ ] Partner erhält E-Mail; in DB: `status = gesendet`, `gesendet_at` gesetzt
- [ ] Test nur an **echte** Partner-E-Mail — Demo-Adressen (`*.demo`) funktionieren nicht

---

## 4. Domain mit Dashboard verbinden

### 4.1 Vercel Custom Domain

- [ ] Domain/Subdomain im Vercel-Projekt hinzufügen (z. B. `dashboard.pastler.com`)
- [ ] DNS-Einträge beim Provider setzen (Vercel zeigt CNAME/A/AAAA an)
- [ ] SSL-Zertifikat aktiv (automatisch via Vercel)
- [ ] `NEXT_PUBLIC_SITE_URL` in Vercel auf **https://&lt;finale-domain&gt;** aktualisieren
- [ ] Redeploy

### 4.2 Supabase Auth anpassen

- [ ] Site URL auf finale Domain
- [ ] Redirect URL `https://<finale-domain>/auth/callback` ergänzen

### 4.3 Optional: von öffentlicher Website verlinken

- [ ] Link von [pastler.com](https://pastler.com) nur für internes Personal (nicht öffentlich indexieren)
- [ ] `robots.txt` / keine öffentliche Bewerbung des Dashboards

---

## 5. Stammdaten im Dashboard anlegen

**Reihenfolge beachten** — spätere Einträge hängen von früheren ab:

```
Vermieter → Inserate → Mieter
                ↘
Partner (parallel, unabhängig)
```

### 5.1 Vermieter (Eigentümer / Auftraggeber)

Route: **`/vermieter/neu`**

Pro Vermieter mindestens:

- [ ] Name, E-Mail (für Zuordnung eingehender Mails)
- [ ] Kontaktadresse (optional)
- [ ] Speichern → Detailseite prüfen

### 5.2 Inserate (Objekte)

Route: **`/inserate/neu`**

- [ ] **Vermieter** auswählen (Pflicht)
- [ ] Adresse, PLZ, Stadt (für automatische Zuordnung in E-Mails wichtig)
- [ ] Typ, Einheiten, optional Profilbild
- [ ] Speichern

> Ohne Vermieter kann kein Inserat angelegt werden (UI blockiert Submit).

### 5.3 Mieter

Route: **`/mieter/neu`**

- [ ] **Inserat** auswählen (Pflicht — API-validiert)
- [ ] Name, E-Mail (für `absender_mieter`-Zuordnung)
- [ ] Einheit, Ein-/Auszug, Status
- [ ] Speichern

> Ohne Inserat kann kein Mieter angelegt werden.

### 5.4 Partner (Handwerker / Dienstleister)

Route: **`/partner/neu`**

- [ ] Firma, E-Mail (**echte** Adresse für späteren Versand)
- [ ] Gewerk (`elektriker`, `sanitaer`, `schluessel`, `reinigung`, `hausmeister`, …)
- [ ] **Aktiv** = true (sonst findet n8n keinen Partner für Entwürfe)
- [ ] Speichern

### 5.5 Checkliste Stammdaten vollständig

| Entität | Anzahl (Ziel) | Alle Pflichtfelder | E-Mail für Automation |
|---------|---------------|--------------------|------------------------|
| Vermieter | ☐ | ☐ | ☐ |
| Inserate | ☐ | ☐ | — |
| Mieter | ☐ | ☐ | ☐ |
| Partner | ☐ | ☐ | ☐ |

**Tipp:** Nach dem Anlegen eine Test-E-Mail von einer registrierten Mieter-Adresse an das IMAP-Postfach senden und prüfen, ob Zuordnung + Todo stimmen.

---

## 6. Abnahme & Go-Live

### 6.1 End-to-End-Szenarien

| # | Szenario | Erwartung | ☐ |
|---|----------|-----------|---|
| 1 | Mieter-Mail „Defekt + Adresse“ | Todo + ggf. Partner-Entwurf, Zuordnung korrekt | ☐ |
| 2 | Partner-Entwurf → Senden | E-Mail beim Partner, Status `gesendet` | ☐ |
| 3 | Manuelles Anlegen Vermieter → Inserat → Mieter | Toasts, Navigation, keine Fehler | ☐ |
| 4 | E-Mail-Zuordnung manuell korrigieren | `/emails/[id]` → Zuordnung speichern | ☐ |
| 5 | Eigentümer-Login (falls genutzt) | Sieht nur eigene Objekte, **kein** `/partner`, **kein** E-Mail-Volltext | ☐ |
| 6 | Duplikat-E-Mail | Kein zweites Todo | ☐ |

### 6.2 Technische Abschluss-Checks

```bash
npm run type-check
npm run build
```

- [ ] Build grün
- [ ] Keine Secrets im Repository (`git grep` auf Keys)
- [ ] Optional: [`docs/AUDIT_ARBEITSPLAN.md`](./AUDIT_ARBEITSPLAN.md) Phase G (DSGVO/AV-Verträge) für rechtliche Freigabe

### 6.3 Go-Live-Freigabe

| Rolle | Name | Datum | Freigabe |
|-------|------|-------|----------|
| Pastler (Fachlich) | | | ☐ |
| Technik (RITZ AI / Betrieb) | | | ☐ |

**Nach Freigabe:**

- [ ] Demo-Seed-Daten in Produktion entfernt oder durch echte Daten ersetzt
- [ ] Mitarbeiter geschult (Todos, Partner-Entwürfe, manuelle Zuordnung)
- [ ] Support-Kontakt dokumentiert (`hausverwaltung@pastler.com`)

---

## Kurzreferenz — Was wo passiert

| Aufgabe | Wo |
|---------|-----|
| E-Mails **empfangen** & Todos erzeugen | n8n + IMAP → Supabase |
| E-Mails an Partner **senden** | Dashboard `/todos` → SMTP (Vercel) |
| Vermieter / Mieter / Partner / Inserate pflegen | Dashboard CRUD |
| Mitarbeiter-Login | Supabase Auth |
| Domain | Vercel + DNS |
| DB-Schema | Supabase Migrationen |

---

## Anhang — Demo vs. Produktion

| | Demo (aktuell) | Produktion (Ziel) |
|---|----------------|-------------------|
| Daten | `seed.sql` / Repair-Skripte | Echte Stammdaten (Abschnitt 5) |
| Partner-E-Mails | `*.demo` Adressen | Echte Handwerker-Mails |
| SMTP | Oft nicht gesetzt | Vercel `SMTP_*` Pflicht |
| n8n | Muss auf Kunden-Postfach zeigen | IMAP = Pastler-Posteingang |
| URL | `*.vercel.app` | Eigene Domain |

*Letzte Aktualisierung: bei Erstellung dieser Checkliste an Code-Stand `main` angepasst.*
