# BRAND.md — Pastler Immobilienverwaltung
**Public Website ([pastler.com](https://pastler.com/)) + Internal Dashboard · Koblenz & Region**

**Rechtsform:** Immobilienverwaltung Pastler UG (haftungsbeschränkt)  
**Inhaber:** Jürgen Pastler — Zertifizierter Verwalter (IHK)  
**Kontakt:** hausverwaltung@pastler.com · 0261 1349 4710  
**Tagline:** *Ihr Wohneigentum in guten Händen*

---

## Brand Intent

Pastler is a young, certified Hausverwaltung that wants to signal **establishment and trustworthiness** despite being founded in 2025. The design must bridge this gap — modern and digital, but with the gravitas of an institution that's been around for decades.

**Two experiences, one design system:**
- **Public website** — sells Pastler to prospective clients (Eigentümer). Tone: elegant, authoritative, confident.
- **Internal dashboard** — operational tool for Pastler Mitarbeiter. Tone: clean, efficient, information-dense.

The brand remains consistent. The information density adjusts.

---

## Einzugsgebiet

**Marketing-Formulierung (Website):** *Wir sind tätig zwischen Bonn und Koblenz.*

**Operatives Gebiet:** Die verwalteten Objekte liegen zwischen **Bad Neuenahr-Ahrweiler** und **Braubach am Rhein** — im UNESCO-Weltkulturerbe Oberes Mittelrheintal.

| Stadt / Ort | Relevanz |
|-------------|----------|
| Bonn – Koblenz | Äußere Grenzen der Tätigkeit |
| Bad Neuenahr-Ahrweiler | Südliche Objektachse |
| Braubach am Rhein | Nördliche Objektachse |
| Andernach, Neuwied, Sinzig | Einzelstandorte (SEO-Unterseiten auf pastler.com) |

**Dashboard:** Kein Karten-Widget nötig. Standortangaben in Mieter-/Inserate-Daten reichen.

---

## Markenwerte — Rittertugenden

Das Logo (Ritter mit Schild) ist bewusst gewählt. Auf [pastler.com](https://pastler.com/) werden sechs Rittertugenden als Markenversprechen erklärt — *„Ihre Immobilie hat einen Ritter verdient.“*

| Tugend | Bedeutung für Pastler |
|--------|----------------------|
| **Mut** | Einsatz für Gerechtigkeit, Schutz der Schwächeren (Mieter, Eigentümer) |
| **Ehre** | Integrität, das Richtige tun — auch bei schwierigen Entscheidungen |
| **Treue** | Loyalität gegenüber Eigentümern, Mietern und eigenen Werten |
| **Höflichkeit** | Respektvoller Umgang, besonders mit Schwächeren |
| **Großzügigkeit** | Ressourcen teilen, fair handeln |
| **Demut** | Grenzen erkennen, sich stetig verbessern |

**Regionaler Bezug:** Viele Ritterlegenden spielen im Oberen Mittelrheintal — Pastlers Heimatregion.

**Copy-Hinweis:** Diese Werte in Marketing-Texten andeuten, nicht als Bullet-Liste im Dashboard wiederholen. Im Dashboard genügt das Logo als stilles Markenzeichen.

---

## Colour Palette

Farben gegen [pastler.com](https://pastler.com/) (Stand Juni 2026) abgeglichen. Die öffentliche Website nutzt **Burgund + Gold auf Weiß**; das Dashboard ergänzt **Navy** für Sidebar und Login (Kontrast, Lesbarkeit bei hoher Informationsdichte).

| Token | Hex | Usage |
|-------|-----|-------|
| `--navy` | `#1A2744` | Dashboard sidebar, login panel, dark sections |
| `--navy-deep` | `#0D1828` | Login background, hero gradient start |
| `--navy-mid` | `#243258` | Hover states on navy elements |
| `--burgundy` | `#9B2222` | Public-site headings, dashboard page titles (Playfair) |
| `--gold` | `#D0BA93` | Accent, CTA buttons, active nav, gold period — **live site primary** |
| `--gold-light` | `#E0D4B8` | Gold hover on dark backgrounds |
| `--gold-pale` | `#F5EFD8` | Light gold tint for callout boxes |
| `--warm-white` | `#F5F3EF` | Page background (public site, dashboard bg) |
| `--white` | `#FFFFFF` | Cards, surfaces, form backgrounds |
| `--border` | `#E5E1DA` | Default borders (warm, not cold gray) |
| `--border-strong` | `#CEC9C1` | Emphasis borders, dividers |
| `--text-primary` | `#1A1A1A` | Primary text |
| `--text-secondary` | `#7A756F` | Descriptions, meta, hints |
| `--text-hint` | `#8A857E` | Timestamps, labels, captions |
| `--success` | `#2D6A4F` | Todo status: erledigt |
| `--warning` | `#92400E` | Todo status: hoch-Priorität |
| `--info` | `#1A3A5C` | Todo status: extern |

**Dark mode:** Not required for v1. Public website and dashboard are light-only.

---

## Typography

| Role | Font | Size | Weight |
|------|------|------|--------|
| Display / Page hero | Playfair Display | 44–48px | 400 |
| Section heading | Playfair Display | 32–36px | 400 |
| Card heading | Playfair Display | 20–22px | 400 |
| Nav / Labels / Body | Inter | 12–16px | 300–500 |
| Dashboard data | Inter | 13–14px | 400–500 |
| Captions / Legal | Inter | 11–12px | 400 |

Load via `next/font/google` (Dashboard). Die Live-Website ([pastler.com](https://pastler.com/)) nutzt derzeit **Poppins** (Überschriften) und **Open Sans** (Fließtext) via Elementor — für das Dashboard bleiben Playfair + Inter die kanonische Kombination (Serif-Autorität + funktionale UI).
```typescript
import { Playfair_Display, Inter } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600'] });
const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500'] });
```

**Rule:** Playfair Display is for brand moments only — headings, hero titles, logo. Everything functional (forms, tables, badges, navigation) uses Inter. Never mix in the same sentence.

---

## Spacing & Layout

Base unit: `8px`

```
4px   — icon to label gap
8px   — tight UI gaps
12px  — component internal gap (cards, list items)
16px  — standard padding (mobile)
24px  — standard padding (desktop cards)
32px  — section padding vertical
48px  — major section spacing
72–80px — full section padding on public site
```

**Public site max-width:** None (sections are full-width with `48px` horizontal padding). Content inside sections: `max-w-[1100px] mx-auto`.

**Dashboard sidebar:** `240px` fixed. Content area: fluid.

---

## Border Radius

| Context | Value |
|---------|-------|
| Buttons | `2px` — almost square. Signals authority. |
| Cards, inputs | `3–4px` — subtle rounding |
| Badges, pills | `4px` |
| Never use | `rounded-xl`, `rounded-full` on anything structural |

This is intentional. The near-square corners are a brand signal.

---

## Components

### Navigation (Public)
```
Background: --navy (#1A2744)
Height: 68px
Logo: "PASTLER" + gold period in Playfair Display, 20px, letter-spacing 3px
Links: Inter 13px, rgba(255,255,255,0.7) → hover: --gold
CTA button: --gold bg, --navy text, 2px radius, 12px font, 500 weight
```

### Sidebar (Dashboard)
```
Background: --navy
Width: 240px
Logo: JPlogo graphic (88px wide), left-aligned
Nav items: Inter 13px, rgba(255,255,255,0.65) → active: --gold text + left border 2px --gold
Page titles (content area): Playfair Display, --burgundy
```

### Hero (Public)
```
Background: linear-gradient(120deg, #0D1828 0%, #1A2744 55%, #1E2E4F 100%)
Decorative pattern: CSS grid lines in --gold at 7% opacity
Badge (e.g. §34c): gold-tinted card, bottom-right corner
```

### Cards
```
Background: --white
Border: 0.5px solid --border
Border-radius: 3–4px
Accent variant (service cards): 2px top border in --gold
Padding: 24–28px
```

### Buttons
```css
/* Primary (public site CTA) */
background: #D0BA93; color: #9B2222; padding: 12px 26px; border-radius: 2px; font-size: 13px; font-weight: 500;

/* Dashboard primary */
background: #1A2744; color: #FFFFFF; padding: 8px 16px; border-radius: 4px; font-size: 13px;

/* Dashboard secondary */
background: transparent; color: #1A2744; border: 1px solid #E5E1DA; padding: 8px 16px; border-radius: 4px;

/* Ghost (on dark bg) */
background: transparent; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.3); padding: 12px 26px;
```

### Todo Status Badges (Dashboard)
```
offen:          bg #F5F3EF, text #7A756F, border #E5E1DA
in_bearbeitung: bg #EFF6FF, text #1A3A5C, border #BFDBFE
erledigt:       bg #ECFDF5, text #2D6A4F, border #A7F3D0
abgelehnt:      bg #FEF2F2, text #991B1B, border #FECACA
```

### Priority Badges (Dashboard)
```
hoch:    bg #FEF2F2, text #92400E
mittel:  bg #FFFBEB, text #78350F
niedrig: bg #F5F3EF, text #7A756F
```

### Kategorie Badges (Dashboard)
```
extern:  bg #EFF6FF, text #1A3A5C
mieter:  bg #F0FDF4, text #166534
intern:  bg #F5F3EF, text #7A756F
```

---

## Contact Form (Public Website)
```
Background: --navy-deep section
Input style: rgba(255,255,255,0.07) bg, rgba(255,255,255,0.12) border, white text
Label: 10px Inter, ALL CAPS, letter-spacing 1px, rgba(255,255,255,0.4)
Submit button: --gold bg, --navy text
```

---

## Logo / Wordmark

### Graphic logo (primary)

Ritter mit Schild — Quelle: [pastler.com](https://pastler.com/), Design: [Evamaria Deisen](http://evamariadeisen.de/).

| Asset | Pfad | Verwendung |
|-------|------|------------|
| Knight logo (AVIF) | `public/JPlogo-png.avif` | Sidebar, Login — via `components/PastlerLogo.tsx` |
| Fallback SVG | `public/pastler-logo.svg` | Nur Entwicklung / Platzhalter |

**Dashboard-Regel:** Graphic logo in Sidebar und Login. Kein separates Favicon-Setup nötig für v1.

### Typographic wordmark (secondary)

Ergänzend, wenn kein Bild passt (z. B. enge Mobile-Nav):

```
PASTLER.
```

- Font: Playfair Display 400, letter-spacing: 3px
- „PASTLER“ in white (on dark) oder `--burgundy` (on light)
- „.“ immer in `--gold`
- Punkt nicht vom Wort trennen

---

## Copy Tone

**Public website:** Confident, established, slightly formal. Sie-form. Short sentences.
- ✅ „Ihr Wohneigentum in guten Händen.“
- ✅ „Hier ist Ihr Wohneigentum in guten Händen!“ (Inhaber-Zitat)
- ✅ „Wir reagieren. Innerhalb von 24 Stunden.“
- ❌ „Wir sind super stolz auf unser tolles Team!“

**Dashboard UI:** Functional. Minimal. German labels only where needed.
- ✅ "Keine offenen To-Dos"
- ✅ "Eingang 14:23 Uhr"
- ❌ "Alles erledigt! 🎉"

---

## Dashboard UI Kit

Material-Dashboard-inspirierte Shell (Sidebar + TopBar + elevated Cards), umgesetzt als eigenes Tailwind-v4-System — **ohne** externes UI-Framework.

| Bereich | Pfad / Token |
|---------|----------------|
| Design-Tokens | `app/globals.css` — Farben, `--shadow-card`, `--sidebar-width`, `--topbar-height` |
| Primitives | `components/ui/*` — Card, StatCard, PageHeader, Breadcrumbs, Button, Input, Select, DataTable |
| App-Shell | `components/Sidebar.tsx`, `components/TopBar.tsx`, `app/(dashboard)/layout.tsx` |
| Logo | `components/PastlerLogo.tsx` → `public/JPlogo-png.avif` |

**Shadow-Utilities:** `.shadow-card`, `.shadow-sidebar` in `globals.css`

**Regel:** Neue Dashboard-UI über `components/ui/*` bauen, nicht inline auf jeder Seite.

---

## What This Brand Is NOT

- Not tech startup (no purple, no rounded corners, no glassmorphism)
- Not traditional old-school Verwaltung either (not clip art, not Word-document aesthetic)
- Not minimalist for minimalism's sake — there's warmth from the gold and the serif
- Not a SaaS dashboard — the dashboard is a tool, not a product in itself
