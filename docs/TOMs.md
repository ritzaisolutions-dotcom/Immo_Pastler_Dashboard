# Technisch-organisatorische Maßnahmen (TOMs)

**System:** Pastler Dashboard + E-Mail-Pipeline  
**Stand:** 2026-06-20

---

## Vertraulichkeit

| Maßnahme | Umsetzung |
|----------|-----------|
| Zugriffskontrolle | Supabase Auth; Middleware schützt Dashboard-Routen |
| Mandantentrennung | RLS: Eigentümer nur eigene Objekte; Mitarbeiter via JWT-Role |
| E-Mail-Volltext | Keine Auth-Policy auf `pastler_emails`; kein UI-Zugriff |
| Verschlüsselung Transport | HTTPS (Vercel TLS) |
| Secrets | `.env*` in `.gitignore`; Service Role nur server-side |
| Security Headers | CSP, HSTS, X-Frame-Options — [`next.config.ts`](../next.config.ts) |

## Integrität

| Maßnahme | Umsetzung |
|----------|-----------|
| Serverseitige Validierung | PATCH `/api/todos`: Status-Enum, `erledigt_at` server-seitig |
| RLS erzwingt Schreibzugriff | Supabase Policies auf `pastler_*` |
| Duplicate E-Mails | UNIQUE `message_id` |

## Verfügbarkeit

| Maßnahme | Umsetzung |
|----------|-----------|
| Hosting | Vercel + Supabase managed |
| Backups | Supabase Point-in-Time (Anbieter-default) |

## Belastbarkeit / Wiederherstellung

| Maßnahme | Umsetzung |
|----------|-----------|
| n8n LLM-Fallback | Todo auch bei Mistral-Fehler |
| Build-Gate | `npm run build` vor Release |

## Verfahren zur regelmäßigen Überprüfung

| Maßnahme | Umsetzung |
|----------|-----------|
| Security-Audit | [`docs/SECURITY_DSGVO_AUDIT.md`](./SECURITY_DSGVO_AUDIT.md) |
| RLS-Tests | [`docs/RLS_TEST.md`](./RLS_TEST.md) |
| Dependency-Scan | `npm audit --audit-level=high` |
| Retention | n8n Cron Workflows 2 + 3 |

## Organisatorisch

| Maßnahme | Umsetzung |
|----------|-----------|
| Supabase Admin | MFA, minimale Zugänge — manuell prüfen |
| n8n Zugang | Nur autorisierte Mitarbeiter |
| AV-Verträge | [`docs/AV_VERTRAEGE.md`](./AV_VERTRAEGE.md) |
