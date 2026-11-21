# Funnel-Map – waybuild Akademie (Runde 1)

Tap-Zählung: Mobil 390 px, Scrollen zählt nicht als Tap, Start = Einstiegsseite geladen, Ziel = erstes Formularfeld im Blick. Tracking: **in keinem Funnel vorhanden** (keine Analytics, keine Events; nur Vorgangsnummer in Mails).
S6771 = künftiger Stand `akad-start-6771`.

## Übersicht

| # | Funnel | Schritte | Taps bis Formular | 2-Tap-Regel | Verbindlichkeit im Ziel |
|---|---|---|---|---|---|
| F1 | Google „AP2 Fachinformatiker Vorbereitung“ → **Kursseite** (main, frei) | Kursseite → „Termin wählen“ (#termine) → „Anmelden“ → `/anmeldung/` (5 Schritte) → Danke → Eingangsbestätigung | **2** (+ Seitenwechsel) | erfüllt | „Zahlungspflichtig anmelden“ = verbindliches Angebot |
| F2 | Google → **Berufsseite** S6771 | Berufsseite → Teil-Knopf/„Unverbindlich anmelden“ → Formular auf derselben Seite (vorausgefüllt) → Danke (art=kontakt) → Bestätigung | **1** | erfüllt | „Unverbindlich anfragen“ |
| F3 | **Startseite S6771 → Berufs-Kachel → Formular** | Start (scrollen bis Kacheln) → Kachel → Berufsseite → Teil-Knopf → Formular | **2** (3 mit „Erst Beruf wählen ↓“) | erfüllt | unverbindlich |
| F3b | Startseite S6771 direkt | Hero „Kurs anfragen“ / Sticky-Leiste → `#anfrage` | **1** | erfüllt | unverbindlich, aber ohne Kurs-Vorauswahl |
| F3c | Startseite S6771, Beruf per Suche | Suchfeld tippen (1) → Eingabe → Kachel (2) → Teil-Knopf (3) | **3** | **verletzt** (Tastatur-Tap mitgezählt) | unverbindlich |
| F4 | top-abschluss.de → **/pruefungsvorbereitung/** | „Termin wählen“ → TerminKarte „Anmelden“ → `/anmeldung/`; S6771 zusätzlich Kachel → Berufsseite → Knopf | 2 / 2 | erfüllt | **gemischt**: oben verbindlich, Kachel-Weg unverbindlich |
| F5 | Main-Startseite (heute) | „Anmelden“ in „Nächste Starttermine“ → `/anmeldung/` | 1 (weit unten) | erfüllt | verbindlich |
| F6 | **Betrieb → mehrere Azubis** | Kursseite → Termin → Anmelden → Schritt 2 „Anzahl Personen“ (bis 5) + Schritt 3 „Mein Betrieb zahlt“ | 2 | erfüllt | verbindlich; Kurzanfrage hat **kein** Personen-/Betriebsfeld |
| F7 | Kursseite **ohne Termin** (Entwurf/IHK-WB) | „Interesse vormerken“ → `/interesse/` | 1 | erfüllt | unverbindlich (eigener Danke-Text) |
| F8 | Coaching | /coaching/ → „Coaching anfragen“ → `/anmeldung/?kurs=pruefungscoaching` | 1 | erfüllt | unverbindlich bis Terminabstimmung + Mail |
| F9 | Beliebige Seite → Kopf-Knopf „Anfragen“ (S6771) | → `/#anfrage` | 1 (+ Seitenwechsel) | erfüllt | unverbindlich, **Kurs-Kontext geht verloren** |

## Je Funnel: Conversions, Drop-off-Hypothesen, Abhängigkeiten

**F1 Kursseite → Anmeldung**
- Mikro: Tap „Termin wählen“, Tap „Anmelden“. Makro: Absenden „Zahlungspflichtig anmelden“.
- Drop-off-H: Wort „zahlungspflichtig“ + 5 Schritte schrecken Azubis ohne Betriebsfreigabe ab; Minderjährigen-Haken (`formular.ts:33`) unklar; kein unverbindlicher Ausweg auf der Seite.
- Abhängigkeiten: `kurse/[slug].astro:55-59,176,431` (frei), `TerminKarte.astro:90` (frei), `AnmeldeFormular.astro` + `anmeldung.php` (besetzt), Teilnahmebedingungen §2 (besetzt, Anwalt).

**F2/F3 Berufsseite / Startseite → Kurzanfrage**
- Mikro: Kachel-Tap, Teil-Knopf, Fokus ins Namensfeld. Makro: „Unverbindlich anfragen“.
- Drop-off-H: CTA heißt „Unverbindlich **anmelden**“, Knopf dann „anfragen“ – Bruch; Danke-Seite „deine Nachricht ist angekommen“ bestätigt nicht, dass die *Anfrage* angekommen ist und was jetzt passiert; Bestätigungsmail „Deine Nachricht ist angekommen“.
- Abhängigkeiten: S6771 `AnfrageFormular.astro`, `anfrage-client.ts`, `kontakt.php` (THEMEN), `danke/index.astro` (Block `kontakt`), `lib/berufe.ts`. Live nur 7 Berufe.

**F4 /pruefungsvorbereitung/**
- Drop-off-H: zwei Hauptwege (Termin wählen ↔ Beruf wählen) konkurrieren; Nutzer mit Ziel „nur informieren“ landen im verbindlichen Formular.

**F6 Betrieb**
- Drop-off-H: Betrieb will erst Angebot/Freigabe; nur verbindlicher Weg vorhanden → Mail statt Formular (nicht messbar).
- Abhängigkeit: Kurzanfrage-Felder (besetzt), Vertragspartner Betrieb (Anwalt offen).

## Prüfung: „unverbindlich → verbindlich erst nach E-Mail-Bestätigung“ (Cans Vorgabe)

| Ort | Aussage heute | Konsistent? |
|---|---|---|
| S6771 Kurzanfrage-Knopf (`AnfrageFormular.astro:78-79`) | „Unverbindlich anfragen“ · „Kostenlos und unverbindlich – noch keine Buchung. Du bekommst eine Bestätigung per E-Mail.“ | teilweise (sagt nicht, *wann* es verbindlich wird) |
| S6771 Startseite FAQ (`index.astro:68`) | „Verbindlich wird es erst mit deiner Anmeldung.“ | **nein** (Anmeldung statt E-Mail-Bestätigung) |
| S6771 Berufsseite (`[beruf].astro:112,128,132`) | „Unverbindlich anmelden“ … „Verbindlich wird es erst mit deiner Anmeldung.“ | **nein** (Wortbruch anmelden/anfragen) |
| Anmeldeformular (`AnmeldeFormular.astro:276`, `anmeldung-client.ts:212`) | „Zahlungspflichtig anmelden“ | **nein** – verbindliches Angebot |
| Teilnahmebedingungen §2 (`teilnahmebedingungen/index.astro:70-77`) | Absenden = verbindliches Angebot; Vertrag erst mit Anmeldebestätigung per E-Mail | Vertragsschluss per Mail ✓, Absenden aber bindend |
| Eingangsbestätigung Anmeldung (`anmeldung.php:291`) | „noch keine Annahme – Vertrag kommt zustande, sobald wir … bestätigen“ | ✓ für Vertragsschluss |
| Danke `anmeldung` | Eingangsbestätigung, Rechnung, Zugang | kein Hinweis „Vertrag erst nach Bestätigung“ |
| Danke `kontakt` (Ziel der Kurzanfrage) | „deine Nachricht ist angekommen … zwei Werktage“ | **fehlt** komplett |
| Bestätigungsmail Kurzanfrage (`kontakt.php:91-95`) | „danke für deine Nachricht“ | **fehlt** |
| FAQ (`lib/faq.ts`) | nur Coaching „Ist die Anfrage verbindlich?“ (Z. 128-129) | **fehlt** für Kurse |
| Kursseite (`kurse/[slug].astro`) | nur Coaching-Text Z. 276 „Anfrage unverbindlich“; Kurs → verbindlich | **nein** |
| Coaching | „Anfrage unverbindlich · Vertrag erst nach Terminabstimmung + E-Mail“ | ✓ (Vorbild) |

**Ergebnis:** Nur der Coaching-Weg ist konsistent. Die Begriffe „Anfrage“, „Anmeldung“, „Buchung“ werden gemischt. Empfehlung: **ein Satz, eine Quelle** (z. B. `lib/zusagen.ts` → `ZUSAGEN.anfrage`: „Deine Anfrage ist kostenlos und unverbindlich. Verbindlich wird es erst, wenn wir dir deinen Platz per E-Mail bestätigen.“) – Wortlaut von Can freigeben lassen; ob die „Zahlungspflichtig“-Button-Lösung bleibt, muss mit dem Anwalt geklärt werden (§ 312j BGB gilt nur beim verbindlichen Schritt).

## Tracking-Vorschlag (nur Plan, nichts einbauen ohne Freigabe/Consent)
Ereignisse ohne Cookies, serverseitig zählbar: Absenden je `thema`/`kurs` (kontakt.php, anmeldung.php, interesse.php schon vorhanden → Zähler in Mail-Log), `?quelle=`-Parameter (Start/Beruf/Kurs) als verstecktes Feld der Kurzanfrage. Client-Events (Kachel-Tap, Sticky-Tap) erst nach DSGVO-Prüfung.
