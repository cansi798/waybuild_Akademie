# Site-Map / Seiteninventar – waybuild Akademie (Runde 1)

Stand: 21.11.2026 · Grundlage: main `786c8aa` (`/home/can/projekte/akad-loop`) und der nicht committete Stand `akad-start-6771` (Kürzel **S6771**, wird bald in main gemergt).
Mobil-Annahme: 390 px. Keine Analytics vorhanden – Aussagen zu Nutzung sind Hypothesen.

**Sichtbarkeit:** Live sind nur `status: freigegeben` → **3 von 70 Kursen**: `ap1-it-berufe`, `ap2-fachinformatiker-systemintegration`, `pruefungscoaching` (`src/lib/kurse.ts:37-45`). Die Vorschau (`dist/`) zeigt alle 70 inkl. Entwürfe.

## 1. Inventar

| # | Seite (src/pages) | Typ | Anzahl | Zielsegment | Phase | Haupt-CTA | Sek. CTA | Proof | Hindernis | Links ein/aus (grob) | Status Helfer |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `index.astro` **main** | Startseite | 1 | alle | Awareness → Consideration | Hero/Countdown, „Anmelden“ je Termin → `/anmeldung/` (Z. 130) | „Termine ansehen“, „Frage stellen“ (mailto) (Z. 203-204) | Dozenten-Satz (WarumBuehne), Endpreise | viel Inhalt (Hero, 3 Säulen, Karten, Termine, Warum, Lernpfad, FAQ, CTA), keine Berufswahl, kein Video | ein: Logo/alle · aus: ~15 | besetzt |
| 1' | `index.astro` **S6771** | Startseite neu | 1 | Azubi (primär), Weiterbildung | Awareness → Decision | „Kurs anfragen“ → `#anfrage` (Z. 106), Sticky „Unverbindlich anfragen“ | „Erst Beruf wählen ↓“, Berufs-Kacheln, je Bereich „Unverbindlich anfragen“ + Mehr-Link, Katalog-Kacheln | Dozenten-Satz, „ab … Endpreis“, Fakten-Box | 3 Videos fehlen (`public/video/` leer → Platzhalter „Video folgt“) | aus: Berufsseiten, /pruefungsvorbereitung/, /kurse/?saeule=…, /termine/, /faq/ | besetzt |
| 2 | `pruefungsvorbereitung/index.astro` | Landingpage (Ziel Weiterleitung top-abschluss.de) | 1 | Azubi | Consideration → Decision | „Termin wählen“ → `#termine` → TerminKarte „Anmelden“ (Z. 55, 204) | Coaching, Kontakt | Prüfungstage-Box, Dozenten-Satz, Risikoumkehr | **S6771**: zusätzlich BerufWahl (Anfrage-Weg) → zwei konkurrierende Wege (verbindlich vs. unverbindlich) auf einer Seite | ein: Kopf, Start · aus: Kursseiten, /anmeldung/, /coaching/ | besetzt |
| 3 | `pruefungsvorbereitung/[beruf].astro` **nur S6771** | Berufsseite (dynamisch) | Vorschau **17**, live **7** (nur IT-Berufe, weil nur AP1/AP2-FISI freigegeben) | Azubi | Decision | Teil-Knöpfe + „Unverbindlich anmelden“ → `#anfrage` auf derselben Seite (Z. 54-63, 105-112) | „Alle Details zum Kurs“ → Kursseite | Preis, Termine, Prüfungstag, IHK-Hinweis | CTA-Text „Unverbindlich **anmelden**“ ≠ Knopf „Unverbindlich **anfragen**“; Z. 132 „verbindlich erst mit deiner Anmeldung“ | ein: Startseite, /pruefungsvorbereitung/ · aus: Kursseite | besetzt |
| 4 | `kurse/index.astro` | Katalog | 1 | alle | Consideration | Kurskarte „Termin wählen“/„Interesse vormerken“ | Kontakt | Endpreise | live nur 3 Karten; IHK-WB/Akademie leer → „in Vorbereitung“ | ein: Kopf/Fuß, Start · aus: 3 (live)/70 Kursseiten | **frei** |
| 5 | `kurse/[slug].astro` | Kursseite (dynamisch) | Vorschau **70**, live **3** | je Säule | Consideration → Decision | „Termin wählen“ → `#termine` → „Anmelden“ → `/anmeldung/` (Z. 55-59, 176) | Interesse vormerken (kein Termin), Coaching anfragen | Dozenten-Satz (nur ihk-pruefung), Risikoumkehr, FAQ 8-10 | **keine** unverbindliche Kurzanfrage; führt in den verbindlichen Weg „Zahlungspflichtig anmelden“; kein Link zur Berufsseite | ein: Katalog, Karten, Termine, Berufsseite · aus: /anmeldung/, /interesse/, /faq/ | **frei** |
| 6 | `termine/index.astro` | Terminliste | 1 | Entschlossene, Betriebe | Decision | TerminKarte „Anmelden“ | „Zu den Kursen“, Coaching | Endpreise | nur 3-4 Termine live | ein: Start, Kursseiten, Fuß | **frei** |
| 7 | `coaching/index.astro` | Angebotsseite | 1 | Azubi AP2 (Projekt) | Decision | „Coaching anfragen“ → `/anmeldung/?kurs=pruefungscoaching` | „#pakete“, FAQ | Pakete, Dozenten-Satz | Anfrage läuft über das 5-Schritt-Anmeldeformular | ein: Prüfungsvorb., Karten | **frei** |
| 8 | `anmeldung/index.astro` | Formular (5 Schritte) | 1 | Azubi, Betrieb (bis 5 Personen) | Decision (Makro) | „Zahlungspflichtig anmelden“ (AnmeldeFormular Z. 276) / Coaching „Paket anfragen“ | Kontakt | Live-Preis, Rabatt ab 3 | verbindliches Angebot – widerspricht Cans Vorgabe „unverbindlich anfragen“ | ein: TerminKarte, Kontakt | besetzt |
| 9 | `interesse/index.astro` | Formular | 1 (noindex) | Kurs ohne Termin | Decision (Mikro) | „Interesse vormerken“ | – | „Unverbindlich und kostenlos“ | live fast unsichtbar (nur 3 Kurse) | ein: Kursseite/Karte | besetzt |
| 10 | `kontakt/index.astro` | Kontaktformular | 1 | alle | Consideration | „Nachricht senden“ | Termine, /anmeldung/ | – | Nachricht Pflicht (≥10 Zeichen); S6771 nutzt denselben Endpunkt für die Kurzanfrage | ein: Kopf, FAQ, Katalog | besetzt |
| 11 | `danke/index.astro` | Bestätigung | 1 (noindex) | alle | Decision → Retention | – | – | Schritte je Art | Kurzanfrage (S6771) landet in `art=kontakt` = „deine **Nachricht** ist angekommen“, kein Wort zu „unverbindlich“/nächstem Schritt | ein: alle Formulare · aus: Start | besetzt |
| 12 | `faq/index.astro` | FAQ | 1 | alle | Consideration | „Zum Kontakt“ | mailto | ~30 Antworten | keine Frage „Ist meine Anfrage/Anmeldung verbindlich?“ (nur Coaching), keine Unterrichtszeit | ein: Start, Kursseite, Fuß | **frei** (Inhalte aus besetzter `lib/faq.ts`) |
| 13 | `ueber-uns/index.astro` | Vertrauen | 1 | Betrieb, skeptische Azubis | Consideration | „Kurse ansehen“ | Kontakt, Impressum | Firmenangaben | kein Anfrage-CTA | ein: Kopf (main) / Fuß (S6771) | **frei** |
| 14 | `404.astro` | Fehler | 1 | – | – | „Zur Startseite“ | MENUE-Links | – | kein Anfrage-CTA, keine Berufssuche | – | **frei** |
| 15 | Recht: `impressum`, `datenschutz`, `teilnahmebedingungen`, `widerruf`, `barrierefreiheit` | Pflicht | 5 | – | Decision (Vertrauen) | – | – | – | Teilnahmebed. §2 beschreiben **„Zahlungspflichtig anmelden“ = verbindliches Angebot** (Z. 70-77) | Fuß | besetzt |
| 16 | `llms.txt.ts`, S6771 `llms-full.txt.ts`, `robots.txt.ts`, `api/termine.json.ts` | maschinenlesbar | 3-4 | KI/Suche | Awareness | – | – | – | – | – | besetzt/teils |

