# UI/UX Audit — Pastler Dashboard

**Stand:** 2026-06-22  
**Scope:** Dashboard, Todos, Inserate, Mieter, Partner, Login + alle Komponenten  
**Nächster Schritt:** Website-Anbindung geplant

---

## Offene Punkte (nach Schwere)

### Kritisch — blockiert Nutzbarkeit

| ID | Seite / Komponente | Problem | Fix |
|----|-------------------|---------|-----|
| C1 | Alle Seiten | Kein Ladezustand — leere Seite während Supabase-Queries | Skeleton-Komponente pro Card/Table-Row via React Suspense |
| C2 | Layout | Sidebar fix 240px, kein Hamburger-Toggle → Content auf Mobile zerstört | Collapsed-State + Drawer-Overlay für `<768px` |
| C3 | PartnerNachrichtPanel | "Ablehnen" und Statuswechsel ohne Bestätigungsdialog, kein Undo | Confirm-Dialog + Undo-Toast (z.B. 5s Fenster) |
| C4 | Login | Kein "Passwort vergessen?"-Link — Accounts sind ohne Admin gesperrt | `supabase.auth.resetPasswordForEmail()` + UI-Link |

---

### Hoch — verschlechtert Erfahrung

| ID | Seite / Komponente | Problem | Fix |
|----|-------------------|---------|-----|
| H1 | Alle Seiten | EmptyState: nur grauer Text, kein Icon, kein CTA | Icon + kontextspezifische Handlungsaufforderung |
| H2 | Formulare | Fehler generisch ("Speichern fehlgeschlagen"), kein Retry-Button | Server-Fehlermeldung anzeigen + Retry-Button |
| H3 | Dashboard, Todos | Rollenbeschränkungen für Eigentümer nicht erklärt | Badge "Eingeschränkt" neben gesperrten Features |
| H4 | Breadcrumbs | UUID in Pfad → zeigt "Detail" statt Entity-Name (z.B. "Mozartstraße 12") | Breadcrumb aus Seitendaten befüllen, nicht aus Pathname |
| H5 | Formulare / Inputs | Kein `focus:ring` auf Inputs — Tastaturnavigation unsichtbar (WCAG AA) | `focus:ring-2 focus:ring-navy` zu Input + Select |
| H6 | Todos | Keine Sortierung nach Fälligkeitsdatum — primärer Workflow des Verwalters | Sort-Option "Nach Fälligkeit" in TodoFilterBar |
| H7 | Dashboard | StatCards nicht klickbar — "4 offene Todos" führt nirgendwo hin | Link zu `/todos?status=offen` etc. |

---

### Mittel — Inkonsistenzen & Politur

| ID | Seite / Komponente | Problem | Fix |
|----|-------------------|---------|-----|
| M1 | Button.tsx | Primär-Button hat `rounded-[4px]`, Gold-Variante `rounded-[2px]` — Spec sagt 2px | Vereinheitlichen auf `rounded-[2px]` |
| M2 | TodoCard | `use_case: "defekte_beleuchtung"` — Entwickler-Jargon für Endnutzer | Label-Funktion wie `kategorieLabel()` für use_case oder Feld ausblenden |
| M3 | PartnerForm | "für n8n-Automatisierung" — Nutzer kennen n8n nicht | Umbenennen: "Aktiv — E-Mails werden automatisch weitergeleitet" |
| M4 | PartnerNachrichtPanel | Partner-E-Mail reiner Text | `href="mailto:{partnerEmail}"` |
| M5 | PartnerNachrichtPanel | "Senden" löst sofort aus, keine Vorschau | Vorschau-Modal oder Bestätigungs-Dialog vor dem Versand |
| M6 | Alle Formulare | Kein Erfolgshinweis nach Submit — Router navigiert still | Toast-Notification (Sonner) nach Create/Update |
| M7 | DataTable | Kein Sticky-Header beim Scrollen | `sticky top-0 bg-white z-10` auf `<thead>` |
| M8 | PartnerForm | Gewerk-Dropdown ohne Erklärung der Optionen | Tooltip oder Hilfstext pro Gewerk-Option |
| M9 | TodoFilterBar | Kein "Alle Filter zurücksetzen"-Button | Clear-All-Link wenn mind. 1 Filter aktiv |
| M10 | Sidebar | Logo ist kein Link zu `/dashboard` | `<Link href="/dashboard">` um PastlerLogo |
| M11 | Inserate | Keine Suchfunktion (anders als Mieter-Seite) | Suchfeld analog zu MieterSearch |
| M12 | Todos | Aktive Filter nicht visuell markiert | FilterSelect-Label fett wenn Wert ≠ default |

