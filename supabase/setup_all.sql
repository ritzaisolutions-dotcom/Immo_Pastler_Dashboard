-- ═══════════════════════════════════════════════════════════════════════════
-- Pastler Dashboard — Komplettes Setup (Migrationen 002–010 + Seed)
-- Einmalig im Supabase SQL Editor ausführen
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 002: Basistabellen ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pastler_inserate (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adresse           TEXT NOT NULL,
  plz               TEXT,
  stadt             TEXT,
  typ               TEXT CHECK (typ IN ('WEG','Mietsverwaltung','Sondereigentum')),
  eigentuemer_name  TEXT,
  eigentuemer_email TEXT,
  einheiten         INTEGER DEFAULT 1,
  notizen           TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pastler_mieter (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inserat_id    UUID REFERENCES public.pastler_inserate(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  email         TEXT,
  telefon       TEXT,
  einheit_nr    TEXT,
  einzug_datum  DATE,
  auszug_datum  DATE,
  status        TEXT DEFAULT 'aktiv' CHECK (status IN ('aktiv','ausgezogen','gekuendigt')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pastler_emails (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    TEXT UNIQUE NOT NULL,
  von_email     TEXT NOT NULL,
  von_name      TEXT,
  betreff       TEXT,
  inhalt_text   TEXT,
  empfangen_at  TIMESTAMPTZ NOT NULL,
  verarbeitet   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pastler_todos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id      UUID REFERENCES public.pastler_emails(id) ON DELETE SET NULL,
  mieter_id     UUID REFERENCES public.pastler_mieter(id) ON DELETE SET NULL,
  inserat_id    UUID REFERENCES public.pastler_inserate(id) ON DELETE SET NULL,
  titel         TEXT NOT NULL,
  beschreibung  TEXT,
  kategorie     TEXT CHECK (kategorie IN ('extern','mieter','intern')),
  prioritaet    TEXT DEFAULT 'mittel' CHECK (prioritaet IN ('hoch','mittel','niedrig')),
  status        TEXT DEFAULT 'offen' CHECK (status IN ('offen','in_bearbeitung','erledigt','abgelehnt')),
  faellig_at    DATE,
  erledigt_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pastler_inserate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastler_mieter   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastler_emails   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastler_todos    ENABLE ROW LEVEL SECURITY;

-- ─── 003: RLS Mitarbeiter + Eigentümer ────────────────────────────────────

DROP POLICY IF EXISTS "mitarbeiter_pastler_inserate" ON public.pastler_inserate;
CREATE POLICY "mitarbeiter_pastler_inserate" ON public.pastler_inserate
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

DROP POLICY IF EXISTS "mitarbeiter_pastler_mieter" ON public.pastler_mieter;
CREATE POLICY "mitarbeiter_pastler_mieter" ON public.pastler_mieter
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

DROP POLICY IF EXISTS "mitarbeiter_pastler_todos" ON public.pastler_todos;
CREATE POLICY "mitarbeiter_pastler_todos" ON public.pastler_todos
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

-- ─── 005a: Eigentümer read-only ────────────────────────────────────────────

DROP POLICY IF EXISTS "eigentümer_pastler_inserate" ON public.pastler_inserate;
DROP POLICY IF EXISTS "eigentümer_select_pastler_inserate" ON public.pastler_inserate;
CREATE POLICY "eigentümer_select_pastler_inserate_legacy" ON public.pastler_inserate
  FOR SELECT TO authenticated
  USING (eigentuemer_email = auth.email());

DROP POLICY IF EXISTS "eigentümer_pastler_mieter" ON public.pastler_mieter;
DROP POLICY IF EXISTS "eigentümer_select_pastler_mieter" ON public.pastler_mieter;
CREATE POLICY "eigentümer_select_pastler_mieter_legacy" ON public.pastler_mieter
  FOR SELECT TO authenticated
  USING (
    inserat_id IN (
      SELECT id FROM public.pastler_inserate WHERE eigentuemer_email = auth.email()
    )
  );

DROP POLICY IF EXISTS "eigentümer_pastler_todos" ON public.pastler_todos;
DROP POLICY IF EXISTS "eigentümer_select_pastler_todos" ON public.pastler_todos;
CREATE POLICY "eigentümer_select_pastler_todos_legacy" ON public.pastler_todos
  FOR SELECT TO authenticated
  USING (
    inserat_id IN (
      SELECT id FROM public.pastler_inserate WHERE eigentuemer_email = auth.email()
    )
  );

-- ─── 007: Partner + Nachrichten ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pastler_partner (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firma           TEXT NOT NULL,
  ansprechpartner TEXT,
  adresse         TEXT,
  plz             TEXT,
  stadt           TEXT,
  email           TEXT NOT NULL,
  telefon         TEXT,
  gewerk          TEXT NOT NULL CHECK (gewerk IN (
    'elektriker', 'sanitaer', 'schluessel', 'reinigung', 'hausmeister', 'allgemein'
  )),
  notizen         TEXT,
  aktiv           BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pastler_todos
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.pastler_partner(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS use_case TEXT,
  ADD COLUMN IF NOT EXISTS gewerk TEXT CHECK (gewerk IN (
    'elektriker', 'sanitaer', 'schluessel', 'reinigung', 'hausmeister', 'allgemein'
  ));

CREATE TABLE IF NOT EXISTS public.pastler_partner_nachrichten (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_id       UUID NOT NULL REFERENCES public.pastler_todos(id) ON DELETE CASCADE,
  partner_id    UUID NOT NULL REFERENCES public.pastler_partner(id) ON DELETE CASCADE,
  betreff       TEXT NOT NULL,
  inhalt        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'entwurf' CHECK (status IN ('entwurf', 'gesendet', 'abgelehnt')),
  gesendet_at   TIMESTAMPTZ,
  gesendet_von  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pastler_partner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastler_partner_nachrichten ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mitarbeiter_pastler_partner" ON public.pastler_partner;
CREATE POLICY "mitarbeiter_pastler_partner" ON public.pastler_partner
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

DROP POLICY IF EXISTS "mitarbeiter_pastler_partner_nachrichten" ON public.pastler_partner_nachrichten;
CREATE POLICY "mitarbeiter_pastler_partner_nachrichten" ON public.pastler_partner_nachrichten
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

CREATE INDEX IF NOT EXISTS idx_partner_nachrichten_partner_id
  ON public.pastler_partner_nachrichten(partner_id);

-- ─── 008: Retention RPCs ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.pastler_retention_purge_email_body_90d()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE affected integer;
BEGIN
  UPDATE pastler_emails SET inhalt_text = NULL
  WHERE created_at < NOW() - INTERVAL '90 days' AND inhalt_text IS NOT NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION public.pastler_retention_anonymize_emails_180d()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE affected integer;
BEGIN
  UPDATE pastler_emails SET von_email = 'redacted@deleted.local', von_name = NULL, betreff = '[gelöscht]'
  WHERE created_at < NOW() - INTERVAL '180 days' AND inhalt_text IS NULL AND von_email <> 'redacted@deleted.local';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION public.pastler_retention_delete_emails_365d()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE affected integer;
BEGIN
  DELETE FROM pastler_emails WHERE created_at < NOW() - INTERVAL '365 days';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION public.pastler_retention_clear_todo_descriptions_365d()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE affected integer;
BEGIN
  UPDATE pastler_todos SET beschreibung = NULL
  WHERE status = 'erledigt' AND created_at < NOW() - INTERVAL '365 days' AND beschreibung IS NOT NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.pastler_retention_purge_email_body_90d() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pastler_retention_anonymize_emails_180d() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pastler_retention_delete_emails_365d() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pastler_retention_clear_todo_descriptions_365d() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pastler_retention_purge_email_body_90d() TO service_role;
GRANT EXECUTE ON FUNCTION public.pastler_retention_anonymize_emails_180d() TO service_role;
GRANT EXECUTE ON FUNCTION public.pastler_retention_delete_emails_365d() TO service_role;
GRANT EXECUTE ON FUNCTION public.pastler_retention_clear_todo_descriptions_365d() TO service_role;

-- ─── 009: Inserat-Bild + E-Mail-Lesezugriff Mitarbeiter ───────────────────

ALTER TABLE public.pastler_inserate ADD COLUMN IF NOT EXISTS bild_url TEXT;

DROP POLICY IF EXISTS "mitarbeiter_select_pastler_emails" ON public.pastler_emails;
CREATE POLICY "mitarbeiter_select_pastler_emails" ON public.pastler_emails
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('pastler-inserate', 'pastler-inserate', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "mitarbeiter_insert_pastler_inserate_storage" ON storage.objects;
CREATE POLICY "mitarbeiter_insert_pastler_inserate_storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pastler-inserate' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

DROP POLICY IF EXISTS "mitarbeiter_update_pastler_inserate_storage" ON storage.objects;
CREATE POLICY "mitarbeiter_update_pastler_inserate_storage" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'pastler-inserate' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

DROP POLICY IF EXISTS "mitarbeiter_delete_pastler_inserate_storage" ON storage.objects;
CREATE POLICY "mitarbeiter_delete_pastler_inserate_storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'pastler-inserate' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

DROP POLICY IF EXISTS "public_read_pastler_inserate_storage" ON storage.objects;
CREATE POLICY "public_read_pastler_inserate_storage" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'pastler-inserate');

-- ─── 010: Vermieter-Stammdaten, Profilfelder, Zuordnung ───────────────────

CREATE TABLE IF NOT EXISTS public.pastler_eigentuemer (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  firma         TEXT,
  email         TEXT NOT NULL UNIQUE,
  telefon       TEXT,
  adresse       TEXT,
  plz           TEXT,
  stadt         TEXT,
  beschreibung  TEXT,
  notizen       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pastler_eigentuemer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mitarbeiter_pastler_eigentuemer" ON public.pastler_eigentuemer;
CREATE POLICY "mitarbeiter_pastler_eigentuemer" ON public.pastler_eigentuemer
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

DROP POLICY IF EXISTS "eigentuemer_select_pastler_eigentuemer" ON public.pastler_eigentuemer;
CREATE POLICY "eigentuemer_select_pastler_eigentuemer" ON public.pastler_eigentuemer
  FOR SELECT TO authenticated
  USING (email = auth.email());

ALTER TABLE public.pastler_inserate
  ADD COLUMN IF NOT EXISTS vermieter_id UUID REFERENCES public.pastler_eigentuemer(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS beschreibung TEXT;

ALTER TABLE public.pastler_mieter
  ADD COLUMN IF NOT EXISTS adresse TEXT,
  ADD COLUMN IF NOT EXISTS plz TEXT,
  ADD COLUMN IF NOT EXISTS stadt TEXT,
  ADD COLUMN IF NOT EXISTS notizen TEXT;

ALTER TABLE public.pastler_partner
  ADD COLUMN IF NOT EXISTS beschreibung TEXT;

ALTER TABLE public.pastler_emails
  ADD COLUMN IF NOT EXISTS mieter_id UUID REFERENCES public.pastler_mieter(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS inserat_id UUID REFERENCES public.pastler_inserate(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vermieter_id UUID REFERENCES public.pastler_eigentuemer(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS zuordnung_quelle TEXT,
  ADD COLUMN IF NOT EXISTS zuordnung_konfidenz TEXT;

ALTER TABLE public.pastler_todos
  ADD COLUMN IF NOT EXISTS vermieter_id UUID REFERENCES public.pastler_eigentuemer(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS zuordnung_quelle TEXT,
  ADD COLUMN IF NOT EXISTS zuordnung_konfidenz TEXT;

-- Drop legacy eigentümer policies (replaced by vermieter_id-based RLS below)
DROP POLICY IF EXISTS "eigentümer_select_pastler_inserate_legacy" ON public.pastler_inserate;
DROP POLICY IF EXISTS "eigentümer_select_pastler_mieter_legacy" ON public.pastler_mieter;
DROP POLICY IF EXISTS "eigentümer_select_pastler_todos_legacy" ON public.pastler_todos;

CREATE OR REPLACE FUNCTION public.pastler_eigentuemer_owns_inserat(inserat_row public.pastler_inserate)
RETURNS BOOLEAN LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT (
    inserat_row.eigentuemer_email = auth.email()
    OR inserat_row.vermieter_id IN (
      SELECT id FROM pastler_eigentuemer WHERE email = auth.email()
    )
  );
$$;

DROP POLICY IF EXISTS "eigentümer_select_pastler_inserate" ON public.pastler_inserate;
CREATE POLICY "eigentümer_select_pastler_inserate" ON public.pastler_inserate
  FOR SELECT TO authenticated
  USING (public.pastler_eigentuemer_owns_inserat(pastler_inserate));

DROP POLICY IF EXISTS "eigentümer_select_pastler_mieter" ON public.pastler_mieter;
CREATE POLICY "eigentümer_select_pastler_mieter" ON public.pastler_mieter
  FOR SELECT TO authenticated
  USING (
    inserat_id IN (
      SELECT id FROM public.pastler_inserate i
      WHERE public.pastler_eigentuemer_owns_inserat(i)
    )
  );

DROP POLICY IF EXISTS "eigentümer_select_pastler_todos" ON public.pastler_todos;
CREATE POLICY "eigentümer_select_pastler_todos" ON public.pastler_todos
  FOR SELECT TO authenticated
  USING (
    inserat_id IN (
      SELECT id FROM public.pastler_inserate i
      WHERE public.pastler_eigentuemer_owns_inserat(i)
    )
  );

CREATE OR REPLACE FUNCTION public.pastler_normalize_match_text(p_text TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT lower(replace(replace(replace(replace(coalesce(p_text,''),'ß','ss'),'str.','straße'),'strasse','straße'),'  ',' '));
$$;

CREATE OR REPLACE FUNCTION public.pastler_resolve_zuordnung(p_von_email TEXT, p_betreff TEXT, p_inhalt TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_text TEXT;
  v_mieter_id UUID; v_inserat_id UUID; v_vermieter_id UUID;
  v_quelle TEXT := 'unbekannt'; v_konfidenz TEXT := 'niedrig';
  r RECORD; v_match_len INT; v_best_len INT := 0;
  v_best_inserat_id UUID; v_best_vermieter_id UUID;
BEGIN
  v_text := public.pastler_normalize_match_text(coalesce(p_betreff,'') || ' ' || coalesce(p_inhalt,''));
  SELECT m.id, m.inserat_id, i.vermieter_id INTO v_mieter_id, v_inserat_id, v_vermieter_id
  FROM pastler_mieter m LEFT JOIN pastler_inserate i ON i.id = m.inserat_id
  WHERE m.email IS NOT NULL AND lower(trim(m.email)) = lower(trim(coalesce(p_von_email,''))) LIMIT 1;
  IF v_mieter_id IS NOT NULL THEN
    RETURN jsonb_build_object('mieter_id',v_mieter_id,'inserat_id',v_inserat_id,'vermieter_id',v_vermieter_id,'quelle','absender_mieter','konfidenz','hoch');
  END IF;
  SELECT id INTO v_vermieter_id FROM pastler_eigentuemer
  WHERE lower(trim(email)) = lower(trim(coalesce(p_von_email,''))) LIMIT 1;
  IF v_vermieter_id IS NOT NULL THEN v_quelle := 'absender_vermieter'; v_konfidenz := 'hoch'; END IF;
  FOR r IN SELECT i.id,i.adresse,i.plz,i.stadt,i.vermieter_id FROM pastler_inserate i
    WHERE v_vermieter_id IS NULL OR i.vermieter_id = v_vermieter_id LOOP
    v_match_len := 0;
    IF r.adresse IS NOT NULL AND length(trim(r.adresse))>=8 AND position(public.pastler_normalize_match_text(r.adresse) IN v_text)>0 THEN v_match_len := greatest(v_match_len,length(trim(r.adresse))); END IF;
    IF r.plz IS NOT NULL AND length(trim(r.plz))>=4 AND position(public.pastler_normalize_match_text(r.plz) IN v_text)>0 THEN v_match_len := greatest(v_match_len,4); END IF;
    IF r.stadt IS NOT NULL AND length(trim(r.stadt))>=3 AND position(public.pastler_normalize_match_text(r.stadt) IN v_text)>0 THEN v_match_len := greatest(v_match_len,length(trim(r.stadt))); END IF;
    IF v_match_len > v_best_len THEN v_best_len := v_match_len; v_best_inserat_id := r.id; v_best_vermieter_id := r.vermieter_id; END IF;
  END LOOP;
  IF v_best_inserat_id IS NOT NULL THEN
    v_inserat_id := v_best_inserat_id;
    IF v_vermieter_id IS NULL THEN v_vermieter_id := v_best_vermieter_id; END IF;
    v_quelle := CASE WHEN v_quelle='absender_vermieter' THEN 'absender_vermieter' ELSE 'inhalt_objekt' END;
    v_konfidenz := 'mittel';
  END IF;
  IF v_inserat_id IS NOT NULL THEN
    SELECT m.id INTO v_mieter_id FROM pastler_mieter m
    WHERE m.inserat_id=v_inserat_id AND m.einheit_nr IS NOT NULL AND length(trim(m.einheit_nr))>=2
      AND position(public.pastler_normalize_match_text(m.einheit_nr) IN v_text)>0
    ORDER BY length(trim(m.einheit_nr)) DESC LIMIT 1;
    IF v_mieter_id IS NOT NULL THEN v_quelle := 'inhalt_einheit'; v_konfidenz := 'mittel'; END IF;
  END IF;
  IF v_mieter_id IS NULL THEN
    FOR r IN SELECT m.id,m.inserat_id,m.name,i.vermieter_id FROM pastler_mieter m
      LEFT JOIN pastler_inserate i ON i.id=m.inserat_id
      WHERE length(trim(m.name))>=3 AND position(public.pastler_normalize_match_text(m.name) IN v_text)>0
      ORDER BY length(trim(m.name)) DESC LIMIT 1 LOOP
      v_mieter_id:=r.id; v_inserat_id:=coalesce(v_inserat_id,r.inserat_id);
      v_vermieter_id:=coalesce(v_vermieter_id,r.vermieter_id);
      v_quelle:='inhalt_mieter_name'; v_konfidenz:='niedrig'; EXIT;
    END LOOP;
  END IF;
  RETURN jsonb_build_object('mieter_id',v_mieter_id,'inserat_id',v_inserat_id,'vermieter_id',v_vermieter_id,'quelle',v_quelle,'konfidenz',v_konfidenz);
END;
$$;

REVOKE ALL ON FUNCTION public.pastler_resolve_zuordnung(TEXT,TEXT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pastler_resolve_zuordnung(TEXT,TEXT,TEXT) TO service_role;

CREATE INDEX IF NOT EXISTS idx_pastler_inserate_vermieter_id ON public.pastler_inserate(vermieter_id);
CREATE INDEX IF NOT EXISTS idx_pastler_mieter_email_lower ON public.pastler_mieter ((lower(email)));

-- ─── Seed: Demo-Daten ─────────────────────────────────────────────────────

INSERT INTO pastler_eigentuemer (id, name, email, beschreibung) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 'Hans Müller', 'hans.mueller@demo-pastler.de', 'Privater Vermieter, 3 Objekte in Koblenz'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', 'Anna Schmidt', 'anna.schmidt@demo-pastler.de', 'WEG-Verwaltung Rheinweg'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', 'Dr. Petra Lehmann', 'p.lehmann@demo-pastler.de', 'Gewerbe- und Wohnimmobilien Mayen')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pastler_inserate (id, vermieter_id, adresse, plz, stadt, typ, eigentuemer_name, eigentuemer_email, einheiten, beschreibung, notizen) VALUES
  ('11111111-1111-1111-1111-111111111101', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 'Hauptstraße 12', '56068', 'Koblenz', 'Mietsverwaltung', 'Hans Müller', 'hans.mueller@demo-pastler.de', 8, 'Mehrfamilienhaus mit 8 Wohneinheiten, zentrale Lage', 'Baujahr 1978'),
  ('11111111-1111-1111-1111-111111111102', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', 'Rheinweg 45', '56073', 'Koblenz', 'WEG', 'Anna Schmidt', 'anna.schmidt@demo-pastler.de', 12, 'WEG mit 12 Wohneinheiten am Rhein', 'Gemeinschaftseigentum inkl. Tiefgarage'),
  ('11111111-1111-1111-1111-111111111103', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', 'Marktplatz 3', '56727', 'Mayen', 'Sondereigentum', 'Dr. Petra Lehmann', 'p.lehmann@demo-pastler.de', 4, 'Mischobjekt Gewerbe EG + Wohnen OG', 'Denkmalgeschütztes Gebäude')
ON CONFLICT (id) DO UPDATE SET vermieter_id = EXCLUDED.vermieter_id, beschreibung = EXCLUDED.beschreibung;

INSERT INTO pastler_mieter (id, inserat_id, name, email, telefon, einheit_nr, einzug_datum, status) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Thomas Weber', 'thomas.weber@demo-mieter.de', '+49 261 123456', '3. OG links', '2019-03-01', 'aktiv'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Lisa Fischer', 'lisa.fischer@demo-mieter.de', '+49 261 234567', '2. OG rechts', '2021-08-15', 'aktiv'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 'Michael Braun', 'michael.braun@demo-mieter.de', '+49 261 345678', 'EG', '2020-01-10', 'aktiv'),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102', 'Sabine Koch', 'sabine.koch@demo-mieter.de', '+49 261 456789', '1. OG', '2022-06-01', 'aktiv'),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111103', 'Gastronomie Mayen GmbH', 'info@gastronomie-mayen.demo', '+49 2651 98765', 'Laden EG', '2015-11-01', 'aktiv')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pastler_partner (id, firma, ansprechpartner, adresse, plz, stadt, email, telefon, gewerk, notizen, aktiv) VALUES
  ('44444444-4444-4444-4444-444444444401', 'Elektro Rhein GmbH', 'Klaus Meier', 'Industriestr. 8', '56070', 'Koblenz', 'auftrag@elektro-rhein.demo', '+49 261 987654', 'elektriker', '24h Notdienst', true),
  ('44444444-4444-4444-4444-444444444402', 'Schlüssel Express Koblenz', 'Maria Keller', 'Bahnhofstr. 22', '56068', 'Koblenz', 'service@schluessel-express.demo', '+49 261 555123', 'schluessel', NULL, true),
  ('44444444-4444-4444-4444-444444444403', 'Sauber & Co. Reinigung', 'Peter Hahn', 'Gartenweg 3', '56073', 'Koblenz', 'info@sauber-co.demo', '+49 261 444333', 'reinigung', 'Treppenhaus-Reinigung', true),
  ('44444444-4444-4444-4444-444444444404', 'Sanitär Wagner', 'Jürgen Wagner', 'Moselufer 14', '56068', 'Koblenz', 'notdienst@sanitaer-wagner.demo', '+49 261 777888', 'sanitaer', 'Wasserschaden-Spezialist', true),
  ('44444444-4444-4444-4444-444444444405', 'Hausmeister Service Koblenz', 'Frank Berger', 'Am Rübenacher Wald 2', '56072', 'Koblenz', 'dienst@hausmeister-koblenz.demo', '+49 261 333222', 'hausmeister', 'Objektbetreuung', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pastler_emails (id, message_id, von_email, von_name, betreff, inhalt_text, empfangen_at, verarbeitet) VALUES
  ('55555555-5555-5555-5555-555555555501','demo-sales-001@pastler.local','thomas.weber@demo-mieter.de','Thomas Weber','Defekte Beleuchtung im Treppenhaus',E'Guten Tag,\n\nseit drei Tagen ist die Beleuchtung im Treppenhaus zwischen 2. und 3. OG ausgefallen.\n\nMit freundlichen Grüßen\nThomas Weber\nHauptstraße 12, 3. OG links',NOW()-INTERVAL '2 hours',true),
  ('55555555-5555-5555-5555-555555555502','demo-sales-002@pastler.local','lisa.fischer@demo-mieter.de','Lisa Fischer','Wasserfleck an der Badezimmerdecke',E'Sehr geehrte Damen und Herren,\n\nich habe einen braunen Fleck an der Decke im Bad (2. OG rechts).\n\nLisa Fischer',NOW()-INTERVAL '5 hours',true),
  ('55555555-5555-5555-5555-555555555503','demo-sales-003@pastler.local','michael.braun@demo-mieter.de','Michael Braun','Schlüssel verloren — Wohnungstür',E'Hallo,\n\nich habe meinen Wohnungsschlüssel verloren (EG, Rheinweg 45).\n\nMichael Braun',NOW()-INTERVAL '1 day',true),
  ('55555555-5555-5555-5555-555555555504','demo-sales-004@pastler.local','sabine.koch@demo-mieter.de','Sabine Koch','Mülltonnenstandplatz verstopft',E'Guten Morgen,\n\nder Mülltonnenbereich im Hinterhof ist überfüllt.\n\nSabine Koch',NOW()-INTERVAL '3 days',true),
  ('55555555-5555-5555-5555-555555555505','demo-sales-005@pastler.local','info@gastronomie-mayen.demo','Gastronomie Mayen GmbH','Heizungsausfall im Ladenlokal',E'Sehr geehrte Pastler Immobilienberatung,\n\nin unserem Ladenlokal (Marktplatz 3, EG) ist die Heizung ausgefallen.',NOW()-INTERVAL '30 minutes',false),
  ('55555555-5555-5555-5555-555555555506','demo-sales-006@pastler.local','auftrag@fremd-handwerker.demo','Fremd Handwerker GmbH','Beleuchtung Hauptstraße 12 — Rückfrage',E'Guten Tag,\n\nwir wurden beauftragt, die Beleuchtung im Treppenhaus der Hauptstraße 12 in Koblenz zu prüfen.',NOW()-INTERVAL '6 hours',true),
  ('55555555-5555-5555-5555-555555555507','demo-sales-007@pastler.local','hans.mueller@demo-pastler.de','Hans Müller','Dachrinne Rheinweg 45',E'Sehr geehrte Hausverwaltung,\n\nbitte lassen Sie die Dachrinne am Objekt Rheinweg 45 in Koblenz reinigen.\n\nHans Müller (Vermieter)',NOW()-INTERVAL '8 hours',true),
  ('55555555-5555-5555-5555-555555555508','demo-sales-008@pastler.local','nachbar@unbekannt.demo','Nachbarin Weber','Lärm von Thomas Weber',E'Hallo,\n\nich wohne neben Thomas Weber in der Hauptstraße 12 (3. OG links) und möchte eine Beschwerde melden.',NOW()-INTERVAL '12 hours',true)
ON CONFLICT (id) DO UPDATE SET von_email=EXCLUDED.von_email, von_name=EXCLUDED.von_name, betreff=EXCLUDED.betreff, inhalt_text=EXCLUDED.inhalt_text, empfangen_at=EXCLUDED.empfangen_at, verarbeitet=EXCLUDED.verarbeitet, mieter_id=EXCLUDED.mieter_id, inserat_id=EXCLUDED.inserat_id, vermieter_id=EXCLUDED.vermieter_id, zuordnung_quelle=EXCLUDED.zuordnung_quelle, zuordnung_konfidenz=EXCLUDED.zuordnung_konfidenz;

UPDATE pastler_emails SET mieter_id='22222222-2222-2222-2222-222222222201',inserat_id='11111111-1111-1111-1111-111111111101',vermieter_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',zuordnung_quelle='absender_mieter',zuordnung_konfidenz='hoch' WHERE id='55555555-5555-5555-5555-555555555501';
UPDATE pastler_emails SET mieter_id='22222222-2222-2222-2222-222222222202',inserat_id='11111111-1111-1111-1111-111111111101',vermieter_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',zuordnung_quelle='absender_mieter',zuordnung_konfidenz='hoch' WHERE id='55555555-5555-5555-5555-555555555502';
UPDATE pastler_emails SET mieter_id='22222222-2222-2222-2222-222222222203',inserat_id='11111111-1111-1111-1111-111111111102',vermieter_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',zuordnung_quelle='absender_mieter',zuordnung_konfidenz='hoch' WHERE id='55555555-5555-5555-5555-555555555503';
UPDATE pastler_emails SET mieter_id='22222222-2222-2222-2222-222222222204',inserat_id='11111111-1111-1111-1111-111111111102',vermieter_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',zuordnung_quelle='absender_mieter',zuordnung_konfidenz='hoch' WHERE id='55555555-5555-5555-5555-555555555504';
UPDATE pastler_emails SET mieter_id='22222222-2222-2222-2222-222222222205',inserat_id='11111111-1111-1111-1111-111111111103',vermieter_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',zuordnung_quelle='absender_mieter',zuordnung_konfidenz='hoch' WHERE id='55555555-5555-5555-5555-555555555505';
UPDATE pastler_emails SET inserat_id='11111111-1111-1111-1111-111111111101',vermieter_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',zuordnung_quelle='inhalt_objekt',zuordnung_konfidenz='mittel' WHERE id='55555555-5555-5555-5555-555555555506';
UPDATE pastler_emails SET vermieter_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',inserat_id='11111111-1111-1111-1111-111111111102',zuordnung_quelle='absender_vermieter',zuordnung_konfidenz='hoch' WHERE id='55555555-5555-5555-5555-555555555507';
UPDATE pastler_emails SET mieter_id='22222222-2222-2222-2222-222222222201',inserat_id='11111111-1111-1111-1111-111111111101',vermieter_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',zuordnung_quelle='inhalt_mieter_name',zuordnung_konfidenz='niedrig' WHERE id='55555555-5555-5555-5555-555555555508';

INSERT INTO pastler_todos (id,email_id,mieter_id,inserat_id,vermieter_id,partner_id,use_case,gewerk,zuordnung_quelle,zuordnung_konfidenz,titel,beschreibung,kategorie,prioritaet,status,faellig_at) VALUES
  ('33333333-3333-3333-3333-333333333301','55555555-5555-5555-5555-555555555501','22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01','44444444-4444-4444-4444-444444444401','defekte_beleuchtung','elektriker','absender_mieter','hoch','Defekte Beleuchtung Treppenhaus','Mieter meldet ausgefallene Beleuchtung zwischen 2. und 3. OG — Elektriker beauftragen.','extern','hoch','offen',CURRENT_DATE),
  ('33333333-3333-3333-3333-333333333302','55555555-5555-5555-5555-555555555502','22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111101','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01','44444444-4444-4444-4444-444444444404','wasserschaden','sanitaer','absender_mieter','hoch','Wasserfleck Badezimmerdecke prüfen','Verdacht auf Leckage von oben — Sanitär Wagner zur Begutachtung.','extern','hoch','in_bearbeitung',CURRENT_DATE+1),
  ('33333333-3333-3333-3333-333333333303',NULL,NULL,'11111111-1111-1111-1111-111111111102','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',NULL,NULL,NULL,'unbekannt','niedrig','Jahresabrechnung 2025 vorbereiten','Nebenkostenabrechnung für WEG Rheinweg 45 erstellen und versenden.','intern','mittel','in_bearbeitung',CURRENT_DATE+14),
  ('33333333-3333-3333-3333-333333333304','55555555-5555-5555-5555-555555555503','22222222-2222-2222-2222-222222222203','11111111-1111-1111-1111-111111111102','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02','44444444-4444-4444-4444-444444444402','schluesselverlust','schluessel','absender_mieter','hoch','Schlüsseldienst — Wohnungstür EG','Mieter hat Wohnungsschlüssel verloren.','extern','hoch','offen',CURRENT_DATE),
  ('33333333-3333-3333-3333-333333333305','55555555-5555-5555-5555-555555555504','22222222-2222-2222-2222-222222222204','11111111-1111-1111-1111-111111111102','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02','44444444-4444-4444-4444-444444444403','muellbereich_reinigung','reinigung','absender_mieter','hoch','Mülltonnenbereich reinigen lassen','Hinterhof überfüllt — Reinigungsdienst beauftragen.','extern','mittel','offen',CURRENT_DATE+2),
  ('33333333-3333-3333-3333-333333333306','55555555-5555-5555-5555-555555555505','22222222-2222-2222-2222-222222222205','11111111-1111-1111-1111-111111111103','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03','44444444-4444-4444-4444-444444444405','heizungsausfall','hausmeister','absender_mieter','hoch','Heizungsausfall Ladenlokal Mayen','Gewerbemieter meldet Heizungsausfall seit Wochenende.','mieter','hoch','offen',CURRENT_DATE),
  ('33333333-3333-3333-3333-333333333307',NULL,'22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',NULL,NULL,NULL,'unbekannt','niedrig','Nebenkostenabrechnung Mieter Weber','Einzelabrechnung 2025 an Thomas Weber versenden.','mieter','niedrig','erledigt',NULL),
  ('33333333-3333-3333-3333-333333333308','55555555-5555-5555-5555-555555555506',NULL,'11111111-1111-1111-1111-111111111101','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',NULL,NULL,NULL,'inhalt_objekt','mittel','Fremdhandwerker — Beleuchtung Hauptstraße 12','Unbekannter Absender, Objektadresse im Text erkannt — Freigabe klären.','intern','mittel','offen',CURRENT_DATE+3),
  ('33333333-3333-3333-3333-333333333309','55555555-5555-5555-5555-555555555507',NULL,'11111111-1111-1111-1111-111111111102','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',NULL,NULL,NULL,'absender_vermieter','hoch','Dachrinne Rheinweg 45 reinigen','Vermieter Hans Müller meldet Reinigungsbedarf am Objekt Rheinweg 45.','intern','mittel','offen',CURRENT_DATE+7),
  ('33333333-3333-3333-3333-333333333310','55555555-5555-5555-5555-555555555508','22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',NULL,NULL,NULL,'inhalt_mieter_name','niedrig','Lärmbeschwerde Nachbar — Thomas Weber','Mietername im Text erkannt, Absender unbekannt.','mieter','mittel','offen',CURRENT_DATE+2)
ON CONFLICT (id) DO UPDATE SET email_id=EXCLUDED.email_id,mieter_id=EXCLUDED.mieter_id,inserat_id=EXCLUDED.inserat_id,vermieter_id=EXCLUDED.vermieter_id,partner_id=EXCLUDED.partner_id,use_case=EXCLUDED.use_case,gewerk=EXCLUDED.gewerk,zuordnung_quelle=EXCLUDED.zuordnung_quelle,zuordnung_konfidenz=EXCLUDED.zuordnung_konfidenz,titel=EXCLUDED.titel,beschreibung=EXCLUDED.beschreibung,kategorie=EXCLUDED.kategorie,prioritaet=EXCLUDED.prioritaet,status=EXCLUDED.status,faellig_at=EXCLUDED.faellig_at;

INSERT INTO pastler_partner_nachrichten (id, todo_id, partner_id, betreff, inhalt, status) VALUES
  ('66666666-6666-6666-6666-666666666601','33333333-3333-3333-3333-333333333301','44444444-4444-4444-4444-444444444401','Auftrag: Beleuchtung Treppenhaus — Hauptstraße 12, Koblenz',E'Sehr geehrter Herr Meier,\n\nwir bitten um Prüfung und Reparatur der Beleuchtung im Treppenhaus zwischen 2. und 3. OG.\n\nObjekt: Hauptstraße 12, 56068 Koblenz\nMeldung: Mieter Thomas Weber\n\nMit freundlichen Grüßen\nPastler Immobilienberatung','entwurf'),
  ('66666666-6666-6666-6666-666666666602','33333333-3333-3333-3333-333333333302','44444444-4444-4444-4444-444444444404','Dringend: Wasserschaden-Verdacht — Hauptstraße 12, 2. OG',E'Sehr geehrter Herr Wagner,\n\nunser Mieter meldet einen braunen Fleck an der Badezimmerdecke (2. OG rechts).\n\nBitte um zeitnahe Begutachtung.\n\nPastler Immobilienberatung','entwurf'),
  ('66666666-6666-6666-6666-666666666603','33333333-3333-3333-3333-333333333304','44444444-4444-4444-4444-444444444402','Schlüsselnotöffnung — Rheinweg 45, EG',E'Sehr geehrte Damen und Herren,\n\nbitte führen Sie eine Schlüsselnotöffnung durch:\n\nObjekt: Rheinweg 45, 56073 Koblenz, EG\nMieter: Michael Braun\n\nMit freundlichen Grüßen\nPastler Immobilienberatung','entwurf')
ON CONFLICT (id) DO UPDATE SET todo_id=EXCLUDED.todo_id,partner_id=EXCLUDED.partner_id,betreff=EXCLUDED.betreff,inhalt=EXCLUDED.inhalt,status=EXCLUDED.status;
