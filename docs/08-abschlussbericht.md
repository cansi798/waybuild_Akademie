# Abschlussbericht waybuild Akademie

Phase 3 „Finalisierung“ · Stand: 13.11.2026 · Status: **Entwurf zur Freigabe**

Dieser Bericht fasst das Projekt „Website der waybuild Akademie“ zusammen: Ziel und Ergebnis, Vorgehen, Erfahrungen,
offene Punkte und die nächsten Schritte bis zum Livegang. Grundlage sind die Dokumente
[01](01-projektdokumentation.md) bis [07](07-benutzeranleitung.md), insbesondere das [Testdokument](06-tests.md).

---

## 1. Ziel und Ergebnis

**Ziel** war eine schnelle, seriöse und barrierearme Website unter waybuild-akademie.de, über die Interessenten
Live-Online-Kurse finden, vergleichen und sich ohne Kundenkonto und ohne Online-Zahlung verbindlich anmelden können.
Erstes Geschäftsziel ist, dass Anmeldungen für die „Vorbereitung auf die IHK-Abschlussprüfung Teil 1 (AP1)“ im
Frühjahr 2027 vor dem Anmeldeschluss am 12.01.2027 eingehen können.

**Ergebnis zum 13.11.2026:**

- Die **Vorschau** ist vollständig online (GitHub Pages, gesperrt für Suchmaschinen): Startseite mit animierter
  „Reise“ von der Anmeldung bis zum Abschluss und Prüfungs-Countdown, Kurskatalog mit Filter, 43 Kursseiten aus
  einer gemeinsamen Vorlage, Terminübersicht, Landingpage Prüfungsvorbereitung, Coaching, Über uns, FAQ, Kontakt,
  vier Formulare, Danke-Seite, vier Rechtsseiten als gekennzeichnete Entwürfe, Fehlerseite.
- **Kursdaten:** 3 freigegebene Startkurse (AP1 alle IT-Berufe, AP2 Fachinformatik Systemintegration,
  Prüfungscoaching) und 40 Kursentwürfe in den drei Säulen. Entwürfe erscheinen nur in der Vorschau.
- **Formular-Versand:** PHP-Endpunkte für den ALL-INKL-Webspace mit serverseitiger Prüfung, Preisberechnung aus der
  beim Bauen erzeugten Terminliste, Spam-Schutz ohne Drittanbieter, Online-Widerrufsfunktion nach § 356a BGB.
