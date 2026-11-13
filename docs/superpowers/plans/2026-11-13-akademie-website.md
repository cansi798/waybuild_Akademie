# waybuild Akademie Website – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Statische Akademie-Website (Kurskatalog, Kursseiten, Terminübersicht, Anmeldung, Rechtsseiten) als Vorschau auf GitHub Pages, live später auf ALL-INKL.

**Architecture:** Astro (statisch) + Inhalte als Content Collection (eine Markdown-Datei je Kurs, Frontmatter per Zod-Schema). Tailwind CSS v4 + daisyUI v5 als einzige UI-Bibliothek (reines CSS, kein Framework-JS). Formular: Vanilla-JS-Validierung, Versand an ein PHP-Skript (`public/api/anmeldung.php`) auf ALL-INKL; in der Vorschau Demo-Modus ohne Versand.

**Tech Stack:** Astro 5, Tailwind CSS 4 (`@tailwindcss/vite`), daisyUI 5, `@fontsource-variable/*` (selbst gehostet), Playwright (Docker-Image `mcr.microsoft.com/playwright:v1.48.2-jammy`), Node nur per Docker `node:22`.

**Spec:** `docs/02-anforderungen.md` + `docs/intern/entscheidungen.md` (Entscheidungen haben Vorrang). Kursdaten: `docs/intern/kurskatalog-recherche.md`.

## Global Constraints

- Repo ist ÖFFENTLICH: nichts aus `docs/intern/` zitieren, keine Wettbewerberpreise, keine Dozentennamen.
- Du-Ansprache. Alles nur Live-Online. Keine Online-Zahlung, keine Nutzerkonten.
- Dozenten anonym: „erfahrene IHK-Prüfer und Dozenten mit langjähriger Praxis“ / „Dozenten mit IHK-Prüfer-Erfahrung“. Keine Zahlen/Quoten/Bewertungen.
- Hinweis überall im Fuß und auf IHK-Kursseiten: „Unabhängiges Bildungsangebot der waybuild Akademie – keine Veranstaltung der IHK. Die Prüfung legst du bei deiner zuständigen IHK ab; verbindlich sind deren Termine.“
- „Teilnahmegebühr“ statt „Prüfungsgebühr“. Preise als Endpreise (Hinweis „umsatzsteuerfrei“ NICHT verwenden, solange keine Befreiung vorliegt → Preis „inkl. aller Kosten“, USt-Frage bleibt offen, siehe Technical Debt).
- Förderung (Aufstiegs-BAföG, Bildungsgutschein) NICHT bewerben.
- Kein Plätze-Zähler, keine Mindestteilnehmerzahl öffentlich, keine Statistik/Tracker, keine externen CDNs/Fonts.
- Entwurfs-Kurse (`status: entwurf`) erscheinen nur in der Vorschau (`PUBLIC_PREVIEW=true`) mit gelbem Band „Entwurf – noch nicht freigegeben“; im Live-Build ausgeblendet.
- Vorschau: `noindex`, robots.txt `Disallow: /`, Vorschau-Banner. ENV wie waybuild_website: `SITE`, `BASE` (`/waybuild_Akademie` bzw. `/`), `PUBLIC_PREVIEW`.
- Live-Domain `https://waybuild-akademie.de`; Mails `anmeldung@waybuild-akademie.de`, `info@waybuild-akademie.de`.
- Barrierefreiheit WCAG 2.2 AA, ab 320 px ohne horizontales Scrollen, Lighthouse mobil ≥ 95.
- Commits: `-c user.name="Jan Sievert" -c user.email="jan.sievert@waybuild.de"`, Endzeile `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Design-Richtung („Überrasch mich“)

Markenfarben aus dem Logo: Petrol-Blau `#0079A6` (primary), Navy `#00346B` (secondary/Text dunkel), Grau `#545454`, Tiefes Petrol `#006B68` (accent dunkel). Dazu ein warmer Akzent für Handlungsknöpfe: Bernstein `#F2A900` (auf Navy) bzw. dunkle Variante für Text-Kontrast. Hintergrund warmes Off-White `#FAF8F4`, Karten weiß.
Typo: Überschriften „Fraunces Variable“ (Serifen, akademisch-modern), Fließtext „Inter Variable“ – beide über @fontsource selbst gehostet.
**Überraschungs-Element Startseite:** „Prüfungs-Countdown“ – große, ruhige Anzeige „Noch N Tage bis zur AP1 am 24.02.2027“ mit Umschalter AP1/AP2 und direkt darunter „Dein Kurs startet am 19.01.2027 →“. Daten kommen aus den Kursterminen (kein Hardcode im Bauteil). Außerdem „Lernpfad“-Grafik (Start → Kurs → Prüfung → Abschluss) als SVG-Linie, die sich beim Scrollen zeichnet (reduced-motion: statisch).

## Datenmodell (Interface für alle Tasks)

`src/content.config.ts` – Collection `kurse` (glob `src/content/kurse/*.md`):

