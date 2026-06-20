# n8n Email → Todo Pipeline

**Instance:** `https://n8n.ritz-ai.solutions`  
**Supabase:** `htyeflqymmbcjhvknjoe` (shared with Haller) — **service role key** required  
**Purpose:** IMAP inbox → `pastler_emails` → Mistral extraction → `pastler_todos`

## Table Mapping (Shared DB)

| CLAUDE / Plan name | Actual table |
|--------------------|--------------|
| `emails` | `pastler_emails` |
| `mieter` | `pastler_mieter` |
| `todos` | `pastler_todos` |

## Workflow 1: Email Ingestion (9 nodes)

| # | Node | Configuration |
|---|------|---------------|
| 1 | IMAP Trigger | Poll every 5 min; mark as read; credentials in n8n vault |
| 2 | Supabase getAll | `pastler_emails` WHERE `message_id = {{ $json.messageId }}` |
| 3 | IF | `{{ $json.length > 0 }}` → true: Stop (NoOp); false: continue |
| 4 | Supabase insert | `pastler_emails`: message_id, von_email, von_name, betreff, inhalt_text, empfangen_at |
| 5 | Supabase getAll | `pastler_mieter` WHERE `email = {{ $('Node 4').item.json.von_email }}` |
| 6 | LLM Chain | Mistral `small-latest`, `continueOnFail: true` |
| 7 | Code Node | JSON parse + fallback (see below) |
| 8 | Supabase insert | `pastler_todos` with fields from Node 7 |
| 9 | Supabase update | `pastler_emails` SET `verarbeitet = true` WHERE `id = {{ $('Node 4').item.json.id }}` |
| 10 | IF (optional) | `prioritaet === 'hoch'` → Telegram alert (no inhalt_text) |

### Mistral Prompt

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

### Code Node (Node 7)

```javascript
const raw = $input.first().json.text || $input.first().json.output || '';
let todo;
try {
  const m = raw.match(/\{[\s\S]*\}/);
  todo = JSON.parse(m ? m[0] : raw);
} catch {
  todo = {
    titel: 'Unbekanntes Anliegen',
    beschreibung: raw.slice(0, 200),
    kategorie: 'intern',
    prioritaet: 'mittel',
    faellig_at: null,
  };
}
const mieter = $('Mieter-Lookup').all()?.[0]?.json ?? null;
return [{
  json: {
    ...todo,
    email_id: $('Raw Email').item.json.id,
    mieter_id: mieter?.id ?? null,
    inserat_id: mieter?.inserat_id ?? null,
  },
}];
```

## Workflow 2: 90-Day Email Purge (Cron)

- **Schedule:** Daily at 02:00
- **SQL:** `UPDATE pastler_emails SET inhalt_text = NULL WHERE created_at < NOW() - INTERVAL '90 days'`

## Security Checklist

- [ ] IMAP credentials in n8n Credentials vault only
- [ ] n8n uses Supabase **service role key** (server-side)
- [ ] Duplicate `message_id` rejected by UNIQUE constraint
- [ ] LLM failure → fallback todo still created (`continueOnFail: true`)
- [ ] Telegram alerts exclude `inhalt_text`
