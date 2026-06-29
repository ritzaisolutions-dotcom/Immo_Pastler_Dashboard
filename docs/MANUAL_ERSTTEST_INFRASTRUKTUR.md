# Manueller Ersttest — Gesamte Pastler-Infrastruktur

**Zweck:** Einmal komplett durchklicken und durchtesten — Dashboard, Supabase, n8n, E-Mail-Pipeline, Mistral-Chat.  
**Dauer:** ca. 45–60 Minuten (inkl. 5–10 Min. Wartezeit auf n8n IMAP-Poll).  
**Production:** https://immo-pastler-dashboard.vercel.app  
**n8n:** https://n8n.ritz-ai.solutions  
**Supabase:** Projekt `htyeflqymmbcjhvknjoe` (eu-central-1)

---

## Was bereits automatisch geprüft wurde (29.06.2026)

| Check | Ergebnis |
|-------|----------|
| `node scripts/verify-demo-ui.mjs --production` | **20/20 PASS** (Routen + Demo-Daten) |
| `node scripts/test-email-pipeline.mjs` (ohne `--send`) | RPC + 8 Demo-Mails → Todos OK |
| SMTP → `marco@ritz-ai.solutions` | Zustellung OK |
| Live n8n → Supabase | **FAIL** — siehe Abschnitt 4 |

