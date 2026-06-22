# Auftragsverarbeitung — Checkliste AV-Verträge / DPA

**Verantwortlicher:** Immobilienverwaltung Pastler UG (haftungsbeschränkt)  
**Stand:** 2026-06-22  
**Ablage:** RAIS intern — PDFs/Links in `01_dashboard/docs/dpa/` ablegen (Ordner bei Bedarf anlegen)

AV-Vertrag (Art. 28 DSGVO) bzw. Data Processing Agreement (DPA) für jeden Anbieter einsammeln, prüfen und ablegen.

| Anbieter | Zweck | Region | AV/DPA | Status | Ablage |
|----------|-------|--------|--------|--------|--------|
| Supabase | DB, Auth | eu-central-1 (Frankfurt) | [Supabase DPA](https://supabase.com/legal/dpa) | ☑ online verfügbar — PDF in Ablage speichern | `dpa/supabase-dpa.pdf` |
| Vercel | Hosting, CDN | Global Edge (kein PII-Speicher im Frontend) | [Vercel DPA](https://vercel.com/legal/dpa) | ☑ online verfügbar — PDF in Ablage speichern | `dpa/vercel-dpa.pdf` |
| Mistral AI | LLM E-Mail-Extraktion | EU (Frankreich) | [Mistral DPA](https://mistral.ai/terms/data-processing-agreement) | ☑ online verfügbar — PDF in Ablage speichern | `dpa/mistral-dpa.pdf` |
| n8n (ritz-ai.solutions) | Workflow-Automatisierung | **EU-VPS** (selbst-gehostet, RAIS) | Eigene AVV mit Pastler; technisch RAIS als Auftragsverarbeiter | ☑ durch Kunden-AVV abgedeckt | Kunden-AVV Anlage A |
| IMAP-Provider (Pastler) | E-Mail-Abruf | Provider des Kunden | Vertrag Kunde ↔ Provider (Strato/Hostinger o. ä.) | ☐ Provider beim Go-Live dokumentieren | `dpa/imap-provider.txt` |
| Telegram (optional) | Hoch-Priorität-Alerts | Meta / EU | Nur Todo-Titel + Priorität, **kein** E-Mail-Text | ☑ geringes Risiko — in AVV Sub-Processor optional | — |

## Prüfpunkte pro AV-Vertrag

- [x] Verarbeitung nur auf dokumentierte Weisung (Kunden-AVV + Pilotvereinbarung)
- [x] Vertraulichkeit der Mitarbeiter (AVV §7)
- [x] Unterauftragsverarbeiter gelistet (AVV §9)
- [x] Löschung/Rückgabe nach Vertragsende (AVV §11)
- [x] Unterstützung bei Betroffenenanfragen (AVV §10, [`BETROFFENENRECHTE.md`](./BETROFFENENRECHTE.md))
- [x] TOMs beschrieben ([`TOMs.md`](./TOMs.md), Kunden-AVV §8)
- [x] Drittlandtransfer: SCC / Angemessenheitsbeschluss dokumentiert (siehe unten)

## Drittlandtransfer-Hinweise

| Anbieter | Risiko | Maßnahme | Status |
|----------|--------|----------|--------|
| Supabase | Hosting Frankfurt | eu-central-1, DPA | ☑ |
| Mistral | EU-Unternehmen | DPA, kein Training auf Kundendaten | ☑ |
| Vercel | CDN/Edge global möglich | DPA + SCC; keine PII in Edge-Cache für Dashboard | ☑ DPA eingeholt |
| n8n | Selbst-gehostet EU | Eigene Infrastruktur RAIS, keine US-Cloud | ☑ |
| IMAP-Provider | Abhängig vom Kunden | Beim Go-Live Provider notieren | ☐ bei Pastler Go-Live |

## Nächste Schritte (RAIS)

1. PDFs von Supabase, Vercel, Mistral herunterladen → `01_dashboard/docs/dpa/` ablegen.
2. Nach Go-Live: IMAP-Provider von Pastler in `imap-provider.txt` eintragen.
3. Jährliche Prüfung auf neue Sub-Processor (AVV §9: 14 Tage Vorankündigung).
