# Betroffenenrechte — Prozess (Art. 15–22 DSGVO)

**Verantwortlicher:** Immobilienverwaltung Pastler UG (haftungsbeschränkt)  
**Kontakt:** hausverwaltung@pastler.com  
**Frist:** 1 Monat (Verlängerung +2 Monate bei Komplexität, Art. 12(3))

---

## 1. Eingang

Anfrage per E-Mail an hausverwaltung@pastler.com. Identität prüfen (z. B. Vertragsdaten, ausweisende E-Mail-Adresse).

---

## 2. Auskunft (Art. 15)

**Mieter-Daten** in Supabase:

```sql
SELECT m.*, i.adresse, i.stadt
FROM pastler_mieter m
LEFT JOIN pastler_inserate i ON i.id = m.inserat_id
WHERE m.email ILIKE '%<email>%' OR m.name ILIKE '%<name>%';
```

**E-Mail-Verarbeitung:**

```sql
SELECT id, von_email, betreff, empfangen_at, verarbeitet, created_at
FROM pastler_emails
WHERE von_email ILIKE '%<email>%';
-- inhalt_text nur wenn noch nicht gelöscht (Retention 90 Tage)
```

**Todos** verknüpft mit Mieter/E-Mail.

**Partner-Stammdaten** (nur Mitarbeiter-Zugriff):

```sql
SELECT * FROM pastler_partner WHERE email ILIKE '%<email>%' OR firma ILIKE '%<name>%';
```

**Partner-Nachrichten** (Entwürfe/Gesendet):

```sql
SELECT pn.*, p.firma, p.email
FROM pastler_partner_nachrichten pn
JOIN pastler_partner p ON p.id = pn.partner_id
WHERE p.email ILIKE '%<email>%';
```

Export: CSV oder PDF manuell aus Supabase Table Editor / SQL-Ergebnis.

---

## 3. Berichtigung (Art. 16)

Korrektur in Supabase Table Editor oder SQL `UPDATE` auf `pastler_mieter` / `pastler_inserate`.

---

## 4. Löschung (Art. 17)

Prüfen ob gesetzliche Aufbewahrungspflichten entgegenstehen (HGB/AO, laufende Verwaltung).

**Lösch-Reihenfolge** (FK-abhängig):

```sql
-- 1. Partner-Nachrichten (falls Partner betroffen)
DELETE FROM pastler_partner_nachrichten WHERE partner_id = '<partner-uuid>';

-- 2. Todos des Mieters
DELETE FROM pastler_todos WHERE mieter_id = '<uuid>';

-- 3. Mieter
DELETE FROM pastler_mieter WHERE id = '<uuid>';

-- 4. E-Mails des Absenders
DELETE FROM pastler_emails WHERE von_email = '<email>';

-- 5. Partner-Stammdatensatz (optional)
DELETE FROM pastler_partner WHERE id = '<partner-uuid>';
```

Dokumentation: Datum, Anfragender, durchgeführte Schritte, Rechtsgrundlage der Löschung.

---

## 5. Einschränkung (Art. 18) / Widerspruch (Art. 21)

Fallbezogen mit Verantwortlichem klären. Technisch: Flag in `notizen` oder Sperre Dashboard-Zugang (Supabase Auth deaktivieren).

---

## 6. Datenübertragbarkeit (Art. 20)

Strukturierter Export (JSON/CSV) der in VV-1/VV-2 genannten Felder — manuell via SQL, kein Self-Service-UI in v1.

---

## 7. Beschwerde

Hinweis auf Landesdatenschutzbeauftragten Rheinland-Pfalz: [lda.rlp.de](https://www.lda.rlp.de/)
