# Customer Journey – waybuild Akademie (Runde 1)

Legende: **F** = Fakt (im Code belegt) · **H** = Hypothese · **U** = unbekannt (keine Analytics, keine Interviews).
S6771 = nicht committeter Stand `/home/can/projekte/akad-start-6771` (künftige Startseite). Pfade relativ zum Projekt.

## Persona A (primär): Azubi vor AP1/AP2

| Phase | Nutzerziel | Fragen/Einwände | Touchpoints | Reibung | Nächste Aktion | Beleg |
|---|---|---|---|---|---|---|
| Awareness | „Wie bestehe ich die AP1/AP2?“ | Gibt es was für **meinen** Beruf? Kostet das viel? | Google, Weiterleitung top-abschluss.de → /pruefungsvorbereitung/, Ausbilder, Mitazubis (**H**) | Live nur 3 Kurse/7 Berufsseiten (**F**); kaufmännische Berufe live unsichtbar (**F**) | Startseite/Berufsseite öffnen | `src/lib/kurse.ts:37-45`, S6771 `src/lib/berufe.ts:57-60`, `pruefungsvorbereitung/index.astro:2` |
| Consideration | Beruf finden, Termin + Prüfungstag + Preis sehen | Passt der Termin zur Prüfung? Abends neben Arbeit/Berufsschule? Live oder Video? | S6771 Kacheln „Welcher Beruf bist du?“ + Suche, Berufsseite, Kursseite, FAQ | Unterrichtszeit widersprüchlich: „17–20 Uhr“ vs. Kursdaten 18:00–20:30/21:30 (**F**); Videos fehlen (**F**) | Prüfungsteil-Knopf / „Termin wählen“ | S6771 `src/lib/site.ts` (UNTERRICHT), `src/content/kurse/ap1-it-berufe.md` (zeiten), `WarumBuehne.astro:30` |
| Decision | Unverbindlich anfragen bzw. anmelden | Ist das verbindlich? Muss ich sofort zahlen? Zahlt mein Betrieb? Bin ich minderjährig? | Kurzanfrage (S6771), `/anmeldung/` (5 Schritte), `/danke/`, Bestätigungsmail | Zwei Modelle: „Unverbindlich anfragen“ vs. „Zahlungspflichtig anmelden“ (**F**); Text „verbindlich erst mit deiner Anmeldung“ ≠ Cans „erst nach E-Mail-Bestätigung“ (**F**); Danke nach Kurzanfrage = „deine Nachricht“ (**F**) | Formular absenden | S6771 `AnfrageFormular.astro:78-79`, `[beruf].astro:132`, `index.astro:68`; main `AnmeldeFormular.astro:276`, `danke/index.astro` (art kontakt), `public/api/kontakt.php:91-95` |
| Retention | Kurs besuchen, Zugang bekommen, nachholen | Wann kommt der Link? Was, wenn ich fehle? | E-Mail (Zugang vor Kursstart), Live-Raum | Kein Self-Service/Kundenkonto (**F**, bewusst); Verlauf nach Anfrage unklar – wer meldet sich wann? (**U**) | Teilnahme, ggf. AP2 nach AP1 | `lib/faq.ts:81, 89`; Danke „anmeldung“-Block |
| Advocacy | Weiterempfehlen (Mitazubis, Ausbilder) | – | – | Keine Empfehlungs-/Bewertungsfunktion, keine Stimmen (**F**; Stimmen dürfen nicht erfunden werden) | – | keine Datei vorhanden |

**H:** Azubis kommen überwiegend mobil, entscheiden in einer Sitzung und brechen bei langen Formularen ab → Kurzanfrage (4 Pflichtfelder) wird mehr Anfragen bringen als das 5-Schritt-Formular. **U:** Anteil Minderjähriger, Anteil „Betrieb zahlt“, Quelle des Traffics.

## Persona B: Ausbildungsbetrieb/Ausbilder als Zahler

