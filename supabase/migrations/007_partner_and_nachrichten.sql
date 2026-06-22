-- Pastler Dashboard — Partner + Partner-Nachrichten (Entwürfe)

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

-- Mitarbeiter: full access
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

-- No authenticated policy on partner tables for Eigentümer — service role for n8n inserts

-- Performance index for partner_nachrichten → partner JOIN
CREATE INDEX IF NOT EXISTS idx_partner_nachrichten_partner_id
  ON public.pastler_partner_nachrichten(partner_id);
