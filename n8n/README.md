# n8n Email → Todo + Partner Pipeline

**Instance:** `https://n8n.ritz-ai.solutions`  
**Supabase:** `htyeflqymmbcjhvknjoe` (shared with Haller) — **service role key** required  
**Purpose:** IMAP inbox → `pastler_emails` → Mistral extraction → `pastler_todos` → optional Partner-Entwurf in `pastler_partner_nachrichten`

## Import (Workflow-JSONs)

Workflow-Dateien liegen unter [`workflows/`](./workflows/):

| Datei | Beschreibung |
|-------|--------------|
| [`email-ingestion-partner.json`](./workflows/email-ingestion-partner.json) | IMAP → Todo + Partner-Entwurf + Telegram (18 Nodes) |
| [`retention-90d.json`](./workflows/retention-90d.json) | Cron 02:00 — E-Mail-Volltext löschen |
| [`retention-extended.json`](./workflows/retention-extended.json) | Cron 02:30 — Anonymisierung + Löschung |

**Import in n8n:**

1. `https://n8n.ritz-ai.solutions` → **Workflows** → **Import from File**
2. JSON-Datei wählen
3. Credentials zuweisen (Platzhalter `CONFIGURE_IN_N8N` ersetzen):
   - **Pastler IMAP** — Posteingang der Verwaltung
   - **Supabase Service Role (Pastler)** — Host `https://htyeflqymmbcjhvknjoe.supabase.co` + Service-Role-Key (**eine Credential für alle Supabase-Nodes**, inkl. RPC)
   - **Mistral API** — EU-Region, Modell `mistral-small-latest`
   - **Pastler Telegram Bot** — Bot-Token von @BotFather; Chat-ID in Node `Telegram Alert` eintragen (siehe unten)
4. IMAP Trigger: Poll-Intervall **5 Minuten**, „Mark as read“ aktivieren
5. Migration **`008_retention_rpc.sql`** in Supabase ausführen (einmalig, RPC-Funktionen für Retention)
6. Workflow **aktivieren**

## Supabase-Zugriff (einheitlich)

| Zugriff | Node-Typ | Credential |
|---------|----------|------------|
| Tabellen (SELECT/INSERT/UPDATE) | **Supabase** (nativ) | `Supabase Service Role (Pastler)` |
| Postgres-Funktionen (RPC) | **HTTP Request** | dieselbe Credential via **Predefined Credential Type → supabaseApi** |

Der native Supabase-Node unterstützt **keine RPC-Aufrufe** (offizielle n8n-Empfehlung). Deshalb heißen RPC-Nodes `Supabase RPC …` und nutzen HTTP Request — aber mit **derselben** `supabaseApi`-Credential (nicht mehr eine separate Header-Auth).

**RPC-Node-Template (alle Workflows identisch):**

- Authentication: **Predefined Credential Type** → `supabaseApi` → `Supabase Service Role (Pastler)`
- Method: `POST`
- URL: `https://htyeflqymmbcjhvknjoe.supabase.co/rest/v1/rpc/<funktionsname>`
- Headers: `Content-Type: application/json`, `Prefer: return=representation`
- Body: JSON mit Funktionsparametern (oder `{}` für parameterlose Retention-RPCs)

> **Kein Postgres in n8n nötig.** Keine zweite Supabase-Credential (`httpHeaderAuth`) mehr.

### RPC testen (curl)

```bash
curl -X POST "https://htyeflqymmbcjhvknjoe.supabase.co/rest/v1/rpc/pastler_retention_purge_email_body_90d" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d "{}"
```

Erwartung: JSON-Zahl (Anzahl betroffener Zeilen), z. B. `0`.

### Telegram-Alert (Workflow 1)

Nach jedem neuen Todo — **nur** wenn `prioritaet = hoch`, Mistral-Fallback (`llm_fallback`) **oder** `zuordnung_quelle = unbekannt`:

| Node | Funktion |
|------|----------|
| **IF Alert** | OR: Priorität hoch / LLM-Fallback |
| **Telegram Alert** | Nachricht an konfigurierte Chat-ID |

