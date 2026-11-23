# Abschlussbericht – Marketing Optimization Loop, waybuild Akademie (21./22.11.2026)

## 1. Zeitbudget

- **Angefragt:** bis 22.11.2026 01:00 CET (ab 00:30 nur QA und Abschluss).
- **Genutzt:** 20:11 bis ca. 00:15, also etwa 4 Stunden aktive Sitzung. Ab 00:05 gab es keine neuen Änderungen mehr, nur noch Abschluss-QA.
- **Ablauf:** 11 Runden plus 7 unabhängige QA- bzw. Audit-Durchgänge. Die Runden 1–2 waren Baseline und Audit, gleichzeitig liefen drei andere Helfer. Ab Runde 3 wurde umgesetzt.
- **Agenten:** 3 Audit-Rollen parallel (Journey/Funnel/IA, SEO/GEO/Technik/A11y, Copy/Trust/Compliance), außerdem 6 getrennte QA-Rollen (R3, R4, R5–6, Lektorat R8, R9, R11) und ein UX-Durchgang in R9 mit Screenshots.
- **Push:** bis R10 über Jan. Ab 00:00 hat Can angewiesen, selbst zu pushen. Runde 11 ging deshalb selbst nach main (5eb14ab), das ist Pages-Vorschau, nicht live.

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
| 8 | a827008 | Entgendern von 68 Kursdateien (nur „(m/w/d)“, keine Paarformen, „Mitarbeiter“), Lektorats-QA eingearbeitet; Kurzanfrage-Mail nennt die Zusage | src/content/kurse/*.md, kontakt.php, php-test.sh |
| 9 | 5235b6d | Kursseite: Zweitweg „Kurz fragen – nur Name und E-Mail“ (Kurzanfrage mit Vorauswahl), kürzere Anmelde-Einleitung, Autofill Betriebsrechnung, Kopf-Anfrage auf /coaching/ | kurse/[slug], anmeldung, AnmeldeFormular, Kopf |
| 10 | 5995ba4 | QA-Fixes R9: Einleitung mit Buchungsangebot, billing name/organization, Fokus aufs erste leere Pflichtfeld | dito |
| 11 | 5eb14ab | Mobile Sticky-Leiste erst nach einer Bildschirmhöhe, „Erst Beruf wählen ↓“ entfernt, IHK-Hinweis „Maßgeblich ist die Einladung deiner IHK“ statt „verbindlich“ | StickyAnfrage, index, TerminKarte, Lernpfad, faq.ts, 25 Kursdateien u. a. |

## 4. Validiert

Die einzelnen Läufe stehen in `qa-checklist.md`. Wichtigste Ergebnisse:

- **Build:** 0 Fehler, 106 Seiten.
- **Chromium (volle Suite auf 5eb14ab):** 121 pass / 5 skip. Unter Serverlast ~55 gab es vereinzelt Timeouts bzw. einen axe-Flake auf /pruefungsvorbereitung/. Einzeln laufen diese Tests grün.
- **Webkit (volle Suite):** 121 pass / 5 skip auf 5235b6d. Endlauf auf 5eb14ab: 121 pass / 5 skip.
- **PHP:** php-test 236/236.
- **axe:** auf allen geänderten Seiten 0 Verstöße.
- **Unabhängige QA:** Alle Befunde sind eingearbeitet oder unten als offen genannt.

## 5. Wirkung

- **Gemessen:** nichts, weil es keine Daten gibt.
- **Plausibel, aber ungemessen:**
  - weniger Hürde auf den Kursseiten (1 Tap statt 2, unverbindlich statt „zahlungspflichtig“),
  - mehr Vertrauen, weil der Ablauf überall gleich beschrieben ist,
  - bessere Orientierung durch Rücklinks und Kopf-Knopf mit Kontext,
  - Regelkonformität: nicht gendern, Du-Form.
- **Vorschlag zur Messung:** Anfragen im Postfach je Woche vor und nach dem Livegang zählen (Details in `experiment-register.md`). Das zeigt einen Trend, ist aber kein Beweis für die Ursache.

## 6. Offene Risiken und Freigaben

- `src/lib/site.ts` IHK_HINWEIS ist ein rechtstextnaher Abgrenzungshinweis. Er wurde leicht umformuliert („die Termine legt sie fest“), Can sollte das zur Kenntnis nehmen.
- Die Kurzanfrage hat keinen Bereich „Coaching“. Der Kopf auf /coaching/ führt deshalb jetzt zur Coaching-Anmeldung.
- Live sind nur 3 Kurse freigegeben. Can muss die übrigen Kursentwürfe freigeben.
- Die Rechtstexte prüft der Anwalt noch. Hier wurden sie nicht geändert.
- Die Preise stehen weiter auf dem Stand von kalk-6771. Hier wurden sie nicht verändert.

## 7. Nächste Iteration (Top 3)

1. Die Kurzanfrage direkt auf der Kursseite einbetten (MKT-021) statt Sprung zur Startseite. Für Betriebe ein optionales Feld „Anzahl Azubis“ ergänzen (MKT-013, betrifft PHP).
2. Unterkurse für Weiterbildungen erst bewerben, wenn Can Entwürfe freigibt (MKT-017). Live sind heute nur 3 Kurse freigegeben.
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

## Nachtrag 23.11.2026 – „Alle Vorschläge umsetzen“ (Can 06:55)

**Umgesetzt** (Branch `vorschlaege-20261123`, alles ohne neue Fakten):

1. **MKT-021 Kurzanfrage auf der Kursseite:** Abschnitt „Kurz fragen“ auf jeder freigegebenen Kursseite mit Termin, Kurs und Bereich vorausgewählt; „Kurz fragen – nur Name und E-Mail“ im Kurskopf springt jetzt auf derselben Seite dorthin (ohne JavaScript ebenso). Eintrag in der Sprungnavigation. Die mobile Handlungsleiste blendet sich aus, solange das Formular im Bild ist.
2. **MKT-013 Anzahl Azubis:** freiwilliges Feld „Anzahl Azubis (Betrieb zahlt)“ in der Kurzanfrage (aufklappbarer Bereich), ganze Zahl 1–50, im Browser und in `kontakt.php` geprüft. Team-Mail (Text, JSON, Betreff „· Betrieb, N Azubis“) und Eingangsbestätigung nennen die Zahl. Datenschutzerklärung: Feldliste der Kurzanfrage sachlich ergänzt (Kursseiten + Anzahl Azubis), sonst unverändert.
3. **Weiterbildungsseiten für die Suche:** H1 „IHK-Weiterbildung berufsbegleitend, live online“ bzw. „Weiterbildung zu KI, IT und Programmierung“, ItemList der freigegebenen Kurse (live derzeit keine, daher leer), Link in den gefilterten Katalog.
4. **Organization-Schema:** Anschrift und `parentOrganization` (Waybuild UG (haftungsbeschränkt), `legalName`, Handelsregister Amtsgericht Kiel, HRB 29883 KI) – nur aus Impressum/`recht/status.ts`.

Bereits erledigt und geprüft: MKT-010 (alternateName), MKT-015/016 (Genderformen, Prüfer-Claim), MKT-002/004/005.

**Offen – braucht Fakten oder Freigaben von Can:** Telefonnummer (Impressum, Schema `telephone`), `sameAs`-Profile, Anwaltsprüfung der Rechtstexte (dort stehen noch „Teilnehmende“/„Mitarbeitende“), Frist für die Abschnitt-Buchung, eigene Jitsi-Adresse, Freigabe der Kursentwürfe (MKT-017; erst dann SEO-Texte der Weiterbildungsseiten mit konkreten Abschlüssen), Videos (MKT-018), USt-IdNr.

**Wirkung:** nicht gemessen (keine Daten). Vorschlag bleibt: Anfragen je Woche im Postfach zählen, Anteil „Kursanfrage · … · Betrieb“ getrennt.
