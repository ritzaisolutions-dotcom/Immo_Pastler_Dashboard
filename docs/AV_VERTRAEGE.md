# Auftragsverarbeitung — Checkliste AV-Verträge / DPA

**Verantwortlicher:** Immobilienverwaltung Pastler UG (haftungsbeschränkt)  
**Stand:** 2026-06-20

AV-Vertrag (Art. 28 DSGVO) bzw. Data Processing Agreement (DPA) für jeden Anbieter einsammeln, prüfen und ablegen.

| Anbieter | Zweck | Region | AV/DPA | Status | Ablage |
|----------|-------|--------|--------|--------|--------|
| Supabase | DB, Auth | eu-central-1 | [Supabase DPA](https://supabase.com/legal/dpa) | ☐ einholen | |
| Vercel | Hosting, CDN | Global/EU | [Vercel DPA](https://vercel.com/legal/dpa) | ☐ einholen | |
| Mistral AI | LLM E-Mail-Extraktion | EU | Mistral Enterprise DPA | ☐ einholen | |
| n8n (ritz-ai.solutions) | Workflow-Automatisierung | **Standort klären** | Mit Betreiber vereinbaren | ☐ einholen | |
| IMAP-Provider | E-Mail-Abruf | **Provider klären** | Provider-AV | ☐ einholen | |
| Telegram (optional) | Hoch-Priorität-Alerts | — | Nur Metadaten, kein E-Mail-Text | ☐ prüfen | |

## Prüfpunkte pro AV-Vertrag

- [ ] Verarbeitung nur auf dokumentierte Weisung
- [ ] Vertraulichkeit der Mitarbeiter
- [ ] Unterauftragsverarbeiter gelistet
- [ ] Löschung/Rückgabe nach Vertragsende
- [ ] Unterstützung bei Betroffenenanfragen (Art. 28(3)(e))
- [ ] TOMs beschrieben oder referenziert
- [ ] Drittlandtransfer: SCC / Angemessenheitsbeschluss dokumentiert

## Drittlandtransfer-Hinweise

| Anbieter | Risiko | Maßnahme |
|----------|--------|----------|
| Vercel | CDN/Edge global möglich | DPA + SCC prüfen; EU-Region bevorzugen |
| Mistral | EU-Hosting | DPA bestätigen |
| n8n | Unbekannt | Hosting-Standort mit Betreiber klären |
