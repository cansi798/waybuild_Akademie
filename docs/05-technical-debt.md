# Technical Debt waybuild Akademie

Phase 2 „Erarbeitung“ · Stand: 13.11.2026 · Status: **Entwurf**

„Technical Debt“ (technische Schulden) sind Punkte, die wir **bewusst** einfacher lösen oder aufschieben, um rechtzeitig
live zu gehen. Jede Schuld hat einen Grund, eine Folge, solange sie besteht, und einen Plan zum Abbau.
Die Liste wird bei jedem Meilenstein (siehe [Projektdokumentation, Zeitplan](01-projektdokumentation.md#4-zeitplan))
überprüft; erledigte Punkte bleiben mit Datum stehen.

**Dringlichkeit:** **vor Livegang** = muss bis M5 (15.12.2026) gelöst oder ausdrücklich angenommen sein ·
**nach Livegang** = im laufenden Betrieb abbauen · **bei Bedarf** = erst, wenn der Anlass eintritt.

---

## Übersicht

| ID | Schuld | Dringlichkeit | Bezug |
|---|---|---|---|
| TD-01 | Rechtstexte nur als Entwurf | vor Livegang | US-20, R-02, R-10 |
| TD-02 | Umsatzsteuerfrage offen | vor Livegang | NFA-21, GR-12, R-03 |
| TD-03 | Keine Plätze-Verwaltung, kein Termin-Status | nach Livegang | US-08, GR-20 |
| TD-04 | Mail-Versand per `mail()` statt Versandbibliothek | nach Livegang | US-12, US-24, R-08 |
| TD-05 | Kein CRM-Anschluss | bei Bedarf | US-29 |
| TD-06 | Entwurfskurse fachlich ungeprüft | vor Freigabe je Kurs | US-22, US-23, R-06 |
| TD-07 | Keine Besucher-Statistik | nach Livegang | NFA-08 |
| TD-08 | Fernunterricht/ZFU-Frage offen | vor Livegang | R-01 |
| TD-09 | Kein Feld für Förderhinweise | bei Bedarf | US-26, GR-17 |
| TD-10 | Live-Übertragung zu ALL-INKL anfangs manuell | nach Livegang | US-25, NFA-19 |
| TD-11 | Einfacher Spam-Schutz | nach Livegang | NFA-13, R-07 |
| TD-12 | Kann-Funktionen nicht umgesetzt (Kalenderdatei, Suche) | bei Bedarf | US-09, US-30 |

---

## Einzelheiten

| ID | Schuld | Grund | Folge, solange sie besteht | Abbau |
|---|---|---|---|---|
| TD-01 | **Rechtstexte** (Impressum, Datenschutz, Teilnahmebedingungen inkl. Storno/Absage/Raten, Widerruf mit Muster-Formular) sind **Entwürfe**. | Fachliche Prüfung braucht Zeit; die Seitenstruktur soll vorher stehen. | Texte sind deutlich als Entwurf gekennzeichnet und dürfen nicht live gehen; Restrisiko bei Widerruf und Button-Lösung. | Rechtsprüfung in AP-09 (bis M4 11.12.2026); danach Kennzeichnung entfernen und freigeben. |
| TD-02 | **Umsatzsteuer:** Ob die Kurse von der Umsatzsteuer befreit sind, ist nicht geklärt. | Klärung (ggf. Bescheinigung der zuständigen Stelle) liegt außerhalb des Projekts. | Preise erscheinen als Endpreise „inkl. aller Kosten“ ohne Hinweis „umsatzsteuerfrei“ (GR-12); Rechnungen und Kalkulation müssen beide Fälle abdecken. | Steuerliche Klärung in AP-09; danach Preishinweis im Layout an **einer** Stelle anpassen, ggf. Preise neu kalkulieren und freigeben. |
| TD-03 | **Keine Plätze-Verwaltung:** kein Zähler freier Plätze, kein Status „Wenige Plätze“ / „Ausgebucht – Warteliste“ / „Abgesagt“. | Entscheidung: zunächst keine Plätze-Anzeige; Aufwand für Pflege und Abgleich zu hoch für den Start. | US-08 ist zurückgestellt. Volle Termine müssen von Hand aus der Inhaltsdatei genommen werden; Überbuchung ist möglich und wird im Backoffice abgefangen. | Bei Bedarf optionales Feld `status` je Termin im Schema ergänzen (Anzeige + Endpunkt-Prüfung), später Abgleich mit dem CRM. |
| TD-04 | **Mail-Versand per PHP `mail()`** statt über eine Versandbibliothek mit SMTP-Anmeldung. | Keine zusätzliche Abhängigkeit (kein Composer-Paket auf dem Webspace), schnell einsatzbereit, bei ALL-INKL unterstützt. | Kein Wiederholungsversuch bei Störungen, nur einfache Text-E-Mails, Zustellbarkeit hängt stark von SPF/DKIM/DMARC der Domain ab; Fehler sind schwer nachzuvollziehen. | Absender-Authentifizierung vor Livegang einrichten (AP-10) und mit Testanmeldungen prüfen; bei Zustellproblemen auf eine Versandbibliothek mit SMTP-Anmeldung am ALL-INKL-Postfach umstellen. |
| TD-05 | **Kein CRM-Anschluss.** | CRM ist noch nicht ausgewählt bzw. angebunden. | Anmeldungen und Interessen werden im Postfach von Hand bearbeitet; Listen „Interesse je Kurs“ entstehen manuell. | Jede E-Mail enthält bereits einen JSON-Block mit festen Feldnamen und Vorgangsnummer (S-03, US-29). Anschluss ohne Änderung der Formulare: CRM liest das Postfach aus oder der Endpunkt sendet zusätzlich an das CRM. |
| TD-06 | **Entwurfskurse ungeprüft:** Viele Kurse (Inhalte, Dauer, Preisvorschläge) sind vorbereitete Entwürfe. | Der Katalog soll früh vollständig sichtbar sein, ohne auf jede Prüfung zu warten. | Entwürfe erscheinen nur in der Vorschau mit gelbem Band und sind nicht buchbar; im Live-Build fehlen sie vollständig (GR-10, automatischer Test NFA-19). Der öffentliche Katalog ist zum Start klein. | Freigabeprozess P-04 je Kurs: fachliche Prüfung, Textprüfung, Preisfreigabe durch die Geschäftsführung. |
| TD-07 | **Keine Besucher-Statistik.** | Entscheidung: keine Statistik am Start; Datensparsamkeit, kein Einwilligungsbanner nötig. | Keine Zahlen zu Besuchern, Herkunft oder Abbrüchen im Formular; Erfolg wird nur an Anmeldungen und Anfragen gemessen. | Nach Livegang entscheiden; wenn gewünscht, nur cookielose, selbst gehostete Messung ohne Einwilligungspflicht (NFA-08) und Ergänzung der Datenschutzerklärung. |
| TD-08 | **Fernunterricht / ZFU offen:** Ob jeder Kurstyp tatsächlich als rein oder überwiegend synchroner Live-Unterricht gilt (Fernunterrichtsschutzgesetz, Risiko R-01), ist rechtlich zu bestätigen; besonders bei langen Weiterbildungen mit Selbststudium. | Die Bewertung hängt von der genauen Kursgestaltung ab und braucht eine fachkundige Prüfung. | Die Rechtslage ist für Mischformen nicht abschließend bestätigt; bei einem ungünstigen Ergebnis wären Kursgestaltung, Texte oder eine Zulassung nötig. Bis dahin gilt GR-21 (nur live, keine Aufzeichnungen). | Rechtsprüfung in AP-09 vor M4; Ergebnis in den Teilnahmebedingungen und Kursbeschreibungen umsetzen; ggf. Zulassungsverfahren einplanen. |
| TD-09 | **Kein Feld für Förderhinweise** im Kursschema. | Förderung wird ohnehin nicht beworben (GR-17); weniger Felder halten das Schema einfach. | US-26 (Ein-/Ausschalten je Kurs) ist nicht umgesetzt. | Sobald eine Förderung gesichert ist: optionales Feld im Schema (standardmäßig aus) und Baustein mit Hinweis auf die zuständige Stelle. |
| TD-10 | **Live-Übertragung zu ALL-INKL** ist anfangs ein manueller Schritt (Live-Paket aus GitHub Actions hochladen). | Zugangsdaten für einen automatischen Upload müssen erst sicher als Geheimnis hinterlegt werden; das Repository ist öffentlich. | Der tägliche Neubau blendet abgelaufene Termine zuverlässig nur in der Vorschau aus; live gilt das erst nach dem nächsten Upload. Der Endpunkt lehnt abgelaufene Termine trotzdem ab (GR-11). | Automatischen, verschlüsselten Upload aus GitHub Actions mit eigenem, eingeschränktem Zugang einrichten. |
| TD-11 | **Einfacher Spam-Schutz:** Lockfeld, Zeitfalle (nur mit JavaScript), Mengenbegrenzung über eine kurzlebige Datei auf dem Webspace. | Kein Drittanbieter (kein reCAPTCHA), wenig Aufwand. | Gezielte Angriffe können den Schutz umgehen; ohne JavaScript greift die Zeitfalle nicht. | Spam-Quote im ersten Monat messen (Ziel < 5 %, NFA-13); bei Bedarf datenschutzfreundliche Rechenaufgabe ohne Drittanbieter ergänzen. |
| TD-12 | **Kann-Funktionen** Kalenderdatei je Termin (US-09) und Kurssuche (US-30) sind nicht umgesetzt. | Priorität „Kann“; der Katalogfilter reicht für den Start. | Teilnehmende übertragen Termine selbst in ihren Kalender; Suche nur über Filter und Browsersuche. | Kalenderdatei beim Bau erzeugen (S-10); Suche ohne externen Dienst, sobald der Katalog groß genug ist. |

---

## Änderungsverlauf

| Datum | Änderung |
|---|---|
| 13.11.2026 | Erste Fassung mit TD-01 bis TD-12 |
