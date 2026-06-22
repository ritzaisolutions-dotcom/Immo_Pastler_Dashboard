-- 012: Pipeline-Reparatur + Zuordnung RPC (Adresse über alle Inserate)
-- Inhalt identisch mit supabase/scripts/repair_pipeline_gaps.sql

CREATE OR REPLACE FUNCTION public.pastler_resolve_zuordnung(
  p_von_email TEXT,
  p_betreff TEXT,
  p_inhalt TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_text TEXT;
  v_mieter_id UUID;
  v_inserat_id UUID;
  v_vermieter_id UUID;
  v_sender_vermieter_id UUID;
  v_quelle TEXT := 'unbekannt';
  v_konfidenz TEXT := 'niedrig';
  r RECORD;
  v_match_len INT;
  v_best_len INT := 0;
  v_best_inserat_id UUID;
  v_best_vermieter_id UUID;
  v_strong_object BOOLEAN := false;
BEGIN
  v_text := public.pastler_normalize_match_text(coalesce(p_betreff, '') || ' ' || coalesce(p_inhalt, ''));

  SELECT m.id, m.inserat_id, i.vermieter_id
  INTO v_mieter_id, v_inserat_id, v_vermieter_id
  FROM pastler_mieter m
  LEFT JOIN pastler_inserate i ON i.id = m.inserat_id
  WHERE m.email IS NOT NULL
    AND lower(trim(m.email)) = lower(trim(coalesce(p_von_email, '')))
  LIMIT 1;

  IF v_mieter_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'mieter_id', v_mieter_id,
      'inserat_id', v_inserat_id,
      'vermieter_id', v_vermieter_id,
      'quelle', 'absender_mieter',
      'konfidenz', 'hoch'
    );
  END IF;

  SELECT id INTO v_vermieter_id
  FROM pastler_eigentuemer
  WHERE lower(trim(email)) = lower(trim(coalesce(p_von_email, '')))
  LIMIT 1;

  v_sender_vermieter_id := v_vermieter_id;

  IF v_vermieter_id IS NOT NULL THEN
    v_quelle := 'absender_vermieter';
    v_konfidenz := 'hoch';
  END IF;

  FOR r IN
    SELECT i.id, i.adresse, i.plz, i.stadt, i.vermieter_id
    FROM pastler_inserate i
  LOOP
    v_match_len := 0;

    IF r.adresse IS NOT NULL AND length(trim(r.adresse)) >= 8
       AND position(public.pastler_normalize_match_text(r.adresse) IN v_text) > 0 THEN
      v_match_len := greatest(v_match_len, length(trim(r.adresse)));
    END IF;

    IF r.plz IS NOT NULL AND length(trim(r.plz)) >= 4
       AND position(public.pastler_normalize_match_text(r.plz) IN v_text) > 0 THEN
      v_match_len := greatest(v_match_len, 4);
    END IF;

    IF r.stadt IS NOT NULL AND length(trim(r.stadt)) >= 3
       AND position(public.pastler_normalize_match_text(r.stadt) IN v_text) > 0
       AND (v_sender_vermieter_id IS NULL OR r.vermieter_id = v_sender_vermieter_id) THEN
      v_match_len := greatest(v_match_len, length(trim(r.stadt)));
    END IF;

    IF v_match_len > v_best_len THEN
      v_best_len := v_match_len;
      v_best_inserat_id := r.id;
      v_best_vermieter_id := r.vermieter_id;
    END IF;
  END LOOP;

  IF v_best_inserat_id IS NOT NULL THEN
    v_inserat_id := v_best_inserat_id;

    SELECT EXISTS (
      SELECT 1 FROM pastler_inserate i
      WHERE i.id = v_best_inserat_id
        AND i.adresse IS NOT NULL
        AND length(trim(i.adresse)) >= 8
        AND position(public.pastler_normalize_match_text(i.adresse) IN v_text) > 0
    ) INTO v_strong_object;

    IF v_strong_object OR v_sender_vermieter_id IS NULL THEN
      v_vermieter_id := v_best_vermieter_id;
    END IF;

    IF v_sender_vermieter_id IS NOT NULL
       AND v_best_vermieter_id = v_sender_vermieter_id
       AND NOT v_strong_object THEN
      v_quelle := 'absender_vermieter';
      v_konfidenz := 'hoch';
    ELSE
      v_quelle := 'inhalt_objekt';
      v_konfidenz := 'mittel';
    END IF;
  END IF;

  IF v_inserat_id IS NOT NULL THEN
    SELECT m.id INTO v_mieter_id
    FROM pastler_mieter m
    WHERE m.inserat_id = v_inserat_id
      AND m.einheit_nr IS NOT NULL
      AND length(trim(m.einheit_nr)) >= 2
      AND position(public.pastler_normalize_match_text(m.einheit_nr) IN v_text) > 0
    ORDER BY length(trim(m.einheit_nr)) DESC
    LIMIT 1;

    IF v_mieter_id IS NOT NULL THEN
      v_quelle := 'inhalt_einheit';
      v_konfidenz := 'mittel';
    END IF;
  END IF;

  IF v_mieter_id IS NULL THEN
    FOR r IN
      SELECT m.id, m.inserat_id, m.name, i.vermieter_id
      FROM pastler_mieter m
      LEFT JOIN pastler_inserate i ON i.id = m.inserat_id
      WHERE length(trim(m.name)) >= 3
        AND position(public.pastler_normalize_match_text(m.name) IN v_text) > 0
      ORDER BY length(trim(m.name)) DESC
      LIMIT 1
    LOOP
      v_mieter_id := r.id;
      v_inserat_id := coalesce(v_inserat_id, r.inserat_id);
      v_vermieter_id := coalesce(v_vermieter_id, r.vermieter_id);
      v_quelle := 'inhalt_mieter_name';
      v_konfidenz := 'niedrig';
      EXIT;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'mieter_id', v_mieter_id,
    'inserat_id', v_inserat_id,
    'vermieter_id', v_vermieter_id,
    'quelle', v_quelle,
    'konfidenz', v_konfidenz
  );
