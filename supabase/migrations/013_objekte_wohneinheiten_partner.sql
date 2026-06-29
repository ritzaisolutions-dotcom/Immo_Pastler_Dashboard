-- Pastler Dashboard — Objekte: Wohneinheiten, Partner-Objekt-Zuordnung, Anrede

-- Gewerk "maler" ergänzen
ALTER TABLE public.pastler_partner DROP CONSTRAINT IF EXISTS pastler_partner_gewerk_check;
ALTER TABLE public.pastler_partner ADD CONSTRAINT pastler_partner_gewerk_check
  CHECK (gewerk IN ('elektriker', 'sanitaer', 'schluessel', 'reinigung', 'hausmeister', 'maler', 'allgemein'));

ALTER TABLE public.pastler_todos DROP CONSTRAINT IF EXISTS pastler_todos_gewerk_check;
ALTER TABLE public.pastler_todos ADD CONSTRAINT pastler_todos_gewerk_check
  CHECK (gewerk IS NULL OR gewerk IN (
    'elektriker', 'sanitaer', 'schluessel', 'reinigung', 'hausmeister', 'maler', 'allgemein'
  ));

ALTER TABLE public.pastler_partner
  ADD COLUMN IF NOT EXISTS anrede_form TEXT NOT NULL DEFAULT 'sie'
    CHECK (anrede_form IN ('sie', 'du')),
  ADD COLUMN IF NOT EXISTS einsatzgebiet TEXT;

-- Wohneinheiten pro Objekt (pastler_inserate)
CREATE TABLE IF NOT EXISTS public.pastler_wohneinheiten (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inserat_id   UUID NOT NULL REFERENCES public.pastler_inserate(id) ON DELETE CASCADE,
  nummer       TEXT NOT NULL,
  bezeichnung  TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (inserat_id, nummer)
);

ALTER TABLE public.pastler_mieter
  ADD COLUMN IF NOT EXISTS wohneinheit_id UUID
    REFERENCES public.pastler_wohneinheiten(id) ON DELETE SET NULL;

-- Partner ↔ Objekt (Multi-Select Einsatzobjekte)
CREATE TABLE IF NOT EXISTS public.pastler_partner_objekte (
  partner_id  UUID NOT NULL REFERENCES public.pastler_partner(id) ON DELETE CASCADE,
  inserat_id  UUID NOT NULL REFERENCES public.pastler_inserate(id) ON DELETE CASCADE,
  PRIMARY KEY (partner_id, inserat_id)
);

-- Partner pro Gewerk am Objekt
CREATE TABLE IF NOT EXISTS public.pastler_objekt_partner_gewerk (
  inserat_id   UUID NOT NULL REFERENCES public.pastler_inserate(id) ON DELETE CASCADE,
  gewerk       TEXT NOT NULL CHECK (gewerk IN ('elektriker', 'sanitaer', 'maler', 'hausmeister')),
  partner_id   UUID NOT NULL REFERENCES public.pastler_partner(id) ON DELETE CASCADE,
  PRIMARY KEY (inserat_id, gewerk)
);

ALTER TABLE public.pastler_wohneinheiten ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastler_partner_objekte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pastler_objekt_partner_gewerk ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mitarbeiter_pastler_wohneinheiten" ON public.pastler_wohneinheiten;
CREATE POLICY "mitarbeiter_pastler_wohneinheiten" ON public.pastler_wohneinheiten
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

DROP POLICY IF EXISTS "eigentuemer_select_pastler_wohneinheiten" ON public.pastler_wohneinheiten;
CREATE POLICY "eigentuemer_select_pastler_wohneinheiten" ON public.pastler_wohneinheiten
  FOR SELECT TO authenticated
  USING (
    inserat_id IN (
      SELECT id FROM public.pastler_inserate i
      WHERE public.pastler_eigentuemer_owns_inserat(i)
    )
  );

DROP POLICY IF EXISTS "mitarbeiter_pastler_partner_objekte" ON public.pastler_partner_objekte;
CREATE POLICY "mitarbeiter_pastler_partner_objekte" ON public.pastler_partner_objekte
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

DROP POLICY IF EXISTS "mitarbeiter_pastler_objekt_partner_gewerk" ON public.pastler_objekt_partner_gewerk;
CREATE POLICY "mitarbeiter_pastler_objekt_partner_gewerk" ON public.pastler_objekt_partner_gewerk
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