## 2. Unterschiede main ↔ S6771 (Navigation)

| Punkt | main | S6771 |
|---|---|---|
| Hauptmenü (`src/lib/site.ts`) | Kurse (Mega-Menü) · Prüfungsvorbereitung · Termine · Coaching · Über uns · Kontakt | Prüfungsvorbereitung · IHK-Weiterbildung · waybuild Weiterbildung · Kontakt + fester Knopf **„Anfragen“ → `/#anfrage`** |
| Mega-Menü | vorhanden | gelöscht (`MegaMenue.astro`, `menue.css`) |
| Termine/Coaching/Über uns | im Kopf | nur noch im Fuß (`FUSS_MENUE`) |
| Startseite | 9 Blöcke, Anmelde-Weg | Hero → Berufswahl → 3 Bereiche mit Video → Katalog → FAQ/Fakten → Kurzanfrage |
| Neuer Funnel | – | Kurzanfrage (`AnfrageFormular.astro`) → `/api/kontakt.php` → `/danke/?art=kontakt` |
| Unterrichtszeit | nur je Kurs (`zeiten`) | global „Abends 17–20 Uhr“ (`site.ts` `UNTERRICHT`) |

## 3. Problemstellen

1. **Zwei Verbindlichkeits-Modelle parallel** (konkurrierende CTAs): Kurzanfrage „Unverbindlich anfragen“ (S6771) vs. Termin → „Zahlungspflichtig anmelden“ (Kursseite, Prüfungsvorbereitung, Termine, Startseite main). Cans Vorgabe „verbindlich erst nach Bestätigung per E-Mail“ erfüllt keiner der beiden Texte wörtlich.
2. **Unterrichtszeit widersprüchlich**: S6771 „17–20 Uhr“ (`site.ts`, Startseite Z. 100, Berufsseite Z. 46, Fakten Z. 75) vs. Kursdaten 18:00–20:30 / 18:00–20:45 / 18:00–21:30 / 18:00–21:15 (+ Samstage) und WarumBuehne „ab 18:00 Uhr“ (`WarumBuehne.astro:30`).
3. **Kontextverlust**: Kopf-Knopf „Anfragen“ (S6771) springt von jeder Seite – auch von einer Kursseite – auf `/#anfrage` ohne `?kurs=`.
4. **Danke-Seite passt nicht zur Kurzanfrage** (`art=kontakt`, „Nachricht“, kein nächster Schritt, keine Verbindlichkeitsaussage); die Bestätigungsmail (`kontakt.php:91-95`) sagt ebenfalls nur „danke für deine Nachricht“.
5. **Kursseite = Sackgasse für Unentschlossene**: kein unverbindlicher Weg außer bei „kein Termin“; kein Rücklink zur Berufsseite.
6. **Live dünn**: 7 Berufsseiten, davon zeigen 6 bei AP2 „Termin auf Anfrage“; Kaufmännische Berufe live gar nicht sichtbar (Suche → „Frag uns einfach“ – gute Ausweichroute).
7. **Inkonsistente FAQ-Botschaft**: `faq.ts:103` „AP2 zuerst für Systemintegration“ vs. Vorschau mit AP2 für 7 IT-Berufe und kaufmännische Berufe.
8. **Verwaist/schwach verlinkt (S6771)**: `/termine/`, `/coaching/`, `/ueber-uns/` nur noch im Fuß; `/anmeldung/` nur über TerminKarte.
9. **Videos fehlen** → Kernvorgabe Cans (drei Blöcke mit Video) noch nicht erfüllt; Platzhalter nennt „Can und Jamil“ (`VideoPlatz.astro:68`, `site.ts:55-65`) – prüfen gegen Regel „keine Dozentennamen“, falls beide als Dozenten auftreten.
10. **Betrieb mit mehreren Azubis**: Kurzanfrage hat kein Feld „Anzahl Personen“/„Betrieb zahlt“; nur das verbindliche Anmeldeformular kann bis 5 Personen + 10 % ab 3.
