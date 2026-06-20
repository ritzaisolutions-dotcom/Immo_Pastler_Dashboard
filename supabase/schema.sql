-- Pastler Dashboard Schema + RLS
-- Run in Supabase SQL Editor (region: eu-central-1)

CREATE TABLE inserate (
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

CREATE TABLE mieter (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inserat_id    UUID REFERENCES inserate(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  email         TEXT,
  telefon       TEXT,
  einheit_nr    TEXT,
  einzug_datum  DATE,
  auszug_datum  DATE,
  status        TEXT DEFAULT 'aktiv' CHECK (status IN ('aktiv','ausgezogen','gekuendigt')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emails (
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

CREATE TABLE todos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id      UUID REFERENCES emails(id) ON DELETE SET NULL,
  mieter_id     UUID REFERENCES mieter(id) ON DELETE SET NULL,
  inserat_id    UUID REFERENCES inserate(id) ON DELETE SET NULL,
  titel         TEXT NOT NULL,
  beschreibung  TEXT,
  kategorie     TEXT CHECK (kategorie IN ('extern','mieter','intern')),
  prioritaet    TEXT DEFAULT 'mittel' CHECK (prioritaet IN ('hoch','mittel','niedrig')),
  status        TEXT DEFAULT 'offen' CHECK (status IN ('offen','in_bearbeitung','erledigt','abgelehnt')),
  faellig_at    DATE,
  erledigt_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE inserate ENABLE ROW LEVEL SECURITY;
ALTER TABLE mieter   ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails   ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos    ENABLE ROW LEVEL SECURITY;

-- Eigentümer policies
CREATE POLICY "eigentümer_inserate" ON inserate
  FOR ALL USING (eigentuemer_email = auth.email());

CREATE POLICY "eigentümer_todos" ON todos
  FOR ALL USING (
    inserat_id IN (SELECT id FROM inserate WHERE eigentuemer_email = auth.email())
  );

CREATE POLICY "eigentümer_mieter" ON mieter
  FOR ALL USING (
    inserat_id IN (SELECT id FROM inserate WHERE eigentuemer_email = auth.email())
  );

-- Mitarbeiter policies (full access via app_metadata.role)
CREATE POLICY "mitarbeiter_inserate" ON inserate
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

CREATE POLICY "mitarbeiter_todos" ON todos
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

CREATE POLICY "mitarbeiter_mieter" ON mieter
  FOR ALL USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'mitarbeiter');

-- emails: NO policy for authenticated users — service role only (n8n)

-- Verify RLS: SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
