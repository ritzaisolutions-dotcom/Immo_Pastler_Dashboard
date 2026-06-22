-- Sales-Demo Seed — Pastler Dashboard (shared Supabase htyeflqymmbcjhvknjoe)
-- Idempotent: ON CONFLICT (id) DO NOTHING
-- Ausführen: Supabase SQL Editor oder supabase db execute

-- ─── Vermieter (pastler_eigentuemer) ─────────────────────────────────────────
INSERT INTO pastler_eigentuemer (id, name, email, beschreibung) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 'Hans Müller', 'hans.mueller@demo-pastler.de', 'Privater Vermieter, 3 Objekte in Koblenz'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', 'Anna Schmidt', 'anna.schmidt@demo-pastler.de', 'WEG-Verwaltung Rheinweg'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', 'Dr. Petra Lehmann', 'p.lehmann@demo-pastler.de', 'Gewerbe- und Wohnimmobilien Mayen')
ON CONFLICT (id) DO NOTHING;

-- ─── Inserate ───────────────────────────────────────────────────────────────
INSERT INTO pastler_inserate (id, vermieter_id, adresse, plz, stadt, typ, eigentuemer_name, eigentuemer_email, einheiten, beschreibung, notizen) VALUES
  ('11111111-1111-1111-1111-111111111101', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', 'Hauptstraße 12', '56068', 'Koblenz', 'Mietsverwaltung', 'Hans Müller', 'hans.mueller@demo-pastler.de', 8, 'Mehrfamilienhaus mit 8 Wohneinheiten, zentrale Lage', 'Baujahr 1978'),
  ('11111111-1111-1111-1111-111111111102', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', 'Rheinweg 45', '56073', 'Koblenz', 'WEG', 'Anna Schmidt', 'anna.schmidt@demo-pastler.de', 12, 'WEG mit 12 Wohneinheiten am Rhein', 'Gemeinschaftseigentum inkl. Tiefgarage'),
  ('11111111-1111-1111-1111-111111111103', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03', 'Marktplatz 3', '56727', 'Mayen', 'Sondereigentum', 'Dr. Petra Lehmann', 'p.lehmann@demo-pastler.de', 4, 'Mischobjekt Gewerbe EG + Wohnen OG', 'Denkmalgeschütztes Gebäude')
ON CONFLICT (id) DO UPDATE SET
  vermieter_id = EXCLUDED.vermieter_id,
  beschreibung = EXCLUDED.beschreibung;

-- ─── Mieter ─────────────────────────────────────────────────────────────────
INSERT INTO pastler_mieter (id, inserat_id, name, email, telefon, einheit_nr, einzug_datum, status) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Thomas Weber', 'thomas.weber@demo-mieter.de', '+49 261 123456', '3. OG links', '2019-03-01', 'aktiv'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Lisa Fischer', 'lisa.fischer@demo-mieter.de', '+49 261 234567', '2. OG rechts', '2021-08-15', 'aktiv'),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111102', 'Michael Braun', 'michael.braun@demo-mieter.de', '+49 261 345678', 'EG', '2020-01-10', 'aktiv'),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111102', 'Sabine Koch', 'sabine.koch@demo-mieter.de', '+49 261 456789', '1. OG', '2022-06-01', 'aktiv'),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111103', 'Gastronomie Mayen GmbH', 'info@gastronomie-mayen.demo', '+49 2651 98765', 'Laden EG', '2015-11-01', 'aktiv')
ON CONFLICT (id) DO NOTHING;

-- ─── Partner ──────────────────────────────────────────────────────────────────
INSERT INTO pastler_partner (id, firma, ansprechpartner, adresse, plz, stadt, email, telefon, gewerk, notizen, aktiv) VALUES
  ('44444444-4444-4444-4444-444444444401', 'Elektro Rhein GmbH', 'Klaus Meier', 'Industriestr. 8', '56070', 'Koblenz', 'auftrag@elektro-rhein.demo', '+49 261 987654', 'elektriker', '24h Notdienst', true),
  ('44444444-4444-4444-4444-444444444402', 'Schlüssel Express Koblenz', 'Maria Keller', 'Bahnhofstr. 22', '56068', 'Koblenz', 'service@schluessel-express.demo', '+49 261 555123', 'schluessel', NULL, true),
  ('44444444-4444-4444-4444-444444444403', 'Sauber & Co. Reinigung', 'Peter Hahn', 'Gartenweg 3', '56073', 'Koblenz', 'info@sauber-co.demo', '+49 261 444333', 'reinigung', 'Treppenhaus-Reinigung', true),
  ('44444444-4444-4444-4444-444444444404', 'Sanitär Wagner', 'Jürgen Wagner', 'Moselufer 14', '56068', 'Koblenz', 'notdienst@sanitaer-wagner.demo', '+49 261 777888', 'sanitaer', 'Wasserschaden-Spezialist', true),
  ('44444444-4444-4444-4444-444444444405', 'Hausmeister Service Koblenz', 'Frank Berger', 'Am Rübenacher Wald 2', '56072', 'Koblenz', 'dienst@hausmeister-koblenz.demo', '+49 261 333222', 'hausmeister', 'Objektbetreuung', true)
ON CONFLICT (id) DO NOTHING;

-- ─── E-Mails (n8n-Pipeline Demo) ─────────────────────────────────────────────
INSERT INTO pastler_emails (id, message_id, von_email, von_name, betreff, inhalt_text, empfangen_at, verarbeitet) VALUES
  (
    '55555555-5555-5555-5555-555555555501',
    'demo-sales-001@pastler.local',
    'thomas.weber@demo-mieter.de',
    'Thomas Weber',
    'Defekte Beleuchtung im Treppenhaus',
    E'Guten Tag,\n\nseit drei Tagen ist die Beleuchtung im Treppenhaus zwischen 2. und 3. OG ausgefallen. Es ist abends sehr dunkel und unsicher.\n\nBitte um schnelle Behebung.\n\nMit freundlichen Grüßen\nThomas Weber\nHauptstraße 12, 3. OG links',
    NOW() - INTERVAL '2 hours',
    true
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    'demo-sales-002@pastler.local',
    'lisa.fischer@demo-mieter.de',
    'Lisa Fischer',
    'Wasserfleck an der Badezimmerdecke',
    E'Sehr geehrte Damen und Herren,\n\nich habe seit gestern einen braunen Fleck an der Decke im Bad (2. OG rechts). Vermutung: Leckage von oben.\n\nKönnen Sie bitte einen Sanitär beauftragen?\n\nLisa Fischer',
    NOW() - INTERVAL '5 hours',
    true
  ),
  (
    '55555555-5555-5555-5555-555555555503',
    'demo-sales-003@pastler.local',
    'michael.braun@demo-mieter.de',
    'Michael Braun',
    'Schlüssel verloren — Wohnungstür',
    E'Hallo Hausverwaltung,\n\nich habe meinen Wohnungsschlüssel verloren und komme nicht in die Wohnung (EG, Rheinweg 45).\n\nBitte Schlüsseldienst organisieren.\n\nMichael Braun\nTel. 0261 345678',
    NOW() - INTERVAL '1 day',
    true
  ),
  (
    '55555555-5555-5555-5555-555555555504',
    'demo-sales-004@pastler.local',
    'sabine.koch@demo-mieter.de',
    'Sabine Koch',
    'Mülltonnenstandplatz verstopft',
    E'Guten Morgen,\n\nder Mülltonnenbereich im Hinterhof ist überfüllt. Können Sie die Reinigung beauftragen?\n\nDanke\nSabine Koch',
    NOW() - INTERVAL '3 days',
    true
  ),
  (
    '55555555-5555-5555-5555-555555555505',
    'demo-sales-005@pastler.local',
    'info@gastronomie-mayen.demo',
    'Gastronomie Mayen GmbH',
    'Heizungsausfall im Ladenlokal',
    E'Sehr geehrte Pastler Immobilienberatung,\n\nin unserem Ladenlokal (Marktplatz 3, EG) ist die Heizung seit dem Wochenende ausgefallen.\n\nBitte umgehend Techniker schicken.\n\nGastronomie Mayen GmbH',
    NOW() - INTERVAL '30 minutes',
    false
  )
ON CONFLICT (id) DO UPDATE SET
  von_email = EXCLUDED.von_email,
  von_name = EXCLUDED.von_name,
  betreff = EXCLUDED.betreff,
  inhalt_text = EXCLUDED.inhalt_text,
  empfangen_at = EXCLUDED.empfangen_at,
  verarbeitet = EXCLUDED.verarbeitet,
  mieter_id = EXCLUDED.mieter_id,
  inserat_id = EXCLUDED.inserat_id,
  vermieter_id = EXCLUDED.vermieter_id,
  zuordnung_quelle = EXCLUDED.zuordnung_quelle,
  zuordnung_konfidenz = EXCLUDED.zuordnung_konfidenz;

-- Zuordnung für Demo-E-Mails (nach Insert oben per UPDATE setzen)
UPDATE pastler_emails SET
  mieter_id = '22222222-2222-2222-2222-222222222201',
  inserat_id = '11111111-1111-1111-1111-111111111101',
  vermieter_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
  zuordnung_quelle = 'absender_mieter',
  zuordnung_konfidenz = 'hoch'
WHERE id = '55555555-5555-5555-5555-555555555501';

UPDATE pastler_emails SET
  mieter_id = '22222222-2222-2222-2222-222222222202',
  inserat_id = '11111111-1111-1111-1111-111111111101',
  vermieter_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
  zuordnung_quelle = 'absender_mieter',
  zuordnung_konfidenz = 'hoch'
WHERE id = '55555555-5555-5555-5555-555555555502';

UPDATE pastler_emails SET
  mieter_id = '22222222-2222-2222-2222-222222222203',
  inserat_id = '11111111-1111-1111-1111-111111111102',
  vermieter_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
  zuordnung_quelle = 'absender_mieter',
  zuordnung_konfidenz = 'hoch'
WHERE id = '55555555-5555-5555-5555-555555555503';

UPDATE pastler_emails SET
  mieter_id = '22222222-2222-2222-2222-222222222204',
  inserat_id = '11111111-1111-1111-1111-111111111102',
  vermieter_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
  zuordnung_quelle = 'absender_mieter',
  zuordnung_konfidenz = 'hoch'
WHERE id = '55555555-5555-5555-5555-555555555504';

UPDATE pastler_emails SET
  mieter_id = '22222222-2222-2222-2222-222222222205',
  inserat_id = '11111111-1111-1111-1111-111111111103',
  vermieter_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
  zuordnung_quelle = 'absender_mieter',
  zuordnung_konfidenz = 'hoch'
WHERE id = '55555555-5555-5555-5555-555555555505';

INSERT INTO pastler_todos (
  id, email_id, mieter_id, inserat_id, vermieter_id, partner_id, use_case, gewerk,
  zuordnung_quelle, zuordnung_konfidenz,
  titel, beschreibung, kategorie, prioritaet, status, faellig_at
) VALUES
  (
    '33333333-3333-3333-3333-333333333301',
    '55555555-5555-5555-5555-555555555501',
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111101',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
    '44444444-4444-4444-4444-444444444401',
    'defekte_beleuchtung',
    'elektriker',
    'absender_mieter',
    'hoch',
    'Defekte Beleuchtung Treppenhaus',
    'Mieter meldet ausgefallene Beleuchtung zwischen 2. und 3. OG — Elektriker beauftragen.',
    'extern', 'hoch', 'offen', CURRENT_DATE
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    '55555555-5555-5555-5555-555555555502',
    '22222222-2222-2222-2222-222222222202',
    '11111111-1111-1111-1111-111111111101',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
    '44444444-4444-4444-4444-444444444404',
    'wasserschaden',
    'sanitaer',
    'absender_mieter',
    'hoch',
    'Wasserfleck Badezimmerdecke prüfen',
    'Verdacht auf Leckage von oben — Sanitär Wagner zur Begutachtung.',
    'extern', 'hoch', 'in_bearbeitung', CURRENT_DATE + 1
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    NULL,
    NULL,
    '11111111-1111-1111-1111-111111111102',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
    NULL,
    NULL,
    NULL,
    'unbekannt',
    'niedrig',
    'Jahresabrechnung 2025 vorbereiten',
    'Nebenkostenabrechnung für WEG Rheinweg 45 erstellen und versenden.',
    'intern', 'mittel', 'in_bearbeitung', CURRENT_DATE + 14
  ),
  (
    '33333333-3333-3333-3333-333333333304',
    '55555555-5555-5555-5555-555555555503',
    '22222222-2222-2222-2222-222222222203',
    '11111111-1111-1111-1111-111111111102',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
    '44444444-4444-4444-4444-444444444402',
    'schluesselverlust',
    'schluessel',
    'absender_mieter',
    'hoch',
    'Schlüsseldienst — Wohnungstür EG',
    'Mieter hat Wohnungsschlüssel verloren, Zugang zur Wohnung nicht möglich.',
    'extern', 'hoch', 'offen', CURRENT_DATE
  ),
  (
    '33333333-3333-3333-3333-333333333305',
    '55555555-5555-5555-5555-555555555504',
    '22222222-2222-2222-2222-222222222204',
    '11111111-1111-1111-1111-111111111102',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02',
    '44444444-4444-4444-4444-444444444403',
    'muellbereich_reinigung',
    'reinigung',
    'absender_mieter',
    'hoch',
    'Mülltonnenbereich reinigen lassen',
    'Hinterhof überfüllt — Reinigungsdienst beauftragen.',
    'extern', 'mittel', 'offen', CURRENT_DATE + 2
  ),
  (
    '33333333-3333-3333-3333-333333333306',
    '55555555-5555-5555-5555-555555555505',
    '22222222-2222-2222-2222-222222222205',
    '11111111-1111-1111-1111-111111111103',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa03',
    '44444444-4444-4444-4444-444444444405',
    'heizungsausfall',
    'hausmeister',
    'absender_mieter',
    'hoch',
    'Heizungsausfall Ladenlokal Mayen',
    'Gewerbemieter meldet Heizungsausfall seit Wochenende — Techniker koordinieren.',
    'mieter', 'hoch', 'offen', CURRENT_DATE
  ),
  (
    '33333333-3333-3333-3333-333333333307',
    NULL,
    '22222222-2222-2222-2222-222222222201',
    '11111111-1111-1111-1111-111111111101',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
    NULL,
    NULL,
    NULL,
    'unbekannt',
    'niedrig',
    'Nebenkostenabrechnung Mieter Weber',
    'Einzelabrechnung 2025 an Thomas Weber versenden.',
    'mieter', 'niedrig', 'erledigt', NULL
  )
ON CONFLICT (id) DO UPDATE SET
  email_id = EXCLUDED.email_id,
  mieter_id = EXCLUDED.mieter_id,
  inserat_id = EXCLUDED.inserat_id,
  vermieter_id = EXCLUDED.vermieter_id,
  partner_id = EXCLUDED.partner_id,
  use_case = EXCLUDED.use_case,
  gewerk = EXCLUDED.gewerk,
  zuordnung_quelle = EXCLUDED.zuordnung_quelle,
  zuordnung_konfidenz = EXCLUDED.zuordnung_konfidenz,
  titel = EXCLUDED.titel,
  beschreibung = EXCLUDED.beschreibung,
  kategorie = EXCLUDED.kategorie,
  prioritaet = EXCLUDED.prioritaet,
  status = EXCLUDED.status,
  faellig_at = EXCLUDED.faellig_at;
INSERT INTO pastler_partner_nachrichten (id, todo_id, partner_id, betreff, inhalt, status) VALUES
  (
    '66666666-6666-6666-6666-666666666601',
    '33333333-3333-3333-3333-333333333301',
    '44444444-4444-4444-4444-444444444401',
    'Auftrag: Beleuchtung Treppenhaus — Hauptstraße 12, Koblenz',
    E'Sehr geehrter Herr Meier,\n\nwir bitten um Prüfung und Reparatur der Beleuchtung im Treppenhaus zwischen 2. und 3. OG.\n\nObjekt: Hauptstraße 12, 56068 Koblenz\nMeldung: Mieter Thomas Weber, 3. OG links\n\nBitte melden Sie sich vor Ort-Termin bei uns.\n\nMit freundlichen Grüßen\nPastler Immobilienberatung',
    'entwurf'
  ),
  (
    '66666666-6666-6666-6666-666666666602',
    '33333333-3333-3333-3333-333333333302',
    '44444444-4444-4444-4444-444444444404',
    'Dringend: Wasserschaden-Verdacht — Hauptstraße 12, 2. OG',
    E'Sehr geehrter Herr Wagner,\n\nunser Mieter meldet einen braunen Fleck an der Badezimmerdecke (2. OG rechts).\n\nBitte um zeitnahe Begutachtung und Leckageortung.\n\nObjekt: Hauptstraße 12, 56068 Koblenz\nAnsprechpartner vor Ort: Lisa Fischer\n\nPastler Immobilienberatung',
    'entwurf'
  ),
  (
    '66666666-6666-6666-6666-666666666603',
    '33333333-3333-3333-3333-333333333304',
    '44444444-4444-4444-4444-444444444402',
    'Schlüsselnotöffnung — Rheinweg 45, EG',
    E'Sehr geehrte Damen und Herren,\n\nbitte führen Sie eine Schlüsselnotöffnung durch:\n\nObjekt: Rheinweg 45, 56073 Koblenz, EG\nMieter: Michael Braun, Tel. +49 261 345678\n\nBitte Rechnung an Pastler Immobilienberatung.\n\nMit freundlichen Grüßen',
    'entwurf'
  )
ON CONFLICT (id) DO UPDATE SET
  todo_id = EXCLUDED.todo_id,
  partner_id = EXCLUDED.partner_id,
  betreff = EXCLUDED.betreff,
  inhalt = EXCLUDED.inhalt,
  status = EXCLUDED.status;