**Bekannter n8n-Fehler (Execution-Log):** Node „Duplicate Check“ bricht ab mit  
`failed to parse logic tree ((message_id.is.undefined))` — IMAP liefert bei manchen Mails kein `messageId`.  
**Fix in n8n-UI:** siehe [Schritt 4.3](#43-n8n-workflow-fixen-einmalig).

---

## Voraussetzungen (5 Min.)

- [ ] Mitarbeiter-Login für https://immo-pastler-dashboard.vercel.app (Supabase Auth, Rolle `mitarbeiter`)
- [ ] Zugang n8n: https://n8n.ritz-ai.solutions (Owner-Login)
- [ ] Zugang Supabase Dashboard: https://supabase.com/dashboard/project/htyeflqymmbcjhvknjoe
- [ ] Zugang Vercel: Projekt `immo-pastler-dashboard`
- [ ] Hostinger Webmail/IMAP für `marco@ritz-ai.solutions` (Testmails prüfen)
- [ ] Gültiger **Mistral API Key** von https://console.mistral.ai (n8n-Credential war 401)

Lokal optional (für Skript `--send`):

```bash
# 01_dashboard/.env.local (gitignored)
PIPELINE_TEST_INBOX=marco@ritz-ai.solutions
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=marco@ritz-ai.solutions
SMTP_PASS=<Hostinger-Passwort>
SMTP_FROM=marco@ritz-ai.solutions
MISTRAL_API_KEY=<gültiger Key>
```

---

## Phase 1 — Env & Deployment (10 Min.)

### 1.1 Mistral auf Vercel

1. Vercel → `immo-pastler-dashboard` → Settings → Environment Variables  
2. `MISTRAL_API_KEY` prüfen: **kein Platzhalter**, echter Key (Länge typisch 30+ Zeichen)  
3. Production + Preview setzen → **Redeploy** (`Deployments` → Redeploy oder `vercel deploy --prod`)  
4. Verifizieren: Nach Redeploy auf `/chat` testen (Phase 3.7)

| Erwartung | ☐ |
|-----------|---|
| Key gesetzt, Redeploy durch | |
| `/chat` antwortet (kein 503) | |

### 1.2 SMTP auf Vercel (optional, für Partner-„Senden“)

| Variable | Wert |
|----------|------|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `marco@ritz-ai.solutions` |
| `SMTP_PASS` | Hostinger-Passwort |
| `SMTP_FROM` | `marco@ritz-ai.solutions` |

Redeploy nach Setzen. Ohne diese Variablen: Partner-Entwürfe nur lesen, nicht versenden.

### 1.3 Schnellcheck lokal

```bash
cd "01_dashboard"
node scripts/verify-demo-ui.mjs --production
node scripts/test-email-pipeline.mjs
```

| Erwartung | ☐ |
|-----------|---|
| 20/20 checks passed | |
| RPC-Test: 2× ✓ | |
| Bestands-Audit: keine ⚠-Zeilen | |

---

## Phase 2 — Dashboard UI (15 Min.)

**URL:** https://immo-pastler-dashboard.vercel.app/login  
Als **Mitarbeiter** einloggen.

| # | Route | Was prüfen | OK |
|---|-------|------------|-----|
| 1 | `/dashboard` | StatCards > 0, letzte Todos mit Mieter-Namen | ☐ |
| 2 | `/emails` | Liste lädt; Zeile **aufklappen** → Volltext, Status, Mieter-Badge | ☐ |
| 3 | `/objekte` | **3** Koblenz-Objekte im Grid | ☐ |
| 4 | `/objekte/[id]` | Je 2 Wohneinheiten; Partner-Dropdowns pro Gewerk | ☐ |
| 5 | `/partner` | Partner öffnen: Sie/Du, Einsatzgebiet, Objekt-Zuordnung | ☐ |
| 5b | `/partner` | Neues Gewerk „Dachdecker“ anlegen (dynamische Gewerke) | ☐ |
| 6 | `/mieter` | Spalten **Vorname \| Nachname** (z. B. Thomas \| Weber) | ☐ |
| 7 | `/chat` | Frage: „Welche offenen Todos gibt es?“ → Antwort von Mistral | ☐ |
| 8 | `/todos` | Status ändern; externes Todo → **Partner-Entwurf** lesen | ☐ |
| 9 | `/vermieter` | Seite lädt | ☐ |
| 9b | `/datenschutz` | Seite lädt | ☐ |
| 10 | `/inserate` | Redirect → `/objekte` | ☐ |

**Sidebar-Reihenfolge (Mitarbeiter):** Dashboard → E-Mails → Objekte → Partner → Mieter → KI-Assistent → Todos

---

## Phase 3 — Supabase Daten (5 Min.)

Supabase → SQL Editor:

```sql
-- Stammdaten
SELECT count(*) AS objekte FROM pastler_inserate;          -- 3
SELECT count(*) AS wohneinheiten FROM pastler_wohneinheiten; -- 6
SELECT count(*) AS gewerke FROM pastler_gewerke;           -- 7
SELECT count(*) AS emails FROM pastler_emails;             -- 8+ nach Pipeline
SELECT count(*) AS todos FROM pastler_todos;               -- 10+
SELECT count(*) AS entwuerfe FROM pastler_partner_nachrichten; -- 4+
```

| Erwartung | ☐ |
|-----------|---|
| Alle Mindestzahlen stimmen | |

---

## Phase 4 — E-Mail-Pipeline (20 Min.) — kritisch

```mermaid
flowchart LR
  Send[SMTP_Testmail] --> Inbox[marco@ritz-ai.solutions]
  Inbox --> IMAP[n8n_IMAP_5min]
  IMAP --> Norm[Normalize_MessageId]
  Norm --> Raw[Raw_Email_Insert]
  Raw --> RPC[pastler_resolve_zuordnung]
  RPC --> LLM[Mistral_Todo_Extract]
  LLM --> Todo[pastler_todos]
  Todo --> Partner[pastler_partner_nachrichten]
```

### 4.1 n8n Workflows prüfen

https://n8n.ritz-ai.solutions → Workflows:

| Workflow | Erwartung | OK |
|----------|-----------|-----|
| **Pastler Email Ingestion + Partner Draft** | Aktiv (grün) | ☐ |
| Pastler Retention — 90d | Aktiv | ☐ |
| Pastler Retention — Extended | Aktiv | ☐ |

**Credentials prüfen (Workflow öffnen → Nodes):**

| Credential | Erwartung | OK |
|------------|-----------|-----|
| IMAP `marco@ritz-ai.solutions` | `imap.hostinger.com:993` | ☐ |
| Supabase `IM24` | Host `htyeflqymmbcjhvknjoe.supabase.co` | ☐ |
| Mistral Cloud account | **Gültiger API-Key** (Test in n8n: Credential testen) | ☐ |

### 4.2 Letzte Executions prüfen

Workflow „Pastler Email Ingestion“ → **Executions**:

- [ ] Keine roten Fehler nach Fix (Schritt 4.3)
- [ ] Bei Fehler: Node-Name + Meldung notieren

### 4.3 n8n Workflow fixen (einmalig)

**Problem:** `Duplicate Check` scheitert, wenn `messageId` vom IMAP leer ist.

**Empfohlener Fix in n8n-UI:**

1. Workflow öffnen → zwischen **IMAP Trigger** und **Duplicate Check** einen **Code**-Node einfügen:  
   **Name:** `Normalize Message ID`
2. Code:

```javascript
return $input.all().map((item) => {
  const j = item.json;
  const subject = String(j.subject || "no-subject").trim().slice(0, 80);
  const datePart = new Date(j.date || Date.now()).toISOString().replace(/[:.]/g, "-");
  const resolvedMessageId =
    j.messageId || `<pastler-${subject}-${datePart}@import.local>`;
  return { json: { ...j, resolvedMessageId } };
});
```

3. Verkabeln: `IMAP Trigger` → `Normalize Message ID` → `Duplicate Check`  
4. Im Node **Duplicate Check**: Filter `message_id` **eq**  
   `={{ $('Normalize Message ID').item.json.resolvedMessageId }}`  
5. Im Node **Raw Email**: Feld `message_id` ebenfalls auf `resolvedMessageId` setzen  
6. **Workflow speichern** → **Deaktivieren** → 3 Sek. warten → **Aktivieren** (Trigger neu laden)

Alternativ: Workflow aus Repo neu importieren:  
[`n8n/workflows/email-ingestion-partner.json`](../n8n/workflows/email-ingestion-partner.json)  
(dort ist der Fallback bereits vorbereitet — danach Credentials neu zuweisen).

| Erwartung | ☐ |
|-----------|---|
| Fix angewendet, Workflow reaktiviert | |

### 4.4 Mistral-Credential in n8n erneuern

1. n8n → Credentials → **Mistral Cloud account**  
2. Neuen Key von https://console.mistral.ai eintragen  
3. **Test** — muss grün sein (vorher: Authorization failed / 401)

| Erwartung | ☐ |
|-----------|---|
| Mistral Credential Test OK | |

### 4.5 Testmail senden

**Option A — Skript (empfohlen):**

```bash
cd "01_dashboard"
node scripts/test-email-pipeline.mjs --send
```

Sendet 2 Mails an `marco@ritz-ai.solutions`, wartet bis 6 Min., prüft Supabase.

**Option B — Manuell:** E-Mail von `thomas.weber@demo-mieter.de` (oder Reply-To) an `marco@ritz-ai.solutions` mit Betreff  
`[Pastler-Test] Defekte Beleuchtung Treppenhaus` und Text „Hauptstraße 12 Koblenz“.

**Warten:** n8n IMAP-Poll ca. **5 Minuten** (ggf. Workflow einmal manuell „Execute“).

### 4.6 Ergebnis prüfen

**Supabase SQL:**

```sql
SELECT betreff, von_email, verarbeitet, zuordnung_quelle, empfangen_at
FROM pastler_emails
WHERE betreff LIKE '%Pastler-Test%'
ORDER BY empfangen_at DESC
LIMIT 5;
```

**Dashboard:** `/emails` — neue Zeilen; `/todos` — neue externe Todos.

| Mail-Typ | Erwartung | OK |
|----------|-----------|-----|
| `thomas.weber@demo-mieter.de` | `zuordnung_quelle=absender_mieter`, Gewerk `elektriker`, Todo + Partner-Entwurf | ☐ |
| Unbekannte Adresse, Text „Rheinweg 45“ | `inhalt_objekt` oder `inhalt_einheit`, Gewerk `hausmeister` | ☐ |

---

## Phase 5 — Retention (nur Sichtprüfung, nicht auslösen!)

| Workflow | Schedule | Aktiv | OK |
|----------|----------|-------|-----|
| Retention 90d | 02:00 | ☐ | ☐ |
| Retention Extended | 02:30 | ☐ | ☐ |

**Nicht** manuell ausführen — würde Demo-Daten löschen/anonymisieren.

---

## Phase 6 — Partner-Versand (optional)

Nur wenn `SMTP_*` auf **Vercel** gesetzt:

1. `/todos` → externes Todo mit Partner-Entwurf  
2. **Senden** klicken  
3. Erwartung: kein Fehler „SMTP nicht konfiguriert“; DB `status=gesendet`

Demo-Partner (`*.demo`) empfangen keine echten Mails — API-Erfolg reicht.

| Erwartung | ☐ |
|-----------|---|
| Senden ohne Fehler (oder bewusst deferred dokumentiert) | |

---

## Abschluss — Demo-ready?

| Kriterium | Status |
|-----------|--------|
| UI alle 10 Routen (Phase 2) | ☐ |
| `verify-demo-ui.mjs --production` 20/20 | ☐ (bereits PASS) |
| n8n Ingestion: neue Testmail in Supabase | ☐ |
| KI-Chat auf Production | ☐ |
| Retention-WFs aktiv (nur Sicht) | ☐ |

**Demo recording-ready:** erst wenn n8n-Pipeline (Phase 4) und Chat (Phase 1.1 + 3.7) grün sind.

---

## Hilfsskripte

| Befehl | Zweck |
|--------|-------|
| `node scripts/verify-demo-ui.mjs --production` | HTTP-Routen + Daten-Counts |
| `node scripts/test-email-pipeline.mjs` | RPC + Bestands-Audit |
| `node scripts/test-email-pipeline.mjs --send` | Live SMTP → n8n → Supabase |

Detailliertes Protokoll: [`TEST_PROTOKOLL_2026-06-29.md`](./TEST_PROTOKOLL_2026-06-29.md)  
Go-Live: [`GO_LIVE_CHECKLISTE.md`](./GO_LIVE_CHECKLISTE.md)