| Phase | Nutzerziel | Fragen/Einwände | Touchpoints | Reibung | Nächste Aktion | Beleg |
|---|---|---|---|---|---|---|
| Awareness | Azubis gezielt vorbereiten lassen | Seriös? Wer steckt dahinter? IHK-nah? | Google, Azubi bringt Link (**H**) | Über uns im S6771-Kopf entfernt (nur Fuß) (**F**) | /ueber-uns/, Fakten-Box | S6771 `src/lib/site.ts` (MENUE/FUSS_MENUE), `index.astro:73-79` |
| Consideration | Preis je Azubi, Gruppenrabatt, Rechnung an Firma | Rechnung mit Bestellnummer? Rabatt? Storno/Ersatz? | Kursseite Preisbox, FAQ „Betrieb“, „Gruppe“ | Rabatt „ab 3 Personen 10 %“ steht nur auf Kursseite/FAQ, nicht auf Start-/Berufsseite (**F**) | Termin wählen | `kurse/[slug].astro:341`, `lib/faq.ts:45, 49` |
| Decision | Mehrere Azubis auf einmal anmelden | Muss jeder Azubi einzeln? Verbindlich? | `/anmeldung/` (bis 5 Personen, „Mein Betrieb zahlt“) | Kurzanfrage kennt weder Personenzahl noch Rechnungsempfänger (**F**); Betrieb muss in den verbindlichen Weg (**F**); Vertragspartner Betrieb rechtlich offen (Anwalt) (**F**) | „Zahlungspflichtig anmelden“ | `AnmeldeFormular.astro:141-200`, `teilnahmebedingungen/index.astro:61, 159` |
| Retention | Nächster Jahrgang, AP2 nach AP1 | – | Rechnung, E-Mail | Kein Firmenkunden-Weg (Rahmen, Wiederbuchung) (**F**) | – | – |
| Advocacy | Empfehlung an andere Betriebe/IHK-Kontakte | – | – | nichts vorhanden (**F**) | – | – |

**H:** Betriebe wollen vor einer verbindlichen Buchung ein Angebot/eine Rechnung zur Freigabe → unverbindliche Betriebsanfrage mit „Anzahl Azubis“ senkt die Hürde. **U:** Wie viele Betriebe direkt buchen.

## Persona C: Berufstätige für IHK-Weiterbildung (Fachwirt, Betriebswirt, Meister …)

| Phase | Nutzerziel | Fragen/Einwände | Touchpoints | Reibung | Nächste Aktion | Beleg |
|---|---|---|---|---|---|---|
| Awareness | Aufstieg neben dem Job | Dauer, Kosten (3.000–6.600 €), Förderung? | Google, S6771 Bereich 2 + Video | **Live kein einziger Kurs freigegeben** (alle `entwurf`) (**F**) | /kurse/?saeule=ihk-weiterbildung | `src/content/kurse/*-ihk.md` (status), S6771 `index.astro:38-46` |
| Consideration | Zeiten, Samstage, Zulassung, Raten | Schaffe ich Di+Do bis 21:15 + Samstage? Raten? | Kursseite (Vorschau), FAQ | Startseiten-Botschaft „17–20 Uhr“ passt nicht zu 18:00–21:15 + Samstag 09:00–14:15 (**F**); Förderhinweise bewusst nicht erlaubt (**F**, Ruling) | Interesse vormerken / Kurzanfrage | z. B. `fachwirt-marketing-ihk.md` zeiten; `faq/index.astro:2-3` |
| Decision | Unverbindlich informieren | Beratung? Verbindlichkeit? | Kurzanfrage (Bereich „IHK-Weiterbildung“), /interesse/ | Zwei unverbindliche Wege (Interesse vs. Kurzanfrage) mit unterschiedlichen Danke-Texten (**F**) | Absenden | S6771 `AnfrageFormular.astro`, main `InteresseFormular.astro:56-57` |
| Retention | Monate­lange Teilnahme | Raten, Ausfall, Nachholen | E-Mail, Rechnung | Ratenhinweis nur in Kursdaten mit `raten: true` (**F**) | – | `kurse/[slug].astro:342` |
| Advocacy | – | – | – | nichts vorhanden (**F**) | – | – |

## Querschnitt: Was fehlt für alle Personas (U)
- Antwortzeit nach Kurzanfrage ist nirgends zugesagt (Kontakt-Danke sagt „zwei Werktage“ – für Anfrage nicht ausgesprochen).
- Ob/wie aus einer Anfrage eine verbindliche Anmeldung wird (Mail mit Link zum Anmeldeformular? Bestätigung per Antwort-Mail?) ist im Code nicht beschrieben → **muss Can entscheiden**, bevor Texte vereinheitlicht werden.
