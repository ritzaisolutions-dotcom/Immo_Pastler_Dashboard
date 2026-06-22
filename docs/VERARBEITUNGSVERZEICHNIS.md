# Verarbeitungsverzeichnis — Pastler Dashboard

**Verantwortlicher:** Immobilienverwaltung Pastler UG (haftungsbeschränkt)  
**Kontakt:** hausverwaltung@pastler.com · 0261 1349 4710  
**Stand:** 2026-06-22  
**Hinweis:** Arbeitsgrundlage gemäß Art. 30 DSGVO — keine Rechtsberatung

---

## VV-1: Internes Verwaltungs-Dashboard

| Feld | Inhalt |
|------|--------|
| **Zweck** | Operative Immobilienverwaltung: Objekte, Mieter, To-Dos, KPIs |
| **Rechtsgrundlage** | Art. 6(1)(b) DSGVO (Verwaltungsvertrag mit Eigentümern); Art. 6(1)(f) (IT-Betrieb) |
| **Kategorien betroffener Personen** | Mieter, WEG-Eigentümer, Mitarbeiter |
| **Datenkategorien** | Name, E-Mail, Telefon, Adresse, Einheit, Vertragsdaten, Todo-Status |
| **Empfänger** | Berechtigte Mitarbeiter; Eigentümer (nur eigene Objekte via RLS) |
| **Speicherdauer** | Vertragslaufzeit + gesetzliche Aufbewahrungsfristen (HGB/AO) |
| **TOMs** | [`docs/TOMs.md`](./TOMs.md) |
| **Technik** | Next.js auf Vercel, Supabase `eu-central-1`, Tabellen `pastler_*` |

---

## VV-2: E-Mail-Ingestion → To-Do-Automatisierung

| Feld | Inhalt |
|------|--------|
| **Zweck** | Eingehende Verwaltungs-E-Mails strukturieren, To-Dos erzeugen |
| **Rechtsgrundlage** | Art. 6(1)(b) oder Art. 6(1)(f) — mit Verantwortlichem bestätigen |
| **Kategorien betroffener Personen** | Mieter, Eigentümer, Dienstleister (E-Mail-Absender) |
| **Datenkategorien** | E-Mail-Adresse, Name, Betreff, Volltext, extrahierte Todo-Felder |
| **Empfänger** | n8n (Workflow), Mistral (LLM), Supabase (Speicher) |
| **Speicherdauer** | Siehe Retention-Matrix unten |
| **TOMs** | Kein UI-Zugriff auf `inhalt_text`; RLS; 90-Tage-Löschung Volltext |
| **Technik** | n8n @ `n8n.ritz-ai.solutions`, IMAP, Mistral `small-latest` (EU) |

**Erweiterung (Partner-Automatisierung):** Bei externem Handwerkerbedarf erzeugt n8n einen E-Mail-**Entwurf** in `pastler_partner_nachrichten` (Status `entwurf`). Versand erfolgt erst nach manueller Freigabe durch Mitarbeiter im Dashboard (SMTP).

### Retention-Matrix

| Daten | Speicherdauer | Mechanismus |
|-------|---------------|-------------|
| `pastler_emails.inhalt_text` | max. 90 Tage | n8n Cron Workflow 2 |
| E-Mail-Metadaten | 180 Tage anonymisiert, 365 Tage gelöscht | n8n Cron Workflow 3 |
| `pastler_todos.beschreibung` (erledigt) | max. 365 Tage | n8n Cron Workflow 3c |
| Todo-Titel | Verwaltungszweck | Bis manuelle Löschung / Vertragsende |

---

## VV-3: Benutzer-Authentifizierung