END;
$$;

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

UPDATE public.pastler_emails e SET verarbeitet = true
WHERE e.id = '55555555-5555-5555-5555-555555555505'
  AND EXISTS (
    SELECT 1 FROM public.pastler_todos t WHERE t.email_id = e.id
  );

INSERT INTO public.pastler_todos (
  id, email_id, mieter_id, inserat_id, vermieter_id,
  partner_id, use_case, gewerk, zuordnung_quelle, zuordnung_konfidenz,
  titel, beschreibung, kategorie, prioritaet, status, faellig_at
)
SELECT
  v.id,
  e.id,
  e.mieter_id,
  e.inserat_id,
  e.vermieter_id,
  v.partner_id,
  v.use_case,
  v.gewerk,
  e.zuordnung_quelle,
  e.zuordnung_konfidenz,
  v.titel,
  v.beschreibung,
  v.kategorie,
  v.prioritaet,
  v.status,
  v.faellig_at
FROM (VALUES
  (
    '33333333-3333-3333-3333-333333333308'::uuid,
    '55555555-5555-5555-5555-555555555506'::uuid,
    NULL::uuid, NULL::text, NULL::text,
    'Fremdhandwerker — Beleuchtung Hauptstraße 12',
    'Unbekannter Absender, Objektadresse im Text erkannt — Freigabe klären.',
    'intern', 'mittel', 'offen', CURRENT_DATE + 3
  ),
  (
    '33333333-3333-3333-3333-333333333309'::uuid,
    '55555555-5555-5555-5555-555555555507'::uuid,
    NULL::uuid, NULL::text, NULL::text,
    'Dachrinne Rheinweg 45 reinigen',
    'Vermieter meldet Reinigungsbedarf am Objekt Rheinweg 45.',
    'intern', 'mittel', 'offen', CURRENT_DATE + 7
  ),
  (
    '33333333-3333-3333-3333-333333333310'::uuid,
    '55555555-5555-5555-5555-555555555508'::uuid,
    NULL::uuid, NULL::text, NULL::text,
    'Lärmbeschwerde Nachbar — Thomas Weber',
    'Mietername im Text erkannt, Absender unbekannt — Rücksprache mit Mieter.',
    'mieter', 'mittel', 'offen', CURRENT_DATE + 2
  )
) AS v(id, email_ref, partner_id, use_case, gewerk, titel, beschreibung, kategorie, prioritaet, status, faellig_at)
JOIN public.pastler_emails e ON e.id = v.email_ref
ON CONFLICT (id) DO UPDATE SET
  email_id = EXCLUDED.email_id,
  mieter_id = EXCLUDED.mieter_id,
  inserat_id = EXCLUDED.inserat_id,
  vermieter_id = EXCLUDED.vermieter_id,
  zuordnung_quelle = EXCLUDED.zuordnung_quelle,
  zuordnung_konfidenz = EXCLUDED.zuordnung_konfidenz,
  titel = EXCLUDED.titel,
  beschreibung = EXCLUDED.beschreibung,
  kategorie = EXCLUDED.kategorie,
  prioritaet = EXCLUDED.prioritaet,
  status = EXCLUDED.status,
  faellig_at = EXCLUDED.faellig_at;

INSERT INTO public.pastler_partner_nachrichten (id, todo_id, partner_id, betreff, inhalt, status)
SELECT
  '66666666-6666-6666-6666-666666666604',
  t.id,
  t.partner_id,
  'Reinigung Mülltonnenbereich — Rheinweg 45',
  E'Sehr geehrte Damen und Herren,

unser Mieter meldet einen überfüllten Mülltonnenbereich im Hinterhof.

Objekt: Rheinweg 45, 56073 Koblenz
Bitte um zeitnahe Reinigung.

Mit freundlichen Grüßen
Pastler Immobilienberatung',
  'entwurf'
FROM public.pastler_todos t
WHERE t.id = '33333333-3333-3333-3333-333333333305'
  AND t.partner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.pastler_partner_nachrichten pn WHERE pn.todo_id = t.id
  );

UPDATE public.pastler_todos t SET
  mieter_id = e.mieter_id,
  inserat_id = e.inserat_id,
  vermieter_id = e.vermieter_id,
  zuordnung_quelle = e.zuordnung_quelle,
  zuordnung_konfidenz = e.zuordnung_konfidenz
FROM public.pastler_emails e
WHERE t.email_id = e.id;
