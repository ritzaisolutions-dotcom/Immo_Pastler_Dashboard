# Security & DSGVO Audit — Pastler Dashboard

**Datum:** 2026-06-20  
**Scope:** Next.js Dashboard (Vercel), Supabase `htyeflqymmbcjhvknjoe`, n8n-Pipeline, Drittanbieter  
**Status:** Audit abgeschlossen — Remediation weitgehend umgesetzt  
**Hinweis:** Keine Rechtsberatung

**→ Schritt-für-Schritt abarbeiten:** [`AUDIT_ARBEITSPLAN.md`](./AUDIT_ARBEITSPLAN.md) (Hauptdokument mit Checkboxen)

**Detail-Dokumente:**

- [`VERARBEITUNGSVERZEICHNIS.md`](./VERARBEITUNGSVERZEICHNIS.md)
- [`AV_VERTRAEGE.md`](./AV_VERTRAEGE.md)
- [`BETROFFENENRECHTE.md`](./BETROFFENENRECHTE.md)
- [`TOMs.md`](./TOMs.md)
- [`RLS_TEST.md`](./RLS_TEST.md)

---

## 1. Systemüberblick

Siehe [`VERARBEITUNGSVERZEICHNIS.md`](./VERARBEITUNGSVERZEICHNIS.md) für Datenflüsse und Zwecke.

**Abgrenzung:** [pastler.com](https://pastler.com/) — öffentliche Website mit eigenen Datenschutzhinweisen. Dashboard: internes Tool unter `/datenschutz`.

---

## 2. Security-Befunde

| ID | Schwere | Befund | Status |
|----|---------|--------|--------|
| S1 | **Hoch** | Vercel Env-Vars | **Erledigt** Production + Development; Preview optional |
| S2 | Mittel | CSP, HSTS, Permissions-Policy | **Erledigt** — `next.config.ts` |
| S3 | Mittel | API außerhalb Proxy | **Erledigt** — Matcher + 401 in `proxy.ts` |
| S4 | Mittel | Kein Rate Limiting | **Erledigt** — 30 req/min/IP in `proxy.ts` |
| S5 | Niedrig | 2 moderate npm advisories (postcss) | Info — kein HIGH/CRITICAL |
| S6 | Info | Keine Secrets in Source | OK |
| S7 | Info | Kein `console.log` / kein `inhalt_text` in `app/` | OK |
| S8 | Mittel | Shared Supabase mit Haller | Dokumentiert — MFA/Admin-Zugang manuell prüfen |

### RLS (Supabase)

| ID | Status |
|----|--------|
| S9–S13 | OK — Migrationen 002–004 |
| S14 | OK — Anon → leer (alle 6 Tabellen, 2026-06-21) |
| S18 | **Hoch — Offen** — Production Middleware `MIDDLEWARE_INVOCATION_FAILED`; Redeploy erforderlich |

### n8n

| ID | Status |
|----|--------|
| S15 | **Offen (manuell)** — Live-Check auf n8n.ritz-ai.solutions |
| S16 | **Erledigt (Doku)** — Execution-Log-Retention in `n8n/README.md` |
| S17 | **Offen (manuell)** — Telegram ohne `inhalt_text` verifizieren |

---

## 3. DSGVO-Befunde

| ID | Anforderung | Status |
|----|-------------|--------|
| D1 | Verantwortlicher dokumentiert | **Erledigt** — `/datenschutz` |
| D2 | Zweckbindung | **Erledigt** — `VERARBEITUNGSVERZEICHNIS.md` |
| D3 | Datenminimierung | **Erledigt** — kein `inhalt_text` in UI |
| D4 | Speicherbegrenzung | **Erledigt** — Retention Migration 005 + n8n Workflow 3 |
| D5 | TOMs | **Erledigt** — `TOMs.md` |
| D6 | Auftragsverarbeitung | **Erledigt (Checkliste)** — `AV_VERTRAEGE.md`; Verträge einholen: offen |
| D7 | Drittlandtransfer | Dokumentiert in AV-Checkliste |
| D8 | Betroffenenrechte | **Erledigt** — `BETROFFENENRECHTE.md` |
| D9 | Informationspflicht Mieter | Organisatorisch (Vertrag/E-Mail) |
| D10 | Todo-Beschreibung für Eigentümer | **Erledigt** — UI maskiert für Nicht-Mitarbeiter |
| D11 | Cookie/Auth | **Erledigt** — `/datenschutz` |
| D12 | Trennung Haller/Pastler | **Erledigt** — Verarbeitungsverzeichnis |

---

## 4. Test-Checkliste

Automatisiert:

```bash
npm run audit:security
```

Manuell: [`RLS_TEST.md`](./RLS_TEST.md)

---

## 5. Offene manuelle Schritte

1. **Vercel Production-Redeploy** — erledigt (`proxy.ts`-Migration). Kurz-Alias `immo-pastler-dashboard.vercel.app` liefert derzeit `NOT_FOUND`; Team-URL `immo-pastler-dashboard-ritzaisolutions-6158s-projects.vercel.app` antwortet (Deployment Protection → 401 ohne SSO-Bypass).
2. **Vercel Preview-Env** für alle Branches (optional) + `SMTP_*` in Production
3. **n8n** Workflows 1–3 live aktivieren und Checkliste abhaken
4. **AV-Verträge** einsammeln (`AV_VERTRAEGE.md`)
5. **Supabase Admin:** MFA aktivieren
6. **Rollen-Tests** Eigentümer/Mitarbeiter manuell (Phase E3/E4)

---

## 6. Änderungshistorie

| Datum | Änderung |
|-------|----------|
| 2026-06-20 | Erstaudit; Headers; `/datenschutz`; Middleware |
| 2026-06-20 | Vollständige Remediation: DSGVO-Docs, Rate Limit, Retention, Eigentümer-Maskierung, RLS-Tests, Audit-Script |
| 2026-06-21 | Audit-Fortsetzung: Partner-Zugriff, `middleware.ts`→`proxy.ts` (S18), erweitertes `audit:security`, RLS verifiziert |
