-- Dynamische Gewerke (Partner + Objekt-Zuordnung)

CREATE TABLE IF NOT EXISTS public.pastler_gewerke (
  key              TEXT PRIMARY KEY,
  label            TEXT NOT NULL,
  objekt_relevant  BOOLEAN NOT NULL DEFAULT false,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pastler_gewerke ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mitarbeiter_pastler_gewerke" ON public.pastler_gewerke;
CREATE POLICY "mitarbeiter_pastler_gewerke" ON public.pastler_gewerke
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

DROP POLICY IF EXISTS "authenticated_select_pastler_gewerke" ON public.pastler_gewerke;
CREATE POLICY "authenticated_select_pastler_gewerke" ON public.pastler_gewerke
  FOR SELECT TO authenticated
  USING (true);

INSERT INTO public.pastler_gewerke (key, label, objekt_relevant, sort_order) VALUES
  ('elektriker', 'Elektriker', true, 10),
  ('sanitaer', 'Sanitär', true, 20),
  ('maler', 'Maler', true, 30),
  ('hausmeister', 'Hausmeister', true, 40),
  ('schluessel', 'Schlüsseldienst', false, 50),
  ('reinigung', 'Reinigung', false, 60),
  ('allgemein', 'Allgemein', false, 100)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  objekt_relevant = EXCLUDED.objekt_relevant,
  sort_order = EXCLUDED.sort_order;

-- Feste CHECK-Constraints entfernen — Gewerke kommen aus pastler_gewerke
ALTER TABLE public.pastler_partner DROP CONSTRAINT IF EXISTS pastler_partner_gewerk_check;
ALTER TABLE public.pastler_todos DROP CONSTRAINT IF EXISTS pastler_todos_gewerk_check;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.pastler_objekt_partner_gewerk'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%gewerk%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.pastler_objekt_partner_gewerk DROP CONSTRAINT IF EXISTS %I',
      r.conname
    );
  END LOOP;
END $$;

ALTER TABLE public.pastler_partner
  DROP CONSTRAINT IF EXISTS pastler_partner_gewerk_fk;
ALTER TABLE public.pastler_partner
  ADD CONSTRAINT pastler_partner_gewerk_fk
  FOREIGN KEY (gewerk) REFERENCES public.pastler_gewerke(key);

ALTER TABLE public.pastler_objekt_partner_gewerk
  DROP CONSTRAINT IF EXISTS pastler_objekt_partner_gewerk_gewerk_fk;
ALTER TABLE public.pastler_objekt_partner_gewerk
  ADD CONSTRAINT pastler_objekt_partner_gewerk_gewerk_fk
  FOREIGN KEY (gewerk) REFERENCES public.pastler_gewerke(key);

ALTER TABLE public.pastler_todos
  DROP CONSTRAINT IF EXISTS pastler_todos_gewerk_fk;
ALTER TABLE public.pastler_todos
  ADD CONSTRAINT pastler_todos_gewerk_fk
  FOREIGN KEY (gewerk) REFERENCES public.pastler_gewerke(key);