**Setup:**

1. Bot bei [@BotFather](https://t.me/BotFather) anlegen → Token in n8n Credential **Pastler Telegram Bot**
2. Eigene Chat-ID ermitteln (z. B. [@userinfobot](https://t.me/userinfobot) oder `/start` an Bot + `getUpdates`)
3. In Node **Telegram Alert** → `chatId` = deine numerische Chat-ID (Platzhalter `CONFIGURE_TELEGRAM_CHAT_ID` ersetzen)
4. Bot einmal anschreiben (`/start`), sonst kann er nicht senden

**DSGVO — Nachricht enthält nur:**

- `titel`, `prioritaet`, `kategorie`, `todo_id`
- Hinweis „Mistral-Fallback“ bei Parse-Fehler
- **Kein** `inhalt_text`, **keine** `beschreibung`, **kein** E-Mail-Volltext

**Beispiel:**

```
Pastler — neues Todo

Titel: Defekte Beleuchtung Treppenhaus
Priorität: hoch
Kategorie: extern
Todo-ID: 3fa85f64-5717-4562-b3fc-2c963f66afa6
```

## Table Mapping (Shared DB)

| CLAUDE / Plan name | Actual table |
|--------------------|--------------|
| `emails` | `pastler_emails` |
| `mieter` | `pastler_mieter` |
| `eigentuemer` / Vermieter | `pastler_eigentuemer` |
| `todos` | `pastler_todos` |
| `partner` | `pastler_partner` |
| `partner_nachrichten` | `pastler_partner_nachrichten` |

## Workflow 1: Email Ingestion + Partner (19 Nodes)

**Duplikat-Schutz vor LLM:** Jede `message_id` wird **zweifach** abgesichert — Lookup in Supabase **und** `UNIQUE` auf `pastler_emails.message_id`. Mistral läuft nur, wenn Insert erfolgreich war (`IF Email Saved`). Duplikate und Race-Conditions enden in **Stop Duplicate**, ohne LLM-Kosten.

**Wichtig:** Node **Normalize Message ID** erzeugt filter-sichere IDs (Hash-Fallback). Betreff-basierte Fallbacks brechen den Supabase `eq`-Filter (`failed to parse logic tree`). Code: [`code/normalize-message-id.js`](./code/normalize-message-id.js).

| # | Node | Configuration |
|---|------|---------------|
| 1 | IMAP Trigger | Poll every 5 min; mark as read |
| 2 | Normalize Message ID | Code: `resolvedMessageId` (sanitize + hash fallback) |
| 3 | Duplicate Check | `pastler_emails` WHERE `message_id = $json.resolvedMessageId`; `alwaysOutputData: true` |
| 4 | IF New Email | `$json.id` leer → neu; sonst Stop Duplicate |
| 5 | Raw Email | Insert `pastler_emails`; `message_id` = `resolvedMessageId`; `continueOnFail: true` |
| 6 | IF Email Saved | `$json.id` gesetzt → weiter; sonst Stop (Race/Duplikat) |
| 7 | HTTP Request | `Supabase RPC Resolve Zuordnung` → `pastler_resolve_zuordnung` (supabaseApi) |
| 8 | LLM Chain | Mistral — Todo + Use-Case + Gewerk (`continueOnFail: true`) |
| 9 | Code Node | JSON parse + Zuordnung aus Node 7, `llm_fallback`, `gewerk`, `partner_noetig` |
| 10 | Supabase insert | `pastler_todos` inkl. `vermieter_id`, `zuordnung_*` |
| 11 | Supabase update | `pastler_emails`: `verarbeitet`, Zuordnungsfelder |
| 12 | IF Alert | `prioritaet = hoch` OR `llm_fallback` OR `zuordnung_quelle = unbekannt` |
| 13 | Telegram | Metadaten + Hinweis bei Fallback / manueller Zuordnung (DSGVO) |
| 14 | IF | `partner_noetig === true` && `gewerk` gesetzt |
| 15 | Supabase getAll | `pastler_partner` WHERE `gewerk` + `aktiv = true` LIMIT 1 |
| 16 | IF | Partner gefunden |
| 17 | LLM Chain | Partner-E-Mail Entwurf (Betreff + Text) |
| 18 | Supabase insert | `pastler_partner_nachrichten` status=`entwurf` |
| 19 | Supabase update | `pastler_todos` SET `partner_id`, `use_case` |

Nodes 11–12 laufen parallel nach Insert Todo (Alert-Zweig). Partner-Kette ab Node 13 unverändert.

**Freigabe:** Entwürfe werden **nicht** automatisch versendet. Mitarbeiter prüfen im Dashboard unter `/todos` und senden manuell (SMTP via Next.js API).

### Zuordnungslogik (`pastler_resolve_zuordnung`)

RPC wird in Node 6 aufgerufen. Rückgabe: `{ mieter_id, inserat_id, vermieter_id, quelle, konfidenz }`.

| Stufe | `zuordnung_quelle` | Logik | Konfidenz |
|-------|-------------------|-------|-----------|
| 1 | `absender_mieter` | `mieter.email = von_email` | hoch |
| 2 | `absender_vermieter` | `vermieter.email = von_email` | hoch |
| 3 | `inhalt_objekt` | Adresse/PLZ im Betreff+Text (alle Inserate; Stadt nur beim passenden Vermieter) | mittel |
| 4 | `inhalt_einheit` | `einheit_nr` im Text | mittel |
| 5 | `inhalt_mieter_name` | Mietername im Text | niedrig |
| 6 | `unbekannt` | Kein Treffer → Telegram-Hinweis „Manuelle Zuordnung“ | — |

Felder werden auf `pastler_emails` und `pastler_todos` geschrieben (`zuordnung_quelle`, `zuordnung_konfidenz`).

### Mistral Prompt — Todo-Extraktion (Node 7)

```
Du bist Assistent einer deutschen Hausverwaltung. Analysiere diese E-Mail.

Von: {{ $('Raw Email').item.json.von_email }}
Betreff: {{ $('Raw Email').item.json.betreff }}
Inhalt: {{ $('Raw Email').item.json.inhalt_text }}

Bereits ermittelte Zuordnung (regelbasiert):
- mieter_id: {{ $('Supabase RPC Resolve Zuordnung').item.json.mieter_id }}
- inserat_id: {{ $('Supabase RPC Resolve Zuordnung').item.json.inserat_id }}
- vermieter_id: {{ $('Supabase RPC Resolve Zuordnung').item.json.vermieter_id }}
- quelle: {{ $('Supabase RPC Resolve Zuordnung').item.json.quelle }}
- konfidenz: {{ $('Supabase RPC Resolve Zuordnung').item.json.konfidenz }}

Antworte NUR mit validem JSON, kein Markdown, keine Erklärung:
{
  "titel": "Kurztitel max. 80 Zeichen",
  "beschreibung": "Was ist zu tun",
  "kategorie": "extern",
  "prioritaet": "mittel",
  "faellig_at": null,
  "use_case": "defekte_beleuchtung",
  "gewerk": "elektriker",
  "partner_noetig": true
}

Regeln:
- kategorie: extern | mieter | intern
- prioritaet: hoch | mittel | niedrig
- faellig_at: YYYY-MM-DD oder null
- use_case: maschinenlesbar snake_case (z.B. defekte_beleuchtung, wasserschaden)
- gewerk: elektriker | sanitaer | schluessel | reinigung | hausmeister | allgemein | null
- partner_noetig: true nur wenn externer Handwerker nötig; sonst false
- gewerk muss zu partner_noetig passen; bei partner_noetig false gewerk null setzen
```

### Code Node — Parse Todo JSON (Node 8)

```javascript
const raw = $input.first().json.text || $input.first().json.output || '';
const llmFailed = !!$input.first().json.error;
let todo;
let llm_fallback = llmFailed || !raw.trim();
try {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) llm_fallback = true;
  todo = JSON.parse(m ? m[0] : raw);
} catch {
  todo = {};
  llm_fallback = true;
}
const defaults = {
  titel: 'Unbekanntes Anliegen',
  beschreibung: raw.slice(0, 200),
  kategorie: 'intern',
  prioritaet: 'mittel',
  faellig_at: null,
  use_case: null,
  gewerk: null,
  partner_noetig: false,
};
todo = { ...defaults, ...todo };
if (typeof todo.partner_noetig !== 'boolean') {
  todo.partner_noetig = todo.kategorie === 'extern' && !!todo.gewerk;
}
if (todo.kategorie === 'extern' && todo.gewerk && !todo.partner_noetig) {
  todo.partner_noetig = true;
}
const validGewerke = ['elektriker', 'sanitaer', 'schluessel', 'reinigung', 'hausmeister', 'allgemein'];
if (todo.gewerk && !validGewerke.includes(todo.gewerk)) {
  todo.gewerk = null;
}
const zuordnung = $('Supabase RPC Resolve Zuordnung').first().json ?? {};
const email = $('Raw Email').item.json;
return [{
  json: {
    ...todo,
    llm_fallback,
    email_id: email.id,
    mieter_id: zuordnung.mieter_id ?? null,
    inserat_id: zuordnung.inserat_id ?? null,
    vermieter_id: zuordnung.vermieter_id ?? null,
    zuordnung_quelle: zuordnung.quelle ?? 'unbekannt',
    zuordnung_konfidenz: zuordnung.konfidenz ?? 'niedrig',
  },
}];
```

Bei `llm_fallback: true` wird trotzdem ein Todo angelegt (Defaults) **und** ein Telegram-Hinweis gesendet.

### Mistral Prompt — Partner-Entwurf (Node 16)

```
Du schreibst im Namen der Hausverwaltung Pastler (formell, Deutsch) eine E-Mail an einen Handwerker-Partner.

Anliegen-Titel: {{ $('Parse Todo JSON').item.json.titel }}
Beschreibung: {{ $('Parse Todo JSON').item.json.beschreibung }}
Use-Case: {{ $('Parse Todo JSON').item.json.use_case }}
Partner-Firma: {{ $('Partner Lookup').item.json.firma }}
Ansprechpartner: {{ $('Partner Lookup').item.json.ansprechpartner }}

Antworte NUR mit validem JSON:
{
  "betreff": "Kurzer Betreff max. 120 Zeichen",
  "inhalt": "Formeller E-Mail-Text mit Grußformel, ohne Markdown"
}

Enthalte: kurze Problemstellung, Bitte um Rückmeldung/Termin, Signatur "Immobilienverwaltung Pastler".
```

### Code Node — Parse Partner Draft (Node 14)

```javascript
const raw = $input.first().json.text || $input.first().json.output || '';
let draft;
try {
  const m = raw.match(/\{[\s\S]*\}/);
  draft = JSON.parse(m ? m[0] : raw);
} catch {
  draft = {
    betreff: $('Parse Todo JSON').item.json.titel,
    inhalt: raw.slice(0, 2000),
  };
}
const todo = $('Insert Todo').item.json;
const partner = $('Partner Lookup').item.json;
return [{
  json: {
    todo_id: todo.id,
    partner_id: partner.id,
    betreff: draft.betreff || todo.titel,
    inhalt: draft.inhalt || '',
    status: 'entwurf',
  },
}];
```

## Workflow 2: 90-Day Email Body Purge (Cron)

- **Datei:** [`workflows/retention-90d.json`](./workflows/retention-90d.json)
- **Schedule:** Daily at 02:00
- **Node:** `Supabase RPC Purge Email Body 90d` → `POST /rest/v1/rpc/pastler_retention_purge_email_body_90d` (supabaseApi)
- **Supabase:** Funktion in [`008_retention_rpc.sql`](../supabase/migrations/008_retention_rpc.sql)

## Workflow 3: Extended Retention (Cron)

- **Datei:** [`workflows/retention-extended.json`](./workflows/retention-extended.json)
- **Schedule:** Daily at 02:30
- **Nodes:** drei parallele `Supabase RPC …`-Nodes (HTTP + supabaseApi):

| RPC-Funktion | Zweck |
|--------------|--------|
| `pastler_retention_anonymize_emails_180d` | Metadaten anonymisieren (180 Tage) |
| `pastler_retention_delete_emails_365d` | E-Mail-Zeilen löschen (365 Tage) |
| `pastler_retention_clear_todo_descriptions_365d` | Todo-Beschreibungen löschen (365 Tage, erledigt) |

Siehe [`supabase/migrations/005b_retention_policies.sql`](../supabase/migrations/005b_retention_policies.sql) (Doku) und [`008_retention_rpc.sql`](../supabase/migrations/008_retention_rpc.sql) (Implementierung).

## End-to-End Test (Beispiel)

Voraussetzungen: Partner mit `gewerk = elektriker` in `/partner` oder Seed; Workflow 1 aktiv.

| Schritt | Aktion | Erwartung |
|---------|--------|-----------|
| 1 | Test-E-Mail senden: *„Glühbirne im Treppenhaus defekt, Objekt Musterstraße 5“* | Workflow läuft ohne Fehler |
| 2 | Supabase `pastler_todos` prüfen | Neues Todo, `kategorie=extern`, `use_case=defekte_beleuchtung`, `gewerk=elektriker` |
| 3 | `pastler_partner_nachrichten` prüfen | Zeile mit `status=entwurf`, Betreff + Inhalt |
| 4 | Dashboard `/todos` (Mitarbeiter) | Entwurf sichtbar, Buttons Senden/Bearbeiten/Ablehnen |
| 5 | „Senden“ klicken (SMTP konfiguriert) | `status=gesendet`, E-Mail an Partner |
| 6 | Gleiche E-Mail erneut (gleiche message_id) | Kein Duplikat-Todo, **kein LLM-Aufruf**, Stop Duplicate |
| 7 | E-Mail ohne Handwerker-Bedarf | Todo ohne Entwurf, kein Workflow-Fehler |
| 8 | Login als Eigentümer | Kein Zugriff auf `/partner`, keine Entwürfe |

## Execution Log Retention (DSGVO)

n8n speichert Workflow-Ausführungen inkl. Node-Inputs — diese können E-Mail-Inhalte enthalten.

- [ ] Execution data retention in n8n auf **7–14 Tage** setzen (Settings → Executions)
- [ ] Zugriff auf n8n auf autorisierte Admins beschränken
- [ ] Keine Execution-Logs exportieren mit `inhalt_text`

## Live-Verification Checklist

Manuell auf `https://n8n.ritz-ai.solutions` prüfen:

- [ ] Workflow 1: 18 Nodes aktiv, IMAP poll 5 min
- [ ] Duplikat: gleiche message_id → Stop vor LLM (Execution zeigt Stop Duplicate, kein Mistral)
- [ ] Telegram: Chat-ID gesetzt; Test mit `prioritaet=hoch` oder Fallback
- [ ] Workflow 2: Cron 02:00 aktiv
- [ ] Workflow 3: Cron 02:30 aktiv
- [ ] Duplicate `message_id` → IF New Email + IF Email Saved stoppen vor LLM
- [ ] Partner-Entwurf: status `entwurf` — **kein** Auto-Send
- [ ] Telegram (optional): nur `titel`, `prioritaet` — kein `inhalt_text`

## Security Checklist

- [ ] IMAP credentials in n8n Credentials vault only
- [ ] n8n uses Supabase **service role key** (server-side)
- [ ] Duplicate `message_id` rejected by UNIQUE constraint
- [ ] LLM failure → fallback todo still created (`continueOnFail: true`)
- [ ] Partner-E-Mails nur nach manueller Freigabe im Dashboard
- [ ] Telegram alerts exclude `inhalt_text`
