-- Pastler: Vermieter-Stammdaten, Profilfelder, Todo-Zuordnung per E-Mail

-- ─── Vermieter (pastler_eigentuemer) ───────────────────────────────────────
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

-- ─── Inserate: Vermieter-FK + Beschreibung ─────────────────────────────────
ALTER TABLE public.pastler_inserate
  ADD COLUMN IF NOT EXISTS vermieter_id UUID REFERENCES public.pastler_eigentuemer(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS beschreibung TEXT;

-- Migrate legacy eigentuemer_* → pastler_eigentuemer
INSERT INTO public.pastler_eigentuemer (name, firma, email)
SELECT DISTINCT ON (lower(trim(eigentuemer_email)))
  coalesce(nullif(trim(eigentuemer_name), ''), split_part(trim(eigentuemer_email), '@', 1)),
  NULL,
  lower(trim(eigentuemer_email))
FROM public.pastler_inserate
WHERE eigentuemer_email IS NOT NULL
  AND trim(eigentuemer_email) <> ''
ON CONFLICT (email) DO NOTHING;

UPDATE public.pastler_inserate i
SET vermieter_id = e.id
FROM public.pastler_eigentuemer e
WHERE i.vermieter_id IS NULL
  AND i.eigentuemer_email IS NOT NULL
  AND lower(trim(i.eigentuemer_email)) = e.email;

-- ─── Mieter: Korrespondenzadresse + Notizen ────────────────────────────────
ALTER TABLE public.pastler_mieter
  ADD COLUMN IF NOT EXISTS adresse TEXT,
  ADD COLUMN IF NOT EXISTS plz TEXT,
  ADD COLUMN IF NOT EXISTS stadt TEXT,
  ADD COLUMN IF NOT EXISTS notizen TEXT;

-- ─── Partner: Beschreibung ─────────────────────────────────────────────────
ALTER TABLE public.pastler_partner
  ADD COLUMN IF NOT EXISTS beschreibung TEXT;

-- ─── Zuordnungs-Metadaten ────────────────────────────────────────────────────
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

ALTER TABLE public.pastler_todos
  ADD COLUMN IF NOT EXISTS gewerk TEXT CHECK (gewerk IN (
    'elektriker', 'sanitaer', 'schluessel', 'reinigung', 'hausmeister', 'allgemein'
  ));

-- Legacy-Sync: vermieter_id → eigentuemer_name/email (RLS-Kompatibilität)
CREATE OR REPLACE FUNCTION public.pastler_sync_inserat_eigentuemer_legacy()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.vermieter_id IS NOT NULL THEN
    SELECT name, email INTO NEW.eigentuemer_name, NEW.eigentuemer_email
    FROM pastler_eigentuemer
    WHERE id = NEW.vermieter_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pastler_inserat_sync_eigentuemer ON public.pastler_inserate;
CREATE TRIGGER trg_pastler_inserat_sync_eigentuemer
  BEFORE INSERT OR UPDATE OF vermieter_id ON public.pastler_inserate
  FOR EACH ROW
  EXECUTE FUNCTION public.pastler_sync_inserat_eigentuemer_legacy();

-- ─── RLS: Eigentümer über vermieter_id (mit Legacy-Fallback) ───────────────
CREATE OR REPLACE FUNCTION public.pastler_eigentuemer_owns_inserat(inserat_row public.pastler_inserate)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
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

-- ─── RPC: E-Mail → Mieter / Inserat / Vermieter ────────────────────────────
CREATE OR REPLACE FUNCTION public.pastler_normalize_match_text(p_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(
    replace(
      replace(
        replace(
          replace(coalesce(p_text, ''), 'ß', 'ss'),
        'str.', 'straße'),
      'strasse', 'straße'),
    '  ', ' ')
  );
$$;

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
  v_quelle TEXT := 'unbekannt';
  v_konfidenz TEXT := 'niedrig';
  r RECORD;
  v_match_len INT;
  v_best_len INT := 0;
  v_best_inserat_id UUID;
  v_best_vermieter_id UUID;
BEGIN
  v_text := public.pastler_normalize_match_text(coalesce(p_betreff, '') || ' ' || coalesce(p_inhalt, ''));

  -- Stufe 1: Absender = Mieter
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

  -- Stufe 2: Absender = Vermieter
  SELECT id INTO v_vermieter_id
  FROM pastler_eigentuemer
  WHERE lower(trim(email)) = lower(trim(coalesce(p_von_email, '')))
  LIMIT 1;

  IF v_vermieter_id IS NOT NULL THEN
    v_quelle := 'absender_vermieter';
    v_konfidenz := 'hoch';
  END IF;

  -- Stufe 3/4: Inhalt → Inserat (ggf. nur Inserate des Vermieters)
  FOR r IN
    SELECT i.id, i.adresse, i.plz, i.stadt, i.vermieter_id
    FROM pastler_inserate i
    WHERE v_vermieter_id IS NULL OR i.vermieter_id = v_vermieter_id
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
       AND position(public.pastler_normalize_match_text(r.stadt) IN v_text) > 0 THEN
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
    IF v_vermieter_id IS NULL THEN
      v_vermieter_id := v_best_vermieter_id;
    END IF;
    IF v_quelle = 'absender_vermieter' THEN
      v_quelle := 'absender_vermieter';
    ELSE
      v_quelle := 'inhalt_objekt';
    END IF;
    v_konfidenz := 'mittel';
  END IF;

  -- Stufe 4b: Einheit im Text
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

  -- Stufe 5: Mietername im Text
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

REVOKE ALL ON FUNCTION public.pastler_resolve_zuordnung(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pastler_resolve_zuordnung(TEXT, TEXT, TEXT) TO service_role;

CREATE INDEX IF NOT EXISTS idx_pastler_inserate_vermieter_id ON public.pastler_inserate(vermieter_id);
CREATE INDEX IF NOT EXISTS idx_pastler_mieter_email_lower ON public.pastler_mieter ((lower(email)));

COMMENT ON FUNCTION public.pastler_resolve_zuordnung IS
  'Regelbasierte Zuordnung: Absender-E-Mail + Inhaltsabgleich → mieter_id, inserat_id, vermieter_id';
