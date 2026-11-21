# SEO · GEO · Performance · Barrierefreiheit – Runde 1 (nur lesen)

Stand: 21.11.2026 · Grundlage: main 786c8aa (`src/`, `dist/` = Vorschau-Build) + uncommitteter Stand `akad-start-6771/src` (Startseite neu, Berufsseiten).
Keine Analytics/Search Console → **keine Ranking- oder Klickzahlen**. „F“ = Fakt (im Code/Build belegt), „H“ = Hypothese.
Aufwand/Risiko: 1 = klein, 5 = groß. Spalte „Datei“: **frei** = darf diese Runde geändert werden, **besetzt** = anderer Helfer/Freigabe nötig.

## 0. Rahmen: was live tatsächlich erscheint (F)

- `src/lib/kurse.ts:38` – live nur `status: freigegeben`. Von 70 Kursdateien sind **3 freigegeben**: `ap1-it-berufe`, `ap2-fachinformatiker-systemintegration`, `pruefungscoaching` (alle Säule `ihk-pruefung`). Die 67 Entwürfe gibt es nur in der Vorschau.
- Live-Modus: `robots` = `index, follow` (`src/layouts/Basis.astro:33`), robots.txt mit Sitemap (`src/pages/robots.txt.ts:7-10`), Canonical = eigener Pfad ohne Query (`Basis.astro:31`). Vorschau: noindex + `Disallow: /` – Absicht, in Ordnung.
- Sitemap filtert danke/404/interesse/kurse/pruefungscoaching (`astro.config.mjs:19-21`). Kein `lastmod` (H: kleiner Nachteil beim Neu-Crawlen).
- hreflang: keiner – richtig, nur Deutsch.
- 404: `noindex`, Links zu Start + `MENUE.slice(0,3)` (`src/pages/404.astro:13-14`).

## 1. Suchintentionen (Abdeckung live)

| Suchintention | Passende Seite live | Befund | Art |
|---|---|---|---|
| „AP2 Fachinformatiker Vorbereitung“ | nur `/kurse/ap2-fachinformatiker-systemintegration/`; im 6771-Stand zusätzlich 7 IT-Berufsseiten (über AP1 sichtbar) | H1 und Course-`name` lauten nur „Vorbereitung auf die IHK-Abschlussprüfung Teil 2 (AP2)“ – Beruf steht nur im `<p>`-Untertitel (`[slug].astro:134-135`, Kursdatei Z. 4-5). AP2 Anwendungsentwicklung (größte Gruppe) ist Entwurf → live keine AP2-Kursseite dafür. | F |
| „Abschlussprüfung Teil 1 Kaufmann Büromanagement Vorbereitung online“ | **keine** | `bueromanagement-teil-1` ist Entwurf; Berufsseite wird nur erzeugt, wenn ≥1 Kurs sichtbar ist (`akad-start-6771/src/lib/berufe.ts:62-65`) → live kein Treffer. | F |
| „IHK Prüfungsvorbereitung online abends“ | Startseite (6771), `/pruefungsvorbereitung/` | 6771-Titel „IHK-Prüfungsvorbereitung live online“ (56 Z. gesamt) trifft gut; main-Titel „waybuild Akademie – Live-Online-Kurse und Weiterbildung“ ist generisch. „abends“ nur in Beschreibung. | F |
| „Wirtschaftsfachwirt online live“ | **keine** | Kurs ist Entwurf; Menüpunkt „IHK-Weiterbildung“ (6771) führt live auf leere Filteransicht `/kurse/?saeule=ihk-weiterbildung`. | F |

## 2. Befunde

