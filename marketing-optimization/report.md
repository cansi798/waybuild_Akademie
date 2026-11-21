# Abschlussbericht – Marketing Optimization Loop, waybuild Akademie (21./22.11.2026)

## 1. Zeitbudget

- **Angefragt:** bis 22.11.2026 01:00 CET (ab 00:30 nur QA und Abschluss).
- **Genutzt:** 20:11 bis ca. 00:50, also etwa 4,5 Stunden aktive Sitzung.
- **Ablauf:** 8 Runden plus 4 unabhängige QA-Durchgänge. Die Runden 1–2 waren Baseline und Audit, gleichzeitig liefen drei andere Helfer. Ab Runde 3 wurde umgesetzt.
- **Agenten:** 3 Audit-Rollen parallel (Journey/Funnel/IA, SEO/GEO/Technik/A11y, Copy/Trust/Compliance), außerdem 4 getrennte QA-Rollen.

## 2. Ziel und Baseline

- **Ziel:** mehr unverbindliche Kursanfragen, Schwerpunkt Prüfungsvorbereitung für Azubis (AP1/AP2).
- **Datenbasis:** keine Analytics, keine Search Console, kein Tracking (bewusst so). Alle Aussagen zur Wirkung sind Hypothesen.
- **Ausgangsstand main 786c8aa:**
  - Build mit 87 Seiten, Playwright 240 pass / 8 skip.
  - Kursseiten hatten keinen unverbindlichen Weg. Der Weg lief über „Termin wählen“ und „Anmelden“ bis „Zahlungspflichtig anmelden“.
  - Die Zeitangaben widersprachen sich.
  - Die Kursdateien enthielten rund 250 Genderformen.
  - Live waren nur 3 von 70 Kursen freigegeben.

## 3. Umgesetzt (lokal, über Jan in main/Vorschau)

| Runde | Commit | Änderung | Dateien |
|---|---|---|---|
| 1 | – | Audit: Site-Map, Customer Journey, Funnel-Map, SEO/GEO/Technik, Copy/Trust/Compliance; Befunde für andere Helfer an Jan | marketing-optimization/* |
| 2 | 119049b | Kurs-FAQ mit Azubi-Einwänden (max. 10), Zahler-Hinweis im Kurskopf, Titel ≤ 60 Zeichen, Genderform /coaching/ | kurse/[slug], Basis, coaching |
| 3 | 174ea3d, 9b1c6ce | **Kursseite: „Unverbindlich anfragen“ – ein Tap zum Formular**, Hinweis zur Verbindlichkeit, Terminkarten „Anfragen“, Leiste 320 px, Course `alternateName` | kurse/[slug], TerminKarte, schema.ts, Tests |
| 4 | 1866a29 | Kursseiten → „Passt zu deinem Beruf“ (Rücklinks), 404 und Über uns mit Anfrage-Weg, Genderformen außerhalb der Kursdateien | kurse/[slug], 404, ueber-uns, llms*, anmeldung-client |
| 5 | 5a6ac62 | Ein Ablauf überall: Anfrage → Angebot → Zusage → Bestätigung; „Dozenten“ statt „Lehrende“; Berufssuche: Enter öffnet bei einem Treffer | zusagen.ts, index, [beruf], danke, ueber-uns, BerufWahl |
| 6 | f7364cd | Kopf-„Anfragen“ mit Seitenzusammenhang (Kurs-/Berufsseite) | Kopf.astro, Test |
| 7 | 3339d57 | QA-Fixes: kein festes Angebotsversprechen, Danke mit Zusage, Mobilmenü schließt, Coaching-Kopf, IME-Schutz | zusagen.ts, index, [beruf], danke, Kopf, BerufWahl |
| 8 | (siehe unten) | Entgendern aller 70 Kursdateien (nur „(m/w/d)“, keine Paarformen, „Mitarbeiter“) | src/content/kurse/*.md |

## 4. Validiert

Die einzelnen Läufe stehen in `qa-checklist.md`. Wichtigste Ergebnisse:

- **Build:** 0 Fehler, 106 Seiten.
- **Chromium (volle Suite):** 119 pass / 5 skip, zuletzt nach Runde 8.
- **Webkit (volle Suite auf f7364cd):** 119 pass / 5 skip.
- **axe:** auf allen geänderten Seiten 0 Verstöße.
- **Unabhängige QA:** 4 Durchgänge, alle Befunde sind eingearbeitet oder unten als offen genannt.

## 5. Wirkung

- **Gemessen:** nichts, weil es keine Daten gibt.
- **Plausibel, aber ungemessen:**
  - weniger Hürde auf den Kursseiten (1 Tap statt 2, unverbindlich statt „zahlungspflichtig“),
  - mehr Vertrauen, weil der Ablauf überall gleich beschrieben ist,
  - bessere Orientierung durch Rücklinks und Kopf-Knopf mit Kontext,
  - Regelkonformität: nicht gendern, Du-Form.
- **Vorschlag zur Messung:** Anfragen im Postfach je Woche vor und nach dem Livegang zählen (Details in `experiment-register.md`). Das zeigt einen Trend, ist aber kein Beweis für die Ursache.

## 6. Offene Risiken und Freigaben

- `public/api/kontakt.php:113–114`: Die Mail an den Kunden nach der Kurzanfrage nennt die Zusage nicht. Das liegt im Bereich PHP/Recht und wurde nicht geändert.
- `/coaching/`: Der Kopf führt zu `/#anfrage`, die Kurzanfrage hat aber keinen Bereich „Coaching“.
- Live sind nur 3 Kurse freigegeben. Can muss die übrigen Kursentwürfe freigeben.
- Die Rechtstexte prüft der Anwalt noch. Hier wurden sie nicht geändert.
- Die Preise stehen weiter auf dem Stand von kalk-6771. Hier wurden sie nicht verändert.

## 7. Nächste Iteration (Top 3)

1. Die Kurzanfrage-Mail (kontakt.php) an den Ablauf Anfrage → Angebot → Zusage → Bestätigung angleichen und auf `/coaching/` einen Coaching-Bereich in der Kurzanfrage ergänzen.
2. Prüfen, ob die Kursseite die Kurzanfrage direkt eingebettet bekommt (3 Felder statt 5-Schritt-Formular). Das wäre ein A/B-würdiger Schritt, sobald Messung möglich ist.
3. Nach Can-Freigabe der Kursentwürfe: SEO-Titel und Beschreibungen der Weiterbildungsseiten schärfen und Organization-Schema mit Adresse, `legalName` und `sameAs` ergänzen (site.ts).

## 8. Quality Gates (Endstand)

| Gate | Status |
|---|---|
| G1 Funktion | PASS |
| G2 UX & Mobile | PASS |
| G3 Accessibility | PASS |
| G4 Performance | PASS_WITH_LIMITATIONS (nicht neu gemessen, keine neuen Assets) |
| G5 SEO & Content | PASS_WITH_LIMITATIONS |
| G6 Datenschutz & Sicherheit | PASS |
| G7 Evidenz | PASS |

**Rollback:** Jede Runde ist ein eigener Commit und lässt sich mit `git revert` zurücknehmen. Live wurde nichts veröffentlicht.