| Feld | Inhalt |
|------|--------|
| **Zweck** | Zugriffskontrolle auf internes Dashboard |
| **Rechtsgrundlage** | Art. 6(1)(f) DSGVO (IT-Sicherheit) |
| **Betroffene** | Mitarbeiter, Eigentümer mit Dashboard-Zugang |
| **Datenkategorien** | E-Mail, Session-Cookie, JWT (`app_metadata.role`) |
| **Speicherdauer** | Session bis Abmeldung; Auth-Logs gemäß Supabase-Richtlinie |
| **Technik** | Supabase Auth, HttpOnly Cookies |

---

## VV-4: Partner-Verwaltung & Partner-Kommunikation

| Feld | Inhalt |
|------|--------|
| **Zweck** | Verwaltung externer Dienstleister (Handwerker); strukturierte Anfragen bei Mängeln |
| **Rechtsgrundlage** | Art. 6(1)(b) DSGVO (Verwaltungsvertrag); Art. 6(1)(f) (betriebliche Kommunikation) |
| **Kategorien betroffener Personen** | Partner (Firmen, Ansprechpartner), indirekt Mieter (über Todo-Kontext) |
| **Datenkategorien** | Firma, Adresse, E-Mail, Telefon, Gewerk, Notizen; Entwürfe/Gesendete Partner-E-Mails |
| **Empfänger** | Berechtigte Mitarbeiter (CRUD, Freigabe); Partner (nach manuellem Versand) |
| **Speicherdauer** | Partner-Stammdaten: Dauer der Geschäftsbeziehung; Nachrichten: Verwaltungszweck + Aufbewahrungsfristen |
| **TOMs** | RLS — Eigentümer kein Zugriff; kein Auto-Versand; SMTP nur serverseitig |
| **Technik** | Dashboard `/partner`, Tabellen `pastler_partner`, `pastler_partner_nachrichten` |

---

## VV-5: Öffentliche Website — Kontaktformular

| Feld | Inhalt |
|------|--------|
| **Zweck** | Kontaktanfragen von Website-Besuchern (Eigentümer-Interessenten) entgegennehmen |
| **Rechtsgrundlage** | Art. 6(1)(a) DSGVO (Einwilligung via Checkbox); Art. 6(1)(b) bei bestehendem Vertragsverhältnis |
| **Kategorien betroffener Personen** | Website-Besucher, potenzielle Auftraggeber |
| **Datenkategorien** | Name, E-Mail, Anliegen-Kategorie, Nachrichtentext, Zeitstempel |
| **Empfänger** | n8n (Weiterleitung), E-Mail-Postfach `hausverwaltung@pastler.com` — **keine** Speicherung in Supabase durch RAIS |
| **Speicherdauer** | E-Mail-Postfach des Verantwortlichen gemäß internen Aufbewahrungsrichtlinien |
| **TOMs** | HTTPS, Webhook-Auth (Bearer Secret), Rate-Limiting auf `/api/contact` |
| **Technik** | Next.js `02_websites`, n8n Workflow `pastler-kontakt`, siehe [`02_websites/DEPLOYMENT.md`](../../02_websites/DEPLOYMENT.md) |

**Hinweis:** VV-5 betrifft nur das Kontaktformular auf [pastler.com](https://pastler.com). Das interne Dashboard (VV-1–4) ist nicht öffentlich zugänglich.

---

## Auftragsverarbeiter

Siehe [`docs/AV_VERTRAEGE.md`](./AV_VERTRAEGE.md).

---

## Trennung Haller / Pastler

Gemeinsame Supabase-Instanz `htyeflqymmbcjhvknjoe`. Pastler nutzt ausschließlich `pastler_*`-Tabellen; Haller nutzt `inserate`, `leads`, `besichtigungsslots`. Getrennte Zwecke im Verarbeitungsverzeichnis dokumentiert; technische Trennung via Tabellenprefix + RLS.

---

## Abgrenzung pastler.com

Die öffentliche Website [pastler.com](https://pastler.com) hat eigene Verarbeitungszwecke (Marketing, Kontaktformular — siehe **VV-5**). Das interne Dashboard ist nicht öffentlich zugänglich. Datenschutzerklärung der Website: `/datenschutz` auf pastler.com.