| # | Befund | Evidenz (Datei:Zeile) | Vorschlag | Aufw. | Risiko | Datei-Status |
|---|---|---|---|---|---|---|
| 1 | **Widerspruch Unterrichtszeit**: neue allgemeine Angabe „17:00–20:00 Uhr“ vs. Kursdaten „Di + Do, 18:00–20:30 / 18:00–21:15 Uhr“ (kein einziger Kurs 17–20). Steht auf derselben Berufsseite nebeneinander, in FAQPage-Schema der Startseite und in llms-full.txt → KI-Suchen zitieren widersprüchliche Fakten. (F) | 6771 `src/lib/site.ts:41-43`; `src/pages/index.astro` FAQ „Wann ist Unterricht?“ + FAKTEN „Unterricht“; `pruefungsvorbereitung/[beruf].astro:46` vs. `:94`; `llms-full.txt.ts` Fakten + FAQ; main `src/content/kurse/*.md` Feld `zeiten` (27× 18:00–20:30, 23× 18:00–21:15 + Sa …) | Eine Wahrheit festlegen (Can): entweder Kursdaten auf 17–20 umstellen oder allgemeine Angabe zu „abends ab 18 Uhr, genaue Zeiten je Kurs“ ändern. Bis dahin keine Uhrzeit im FAQ-Schema. | 2 | 4 (Vertrauen/Abmahnrisiko bei falschen Angaben) | besetzt (site.ts, index, [beruf], llms*, content) |
| 2 | **Live nur 3 Kurse** → Menü/Startseite (6771) bewerben „IHK-Weiterbildung“ und „waybuild Weiterbildung“ (Fachwirt, Betriebswirt, KI …), live ohne einen Kurs; Videos dort „Video folgt“. Kaufmännische Berufe live ganz ohne Seite. (F) | main `src/lib/kurse.ts:38,44`; 6771 `src/lib/site.ts` MENUE; `index.astro` BEREICHE/KATALOG | Entscheidung Can: (a) Bereiche/Menüpunkte live ausblenden, solange 0 Kurse, oder (b) Berufs-/Kursseiten als „Interesse vormerken“-Seiten ohne Preis live schalten (eigener Status z. B. `vormerken`). (b) bringt die Suchintentionen Büromanagement/Wirtschaftsfachwirt überhaupt erst ins Spiel (H). | 3 | 3 | besetzt (site.ts, index, berufe.ts, content); `lib/kurse.ts` frei |
| 3 | **H1/Course-Name ohne Beruf** bei AP1/AP2 (s. Tabelle 1). Title ist gut („AP2 Fachinformatiker Systemintegration“), H1 und `Course.name` nicht. (F) | `src/pages/kurse/[slug].astro:134`; `src/components/seiten/schema.ts:98` (`name: d.titel`) | H1 = Titel + Untertitel als eine Überschrift (Untertitel in `<span>` in der H1); `Course.name` = `${titel} – ${untertitel}`. | 1 | 1 | frei |
| 4 | **Titel > 60 Zeichen**: 19 Kursseiten (alle Entwürfe ohne `SEO_KURSE`-Eintrag, z. B. Groß-/Außenhandel 87, Industriekaufleute alt 83, NTG 78, Versicherungen 77) und alle Berufsseiten (6771, z. B. „Prüfungsvorbereitung Fachinformatiker Anwendungsentwicklung | waybuild Akademie“ ≈ 79). Keine doppelten Titel; 1 doppelte Beschreibung (nur noindex-Coachingseite). (F) | `src/lib/seo.ts:45-49` (Fallback = voller Titel); `Basis.astro:29`; 6771 `[beruf].astro:30` | Fallback: Markenzusatz weglassen, wenn > 60 (in `Basis.astro`), plus kurze SEO-Titel je Kurs vor Freigabe; Berufsseite: „AP1/AP2 Vorbereitung {Kurzname} online“. Slug/Titel-Abweichung `fachwirt-versicherungen…` → „Bachelor Professional …“ prüfen. | 2 | 1 | Basis.astro frei; seo.ts, [beruf] besetzt |
| 5 | **Course-/Event-Schema mehrfach**: Berufsseite bettet volles `kursSchema` ein (gleiche `@id …/kurse/ap1-it-berufe/#kurs` + Events) → AP1-Course + 2 Events identisch auf 7 Berufsseiten + Kursseite. (F) Google wertet doppelte Event-/Course-Auszeichnung auf Nicht-Hauptseiten als Duplikat (H). | 6771 `[beruf].astro:26-29`; `components/seiten/schema.ts:79-136` | Auf Berufsseiten nur `ItemList` mit URLs bzw. `{ "@id": … }`-Verweis, volles Course/Event nur auf der Kursseite. | 1 | 1 | besetzt ([beruf]); schema.ts frei |
| 6 | **Interne Verlinkung**: (a) In `<main>` haben 34 der 70 Kursseiten nur 1 eingehenden Link (nur `/kurse/`), 33 genau 2 (`/kurse/` + `/termine/`); nur AP1/AP2-SI (4) und Coaching (3) mehr. Alle Kursseiten sind bisher zusätzlich über das Mega-Menü im Kopf verlinkt (≈86 Seiten). (b) 6771 **löscht MegaMenue** (`D src/components/uebersicht/MegaMenue.astro`) → Kopf verlinkt keine Kurse mehr. (c) Kursseite verlinkt nicht zurück auf ihre Berufsseite; `/termine/` und `/faq/` (main) verlinken keine Berufsseiten. (F) | `dist/**/index.html` (Auswertung `<main>`-Links); 6771 `git status`; `[slug].astro` (kein Link auf `/pruefungsvorbereitung/<beruf>/`) | Kursseite: Block „Für deinen Beruf“ mit Link zur Berufsseite (Zuordnung aus berufe.ts lesen); Termine-Zeile + KursKarte: Link „zur Berufsseite“; FAQ „Welcher Kurs passt?“ → Berufsseiten. Mega-Menü-Ersatz im Fuß (FUSS_MENUE) um Berufe ergänzen. | 2 | 1 | [slug], termine, faq, KursKarte, KursZeile frei; Kopf/Fuss/berufe.ts besetzt |
| 7 | **Organisation dünn für GEO/Entität**: `EducationalOrganization` ohne `address`, `legalName`, `areaServed`, `sameAs`, `telephone`. (F) Adresse steht nur im Impressum. | `src/layouts/Basis.astro:35-44`; `src/pages/impressum/index.astro:24-29` | `legalName: Waybuild UG (haftungsbeschränkt)`, `address` (PostalAddress laut HR-Auszug), `areaServed: DE`, `parentOrganization`; Daten zentral in site.ts. | 1 | 1 | Basis.astro frei; Daten in site.ts besetzt (zur Not in Basis) |
| 8 | **Video-Platzhalter (6771)**: kein `public/video/` → alle 3 Bereiche zeigen „Video folgt – mit Can und Jamil“. Technik gut: `preload="none"`, Laden erst beim Scrollen, Poster `loading="lazy"`, Seitenverhältnis-Box (kein CLS), reduced-motion, Pause-Knopf, Transkript. Kein `VideoObject`-Schema. (F) | 6771 `src/components/start/VideoPlatz.astro:19-23,34-46,57-70`; `site.ts` VIDEOS | Live: Platzhalter ausblenden statt „Video folgt“ (H: wirkt unfertig). Sobald Videos da: `VideoObject` (name, description = Transkript, thumbnailUrl, uploadDate, duration). | 2 | 2 | besetzt (start/*, site.ts) |
| 9 | **FAQ/GEO-Fakten**: FAQPage auf Start, /faq/, /pruefungsvorbereitung/, /coaching/, jeder freigegebenen Kursseite – Antworten kurz und zitierfähig (Preis = Endpreis, live, keine Aufzeichnung, Rechnung, unverbindlich, IHK-Hinweis) (F). FAQ-Rich-Results zeigt Google seit 2023 nur noch für Behörden/Gesundheit (F, Google-Ankündigung) → Nutzen v. a. für KI-Suchen. Behauptung „Dozenten mit IHK-Prüfer-Erfahrung“ ohne Beleg auf der Seite (llms.txt, Startseite 6771). (F) Kurz-Fakt „Dauer“ fehlt in Start-FAKTEN. | `src/pages/llms.txt.ts:36`; 6771 `index.astro` BEREICHE/FAKTEN | Fakten-Block um „Dauer: 10–15 Abende, 35–45 UE“ ergänzen; Prüfer-Aussage nur mit Beleg (Name/Funktion, Über-uns) oder streichen. Gleiche Antworttexte überall aus `lib/faq.ts`. | 2 | 3 (Werbeaussage) | besetzt (faq.ts, llms*, index); ueber-uns frei |
| 10 | **Performance** – insgesamt gut (F): eine CSS-Datei `Basis.*.css` 97 KB (17,6 KB gzip, render-blockierend); JS je Seite ≤ 9 KB als Module; 2 Schriften vorgeladen (Inter latin 48 KB + Fraunces latin 67 KB), latin-ext wird nicht gebraucht (keine Zeichen außerhalb latin gefunden). HTML: Kursseite ≈ 79 KB (13 KB gzip), davon **31 KB Kopf/Mega-Menü**; größte Seiten `/kurse/` 356 KB (22 KB gzip), `/termine/` 222 KB, `/anmeldung/` 150 KB, Start 142 KB (Vorschau mit 70 Kursen; live deutlich kleiner). `dist` gesamt 7,9 MB. Alle 174 `<img>` mit width/height. | `dist/_astro/*`, `du -b`, gzip -9 | Kein Handlungsdruck. Optional: Fraunces-Preload nur auf Seiten mit Serif-H1 oben; Mega-Menü-Wegfall (6771) spart ~30 KB HTML je Seite. Feldmessung (CrUX) erst nach Livegang möglich. | 1 | 1 | Basis.astro frei |

## 3. Barrierefreiheit (statisch, dist/)

| Prüfung | Ergebnis | Art |
|---|---|---|
| Bilder ohne `alt` | 0 von 174 | F |
| Links/Buttons ohne zugänglichen Namen (Text, alt, aria-label, title) | 0 | F |
| Formularfelder ohne Label (label for, umschließendes label, aria-label) | 0; 6771 BerufWahl-Suche hat sr-only-Label + `aria-live`-Trefferzahl (`BerufWahl.astro:30-44`) | F |
| Fokus-Stil | `:focus-visible` 3 px Petrol, auf Navy/Tief-Petrol Bernstein (`src/styles/global.css:120-127`); Skip-Link vorhanden (`Basis.astro:76-80`) | F |
| H1 je Seite | überall genau 1, außer `/danke/` (5 H1 in Zustands-Varianten, `danke/index.astro:72,86`; noindex) | F |

Kontrast (berechnet, WCAG-Formel):

| Vordergrund / Hintergrund | Verhältnis | Bewertung |
|---|---|---|
| Bernstein #F2A900 auf Off-White #FAF8F4 | **1,89 : 1** | fällt durch – Text (4,5) und Grafik/Bedienelement (3,0) |
| Bernstein auf Weiß | 2,01 : 1 | fällt durch |
| Navy #00346B auf Bernstein (btn-accent) | 6,13 : 1 | AA ok |
| Bernstein auf Navy (`text-bernstein`, Fokusring dunkel) | 6,13 : 1 | AA ok |
| Petrol #0079A6 auf Off-White | 4,62 : 1 | AA knapp ok |
| Link-Petrol #006D96 auf #F2EEE6 | 5,00 : 1 | AA ok |
| Grau #545454 auf Off-White | 7,14 : 1 | AAA |

F: `text-bernstein` kommt nur auf Navy vor (`[slug].astro:334`, `ueber-uns:49`, `coaching:77`, `Risikoumkehr.astro:31,44`); auf hellem Grund nur als dekorativer Punkt (`aria-hidden`). Regel aus `global.css:7` wird eingehalten. Risiko: künftige Bernstein-Rahmen/Icons auf Hell wären Verstoß gegen 1.4.11.

## 4. Kurzfazit Priorität

1. Uhrzeit-Widerspruch (#1) vor jedem Livegang klären – betrifft Vertrauen, FAQ-Schema und KI-Zitate.
2. Live-Umfang (#2) entscheiden – sonst fehlen 3 von 4 Ziel-Suchintentionen komplett.
3. Schnelle freie Fixes: H1/Course-Name (#3), Titel-Fallback (#4), Rücklinks Kurs ↔ Beruf ↔ Termine (#6), Organisation (#7).