---

### Niedrig — Feinschliff

| ID | Seite / Komponente | Problem | Fix |
|----|-------------------|---------|-----|
| L1 | PastlerLogo | AVIF ohne Fallback — ältere Browser zeigen kein Logo | `<picture>` mit AVIF + PNG Fallback |
| L2 | Breadcrumbs | Kein Home-Icon + "Dashboard" am Anfang | Erstes Element `🏠 Dashboard` als Link |
| L3 | Datenschutz | Keine Print-Styles — rechtlich geteilt, sollte druckbar sein | `@media print { sidebar: hidden; max-width: 100% }` |
| L4 | Breadcrumbs | Kein `aria-current="page"` — Screenreader können aktive Seite nicht erkennen | `aria-current="page"` auf letztem Item |
| L5 | PartnerList | "Aktiv"-Badge inline statt Badge-Komponente — Inkonsistenz | `<Badge variant={{ type: "aktiv", value: p.aktiv }}>` |
| L6 | Inserat Detail | Kein Zurück-Link auf Edit-Seite `/inserate/[id]/bearbeiten` | Breadcrumb oder "← Zurück" Link |
| L7 | Partner Edit | Kein Löschen-Button — nur Archivieren über aktiv=false möglich | Delete-Button mit Bestätigung (soft-delete) |
| L8 | Datenschutz | Keine Inhaltsübersicht / Anchor-Links bei langer Seite | `<nav>` mit Sprungmarken zu den 8 Sektionen |

---

## Qualitative Erweiterungsvorschläge

### E1 — Kalender-Ansicht für Todos
**Warum:** Hausverwalter planen nach Terminen, nicht nach Listen. `faellig_at` ist bereits in der DB.  
**Was:** Monatsansicht mit Todos als Kacheln, klickbar → TodoCard-Detail.  
**Tech:** Eigene Grid-Komponente oder `react-big-calendar`; dieselben Supabase-Queries, nur andere Darstellung.

---

### E2 — Mieter-Ablauf-Erinnerungen (n8n)
**Warum:** `auszug_datum` liegt in der DB, aber kein System erinnert daran.  
**Was:** n8n-Cron (wöchentlich) sucht `auszug_datum < NOW() + 30 days` → erstellt automatisch Todo "Mietvertrag verlängern / Übergabe planen".  
**Tech:** Neuer Workflow in `n8n/workflows/mieter-ablauf-reminder.json`. Kein Dashboard-Code nötig.

---

### E3 — Toast-System (Sonner)
**Warum:** Aktuell kein Erfolgs-Feedback nach Create/Update/Send. Löst M6 + C3 + H2 auf einmal.  
**Was:** Sonner (`npm install sonner`) + `<Toaster>` in Layout. Alle API-Calls → `toast.success("...")` / `toast.error("...")`.  
**Tech:** 1–2h Aufwand, hoher Impact.

---

### E4 — Aktivitäts-Feed / Audit-Log
**Warum:** Wer hat wann was geändert? Bei mehreren Mitarbeitern kritisch für Nachvollziehbarkeit.  
**Was:** Supabase-Trigger schreibt Änderungen in `pastler_activity` → Timeline auf Inserat-Detailseite.  
**Tech:** Migration + Trigger + UI-Komponente `<ActivityFeed>`.

---

