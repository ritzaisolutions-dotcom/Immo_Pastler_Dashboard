-- Pastler Dashboard — shared Supabase with Haller (prefix: pastler_*)

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

-- Staff policies (same pattern as Haller dashboard)
DROP POLICY IF EXISTS "staff_select_pastler_inserate" ON public.pastler_inserate;
CREATE POLICY "staff_select_pastler_inserate" ON public.pastler_inserate
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_insert_pastler_inserate" ON public.pastler_inserate;
CREATE POLICY "staff_insert_pastler_inserate" ON public.pastler_inserate
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "staff_update_pastler_inserate" ON public.pastler_inserate;
CREATE POLICY "staff_update_pastler_inserate" ON public.pastler_inserate
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_select_pastler_mieter" ON public.pastler_mieter;
CREATE POLICY "staff_select_pastler_mieter" ON public.pastler_mieter
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_insert_pastler_mieter" ON public.pastler_mieter;
CREATE POLICY "staff_insert_pastler_mieter" ON public.pastler_mieter
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "staff_update_pastler_mieter" ON public.pastler_mieter;
CREATE POLICY "staff_update_pastler_mieter" ON public.pastler_mieter
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_select_pastler_todos" ON public.pastler_todos;
CREATE POLICY "staff_select_pastler_todos" ON public.pastler_todos
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "staff_insert_pastler_todos" ON public.pastler_todos;
CREATE POLICY "staff_insert_pastler_todos" ON public.pastler_todos
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "staff_update_pastler_todos" ON public.pastler_todos;
CREATE POLICY "staff_update_pastler_todos" ON public.pastler_todos
  FOR UPDATE TO authenticated USING (true);

-- pastler_emails: no authenticated policy — service role only (n8n)