CREATE INDEX IF NOT EXISTS idx_wohneinheiten_inserat ON public.pastler_wohneinheiten(inserat_id);
CREATE INDEX IF NOT EXISTS idx_partner_objekte_inserat ON public.pastler_partner_objekte(inserat_id);

-- ─── Demo: Wohneinheiten (2 pro Objekt für erste 3 Inserate) ─────────────────
INSERT INTO pastler_wohneinheiten (id, inserat_id, nummer, bezeichnung, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', 'WE 1', '3. OG links', 1),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111101', 'WE 2', '2. OG rechts', 2),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111102', 'WE 1', 'EG', 1),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111102', 'WE 2', '1. OG', 2),
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111103', 'WE 1', 'Laden EG', 1),
  ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111103', 'WE 2', 'Büro OG', 2)
ON CONFLICT (id) DO NOTHING;

UPDATE pastler_mieter SET wohneinheit_id = '33333333-3333-3333-3333-333333333301' WHERE id = '22222222-2222-2222-2222-222222222201';
UPDATE pastler_mieter SET wohneinheit_id = '33333333-3333-3333-3333-333333333302' WHERE id = '22222222-2222-2222-2222-222222222202';
UPDATE pastler_mieter SET wohneinheit_id = '33333333-3333-3333-3333-333333333303' WHERE id = '22222222-2222-2222-2222-222222222203';
UPDATE pastler_mieter SET wohneinheit_id = '33333333-3333-3333-3333-333333333304' WHERE id = '22222222-2222-2222-2222-222222222204';
UPDATE pastler_mieter SET wohneinheit_id = '33333333-3333-3333-3333-333333333305' WHERE id = '22222222-2222-2222-2222-222222222205';

-- Partner Felder + Maler-Partner
INSERT INTO pastler_partner (id, firma, ansprechpartner, email, telefon, gewerk, aktiv, anrede_form, einsatzgebiet) VALUES
  ('44444444-4444-4444-4444-444444444406', 'Malerbetrieb Koblenz', 'Stefan Lack', 'lack@maler-koblenz.demo', '+49 261 111222', 'maler', true, 'sie', 'Koblenz, Lahnstein')
ON CONFLICT (id) DO UPDATE SET
  anrede_form = EXCLUDED.anrede_form,
  einsatzgebiet = EXCLUDED.einsatzgebiet,
  gewerk = EXCLUDED.gewerk;

UPDATE pastler_partner SET anrede_form = 'sie', einsatzgebiet = 'Koblenz' WHERE id = '44444444-4444-4444-4444-444444444401';
UPDATE pastler_partner SET anrede_form = 'du', einsatzgebiet = 'Koblenz' WHERE id = '44444444-4444-4444-4444-444444444404';
UPDATE pastler_partner SET anrede_form = 'sie', einsatzgebiet = 'Koblenz, Mayen' WHERE id = '44444444-4444-4444-4444-444444444405';

INSERT INTO pastler_partner_objekte (partner_id, inserat_id) VALUES
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101'),
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111102'),
  ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111101'),
  ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111103'),
  ('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111102'),
  ('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111101')
ON CONFLICT DO NOTHING;

INSERT INTO pastler_objekt_partner_gewerk (inserat_id, gewerk, partner_id) VALUES
  ('11111111-1111-1111-1111-111111111101', 'elektriker', '44444444-4444-4444-4444-444444444401'),
  ('11111111-1111-1111-1111-111111111101', 'sanitaer', '44444444-4444-4444-4444-444444444404'),
  ('11111111-1111-1111-1111-111111111101', 'maler', '44444444-4444-4444-4444-444444444406'),
  ('11111111-1111-1111-1111-111111111101', 'hausmeister', '44444444-4444-4444-4444-444444444405'),
  ('11111111-1111-1111-1111-111111111102', 'elektriker', '44444444-4444-4444-4444-444444444401'),
  ('11111111-1111-1111-1111-111111111102', 'hausmeister', '44444444-4444-4444-4444-444444444405')
ON CONFLICT (inserat_id, gewerk) DO UPDATE SET partner_id = EXCLUDED.partner_id;
