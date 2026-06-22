# RLS-Testprotokoll — Pastler Dashboard

Wiederholbar vor jedem Release. Supabase-Projekt: `htyeflqymmbcjhvknjoe`.

---

## 1. Schema-Check

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename LIKE 'pastler_%';
-- Erwartung: alle rowsecurity = true

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename LIKE 'pastler_%'
ORDER BY tablename, policyname;
```

---

## 2. Anon-Key (ohne Login)

Supabase REST mit Anon Key:

```bash
curl "https://htyeflqymmbcjhvknjoe.supabase.co/rest/v1/pastler_inserate?select=id" \
  -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
```

**Erwartung:** `[]` für `pastler_inserate`, `pastler_mieter`, `pastler_todos`, `pastler_emails`, `pastler_partner`, `pastler_partner_nachrichten`.

---

## 3. Eigentümer-Test

Seed: `hans.mueller@example.com` (siehe `supabase/seed.sql`).

1. Als Eigentümer einloggen
2. `/dashboard` — KPIs nur für eigene Inserate
3. `/inserate` — nur eigene Objekte
4. Fremde UUID in URL `/inserate/<fremde-uuid>` → leere Sections, kein 500
5. Todo-**Beschreibung** ausgeblendet; **kein Status-Toggle** (nur Mitarbeiter)
6. **Kein** Sidebar-Link „Partner“; direkter Aufruf `/partner` → Redirect `/dashboard`
7. Partner-Entwürfe in Todos **nicht** sichtbar

---

## 4. Mitarbeiter-Test

User mit `app_metadata.role = "mitarbeiter"`.

1. Sieht alle `pastler_*` Datensätze
2. Sieht Todo-`beschreibung`
3. PATCH Status-Toggle funktioniert

---

## 5. API ohne Session

```bash
curl -X PATCH http://localhost:3000/api/todos/<uuid> \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"erledigt\"}"

curl -X POST http://localhost:3000/api/partner \
  -H "Content-Type: application/json" \
  -d "{\"firma\":\"Test\"}"
```

**Erwartung:** HTTP 401 (ohne Session). Mit Eigentümer-Session auf Partner-API: HTTP 403.

---

## 6. Haller-Daten unberührt

```sql
SELECT COUNT(*) FROM inserate;  -- erwartet: 4
SELECT COUNT(*) FROM leads;     -- erwartet: 7
```

---

## Protokoll

| Datum | Tester | Anon OK | Eigentümer OK | Mitarbeiter OK | API 401 | Notizen |
|-------|--------|---------|---------------|----------------|---------|---------|
| | | ☐ | ☐ | ☐ | ☐ | |
