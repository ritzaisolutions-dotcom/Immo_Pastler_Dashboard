-- Idempotent demo data repair — run in Supabase SQL Editor after migrations 009–011
-- Aligns mieter/vermieter emails with seed, inserts missing emails, backfills Zuordnung via RPC

-- ─── 3a: E-Mail-Adressen an Seed angleichen ─────────────────────────────────
UPDATE public.pastler_mieter SET email = 'thomas.weber@demo-mieter.de'
  WHERE id = '22222222-2222-2222-2222-222222222201';

UPDATE public.pastler_mieter SET email = 'lisa.fischer@demo-mieter.de'
  WHERE id = '22222222-2222-2222-2222-222222222202';

UPDATE public.pastler_mieter SET email = 'michael.braun@demo-mieter.de'
  WHERE id = '22222222-2222-2222-2222-222222222203';

UPDATE public.pastler_eigentuemer SET email = 'hans.mueller@demo-pastler.de'
  WHERE name = 'Hans Müller';

UPDATE public.pastler_eigentuemer SET email = 'anna.schmidt@demo-pastler.de'
  WHERE name = 'Anna Schmidt';

UPDATE public.pastler_inserate i SET
  eigentuemer_email = e.email,
  eigentuemer_name = e.name
FROM public.pastler_eigentuemer e
WHERE i.vermieter_id = e.id;

-- ─── 3b: Fehlende Demo-E-Mails 006–008 ───────────────────────────────────────
INSERT INTO public.pastler_emails (id, message_id, von_email, von_name, betreff, inhalt_text, empfangen_at, verarbeitet) VALUES
  (
    '55555555-5555-5555-5555-555555555506',
    'demo-sales-006@pastler.local',
    'auftrag@fremd-handwerker.demo',
    'Fremd Handwerker GmbH',
    'Beleuchtung Hauptstraße 12 — Rückfrage',
    E'Guten Tag,\n\nwir wurden beauftragt, die Beleuchtung im Treppenhaus der Hauptstraße 12 in Koblenz zu prüfen. Bitte um Freigabe und Ansprechpartner vor Ort.\n\nFremd Handwerker GmbH',
    NOW() - INTERVAL '6 hours',
    true
  ),
  (
    '55555555-5555-5555-5555-555555555507',
    'demo-sales-007@pastler.local',
    'hans.mueller@demo-pastler.de',
    'Hans Müller',
    'Dachrinne Rheinweg 45',
    E'Sehr geehrte Hausverwaltung,\n\nbitte lassen Sie die Dachrinne am Objekt Rheinweg 45 in Koblenz reinigen.\n\nHans Müller (Vermieter)',
    NOW() - INTERVAL '8 hours',
    true
  ),
  (
    '55555555-5555-5555-5555-555555555508',
    'demo-sales-008@pastler.local',
    'nachbar@unbekannt.demo',
    'Nachbarin Weber',
    'Lärm von Thomas Weber',
    E'Hallo,\n\nich wohne neben Thomas Weber in der Hauptstraße 12 (3. OG links) und möchte eine Beschwerde wegen nächtlichem Lärm melden.\n\nMit freundlichen Grüßen',
    NOW() - INTERVAL '12 hours',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  von_email = EXCLUDED.von_email,
  von_name = EXCLUDED.von_name,
  betreff = EXCLUDED.betreff,
  inhalt_text = EXCLUDED.inhalt_text,
  empfangen_at = EXCLUDED.empfangen_at,
  verarbeitet = EXCLUDED.verarbeitet;

-- ─── 3c: Zuordnung per RPC backfillen ───────────────────────────────────────
WITH resolved AS (
  SELECT
    id,
    public.pastler_resolve_zuordnung(
      von_email,
      coalesce(betreff, ''),
      coalesce(inhalt_text, '')
    ) AS z
  FROM public.pastler_emails
)
UPDATE public.pastler_emails e SET
  mieter_id = NULLIF(r.z->>'mieter_id', '')::uuid,
  inserat_id = NULLIF(r.z->>'inserat_id', '')::uuid,
  vermieter_id = NULLIF(r.z->>'vermieter_id', '')::uuid,
  zuordnung_quelle = r.z->>'quelle',
  zuordnung_konfidenz = r.z->>'konfidenz'
FROM resolved r
WHERE e.id = r.id;

UPDATE public.pastler_todos t SET
  mieter_id = e.mieter_id,
  inserat_id = e.inserat_id,
  vermieter_id = e.vermieter_id,
  zuordnung_quelle = e.zuordnung_quelle,
  zuordnung_konfidenz = e.zuordnung_konfidenz
FROM public.pastler_emails e
WHERE t.email_id = e.id;