- **Live-Paket:** Jeder Bau erzeugt zusätzlich das Paket „akademie-allinkl-upload“ ohne Entwürfe; der Upload ist
  vorbereitet und in der [Benutzeranleitung](07-benutzeranleitung.md#a8-live-upload-auf-all-inkl) beschrieben.
- **Tests:** 82 Testfälle im [Testdokument](06-tests.md). Lauf vom 13.11.2026: Browser-Tests (Chromium und WebKit)
  gegen die Vorschau 171 von 176 bestanden (4 nur für den Live-Build vorgesehen, 1 instabil unter Last),
  PHP-Tests 200 von 200 bestanden. Gegen den Live-Build schlägt ein Test wegen eines Testkonflikts fehl; die
  Anforderung „keine Entwürfe live“ ist manuell bestätigt. Elf manuelle Prüfungen (u. a. Lighthouse, Screenreader,
  echte Geräte, Live-Server) stehen vor dem Livegang noch aus.
- **Dokumentation:** Dokumente 00–08 mit acht Diagrammen (PlantUML, davon sieben UML).

Die Muss-Anforderungen sind in der Vorschau umgesetzt, mit Ausnahme der Punkte, die von externen Entscheidungen
abhängen (Rechtsprüfung, Domain und Postfächer, siehe Abschnitt 5). Bewusst zurückgestellt sind die in
[05-technical-debt.md](05-technical-debt.md) aufgeführten Punkte (z. B. Platz-Status, Kalenderdatei, Kurssuche).

---

## 2. Vorgehen nach den drei Phasen

| Phase | Inhalt | Ergebnis |
|---|---|---|
| **1 Konzeption** | Projektdokumentation mit 14 Risiken und Zeitplan, 30 User Stories und 25 nichtfunktionale Anforderungen, Spezifikation mit Datenmodell, Prozessen, 21 Geschäftsregeln, Schnittstellen und Seitenentwürfen | Dokumente 01–03 |
| **2 Erarbeitung** | Architekturentscheidung (Astro statisch, Tailwind 4 + daisyUI 5, PHP auf ALL-INKL), Umsetzung in sieben Arbeitspaketen mit je einem Review, Technical-Debt-Liste | Dokumente 04–05, Vorschau, Live-Paket |
| **3 Finalisierung** | Gesamttest, Testprotokoll, Benutzeranleitung, Abschlussbericht, Gesamt-Review des Codes | Dokumente 06–08 |

Die Umsetzung folgte einem schriftlichen Plan mit klar getrennten Aufgaben. Unabhängige Aufgaben (Grundgerüst,
Kursentwürfe, Dokumente; danach Seiten, Formulare, Rechtsseiten, Startseiten-Bühne) liefen **parallel** in eigenen
Arbeitskopien und Zweigen. Jede Aufgabe endete mit einem Bericht und einem unabhängigen Review (Spezifikation und
Qualität, beim Formular zusätzlich Sicherheit); erst danach wurde sie in den Hauptzweig übernommen. Gefundene Mängel
wurden in eigenen Korrektur-Commits behoben und erneut geprüft.

---

## 3. Was gut lief

- **Eine Datenquelle:** Karte, Kursseite, Terminübersicht, Countdown, Formular, strukturierte Daten und die
  Terminliste für den Server lesen dieselbe Kursdatei. Abweichende Preise oder Termine sind dadurch ausgeschlossen.
- **Schema-Prüfung beim Bau:** Fehlerhafte Kursdateien stoppen die Veröffentlichung. 40 Entwürfe ließen sich so
  schnell und sicher anlegen und automatisch prüfen.
- **Trennung Vorschau / Live:** Entwürfe sind in der Vorschau sichtbar und gekennzeichnet; ein Test stellt sicher,
  dass das Live-Paket keine Entwurfsseite enthält.
- **Reviews mit Wirkung:** Jedes Review fand echte Mängel (Grammatik in Schablonentexten, unzulässige Andeutung einer
  Mindestteilnehmerzahl, missverständliche Storno-Zeile, Sicherheitslücken im Formular) – alle vor der Übernahme behoben.
- **Ohne JavaScript nutzbar:** Katalog, Termine, FAQ und alle Formulare funktionieren auch ohne Skripte.
- **Datensparsam:** keine Cookies, keine Tracker, keine externen Schriften; Formulardaten nur per E-Mail.

---

## 4. Was schwierig war

**Parallele Arbeit und Zusammenführen.** Bis zu vier Aufgaben liefen gleichzeitig. Das sparte viel Zeit, verlangte
aber eine feste Reihenfolge beim Zusammenführen (Seiten → Formulare → Recht → Startseite) und klare Grenzen, welche
Aufgabe welche Dateien ändert. Schnittstellen zwischen den Aufgaben – etwa das in die Widerrufsseite eingebundene
Widerrufsformular oder der Paket-Parameter des Coachings – mussten vorher festgelegt werden. Einzelne gemeinsam
genutzte Testdateien wurden trotzdem von mehreren Aufgaben berührt.

**Gestoppte Recherchen.** Die ersten Recherchen zu UI-Bibliotheken und zur Rechtslage wurden abgebrochen, bevor sie
fertig waren. Die Entscheidung fiel danach ohne weiteres Gate: nur daisyUI, die Rechtsrecherche wurde neu und
fokussiert aufgesetzt, die eigentliche Rechtsprüfung auf die Zeit vor dem Livegang verschoben. Die Rechtstexte
bleiben deshalb bis zur Prüfung Entwürfe.

**Rechtslage Fernunterricht und Widerrufsbutton.** Ob Online-Kurse unter das Fernunterrichtsschutzgesetz fallen,
hängt laut Rechtsprechung des Bundesgerichtshofs von der Kursgestaltung ab; rein oder überwiegend synchroner
Live-Unterricht fällt in der Regel nicht darunter (Risiko R-01). Daraus wurde Regel GR-21: nur Live-Unterricht,
keine Aufzeichnungen, angepasste Wortwahl in allen Texten. Seit 19.06.2026 verlangt § 356a BGB eine
Online-Widerrufsfunktion; sie wurde zweistufig umgesetzt („Vertrag jetzt widerrufen“ → „Widerruf bestätigen“) und
im Fuß jeder Seite verlinkt. Beides bleibt bis zur Anwaltsprüfung als Risiko geführt.

**Sicherheitsfund im Formular.** Das Sicherheits-Review fand, dass die automatischen Eingangsbestätigungen Freitext
aus dem Formular enthielten. Damit hätten Dritte die Formulare nutzen können, um Spam- oder Phishing-Texte an
beliebige Adressen zu schicken („Relay“). Die Bestätigungen bestehen jetzt nur aus festen Bausteinen und geprüften
Werten; dazu kamen ein Limit je Empfängeradresse, ein Tageslimit, eine strengere E-Mail-Prüfung, die Kürzung von
IPv6-Adressen für das Rate-Limit und ein „fail closed“-Verhalten ohne festen Ersatzschlüssel. Die PHP-Tests wuchsen
dadurch von 109 auf 200 Prüfungen.

**Safari-Eigenheiten.** WebKit verhielt sich an mehreren Stellen anders als Chromium: Klicks gingen verloren, wenn
der Knopftext während des Klicks neu gesetzt wurde; Fehlertexte, die beim Verlassen eines Feldes erschienen,
verschoben den Absende-Knopf; Links im Menü sind per Tab-Taste nur mit Alt+Tab erreichbar. Alle Tests laufen deshalb
in Chromium **und** WebKit.

**Docker und node_modules.** Node läuft nur in Docker. In den parallelen Arbeitskopien zeigten verlinkte
`node_modules` ins Leere, weil das Ziel nicht im Container eingebunden war. Abhilfe war eine Hardlink-Kopie je
Arbeitskopie.

**Last auf dem Testrechner.** Bei hoher Last laufen einzelne lange Tests (Link-Crawler über alle Seiten, Warten auf
„Netzwerk ruhig“) in ihr Zeitlimit. Die Läufe werden deshalb mit zwei parallelen Workern ausgeführt; die Grenzen
stehen im [Testdokument](06-tests.md#5-bekannte-grenzen).

---

## 5. Lessons Learned

1. **Schnittstellen vor der Parallelarbeit festlegen** (Dateigrenzen, Komponenten-Namen, URL-Parameter) und eine
   Merge-Reihenfolge bestimmen. Gemeinsame Dateien wie Tests einer Aufgabe zuordnen.
2. **Sicherheits-Review für jeden Server-Code**, nicht nur ein Funktions-Review. Der Relay-Fund war im Funktionstest
   unsichtbar.
3. **Rechtliche Leitplanken früh als Geschäftsregel** festhalten (GR-21, Button-Lösung, Widerrufsfunktion). Dann
   halten sich alle Texte und Entwürfe von Anfang an daran.
4. **Von Anfang an in zwei Browser-Engines testen.** Safari-Fehler sind sonst erst auf dem iPhone sichtbar.
5. **Tests unter Last einplanen:** Zeitlimits großzügig, Crawler-Tests begrenzen, Worker-Zahl festlegen.
6. **Entwürfe gefahrlos sichtbar machen:** Statusfeld plus automatischer Live-Test erlaubt frühes Feedback ohne Risiko.
7. **Werkzeug-Umgebung früh prüfen** (Docker, Pfade, Abhängigkeiten in Arbeitskopien), bevor mehrere Agenten oder
   Personen parallel arbeiten.

---

## 6. Offene Punkte

| Punkt | Was fehlt | Zuständig | Bezug |
|---|---|---|---|
| **Anwaltsprüfung** | Prüfung von Impressum, Datenschutz, Teilnahmebedingungen (Storno, Absage, Raten, Kündigung langer Lehrgänge), Widerrufsbelehrung, Wertersatz-Wortlaut, Altersbestätigung, Vertragspartner bei „Betrieb zahlt“, Fernunterrichtsfrage; danach `RECHT_GEPRUEFT = true` | Geschäftsführung mit Rechtsberatung | R-01, R-02, R-10, TD-01, TD-08 |
| **Firmendaten** | Telefonnummer, Registergericht, Registernummer, USt-IdNr. für Impressum und Kontaktseite | Geschäftsführung | TD-01 |
| **Kursentwürfe freigeben** | 40 Entwürfe fachlich und sprachlich prüfen (Schablonentexte individualisieren, Rahmenpläne abgleichen), Preise festlegen, freigeben | Redaktion, Geschäftsführung | US-23, TD-06 |
| **Umsatzsteuer** | Bescheinigung zur Umsatzsteuerbefreiung von Bildungsleistungen ist beantragt; Preise bleiben Endpreise „alles inklusive“ | Geschäftsführung mit Steuerberatung | R-03, TD-02 |
| **Videokonferenz-Tool** | Auswahl des Live-Raums; Eintrag in der Datenschutzerklärung; Ablauf für Zugangsdaten | Geschäftsführung, Backoffice | S-08 |
| **Fotos und Bilder** | Bildsprache derzeit nur Grafiken; Fotos nur mit geklärten Rechten und ohne Lehrende | Geschäftsführung | NFA-23 |
| **Domain und Postfächer** | waybuild-akademie.de auf ALL-INKL, SSL, `anmeldung@` und `info@`, SPF/DKIM/DMARC, Weiterleitung top-abschluss.de, Testanmeldungen | Hosting-Verwaltung | AP-10, R-08, US-27 |
| **Sicherheits-Header** | Content-Security-Policy, HSTS und weitere Header per `.htaccess` für das Live-Paket ergänzen und mit Observatory/SSL Labs prüfen | Entwicklung | NFA-11, NFA-12 |
| **Manuelle Prüfungen** | Lighthouse, Screenreader, echtes iPhone/Android, Zustellbarkeit der Mails (siehe Testdokument) | Entwicklung, Team | NFA-01 … NFA-04 |
| **Kursdaten prüfen** | IHK-Prüfungstermine 2027 je IHK bestätigen; Prüfungstag des AP1-Herbsttermins abgleichen | Redaktion | R-09 |

---

## 7. Nächste Schritte bis zum Livegang

| Meilenstein | Termin | Schritte |
|---|---|---|
| **M2 Vorschau online** | 20.11.2026 | Gesamt-Review des Codes abschließen und Funde beheben; Freigabe der Vorschau (Gate Phase 2); Anwaltsfrage zur Ratenzahlung stellen |
| **M3 Inhalte freigegeben** | 04.12.2026 | Startkurse, Preise, Termine und Texte freigeben (AP-08); weitere Entwürfe nach Prüfung freigeben; Firmendaten nachtragen |
| **M4 Rechtsprüfung abgeschlossen** | 11.12.2026 | Rechtstexte, Formular und Fernunterrichtsfrage prüfen lassen (AP-09); Änderungen einarbeiten; Umsatzsteuerfrage entscheiden oder als Risiko annehmen |
| **AP-10 Live-Umgebung** | 30.11.–11.12.2026 | Domain, SSL, Postfächer, SPF/DKIM/DMARC, Weiterleitung, Sicherheits-Header; erstes Live-Paket hochladen; Testanmeldungen an verschiedene Postfächer |
| **M5 Livegang** | 15.12.2026 | Letzter Testlauf nach [06-tests.md](06-tests.md) ohne offene kritische Fehler; manuelle Prüfungen abgehakt; `RECHT_GEPRUEFT = true`; Live-Upload; Gate Phase 3 |
| Anmeldephase AP1 | 15.12.2026–12.01.2027 | Anmeldungen bearbeiten (AP-12), Spam-Quote beobachten (Ziel < 5 %), wöchentlicher Live-Upload |

Verschiebt sich M5 um mehr als eine Woche, wird der Ausweichplan aus Risiko R-11 entschieden (Start mit AP2 Sommer
2027 bzw. AP1 Herbst 2027).

---

## 8. Freigabe

| Dokument | Version | Freigabe durch | Datum |
|---|---|---|---|
| 08-abschlussbericht.md | Entwurf 13.11.2026 | Geschäftsführung | offen |
