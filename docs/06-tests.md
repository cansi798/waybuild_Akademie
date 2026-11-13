# Testdokument waybuild Akademie

Phase 3 „Finalisierung“ · Stand: 13.11.2026 · Status: **Entwurf** · Prüfstand: `main` d3ce5ec (Zweig `bau/phase3`)

Dieses Dokument beschreibt, **wie** die Website getestet wird (Teststrategie), **was** getestet wurde (Testprotokoll)
und welche Grenzen die Tests haben. Grundlage sind die Akzeptanzkriterien der User Stories (**US-xx**) und die
nichtfunktionalen Anforderungen (**NFA-xx**) aus dem [Anforderungsdokument](02-anforderungen.md) sowie die
Geschäftsregeln (**GR-xx**) und Schnittstellen (**S-xx**) aus der [Spezifikation](03-spezifikation.md).

Alle Zahlen in Abschnitt 3 stammen aus Testläufen vom **13.11.2026** auf dem Entwicklungsrechner. Nicht
automatisierte Prüfungen sind als **„manuell – geprüft am … (Quelle)“** oder **„manuell – offen“** gekennzeichnet.

---

## Inhalt

1. [Teststrategie](#1-teststrategie)
2. [Werkzeuge und Befehle](#2-werkzeuge-und-befehle)
3. [Testläufe vom 13.11.2026](#3-testläufe-vom-13112026)
4. [Testprotokoll](#4-testprotokoll)
5. [Bekannte Grenzen](#5-bekannte-grenzen)
6. [Befunde und Empfehlungen](#6-befunde-und-empfehlungen)

---

## 1. Teststrategie

Getestet wird auf vier Ebenen. Jede Ebene prüft etwas anderes; zusammen decken sie die Muss-Anforderungen ab.

| Ebene | Was wird geprüft | Wie | Bezug |
|---|---|---|---|
| **Einheit / Komponente** | Kursdaten gegen das Schema (Pflichtfelder, Datentypen, Aufzählungen, Länge der Kurzbeschreibung); Typprüfung aller Astro- und TypeScript-Dateien; PHP-Hilfsfunktionen (IP-Schlüssel, Rechte des Datenverzeichnisses, Syntaxprüfung) und PHP-Validierung je Feld | `astro check` und das Zod-Schema laufen bei jedem Bau; PHP-Gruppe „Einheiten“ und Feldregeln in `scripts/php-test.sh`, `php -l` für alle Skripte. Die Logik in `src/lib/` (z. B. nächster Termin, Preisformat, Entwurfsfilter) hat keine eigenen Unit-Tests; sie wird über die Systemtests mit fester Uhrzeit geprüft. | NFA-14, NFA-17 |
| **Integration** | Formular → PHP-Endpunkt → E-Mail: Statuscodes, Weiterleitungen, Empfänger, Betreff, Inhalt und JSON-Block der Mails; Terminliste `termine.json` aus dem Bau gegen den Endpunkt (S-06) | PHP 8.3 in Docker mit eingebautem Webserver (`php -S`). `sendmail_path` ist auf ein Skript umgebogen, das jede Mail als Datei ablegt – es wird nichts versendet. Die Terminliste wird mit Daten relativ zum Testtag erzeugt; zusätzlich wird die gebaute `dist/api/termine.json` geprüft. | US-10 … US-16, US-24, US-29, S-01 … S-06 |
| **System / End-to-End** | Fertig gebaute Website in echten Browser-Engines: Seiten, Navigation, Filter, Formulare im Demo-Modus, Barrierefreiheits-Grundlagen, Breiten 320–1440 px, ohne JavaScript, reduzierte Bewegung, Vorschau- und Live-Build | Playwright mit **Chromium** und **WebKit** (Safari-Engine) gegen `dist/`, ausgeliefert unter dem echten Basis-Pfad. Uhrzeit wird bei Terminfragen fest eingestellt (`page.clock`), damit die Tests unabhängig vom Testtag sind. | US-01 … US-28, NFA-03 … NFA-05, NFA-19 |
| **Sicherheit** | Header-Injection, Spam-/Phishing-Relay über Eingangsbestätigungen, Rate-Limits (Anschluss, Empfänger, global), HMAC-Zeitfalle, Lockfeld, „fail closed“ ohne Geheimnis, XSS auf Fehlerseiten, Pfade im Kurs-Slug, manipulierte Preise und Personenzahlen, CORS | Eigene Angriffsfälle in `scripts/php-test.sh` (Gruppen „Header-Injection“, „Angriffe (Review)“, „Spam-Schutz“, „Globales Mail-Limit“, „fail closed“). Gegenprobe im Review: Die Angriffstests scheitern mit dem Code vor der Korrektur. | NFA-13, NFA-14 |
| **Manuelle Prüfungen** | Optik (Screenshots je Breite), echte Geräte (iPhone/Safari, Android), Lighthouse, Screenreader, Zustellbarkeit der Mails, Live-Server (HTTPS, Header, Weiterleitung) | Sichtprüfung der Screenshots in jedem Arbeitspaket; Geräte- und Server-Prüfungen vor dem Livegang (siehe T-072 … T-082) | NFA-01 … NFA-04, NFA-07, NFA-11, NFA-12, R-08 |

**Grundsätze**

- Getestet wird immer der **fertige Build**, nicht der Entwicklungsserver.
- Vor jedem Playwright-Lauf wird neu gebaut. `scripts/test.sh` prüft, was gerade in `dist/` liegt – nach einem
  Live-Build muss für die Vorschau-Tests erst wieder `scripts/bau.sh` laufen.
- Die Tests im Vorschau-Build prüfen Entwürfe und Demo-Modus. Die Live-Gruppe in `tests/seiten.spec.ts` prüft, dass
  das Live-Paket nur freigegebene Kurse enthält (NFA-19).
- Testdaten sind ausgedacht (`lena@beispiel.de`, `Beispiel GmbH`); es gehen keine echten Mails hinaus.
- In der CI (GitHub Actions) laufen dieselben Playwright-Tests bei jedem Push auf `main`; der Test-Job blockiert das
  Veröffentlichen der Vorschau bewusst nicht.

---

## 2. Werkzeuge und Befehle

Node, PHP und die Browser laufen nur in Docker. Auf dem Rechner wird nichts davon installiert.

| Werkzeug | Version / Image | Zweck |
|---|---|---|
| Astro + `astro check` | Astro 7, Image `node:22` | Bau, Typ- und Schemaprüfung |
| Playwright | `@playwright/test` 1.48.2, Image `mcr.microsoft.com/playwright:v1.48.2-jammy` | System-Tests in Chromium und WebKit |
| PHP | Image `php:8.3-cli` | Integrations- und Sicherheitstests der Endpunkte |

```bash
# 1. Vorschau bauen (astro check + Build mit Entwürfen, BASE=/waybuild_Akademie)
bash scripts/bau.sh

# 2. Playwright gegen die Vorschau (zwei Worker, siehe Abschnitt 5)
bash scripts/test.sh --workers=2 --reporter=list

# 3. PHP-Endpunkte (nutzt dist/api/termine.json, falls gebaut)
bash scripts/php-test.sh

# 4. Live-Build (nur freigegebene Kurse, BASE=/) und Live-Tests
bash scripts/bau.sh live
BASE=/ bash scripts/test.sh tests/seiten.spec.ts tests/recht.spec.ts tests/hero.spec.ts --workers=2 --reporter=list

# Danach für weitere Vorschau-Tests wieder: bash scripts/bau.sh
```

Einzelne Dateien oder Browser: `bash scripts/test.sh tests/formulare.spec.ts --project=webkit`.

---

## 3. Testläufe vom 13.11.2026

| Lauf | Zeit | Befehl | Ergebnis |
|---|---|---|---|
| **L-1** Vorschau-Build | 11:54 | `scripts/bau.sh` | `astro check`: 76 Dateien, **0 Fehler, 0 Warnungen, 0 Hinweise**; **59 Seiten** gebaut |
| **L-2** Playwright Vorschau | 11:54–12:00 | `scripts/test.sh --workers=2 --reporter=list` | **176 Tests: 171 bestanden, 4 übersprungen, 1 fehlgeschlagen** (5,7 min). Übersprungen: die 2 Live-Tests × 2 Browser (laufen nur im Live-Build). Fehlgeschlagen: T-001 in Chromium (Zeitlimit beim Warten auf „Netzwerk ruhig“, siehe Abschnitt 5). |
| **L-3** PHP-Endpunkte | 12:00 | `scripts/php-test.sh` | `php -l` ohne Syntaxfehler; **200 bestanden, 0 fehlgeschlagen** (21 Gruppen, inkl. gebaute `termine.json`) |
| **L-4** Live-Build | 12:00 | `scripts/bau.sh live` | `astro check` 0/0/0; **19 Seiten**; `dist/kurse/` enthält nur die 3 freigegebenen Kurse |
| **L-5** Playwright gegen Live-Build | 12:00–12:04 | `BASE=/ scripts/test.sh --workers=2` (alle Dateien) | **176 Tests: 122 bestanden, 28 übersprungen, 26 fehlgeschlagen.** Davon 24 erwartbar: Vorschau-Tests für den Demo-Modus (`formulare.spec.ts`, 22) und für `noindex` (2) laufen ohne Ausschluss auch im Live-Build (Befund F-02). Nach Datei: `recht` 38/38, `hero` 30/30, `startseite` 28/30 (2 = noindex), `seiten` Live-Gruppe 2/4 – „Katalog und Termine zeigen nur freigegebene Kurse“ bestanden, „nirgends ‚Entwurf‘“ fehlgeschlagen (Befund F-01). |
| **L-6** Wiederholung T-001 | 12:05–12:06 | `scripts/bau.sh`, dann `scripts/test.sh tests/startseite.spec.ts -g Konsolenfehler --repeat-each=5 --workers=2` | **10 Läufe: 9 bestanden, 1 fehlgeschlagen** (Chromium, gleiche Ursache) → Test instabil, kein Konsolenfehler gefunden |
| **L-7** Playwright Vorschau, zweiter Volllauf | 12:06–12:11 | wie L-2 (nach neuem `scripts/bau.sh`) | **176 Tests: 171 bestanden, 4 übersprungen, 1 fehlgeschlagen** (4,8 min) – wieder nur T-001 in Chromium (Zeitlimit „Netzwerk ruhig“) |

**Manuelle Gegenprüfung des Live-Builds (13.11.2026, nach L-4):** `dist/kurse/` = `ap1-it-berufe`,
`ap2-fachinformatiker-systemintegration`, `pruefungscoaching`; `dist/api/termine.json` enthält genau diese drei Kurse;
keiner der 40 Entwurfs-Slugs kommt in `dist/` vor; `robots.txt` = `Allow: /` mit Sitemap; Startseite
`<meta name="robots" content="index, follow">`, kein Vorschau-Band. Die Treffer von T-067 sind das gewollte
Entwurfsband der vier Rechtsseiten („Entwurf – rechtlich noch nicht geprüft“) und ein Textbaustein im
Anmelde-Skript – kein Kursentwurf. **Die Anforderung NFA-19 ist erfüllt; der Test muss angepasst werden.**

**Statische Prüfung auf Fremd-Ressourcen (13.11.2026, Vorschau-Build):** In allen HTML-Dateien gibt es keine
Skripte, Stile, Schriften oder Bilder von fremden Domains. Externe Adressen sind nur die kanonischen Links auf die
eigene Adresse und ein normaler Link zur Datenschutz-Aufsichtsbehörde.

**Frühere Läufe laut Berichten der Arbeitspakete** (zur Einordnung): Task 1 30/30; Task 3 58 Vorschau + 4 Live;
Task 5 68/68 und 38/38 gegen Live; Hero 60/60; Task 4 74 bestanden / 2 übersprungen und PHP 109 → 130 → 188 → 200;
nach dem Zusammenführen auf `main` 172 bestanden / 4 übersprungen. CI-Lauf für Commit 73faa2c (build, test,
live-build, deploy) grün laut Bericht Task 1.

---

## 4. Testprotokoll

**Spalten:** ID · Kurzbeschreibung · Vorbedingungen · Eingaben · erwartetes Ergebnis · tatsächliches Ergebnis
(Lauf vom 13.11.2026) · Status · Bezug.
**Quelle:** `S` = `tests/startseite.spec.ts`, `H` = `tests/hero.spec.ts`, `K` = `tests/seiten.spec.ts`,
`F` = `tests/formulare.spec.ts`, `R` = `tests/recht.spec.ts`, `P` = `scripts/php-test.sh`.
„2/2“ heißt: in Chromium und WebKit bestanden.
Vorbedingung „V“ = Vorschau-Build in `dist/`, „L“ = Live-Build, „PHP“ = PHP-Testumgebung mit umgebogenem sendmail.

### 4.1 Start, Hero, Countdown, Navigation

| ID | Kurzbeschreibung | Vorbed. | Eingaben | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Bezug |
|---|---|---|---|---|---|---|---|
| T-001 | Startseite lädt ohne Konsolenfehler (S) | V, L | Aufruf `/` | Status 200, H1 „Gut vorbereitet in die Prüfung“, keine Konsolen- oder Skriptfehler | L-2 und L-7: WebKit bestanden, Chromium jeweils Zeitlimit 30 s beim Warten auf „Netzwerk ruhig“; L-5 (Live): 2/2; L-6 (einzeln, 10 Läufe): 9 bestanden | instabil (kein Fehler gefunden) | US-01 |
| T-002 | Kein horizontales Scrollen auf der Startseite (S) | V | Breiten 320, 375, 768, 1280, 1440 px; Bühne ins Bild scrollen | `scrollWidth ≤ clientWidth` | 10/10 | bestanden | NFA-04 |
| T-003 | Prüfungs-Countdown aus Kursdaten (S) | V, Uhr 01.12.2026 | Aufruf `/`, Umschalter „AP2“ | AP1: 85 Tage bis 24.02.2027, „Dein Kurs startet am 19.01.2027“; AP2-Tafel mit positiver Tageszahl | 2/2 | bestanden | US-01, GR-10 |
| T-004 | Hero-Reise: fünf Stationen im Wechsel (H) | V, Uhr fest | Abwarten der Stationsdauern | Stationen 1→5, danach von vorn | 2/2 | bestanden | US-01 |
| T-005 | Hero: Pause/Weiter, Ansage der Station (H) | V | Klick „Pause“, „Weiter“ | Bühne hält an; aria-live „Schritt 4 von 5: Prüfungstag“ | 2/2 | bestanden | NFA-03 (WCAG 2.2.2) |
| T-006 | Reduzierte Bewegung: statische Bildfolge (H, S) | V, `prefers-reduced-motion: reduce` | Aufruf `/` | Hero und Warum-Bühne zeigen alle Stationen/Szenen statisch, keine Steuerung | 4/4 | bestanden | NFA-03 |
| T-007 | Hero-Daten aus den Kursdateien (H) | V, Uhr fest | Aufruf `/`; Quelltext der Hero-Bauteile | Kursstart und Prüfungstag wie in der Kursdatei; kein Datum fest im Code | 4/4 | bestanden | US-21 AK4, NFA-18 |
| T-008 | Hero ohne horizontales Scrollen, mobile Höhe (H) | V | 320–1440 px, alle 5 Stationen; 390×844, 375×667, 360×740, 320×568 | kein H-Scroll; Bühne ≤ 70 % der Bildschirmhöhe | 18/18 | bestanden | NFA-04 |
| T-009 | Mobiles Menü per Tastatur (S) | V, 390 px | Enter, Tab (WebKit Alt+Tab), Escape | Menü öffnet, Fokus auf „Kurse“, Escape schließt, Fokus zurück auf Knopf | 2/2 | bestanden | NFA-03 |
| T-010 | Alle internen Links liefern 200 (S) | V, L | Crawler ab Startseite inkl. `?kurs=`-Varianten | jede interne Adresse 200, > 15 Seiten | L-2 2/2; L-5 2/2 | bestanden | NFA-16 |
| T-011 | Vorschau gesperrt (S) | V | Aufruf `/`, `robots.txt` | `noindex`, Vorschau-Band, `Disallow: /` | L-2 2/2; im Live-Build erwartungsgemäß `index, follow` (L-5 als Fehler gezählt, F-02) | bestanden | US-22 AK4 |
| T-012 | IHK-Hinweis im Fuß (S) | V, L | Aufruf `/` | „keine Veranstaltung der IHK“ im Fuß | 2/2 (V und L) | bestanden | US-19, GR-13 |
| T-013 | Warum-Bühne: Szenen, Pause, Punkte (S) | V, Uhr installiert | Zeit vorspulen, Pause, Weiter, Punkt 0 | Szenen 0→1→2, Pause hält 12 s, Weiter/Punkte springen | 2/2 | bestanden | US-01, NFA-03 |

### 4.2 Katalog, Kursdetail, Termine

| ID | Kurzbeschreibung | Vorbed. | Eingaben | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Bezug |
|---|---|---|---|---|---|---|---|
| T-014 | Katalog-Filter Säule und Kategorie (K) | V | Chip „IHK-Prüfung“, Kategorie „IT-Berufe“, zurück auf „Alle“ | nur passende Kurse sichtbar, `aria-pressed`, Trefferzahl „N Kurse“, Filter in der Adresse | 2/2 | bestanden | US-02 AK1/2/4 |
| T-015 | Filter aus der Adresse (K) | V | `?saeule=akademie`, `?saeule=pruefungsvorbereitung`, `?saeule=gibt-es-nicht` | passende Säule aktiv; Kurzform wirkt; Unbekanntes zeigt alle Kurse | 2/2 | bestanden | US-02 AK2, US-27 |
| T-016 | Katalog ohne JavaScript (K) | V, JS aus | `/kurse/?saeule=akademie` | Filter ausgeblendet, alle 43 Kurse sichtbar, drei Säulen-Gruppen mit Überschrift | 2/2 | bestanden | US-02 AK3, NFA-05 |
| T-017 | Entwürfe gekennzeichnet (K) | V | `/kurse/`, eine Entwurfsseite | gelbes Band „Entwurf – noch nicht freigegeben“ nur bei Entwürfen; kein Anmelde-Knopf | 2/2 | bestanden | US-22 AK2, GR-10 |
| T-018 | Kurskarte ohne Termin (K) | V | `/kurse/` | Karte zeigt „Termin in Planung – Interesse vormerken“ | 2/2 | bestanden | US-03 AK2 |
| T-019 | Kursseiten: Sprungnavigation und Anmelde-Links (K) | V | alle Kursseiten | Reihenfolge Überblick, Inhalte, Termine, Preis, Voraussetzungen (+ FAQ); jeder Anmelde-Link mit `kurs` und `termin` | 2/2 | bestanden | US-04 AK1/2, US-07 AK4 |
| T-020 | Kurse ohne Termin → „Interesse vormerken“ (K) | V | alle Kursseiten ohne Termin | Hauptknopf „Interesse vormerken“ → `/interesse/?kurs=<slug>`, kein Anmelde-Link | 2/2 | bestanden | US-14 AK1, US-25 AK3 |
| T-021 | Mobile Handlungsleiste (K) | V, 390 px | Kursseite AP1 scrollen | Leiste erscheint erst, wenn der Kopf-Knopf aus dem Bild ist; Link `#termine` | 2/2 | bestanden | US-04 AK2 |
| T-022 | Strukturierte Daten (K) | V | Kursseiten, FAQ, Coaching | jeder JSON-LD-Block gültiges JSON; AP1: Course, Event, FAQPage; Entwurf ohne Course | 2/2 (Rich-Results-Test siehe T-082) | bestanden | NFA-15 |
| T-023 | AP1: Zeiten und Umfang (K) | V | `/kurse/ap1-it-berufe/` | „5 × 18:00–20:45 Uhr (3 UE) und 5 × 18:00–21:30 Uhr (4 UE)“, „35 UE“ | 2/2 | bestanden | US-04 |
| T-024 | Coaching führt zur Anfrage (K) | V | Kursseite Coaching, `/coaching/` | Knopf → `/anmeldung/?kurs=pruefungscoaching`; Hinweis „deine Prüfungsleistungen erstellst du selbst“; Pakete 69/189/299 € | 2/2 | bestanden | US-15 AK1/3, GR-19 |
| T-025 | Terminübersicht chronologisch, vergangene ausgeblendet (K) | V, Uhr fest | `/termine/` | nach Start sortiert, nur Termine mit offenem Anmeldeschluss, Monate sortiert, Hinweis „Verbindlich ist die Einladung deiner IHK“ | 2/2 | bestanden | US-07 AK1/2, US-25, US-28 |
| T-026 | Termine nach Säule filtern (K) | V | Filter auf `/termine/` | nur Termine der Säule sichtbar | 2/2 | bestanden | US-07 AK2 |
| T-027 | Termine und FAQ ohne JavaScript (K) | V, JS aus | `/termine/`, `/faq/` | Termine sichtbar; FAQ lesbar, „Ist der Kurs eine IHK-Veranstaltung?“ → „Nein“ | 2/2 | bestanden | NFA-05, US-17 AK2/3 |

### 4.3 Anmeldung im Browser (Vorschau, Demo-Modus)

| ID | Kurzbeschreibung | Vorbed. | Eingaben | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Bezug |
|---|---|---|---|---|---|---|---|
| T-028 | Vorauswahl und Knopftext (F) | V, Uhr 01.12.2026 | `/anmeldung/?kurs=ap1-it-berufe&termin=ap1-2027-fruehjahr` | Kurs und Termin gewählt; Knopf exakt „Zahlungspflichtig anmelden“; 349,00 €; Links zu Teilnahmebedingungen, Datenschutz, Widerruf; Wertersatz-Text | 2/2 | bestanden | US-10 AK1/4, US-20 AK2, GR-14 |
| T-029 | Ohne Parameter: Kurs wählen (F) | V | Kurs „AP2 Systemintegration“ wählen | nur AP2-Termine wählbar; Entwürfe mit „(Entwurf)“ markiert | 2/2 | bestanden | US-10 AK1 |
| T-030 | Pflichtfelder „Ich zahle selbst“ (F) | V | Zahlweg „selbst“, leere Felder, Absenden | Fehlertexte laut Spezifikation 5.4 am Feld, `aria-invalid`, Fokus auf erstes Fehlerfeld, Fehler-Zusammenfassung; nichts gesendet | 2/2 | bestanden | US-10 AK3, US-11 AK2, NFA-03 |
| T-031 | Pflichtfelder „Mein Betrieb zahlt“, ohne Zahlweg (F) | V | Zahlweg „betrieb“ bzw. keiner | Firma, Ansprechperson, Anschrift, Rechnungs-E-Mail Pflicht; ohne Zahlweg Hinweis am Auswahlfeld | 4/4 | bestanden | US-11, GR-04 |
| T-032 | 1–5 Personen, Rabatt, Live-Preis (F) | V | Personen 1 → 5 | Endpreis = 349 × n, ab 3 Personen −10 %; höchstens 5 | 2/2 | bestanden | US-13 AK1/2, GR-02, GR-03 |
| T-033 | Anmeldeschluss vorbei (F) | V, Uhr 13.01.2027 | Frühjahrstermin | Termin nicht wählbar | 2/2 | bestanden | GR-01, GR-11 |
| T-034 | Demo-Modus führt zur Danke-Seite (F) | V | gültige Anmeldung | kein Versand, `/danke/?art=anmeldung&demo=1` mit Demo-Hinweis und Zusammenfassung | 2/2 | bestanden | US-12 AK1 |
| T-035 | Wertersatz-Bestätigung (F) | V, Uhr 08.01.2027 bzw. 01.12.2026 | Absenden ohne Häkchen | Start in 11 Tagen: Pflicht mit Fehlertext; Start in 49 Tagen: freiwillig | 4/4 | bestanden | R-02, § 356 Abs. 4 BGB |
| T-036 | Coaching-Anfrage im Formular (F) | V | `?kurs=pruefungscoaching&paket=…`, unbekanntes Paket | Paketwahl statt Termin, Knopf „Paket anfragen“, unverbindlich; unbekanntes Paket ignoriert, ohne Paket Hinweis | 4/4 | bestanden | US-15 AK2/4, GR-07 |
| T-037 | Formulare ohne JavaScript (F) | V, JS aus | Anmeldung, Interesse, Kontakt absenden | normales POST an `/api/<formular>.php`; beide Zahlweg-Bereiche sichtbar; Lockfeld leer übertragen | 4/4 | bestanden | NFA-05, US-11 AK3 |

### 4.4 Anmeldung auf dem Server (PHP)

| ID | Kurzbeschreibung | Vorbed. | Eingaben | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Bezug |
|---|---|---|---|---|---|---|---|
| T-038 | Gültige Anmeldung „Ich zahle selbst“ (P) | PHP | 1 Person, Anschrift, alle Häkchen | 303 → `/danke/?art=anmeldung&vorgang=A-JJJJMMTT-XXXX`; 2 Mails; Team an `anmeldung@`, Betreff „Anmeldung · Kurs · Start“, `Reply-To`, UTF-8, „RECHNUNG AN: PRIVAT“, „Endpreis (alles inklusive): 349,00 €“, JSON-Block; Bestätigung „Hallo,“, Rechnung per E-Mail, Widerrufs-Link, „noch keine Annahme“ | alle 27 Prüfungen der Gruppe ok | bestanden | US-12 AK2/3, US-24, US-29 AK1, S-03, S-04 |
| T-039 | Betrieb zahlt, 3 bzw. 2 Personen (P) | PHP | Firma, Rechnungs-E-Mail, Bestellnummer, 3 Personen | „RECHNUNG AN: FIRMA“, jede Person einzeln; 1.047,00 € − 104,70 € = **942,30 €**; 2 Personen 698,00 € ohne Rabatt | ok | bestanden | US-13 AK3, GR-03 |
| T-040 | Preis aus dem Formular wird ignoriert (P) | PHP | `gesamtpreis=1`, `preis=-349`, `rabattProzent=100` | Mail enthält Server-Preis (349,00 € bzw. 942,30 €) | ok | bestanden | S-06, NFA-14 |
| T-041 | Serverseitige Pflicht- und Formatprüfung (P) | PHP | leere Felder, falsche Telefonnummer, 6 Personen, Person 2 unvollständig, doppelte E-Mail, Nachricht > 2.000, Bestellnummer > 50, alle Längengrenzen, Felder als Array, Personenzahl `0`, `-3`, `3abc`, Überlauf | ohne JS 422-Seite mit allen Fehlern und „Zurück“; mit JS 422-JSON je Feld mit den Texten der Spezifikation; Altersbestätigung Pflicht; keine Mail | ok | bestanden | NFA-14, GR-02, GR-04, Spez. 5.4 |
| T-042 | Kurs und Termin gegen die Terminliste (P) | PHP | unbekannter/geschlossener Termin, Entwurfskurs, Termin eines anderen Kurses, `../config`, `%2e%2e%2fconfig` | passende Fehlermeldung, Entwurf nicht buchbar, Pfade abgelehnt | ok | bestanden | GR-10, GR-11, S-06 |
| T-043 | Wertersatz serverseitig (P) | PHP | Termin in 10 bzw. 40 Tagen | 10 Tage: Bestätigung Pflicht, mit Häkchen 303 und Vermerk in der Mail; 40 Tage: freiwillig | ok | bestanden | R-02 |
| T-044 | Coaching-Anfrage serverseitig (P) | PHP | Paket „coaching-paket“, Anliegen | 303 → `art=coaching`, „Paketpreis: 189,00 €“ vom Server, Bestätigung „noch unverbindlich“; Paket und Anliegen Pflicht | ok | bestanden | US-15, GR-07 |
| T-045 | Versand schlägt fehl (P) | PHP, `sendmail_path=/bin/false` | gültige Anmeldung | 500 mit `anmeldung@waybuild-akademie.de` als Ausweg (JSON und HTML) | ok | bestanden | US-12 AK4, NFA-25 |

### 4.5 Interesse, Kontakt, Widerruf

| ID | Kurzbeschreibung | Vorbed. | Eingaben | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Bezug |
|---|---|---|---|---|---|---|---|
| T-046 | Interesse vormerken im Browser (F) | V | `/interesse/?kurs=…`, leere Pflichtfelder, dann gültig | Kurs vorausgewählt, Fehlertexte, Einwilligung nicht vorausgewählt, Danke-Seite | 2/2 | bestanden | US-14 AK2/3 |
| T-047 | Interesse auf dem Server (P) | PHP | gültig bzw. fehlerhaft | 303 → `art=interesse`; Mail an `info@`, Betreff „Interesse · …“; Bestätigung „Wir melden uns, sobald Termine feststehen.“; Kurs, Wunschzeitraum, Einwilligung geprüft | ok | bestanden | US-14, US-24 AK3 |
| T-048 | Kontakt (F, P) | V bzw. PHP | Thema, Nachricht, Telefon | Themenauswahl, Telefon-Platzhalter, Pflichtfelder; 303 → `art=kontakt`, Mail an `info@` mit Thema | 2/2 und ok | bestanden | US-16 |
| T-049 | Online-Widerruf im Browser (F) | V, Uhr 01.12.2026 14:05 | Name, E-Mail, falsche/richtige Vorgangsnummer, Kurs, Anmeldedatum | „Vertrag jetzt widerrufen“ → Prüfschritt mit Zusammenfassung, Fokus auf „Widerruf bestätigen“ → Eingang „01.12.2026 um 14:05 Uhr“ | 2/2 | bestanden | US-20, § 356a BGB |
| T-050 | Widerruf auf dem Server (P) | PHP | Schritt 1 ohne JS, Schritt 2, ungültige Angaben, Freitext mit Link | Schritt 1 sendet nichts, zeigt „Widerruf bestätigen“; Schritt 2: Team-Mail mit allem, Bestätigung mit Datum/Uhrzeit nur aus geprüften Feldern, ohne Freitext, ohne „angenommen/wirksam“; eigener Zähler | ok | bestanden | § 356a BGB, US-24 |
| T-051 | Widerruf überall erreichbar (R) | V, L | jede Seite, `/widerruf/` | Fuß-Link „Vertrag widerrufen“ → `/widerruf/#widerrufsformular`; Belehrung, Muster-Formular und Formularbereich vorhanden | 2/2 (V und L) | bestanden | US-20 AK1 |

### 4.6 Sicherheit der Formular-Endpunkte (PHP)

| ID | Kurzbeschreibung | Vorbed. | Eingaben | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Bezug |
|---|---|---|---|---|---|---|---|
| T-052 | Zugriffsschutz (P) | PHP | GET auf alle Formulare, Direktaufruf `config.php`, `_lib.php`; `token.php` | 405 mit `Allow: POST`; 404; signierter Zeitstempel; Geheimnis außerhalb des Webroots, Rechte 0600, Datenordner per `.htaccess` gesperrt | ok | bestanden | NFA-14 |
| T-053 | Header-Injection (P) | PHP | CR/LF und `%0A` in Name, E-Mail, Betreff-Feldern (`Bcc:`, `Subject:`, `Cc:`) | keine eingeschleuste Kopfzeile; Name bleibt einzeilig; E-Mail mit Umbruch 422 | ok | bestanden | NFA-14 |
| T-054 | Mehrdeutige E-Mail-Adressen (P) | PHP | `"a@evil.example>,<b"@…`, `lena@[127.0.0.1]`, ohne TLD; gültig: `o'brien@`, `+tag`, Punycode | Erste Gruppe 422, zweite angenommen | ok | bestanden | NFA-14 |
| T-055 | Kein Spam-/Phishing-Relay (P) | PHP | Links und Werbetext in Name, Nachricht, Wunschzeitraum, Firma, Bestellnummer | Team-Mail enthält alles; Bestätigung an die Absender-Adresse nur feste Bausteine und geprüfte Werte, keine Namen, keine URLs | ok | bestanden | NFA-13, NFA-14 |
| T-056 | Lockfeld (P) | PHP | Feld `website` ausgefüllt | Antwort wie Erfolg (303), keine Mail | ok | bestanden | NFA-13 |
| T-057 | Zeitfalle mit HMAC (P) | PHP | sofort, nach 10 s, nach 5 h, nach 7 h, gefälschte Signatur, 9 Manipulationen (Großschreibung, gekürzt, Vorzeichen, Array, leerer Schlüssel …), Zukunft | sofort 429 „Das ging sehr schnell …“; 10 s und 5 h 303; 7 h 422; Manipulationen 400; Zukunft 429 | ok | bestanden | NFA-13 |
| T-058 | Rate-Limit je Anschluss (P) | PHP | 16 Anfragen in Folge | 15 angenommen, 16. → 429; gespeichert nur HMAC-Hash und Zeitpunkte; IPv6 auf /64 gekürzt | ok | bestanden | NFA-13, NFA-10 |
| T-059 | Limit je Empfängeradresse (P) | PHP | 4 Kontaktanfragen mit derselben Adresse, Groß-/Kleinschreibung, danach Widerrufe | Team erhält 4 Mails, Bestätigung nur 3; Team-Mail vermerkt „NICHT versendet“; Widerruf zählt getrennt | ok | bestanden | NFA-13 |
| T-060 | Globales Mail-Limit (P) | PHP | Zähler auf 299 bzw. 500 gesetzt | ab 300: nur Team-Mail mit Hinweis; ab 500: 503, kein Versand; Einträge > 24 h zählen nicht | ok | bestanden | NFA-13 |
| T-061 | „Fail closed“ ohne Geheimnis (P) | PHP, Konto schreibgeschützt | Kontakt, Anmeldung, `token.php`, Lockfeld | 503 „Gerade technisch nicht erreichbar …“; kein Versand; kein vorgetäuschter Erfolg | ok | bestanden | NFA-14 |
| T-062 | XSS, Weiterleitungen, CORS (P) | PHP | Skript-Code in Widerrufsfeldern, Referer `//boese.example`, JSON-Anfrage | Ausgaben escaped; Zurück-Link nur pfad-relativ; keine CORS-Freigabe, `nosniff` | ok | bestanden | NFA-14 |
| T-063 | Gebaute Terminliste (P) | `dist/api/termine.json` aus L-1 | Datei lesen | gültiges JSON, je Kurs Titel, Status, Preis, Termine mit Datumsformat | ok | bestanden | S-06 |

### 4.7 Recht, Live-Build, Barrierefreiheit und 320 px

| ID | Kurzbeschreibung | Vorbed. | Eingaben | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Bezug |
|---|---|---|---|---|---|---|---|
| T-064 | Rechtsseiten mit Entwurfsband (R) | V, L | Impressum, Datenschutz, Teilnahmebedingungen, Widerruf | H1, rotes Entwurfsband (solange `RECHT_GEPRUEFT = false`), jeder Inhaltsverzeichnis-Anker springt, kein H-Scroll bei 320 px | V 32/32, L 32/32 | bestanden | US-20 AK3, TD-01 |
| T-065 | Nachweisvorbehalt bei Storno (R) | V, L | `/teilnahmebedingungen/` | Hinweis auf geringeren Schaden vorhanden | 2/2 (V und L) | bestanden | GR-05 |
| T-066 | Live: nur freigegebene Kurse (K) | L | `/kurse/`, `/termine/`, `/kurse/?saeule=akademie` | Katalog = 3 freigegebene Kurse, kein Entwurfsband, Termine nur freigegebener Kurse, leere Säule „in Vorbereitung“ | L-5 2/2 | bestanden | US-22 AK3, NFA-19 |
| T-067 | Live: nirgends „Entwurf“ (K) | L | alle Dateien in `dist/` | kein Treffer für „Entwurf“, nur freigegebene Kursseiten, Sitemap ohne Entwürfe | L-5 0/2: Treffer in den 4 Rechtsseiten (gewolltes Band) und im Anmelde-Skript (Textbaustein); manuelle Gegenprüfung ohne Kursentwurf (Abschnitt 3) | fehlgeschlagen – Testkonflikt (F-01), Anforderung erfüllt | NFA-19, GR-10 |
| T-068 | Live: Indexierung, Formular-Ziel (manuell) | L | `dist/index.html`, `robots.txt`, `termine.json` | `index, follow`, kein Band, `Allow: /` + Sitemap, nur 3 Kurse in der Terminliste | manuell – geprüft am 13.11.2026 (Abschnitt 3) | bestanden | US-22, NFA-16 |
| T-069 | 320 px: alle Seiten (S) | V | jede Seite bei 320 px | kein H-Scroll | 2/2 | bestanden | NFA-04 |
| T-070 | 320 px: Formularseiten auch mit Fehlern (F) | V | Anmeldung, Coaching, Interesse, Kontakt, Danke, Widerruf; Absenden ohne Eingaben | kein H-Scroll vor und nach den Fehlermeldungen | 12/12 | bestanden | NFA-04 |
| T-071 | 320 px: alle Kursseiten, längster Titel (K) | V | alle Kursseiten, Katalog IHK-Weiterbildung | kein H-Scroll | 2/2 | bestanden | NFA-04 |

### 4.8 Manuelle Prüfungen

| ID | Kurzbeschreibung | Vorbed. | Eingaben | Erwartetes Ergebnis | Tatsächliches Ergebnis | Status | Bezug |
|---|---|---|---|---|---|---|---|
| T-072 | Sichtprüfung Screenshots | V | 320, 375, 390, 768, 1280, 1440 px, Druckansicht Rechtsseiten | kein abgeschnittener Text, lesbare Hierarchie | Mängel gefunden und behoben (verrutschtes Auswahlfeld, Wortbruch „Projektdokumentation“ bei 375 px, runde Checkboxen) | manuell – geprüft am 13.11.2026 (Berichte Task 1, 3, 4, 5, Hero) | NFA-04 |
| T-073 | Ende-zu-Ende Browser → PHP mit Live-Build | Live-Build mit `php -S` | Anmeldung 3 Personen, Betrieb zahlt | 942,30 €, Danke-Seite, 2 Mails | wie erwartet | manuell – geprüft am 13.11.2026 (Bericht Task 4) | US-10 … US-13 |
| T-074 | CI-Lauf GitHub Actions | Push auf `main` | Jobs build, test, live-build, deploy | alle grün, Artefakt „akademie-allinkl-upload“ vorhanden | grün für Commit 73faa2c | manuell – geprüft am 13.11.2026 (Bericht Task 1); aktueller Stand vor M5 erneut prüfen | NFA-19, NFA-25 |
| T-075 | Lighthouse mobil | L auf dem Live-Server | Start, Katalog, Kursseite, Termine, Anmeldung | ≥ 95 in allen vier Kategorien; LCP < 2,0 s, CLS < 0,1 | Hinweis aus Bericht Hero: CLS Desktop 0,05–0,27 (Schrift-Tausch, Warum-Bühne) | manuell – offen | NFA-01, NFA-02 |
| T-076 | Barrierefreiheit vertieft | L | axe je Seitentyp; NVDA oder VoiceOver für die Anmeldung; ganze Anmeldung per Tastatur; 200 % Zoom | keine Verstöße; Anmeldung mit Screenreader möglich | automatisiert nur Teilaspekte (T-005, T-009, T-030) | manuell – offen | NFA-03 |
| T-077 | Echte Geräte und Browser | L | iPhone (Safari iOS), Android (Chrome), Firefox, Edge | keine Darstellungs- oder Bedienfehler | automatisiert nur WebKit mit Desktop-Safari-Profil und Chromium | manuell – offen | NFA-04, NFA-07 |
| T-078 | HTTPS und Sicherheits-Header | Live-Server | `http://` aufrufen, SSL Labs, Mozilla Observatory | 301 auf HTTPS, HSTS, SSL Labs ≥ A, Observatory ≥ B+ | Header sind im Live-Paket noch nicht enthalten (F-03) | manuell – offen | NFA-11, NFA-12 |
| T-079 | Mailzustellung | Live-Server, Postfächer | Testanmeldung an Gmail, Outlook, Firmenpostfach | Eingang ohne Spam-Ordner; SPF/DKIM/DMARC bestanden | – | manuell – offen | R-08, NFA-25 |
| T-080 | Weiterleitung top-abschluss.de | DNS/KAS eingerichtet | `top-abschluss.de`, `www.top-abschluss.de/x` | 301 auf `/pruefungsvorbereitung/` | – | manuell – offen | US-27 |
| T-081 | Keine Fremd-Domains, keine Cookies | V | statische Suche in `dist/`; Netzwerkprotokoll im Browser | keine fremden Skripte, Stile, Schriften; keine Cookies | statisch: keine Fremd-Ressourcen (Abschnitt 3); Netzwerk-Trace Startseite nur eigene Schriften und CSS (Review Hero) | manuell – geprüft am 13.11.2026 (teilweise); Netzwerkprotokoll aller Seitentypen offen | NFA-08, NFA-09 |
| T-082 | Rich-Results-Test und Schema-Validator | L auf dem Live-Server | Kursseite AP1, FAQ | ohne Fehler | – | manuell – offen | NFA-15 |

**Summe:** 82 Testfälle – 66 automatisiert (davon 64 bestanden, T-001 instabil, T-067 fehlgeschlagen wegen
Testkonflikt), 16 manuell (5 geprüft bzw. teilweise geprüft, 11 offen).

---

## 5. Bekannte Grenzen

1. **Instabile Tests unter Last.** Der Rechner ist durch parallele Arbeiten stark ausgelastet. Der Test „Startseite lädt
   ohne Konsolenfehler“ (T-001) wartet auf „Netzwerk ruhig“ und läuft dann in Chromium in sein Zeitlimit: in beiden
   Volläufen gegen die Vorschau (L-2, L-7) fehlgeschlagen, einzeln 9 von 10 bestanden (L-6), im Live-Lauf bestanden (L-5).
   Ein Konsolenfehler wurde dabei nie gemeldet – der Test bricht vorher ab. Lange Crawl-Tests (T-010, T-019, T-020, T-071) haben deshalb 120 s Zeitlimit. Läufe immer
   mit `--workers=2`. Empfehlung: in T-001 auf `load` plus kurze Wartezeit umstellen.
2. **Vorschau-Tests ohne Ausschluss im Live-Build.** `tests/formulare.spec.ts` und der noindex-Test sind für die
   Vorschau (Demo-Modus) geschrieben. Ein Gesamtlauf gegen den Live-Build meldet dort erwartbare Fehler (F-02). Für den
   Live-Build nur die in Abschnitt 2 genannten Dateien ausführen.
3. **Silbentrennung.** Das Headless-Chromium im Test hat kein deutsches Trennwörterbuch. Sehr lange Wörter (z. B.
   „Berufsspezialist/in für Systemintegration“ bei 320 px) brechen dort hart um. Es entsteht kein seitliches Scrollen;
   echte Browser trennen mit `hyphens: auto`. Auf echten Geräten prüfen (T-077).
4. **Termine zwischen zwei Builds.** Abgelaufene Termine verschwinden beim täglichen Neubau der Vorschau und im Browser
   per Skript. Auf der Kursseite bleiben „Nächster Start“ und der Knopf „Termin wählen“ bis zum nächsten Build stehen.
   Live gilt der Stand erst nach dem nächsten Upload (TD-10); der Endpunkt lehnt abgelaufene Termine immer ab (T-042).
5. **Kein echter Mailversand im Test.** Die PHP-Tests prüfen den Inhalt der übergebenen Mails, nicht die Zustellung
   (T-079).
6. **Kein Test gegen ALL-INKL.** Apache-Regeln (`.htaccess`), PHP-Version und Rechte auf dem Webspace sind nur
   nachgebildet. Nach dem ersten Upload die Schritte aus der [Benutzeranleitung A9](07-benutzeranleitung.md#a9-ersteinrichtung-formulare-postfächer-weiterleitung) ausführen.
7. **Zeitfalle ohne JavaScript.** Ohne JavaScript gibt es keinen Zeitstempel; dann wirken nur Lockfeld und Limits
   (TD-11).
8. **Keine Unit-Tests für `src/lib/`.** Die Logik ist über Systemtests mit fester Uhrzeit abgedeckt, Grenzfälle (z. B.
   Zeitumstellung, Schaltjahr) sind nicht einzeln geprüft.
9. **Desktop-Safari statt iOS.** WebKit im Test entspricht der Safari-Engine, aber nicht dem iPhone mit Touch,
   dynamischer Leiste und Schriftgrößen-Einstellungen.

---

## 6. Befunde und Empfehlungen

| ID | Befund | Schwere | Empfehlung | Bezug |
|---|---|---|---|---|
| F-01 | T-067 meldet „Entwurf“ im Live-Build: gewolltes Entwurfsband der Rechtsseiten und ein Textbaustein im Anmelde-Skript. Kein Kursentwurf im Live-Paket (manuell geprüft). Der Test stammt aus der Zeit vor dem Zusammenführen mit den Rechtsseiten. | mittel (Test, nicht Website) | Test anpassen: Rechtsseiten ausnehmen, solange `RECHT_GEPRUEFT = false`; statt des Worts die Entwurfs-Slugs und `data-entwurf` prüfen | NFA-19 |
| F-02 | Vorschau-Tests (`formulare.spec.ts`, noindex) laufen ohne Ausschluss gegen den Live-Build. | gering | `test.skip(!istVorschau)` wie in `seiten.spec.ts` ergänzen | – |
| F-03 | Das Live-Paket enthält keine `.htaccess` im Webroot: HTTPS-Umleitung, HSTS, Content-Security-Policy und weitere Sicherheits-Header fehlen. | hoch für M5 | Datei vor dem Livegang ergänzen oder im KAS einstellen; mit T-078 prüfen | NFA-11, NFA-12 |
| F-04 | T-001 instabil unter Last (siehe Abschnitt 5). | gering | Warten auf `load` statt `networkidle` | US-01 |
| F-05 | Layout-Verschiebung (CLS) auf dem Desktop laut Bericht Hero 0,05–0,27. | mittel | Schriften vorladen bzw. metrisch angepasste Ersatzschrift; Warum-Bühne CSS-first; mit T-075 messen | NFA-02 |

Vor dem Livegang (M5) muss dieses Protokoll erneut durchlaufen werden: alle automatisierten Tests bestanden,
F-01 bis F-03 erledigt, die manuellen Prüfungen T-075 bis T-082 abgehakt.

---

## Änderungsverlauf

| Datum | Änderung |
|---|---|
| 13.11.2026 | Erste Fassung mit Testläufen L-1 bis L-7 |