### E5 — Dokumenten-Upload
**Warum:** Mietverträge, Übergabeprotokolle, Rechnungen fehlen — Dashboard ist ohne sie kein vollständiges Aktensystem.  
**Was:** File-Upload pro Inserat + Mieter. Supabase Storage ist bereits im Stack.  
**Tech:** `supabase.storage.from("pastler-docs").upload(...)` + Dateiliste-Komponente.

---

### E6 — Kommunikations-Thread pro Todo
**Warum:** Partner-E-Mail-Entwürfe sind derzeit Einzeldokumente — kein vollständiger Verlauf sichtbar.  
**Was:** Thread-Ansicht (ein- und ausgehende E-Mails, Notizen, Statuswechsel) pro Todo als Seitenleiste oder Tab.  
**Tech:** E-Mail-Ingestion ist bereits da; UI-Konzept + `pastler_todo_kommentare`-Tabelle nötig.

---

### E7 — Schnell-Aktionen auf Dashboard
**Warum:** "Neue Anfrage erfassen" braucht aktuell 3 Klicks (Dashboard → Todos → Neu). Bei 10+ Anfragen/Tag relevant.  
**Was:** Floating-Action-Button oder Shortcut-Leiste direkt auf dem Dashboard.  
**Tech:** `<QuickActions>` Komponente mit Shortcuts für häufigste Aktionen.

---

## Website-Anbindung — Vorbereitungshinweise

Diese Punkte sind relevant sobald die Pastler-Website gebaut und angebunden wird:

| Thema | Jetzt vorbereiten |
|-------|-------------------|
| **Auth-Domain** | Supabase → Authentication → URL Configuration: Website-Domain zu Redirect URLs hinzufügen |
| **Env-Vars** | `NEXT_PUBLIC_SITE_URL` im Dashboard + auf Website gleich konfigurieren |
| **Lead-Capture** | Kontaktformular auf Website → `pastler_leads`-Tabelle → n8n-Workflow für Eingangsbestätigung |
| **Datenschutz-Sync** | `/datenschutz` im Dashboard und Datenschutzseite der Website aus gleicher Quelle (MDX oder Supabase CMS) |
| **Eigentümer-Login-Link** | Website → "Mein Bereich" → Dashboard-Login (gleicher Supabase-Auth-Flow) |
| **SEO vs. Dashboard** | Website ist public + indexierbar; Dashboard ist auth-gated — Robots.txt und Sitemap für beide separat konfigurieren |

---

## Priorisierte Umsetzungsreihenfolge

**Sprint 1 — Quick Wins (je ~30–60 Min)**
- [ ] H7 StatCards klickbar machen
- [ ] M10 Logo-Link zu /dashboard
- [ ] M4 Partner-E-Mail als mailto-Link
- [ ] M3 "n8n-Automatisierung" → nutzerfreundlicher Text
- [ ] L6 Zurück-Link auf Edit-Seiten

**Sprint 2 — Toast + Dialoge (~2–3h)**
- [ ] E3 Sonner Toast-System einführen (löst M6, H2 mit)
- [ ] C3 Bestätigungs-Dialog für Ablehnen + Senden
- [ ] C4 Passwort-Reset auf Login-Seite

**Sprint 3 — Accessibility + Filter (~3–4h)**
- [ ] H5 Focus:ring auf alle Inputs
- [ ] L4 aria-current auf Breadcrumbs
- [ ] H6 Sort-Option in TodoFilterBar
- [ ] M9 Clear-All in FilterBar
- [ ] M11 Suche auf Inserate-Seite

**Sprint 4 — Loading + Mobile (~4–6h)**
- [ ] C1 Skeleton-Komponenten auf allen Seiten
- [ ] C2 Mobile Sidebar Drawer

**Sprint 5 — Erweiterungen (~je 1–2 Tage)**
- [ ] E1 Kalender-Ansicht für Todos
- [ ] E2 Mieter-Ablauf-Erinnerungen (n8n-Workflow)
- [ ] E4 Aktivitäts-Feed
- [ ] E5 Dokumenten-Upload

---

## Änderungshistorie

| Datum | Änderung |
|-------|----------|
| 2026-06-22 | Audit erstellt nach vollständiger Code-Review aller Pages + Komponenten |
