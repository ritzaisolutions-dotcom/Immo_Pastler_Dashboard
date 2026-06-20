-- Test seed data for Pastler Dashboard
-- Run after schema.sql and after creating auth users

-- Inserate
INSERT INTO inserate (id, adresse, plz, stadt, typ, eigentuemer_name, eigentuemer_email, einheiten) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Hauptstraße 12', '56068', 'Koblenz', 'Mietsverwaltung', 'Hans Müller', 'hans.mueller@example.com', 8),
  ('11111111-1111-1111-1111-111111111102', 'Rheinweg 45', '56073', 'Koblenz', 'WEG', 'Anna Schmidt', 'anna.schmidt@example.com', 12);

-- Mieter
INSERT INTO mieter (id, inserat_id, name, email, telefon, einheit_nr, status) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Thomas Weber', 'thomas.weber@example.com', '+49 261 123456', '3.OG links', 'aktiv'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Lisa Fischer', 'lisa.fischer@example.com', '+49 261 234567', '2.OG rechts', 'aktiv'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 'Michael Braun', 'michael.braun@example.com', '+49 261 345678', 'EG', 'aktiv');

-- Todos
INSERT INTO todos (id, mieter_id, inserat_id, titel, beschreibung, kategorie, prioritaet, status, faellig_at) VALUES
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Heizung defekt', 'Mieter meldet ausgefallene Heizung in Wohnung 3.OG', 'mieter', 'hoch', 'offen', CURRENT_DATE),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Treppenhaus reinigen', 'Reinigungsdienst für Treppenhaus beauftragen', 'extern', 'mittel', 'offen', CURRENT_DATE + 3),
  ('33333333-3333-3333-3333-333333333303', NULL, '11111111-1111-1111-1111-111111111102', 'Jahresabrechnung vorbereiten', 'Nebenkostenabrechnung 2025 erstellen', 'intern', 'mittel', 'in_bearbeitung', CURRENT_DATE + 14),
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 'Wasserschaden prüfen', 'Feuchtigkeit an der Decke im Bad', 'mieter', 'hoch', 'offen', CURRENT_DATE + 1),
  ('33333333-3333-3333-3333-333333333305', NULL, '11111111-1111-1111-1111-111111111101', 'Versicherung kontaktieren', 'Gebäudeversicherung über Dachschaden informieren', 'extern', 'niedrig', 'erledigt', NULL);

-- Mitarbeiter auth user: create in Supabase Auth dashboard with app_metadata: {"role": "mitarbeiter"}
