-- Test seed data for Pastler Dashboard (shared Supabase with Haller)
-- Run after 002_pastler_schema.sql

INSERT INTO pastler_inserate (id, adresse, plz, stadt, typ, eigentuemer_name, eigentuemer_email, einheiten) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Hauptstraße 12', '56068', 'Koblenz', 'Mietsverwaltung', 'Hans Müller', 'hans.mueller@example.com', 8),
  ('11111111-1111-1111-1111-111111111102', 'Rheinweg 45', '56073', 'Koblenz', 'WEG', 'Anna Schmidt', 'anna.schmidt@example.com', 12)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pastler_mieter (id, inserat_id, name, email, telefon, einheit_nr, status) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Thomas Weber', 'thomas.weber@example.com', '+49 261 123456', '3.OG links', 'aktiv'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Lisa Fischer', 'lisa.fischer@example.com', '+49 261 234567', '2.OG rechts', 'aktiv'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 'Michael Braun', 'michael.braun@example.com', '+49 261 345678', 'EG', 'aktiv')
ON CONFLICT (id) DO NOTHING;

INSERT INTO pastler_todos (id, mieter_id, inserat_id, titel, beschreibung, kategorie, prioritaet, status, faellig_at) VALUES
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Heizung defekt', 'Mieter meldet ausgefallene Heizung in Wohnung 3.OG', 'mieter', 'hoch', 'offen', CURRENT_DATE),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Treppenhaus reinigen', 'Reinigungsdienst für Treppenhaus beauftragen', 'extern', 'mittel', 'offen', CURRENT_DATE + 3),
  ('33333333-3333-3333-3333-333333333303', NULL, '11111111-1111-1111-1111-111111111102', 'Jahresabrechnung vorbereiten', 'Nebenkostenabrechnung 2025 erstellen', 'intern', 'mittel', 'in_bearbeitung', CURRENT_DATE + 14),
  ('33333333-3333-3333-3333-333333333304', '22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 'Wasserschaden prüfen', 'Feuchtigkeit an der Decke im Bad', 'mieter', 'hoch', 'offen', CURRENT_DATE + 1),
  ('33333333-3333-3333-3333-333333333305', NULL, '11111111-1111-1111-1111-111111111101', 'Versicherung kontaktieren', 'Gebäudeversicherung über Dachschaden informieren', 'extern', 'niedrig', 'erledigt', NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pastler_partner (id, firma, ansprechpartner, adresse, plz, stadt, email, telefon, gewerk, notizen) VALUES
  ('44444444-4444-4444-4444-444444444401', 'Elektro Rhein GmbH', 'Klaus Meier', 'Industriestr. 8', '56070', 'Koblenz', 'auftrag@elektro-rhein.example.com', '+49 261 987654', 'elektriker', '24h Notdienst'),
  ('44444444-4444-4444-4444-444444444402', 'Schlüssel Express Koblenz', 'Maria Keller', 'Bahnhofstr. 22', '56068', 'Koblenz', 'service@schluessel-express.example.com', '+49 261 555123', 'schluessel', NULL),
  ('44444444-4444-4444-4444-444444444403', 'Sauber & Co.', 'Peter Hahn', 'Gartenweg 3', '56073', 'Koblenz', 'info@sauber-co.example.com', '+49 261 444333', 'reinigung', 'Treppenhaus-Reinigung')
ON CONFLICT (id) DO NOTHING;
