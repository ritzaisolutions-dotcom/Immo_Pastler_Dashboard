# Testprotokoll — Pastler Dashboard Demo-Abnahme

**Datum:** 29.06.2026 (aktualisiert)  
**Production:** https://immo-pastler-dashboard.vercel.app  
**Supabase:** `htyeflqymmbcjhvknjoe` (eu-central-1)  
**n8n:** https://n8n.ritz-ai.solutions  

**Manuelle Ersttest-Anleitung:** [`MANUAL_ERSTTEST_INFRASTRUKTUR.md`](./MANUAL_ERSTTEST_INFRASTRUKTUR.md)

---

## 1. Umgebung

| Variable | Status |
|----------|--------|
| `PIPELINE_TEST_INBOX` | `marco@ritz-ai.solutions` in `.env.local` |
| `SMTP_*` (lokal) | In `.env.local` gesetzt; SMTP verify OK |
| `MISTRAL_API_KEY` (Vercel) | Sync aus n8n versucht — **n8n-Key selbst 401** → neuen Key in Mistral Console + Vercel setzen |
| Migrationen 013 + 014 | Live (3 Objekte, 6 WE, 7 Gewerke) |

---

## 2. Automatisierte Checks

`node scripts/verify-demo-ui.mjs --production` → **20/20 PASS**

| Bereich | Ergebnis |
|---------|----------|
| HTTP-Routen + Auth-Gate | PASS |
| Demo-Stammdaten in Supabase | PASS |
| Chat API ohne Session | 401 PASS |

---

## 3. n8n Root-Cause (ermittelt)

| Punkt | Befund |
|-------|--------|
| Workflow | `Pastler Email Ingestion + Partner Draft` — **aktiv** |
| IMAP | Credential `marco@ritz-ai.solutions` — korrekt |
| Supabase | Credential `IM24` → `htyeflqymmbcjhvknjoe` — korrekt |
| **Fehler** | Node **Duplicate Check**: `message_id.is.undefined` — IMAP liefert bei Testmails kein `messageId` |
| Mistral | Credential **401** — Key in n8n ungültig/abgelaufen |
| Fix | Code-Node „Normalize Message ID“ + Duplicate Check auf `resolvedMessageId` — **manuell in n8n-UI** (siehe Manual) |

Testmails kamen im Postfach an (SMTP OK), landeten aber nicht in Supabase wegen Execution-Error.

---

## 4. Live-Pipeline

| Schritt | Ergebnis |
|---------|----------|
| SMTP send → `marco@ritz-ai.solutions` | PASS |
| n8n → Supabase `[Pastler-Test]*` | **FAIL** (bis Workflow-Fix + Mistral-Key) |
| Automatische n8n-API-Patches | Teilweise angewendet — **Reaktivierung in n8n-UI empfohlen** |

---

## 5. UI-Walkthrough

Nicht automatisiert (Login erforderlich). Checkliste in [`MANUAL_ERSTTEST_INFRASTRUKTUR.md`](./MANUAL_ERSTTEST_INFRASTRUKTUR.md) Phase 2.

---

## 6. Gesamtbewertung

| Bereich | Status |
|---------|--------|
| UI-Routen + Auth | PASS |
| Demo-Stammdaten | PASS |
| RPC + Bestands-Pipeline | PASS |
| Live E-Mail-Pipeline (n8n) | **FAIL** — Fix dokumentiert |
| KI-Chat (Mistral) | **BLOCKED** — gültiger API-Key fehlt |

**Demo-ready:** Nein — zuerst Phase 1 + 4 im Manual abarbeiten, dann erneut `test-email-pipeline.mjs --send`.