```ts
saeule: z.enum(['ihk-pruefung', 'ihk-weiterbildung', 'akademie'])  // IHK-Prüfungsvorbereitung | IHK-Weiterbildung | waybuild Weiterbildung
kategorie: z.string()            // z. B. "IT-Berufe", "Kaufmännisch", "Fachwirte", "Betriebswirte", "Ausbilder", "KI", "Programmierung", "IT"
titel: z.string()
untertitel: z.string()
kurzbeschreibung: z.string().max(220)
status: z.enum(['freigegeben', 'entwurf'])
art: z.enum(['kurs', 'coaching'])
ue: z.number().int().positive().optional()       // Unterrichtseinheiten à 45 Min
dauer: z.string()                                 // "ca. 5 Wochen", "ca. 14 Monate"
zeiten: z.string()                                // "Di + Do, 18:00–20:45 Uhr"
preis: z.object({ betrag: z.number(), hinweis: z.string().optional(), raten: z.boolean().default(false) })
pakete: z.array(z.object({ name: z.string(), betrag: z.number(), beschreibung: z.string() })).optional() // Coaching
zielgruppe: z.array(z.string())
voraussetzungen: z.array(z.string())
inhalte: z.array(z.object({ titel: z.string(), punkte: z.array(z.string()) }))
abschluss: z.string()                              // "Teilnahmebescheinigung; Prüfung bei deiner IHK"
termine: z.array(z.object({
  id: z.string(),                                 // "ap1-2027-fruehjahr"
  start: z.coerce.date(), ende: z.coerce.date(),
  pruefung: z.coerce.date().optional(),           // IHK-Prüfungstag
  pruefungHinweis: z.string().optional(),
  anmeldeschluss: z.coerce.date(),                // start − 7 Tage
  ausfall: z.array(z.coerce.date()).default([]),
})).default([])
faq: z.array(z.object({ frage: z.string(), antwort: z.string() })).default([])
reihenfolge: z.number().default(100)
```
Body (Markdown) = ausführliche Beschreibung. Slug = Dateiname.

`src/lib/kurse.ts`: `alleKurse(): Promise<Kurs[]>` (filtert `entwurf` außer bei `PUBLIC_PREVIEW`), `naechsterTermin(kurs)`, `alleTermine(): TerminMitKurs[]` (sortiert, nur zukünftige), `formatEuro(n)`, `formatDatum(d)`, `saeulenName(s)`.

## Seiten

`/` Start · `/kurse/` Katalog (Filter Säule/Kategorie, CSS+kleines JS, ohne JS alle sichtbar) · `/kurse/[slug]/` Kursdetail (Sprungnavigation, Inhalte, Termine, Preis, FAQ, CTA) · `/termine/` alle Termine · `/pruefungsvorbereitung/` Landing IHK-Prüfung (Ziel top-abschluss.de) · `/coaching/` · `/ueber-uns/` · `/faq/` · `/kontakt/` · `/anmeldung/?kurs=<slug>&termin=<id>` · `/interesse/?kurs=<slug>` · `/danke/` · `/impressum/` `/datenschutz/` `/teilnahmebedingungen/` `/widerruf/` · 404.

## Tasks

### Task 1: Grundgerüst, Design-System, Layout, Startseite, Deploy
Files: package.json, astro.config.mjs, src/styles/global.css (Tailwind+daisyUI-Theme „akademie“), src/layouts/Basis.astro (Kopf, Menü mobil, Fuß mit IHK-Hinweis, Vorschau-Banner, SEO-Meta, noindex in Vorschau), src/components/{Kopf,Fuss,Countdown,Lernpfad,KursKarte}.astro, src/content.config.ts, src/lib/kurse.ts, src/content/kurse/ (3 Kurse freigegeben: ap1-it-berufe, ap2-fachinformatiker-systemintegration, pruefungscoaching – aus dem Ausgangskonzept, Termine 2027 laut Entscheidungen), src/pages/index.astro, public/robots.txt-Logik, .github/workflows/deploy.yml (Pages-Vorschau + ALL-INKL-Artefakt), scripts/bau.sh, tests/ (Playwright: Start lädt, kein H-Scroll 320–1440, Countdown zeigt Tage, Menü per Tastatur), README.
Deliverable: Vorschau https://cansi798.github.io/waybuild_Akademie/ zeigt die Startseite.

### Task 2: Kursentwürfe (Inhalt) – parallel zu Task 3/4 möglich (nur `src/content/kurse/*.md`)
Alle weiteren Kurse aus der Katalog-Recherche (Prio 1–3) als `status: entwurf`, faire Preisvorschläge laut Recherche, Inhalte nach DIHK-Rahmenplan in eigenen Worten.

### Task 3: Katalog, Kursdetail, Termine, Landing Prüfungsvorbereitung, Coaching, FAQ, Über uns, Kontakt (Seiten)

### Task 4: Anmeldung, Interesse, Danke + `public/api/anmeldung.php` (ALL-INKL, mail(), Honeypot + Zeitfalle, Bestätigungs-Mail, Validierung serverseitig) + Tests

### Task 5: Rechtsseiten-Entwürfe (Impressum, Datenschutz, Teilnahmebedingungen inkl. Storno/Absage/Raten, Widerruf mit Muster) – deutlich als Entwurf markiert

### Task 6: Dokumente Phase 1/2: 01-projektdokumentation.md, 03-spezifikation.md (Klassen-/Aktivitätsdiagramm, Mockup-Beschreibung = Screenshots), 04-architektur.md (Sequenzdiagramm Anmeldung), 05-technical-debt.md

### Task 7: Phase 3: 06-tests.md (Strategie + Protokoll aus Playwright-Läufen), 07-benutzeranleitung.md, 08-abschlussbericht.md; Gesamt-Review

## Review Focus

1. Lange Firmennamen/Kurstitel brechen Layout bei 320 px nicht.
2. Ohne JavaScript bleiben Katalog, Termine und Formular nutzbar (Formular-Fallback: normales POST).
3. Vergangene Termine verschwinden automatisch (Build-Zeitpunkt), Countdown springt auf nächsten Termin.
4. Entwurfs-Kurse tauchen im Live-Build nirgends auf (auch nicht in Sitemap/Terminen/Countdown).
5. Formular: Pflichtfelder je Zahlweg korrekt, 1–5 Personen, Spam-Schutz, Fehlertexte verständlich, PHP verweigert ungültige Eingaben.
