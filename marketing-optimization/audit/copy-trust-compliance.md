# Copy · Vertrauen · Hausregeln – Runde 1 (nur lesen)

Stand 21.11.2026. Geprüft: `main` (akad-loop, 786c8aa), nicht committete Startseiten-Arbeit (akad-start-6771, gleiche Basis), Abgleich Zeiten mit Branch `kalk-6771` (9e95844).
Nichts an Quelldateien geändert. **frei** = darf in Runde 2 angefasst werden, **besetzt** = anderer Helfer (start-6771 / recht-6771 / kalk-6771).

## 1. Regelverstöße

Zählung: main | start-6771 (start-6771 = main + eigene Änderungen; Kursdateien sind identisch).

| Regel | main | start-6771 | Kurz |
|---|---|---|---|
| Du-Form | 0 | 0 | „Sie“ nur im gesetzlichen Widerrufsmuster (`widerruf/index.astro:45–117`, begründet, nur gemeldet). Alle anderen „Sie“ = 3. Person. |
| Nicht gendern / nur (m/w/d) | ≈ 252 (248 in Kursdateien, 4 auf Seiten) | ≈ 253 | Schrägstrich-Formen, Paarformen, Partizipformen. `(m/w/d)` kommt in main **nie** vor; start-6771 nutzt es korrekt in `lib/berufe.ts`. |
| Keine Dozentennamen/-fotos | 0 | 0 | sauber |
| GF nur als Geschäftsführung | 0 | 4 | Vornamen ohne Rolle in Video-Texten |
| Keine Erfolgsgarantie/Superlative/Quoten | 1 | 1 | Abweichung vom einzigen erlaubten Vertrauenssatz |
| Nur live (keine Aufzeichnung/On-Demand) | 0 | 0 | sauber; Startseiten-Videos sind Infovideos (siehe Hinweis) |
| Keine Fake-Belege/künstliche Dringlichkeit | 0 | 0 | sauber („Einführungspreis“ in 24 Kursen beobachten) |
| Förderung | 0 | 0 | wird nirgends erwähnt (ok) |
| Marke (Farben/Schriften) | 0 | 0 | Petrol/Navy/Bernstein/Off-White + Fraunces/Inter; sonst nur Tönungen |
| Zeiten 17–20 Uhr | 69 Kurse + 3 Stellen | 69 Kurse + Widerspruch Startseite | main durchgehend 18:00–20:30/21:15 + Samstage; `kalk-6771` hat 0 Altzeiten |
| „unverbindlich anfragen“ ≠ „zahlungspflichtig anmelden“ | 1 | 3 | Vermischung der Begriffe |

### Einzelbefunde

| Datei:Zeile | Zitat | Vorschlag | Status |
|---|---|---|---|
| `src/components/WarumBuehne.astro:34` | „Bei uns unterrichten erfahrene IHK-Prüfer und Dozenten mit langjähriger Praxis.“ | „Bei uns unterrichten Dozenten mit IHK-Prüfer-Erfahrung.“ (nur der freigegebene Satz) | besetzt (Startseite/Prüfungsvorbereitung) |
| `src/components/WarumBuehne.astro:30` | „zweimal pro Woche ab 18:00 Uhr“ | wie kalk-6771: „von 17:00 bis 20:00 Uhr“ | besetzt |
| `src/components/WarumBuehne.astro:91` | SVG-Text „18:00“ | „17:00“ (kalk-6771 hat es schon) | besetzt |
| `src/content/kurse/*.md` Feld `zeiten` (69 Dateien), Fließtext „Samstagvormittag“ (62 Stellen) | „Di + Do, 18:00–21:15 Uhr, dazu jeden zweiten Samstag 09:00–14:15 Uhr“ | kalk-6771 übernehmen (alle 17:00–20:00, keine Samstage) | besetzt (kalk-6771) |
| `src/lib/site.ts:41–43` + `src/pages/index.astro` (Hero, FAQ, Fakten) – start-6771 | „Abends 17–20 Uhr · live online“ | stimmt erst nach Merge von kalk-6771; vorher widerspricht die Terminkarte (`d.zeiten` = 18:00–21:15 + Sa) auf derselben Reise | besetzt – **Merge-Reihenfolge: kalk-6771 vor/mit start-6771** |
| `src/lib/site.ts:55,60,65` – start-6771 | „Can und Jamil erklären …“ | „Unsere Geschäftsführung erklärt …“ bzw. „Can und Jamil, Geschäftsführung der waybuild Akademie, erklären …“ | besetzt |
| `src/components/start/VideoPlatz.astro:68` – start-6771 | „Video folgt – mit Can und Jamil“ | „Video folgt – mit unserer Geschäftsführung“ | besetzt |
| `src/pages/pruefungsvorbereitung/[beruf].astro:112` – start-6771 | Knopf „Unverbindlich anmelden“ | „Unverbindlich anfragen“ | besetzt |
| `src/pages/pruefungsvorbereitung/[beruf].astro:128` – start-6771 | H2 „Unverbindlich anmelden“ | „Unverbindlich anfragen“ (Zeile 132 sagt selbst: verbindlich erst mit Anmeldung) | besetzt |
| `src/pages/interesse/index.astro:24` | „meldest du dich mit einem Klick an“ | „meldest du dich über das Anmeldeformular an“ (ist ein Formular, kein Klick) | besetzt (recht-6771) |
| `src/pages/anmeldung/index.astro:17` | „trag die Teilnehmenden ein“ | „trag die Teilnehmer ein“ | besetzt (recht-6771) |
| `src/pages/coaching/index.astro:182` | „erstellen ausschließlich die Prüfungsteilnehmenden selbst“ | „erstellst du ausschließlich selbst“ | **frei** |
| `src/components/formulare/anmeldung-client.ts:92` | „Teilnehmer/in“ / „Teilnehmende (n)“ | „Teilnehmer“ / „Teilnehmer (n)“ | besetzt |
| `src/pages/llms.txt.ts:34`, start-6771 `llms.txt.ts:36`, `llms-full.txt.ts:51` | „an Teilnehmende oder ihren Betrieb“ | „an dich oder deinen Betrieb“ | besetzt |
| `src/content/kurse/*.md` (38 Dateien, 176×) | „Geprüfte/r Technische/r Betriebswirt/in“, „Fachwirt/in“, „Fachinformatiker/innen“ | Titel ohne Schrägstrich + „(m/w/d)“ einmal je Titel, z. B. „Geprüfter Technischer Betriebswirt (m/w/d)“ | besetzt (kalk-6771) |
| `src/content/kurse/*.md` (59× Paarform) | „Umschülerinnen und Umschüler“, „Kundinnen und Kunden“, `ap1-it-berufe.md:78` „Die Dozentin oder der Dozent“ | „Umschüler“, „Kunden“, „Der Dozent“ | besetzt |
| `src/content/kurse/*.md` (≈ 12×) | „Mitarbeitende“, `ntg-vorkurs-meister.md:19` „Teilnehmende“ | „Mitarbeiter“, „Teilnehmer“ | besetzt |
| Rechtstexte (nur gemeldet): `teilnahmebedingungen:17,18,57,291,318`, `datenschutz:147,212,224`, `widerruf:103` | „Teilnehmende“, „Mitarbeitende“, „Dozentinnen und Dozenten“ | bei nächster Rechtstext-Runde mitprüfen | besetzt (recht-6771) |

Hinweise ohne Verstoß:
- „Auszubildende“ ist die gesetzliche Berufsbezeichnung (BBiG), kein Genderersatz – bleibt.
- Startseiten-Videos (start-6771): klar als Infovideo kennzeichnen („Kurz erklärt“), damit niemand Kursinhalte als Video erwartet.
- `faq.ts` „verpasst“ sagt „soweit dort Platz ist“, `ap1-it-berufe.md:72` verspricht Nachholen ohne Vorbehalt → angleichen (besetzt).

## 2. Copy- und Vertrauensbefunde (Top 8)

1. **Kursseite: kein unverbindlicher Weg für Kurse mit Termin** – `src/pages/kurse/[slug].astro:55–59, 176, 418, 431`. Hauptknopf „Termin wählen“ → Terminkarte „Anmelden“ → Formular „Zahlungspflichtig anmelden“. „Unverbindlich“ gibt es nur, wenn kein Termin feststeht. Für das Ziel (mehr Anfragen) fehlt der Einstieg mit niedriger Hürde. **frei**
2. **Kursseite oben: Feature statt Ergebnis** – `[slug].astro:134–135, 181`. H1 = Kursname, Untertitel = „Ein Kurs für alle sieben IT-Berufe“; der Nutzen steht unter der Preiskarte und ist mobil erst nach dem Knopf sichtbar. Es fehlt ein Satz „Was hast du danach?“. **frei**
3. **Einwände von Azubis kaum beantwortet** – `[slug].astro:68–70`: gemeinsame FAQ nur Storno/Absage/Betrieb/Technik/Prüfungsanmeldung. Es fehlen „Schaffe ich das nach der Arbeit?“, „Was, wenn ich krank bin / einen Abend verpasse?“ (nur 4 von 70 Kursen haben es selbst), „Fragt mein Betrieb mit?“ oben auf der Seite. Die passenden Antworten gibt es schon in `faq.ts` (`verpasst`, `kursabend`, `fachwissen`). **frei** (`[slug].astro` wählt nur IDs; `faq.ts` bleibt unberührt)
4. **„Betrieb zahlt“ zu weit unten** – im Kopf nur „Endpreis, alles inklusive“; „Rechnung an dich oder deinen Betrieb“ steht erst in „Im Preis enthalten“. Für Azubis ist „Wer zahlt?“ der wichtigste Einwand. **frei**
5. **Zeiten widersprechen sich** – Kerndaten und Terminkarte zeigen `d.zeiten` (main: 18:00–21:15 + Samstage), Startseite/WarumBuehne sagen 17–20 bzw. ab 18 Uhr. Wer das sieht, verliert Vertrauen. Lösung = Merge kalk-6771; `[slug].astro` selbst ist nicht betroffen. besetzt
6. **Begriffe wild gemischt** – „Termin wählen“, „Anmelden“, „Interesse vormerken“, „Kurs anfragen“, „Anfragen“, „Unverbindlich anmelden“ (start-6771). Vorschlag: genau zwei Verben – „Unverbindlich anfragen“ (primär) und „Zahlungspflichtig anmelden“ (nur im Formular), „Termin ansehen“ nur zur Navigation. Betrifft `KursKarte.astro:26–27` (**frei**), `Kopf.astro:127` (besetzt), `pruefungsvorbereitung/index.astro:55,204` (besetzt), `[beruf].astro` (besetzt).
7. **Vertrauenssatz nur halb genutzt** – `[slug].astro:137–143`: „Dozenten mit IHK-Prüfer-Erfahrung“ steht ohne Erklärung, was das bringt. Ein Halbsatz wie „… sie kennen die Prüfung von der anderen Seite“ (wie in `faq.ts:15`) macht ihn verständlich, ohne neue Behauptung. Richtig: kein Satz bei Weiterbildung/Entwurf. **frei**
8. **„Einführungspreis“ ohne Bezug** – 24 Kursdateien (`preis.hinweis`). Ohne Angabe, was danach gilt, wirkt es wie Druck. Entweder streichen oder „Preis für alle Kurstermine 2027“. besetzt (kalk-6771, Preise ändern sich dort ohnehin).

Weitere kleinere Punkte:
- `[slug].astro:287`: „Jeder Kurs endet kurz vor dem bundesweiten schriftlichen Prüfungstag“ – guter Satz, gehört nach oben (Nutzen „pünktlich fertig“). **frei**
- `[slug].astro:178`: „Merk dir den Kurs unverbindlich vor.“ – gut; dasselbe Muster für Kurse mit Termin. **frei**
- `[slug].astro:341`: „Ab 3 Personen … 10 % Rabatt“ – für Betriebe stark, steht aber klein im Navy-Block; Hinweis „Für Ausbildungsbetriebe“ ergänzen. **frei**
- Mobile Leiste `[slug].astro:424–433`: Preis + „Termin wählen“; besser „Unverbindlich anfragen“ + Zeile „kostenlos · Antwort per E-Mail“. **frei**

## 3. Fünf Textvorschläge für `src/pages/kurse/[slug].astro` (Ideen zum Umsetzen)

Voraussetzung: Die Anfrage-Ziel-URL kommt nach dem Merge aus start-6771 (`ANFRAGE_PFAD` = `/#anfrage`, Vorauswahl über `?bereich=pruefung&kurs=<id>`). Bis dahin `/kontakt/?kurs=<id>` oder `interesseUrl(kurs)` nutzen.

**V1 – Zwei Knöpfe im Kopf (Zeile 55–59, 176)**
```astro
// primär: unverbindlich, sekundär: Termine
const anfrage = { text: 'Unverbindlich anfragen', url: href(`/?bereich=${pruefungskurs ? 'pruefung' : d.saeule}&kurs=${kurs.id}#anfrage`), daten: 'anfrage' };
...
<a href={anfrage.url} class="btn btn-accent mt-5 w-full rounded-full" data-hauptaktion="anfrage">{anfrage.text}</a>
<p class="mt-2 text-center text-sm text-white/80">Kostenlos, noch keine Buchung. Antwort per E-Mail.</p>
{termine.length > 0 && <a href="#termine" class="btn btn-ghost mt-2 w-full rounded-full text-white">Termine ansehen</a>}
```

**V2 – Ergebnis-Satz unter der H1, nur Prüfungskurse (nach Zeile 135)**
```astro
{pruefungskurs && naechster?.pruefung && (
  <p class="mt-3 text-lg">Du gehst mit geübten Aufgaben und einem klaren Lösungsweg in deine Prüfung am {formatDatum(naechster.pruefung)}. Der Kurs endet kurz davor.</p>
)}
```
(Kein Versprechen, dass du bestehst – nur was du im Kurs tust und wann er endet.)

**V3 – Drei Einwand-Zeilen direkt unter der Preiskarte (nach Zeile 177)**
```astro
<ul class="mt-4 grid gap-1.5 text-sm text-white/85" data-einwaende>
  <li>Abends nach der Arbeit, live online – ohne Anfahrt</li>
  <li>Rechnung an dich oder an deinen Ausbildungsbetrieb</li>
  <li>Abend verpasst? Du holst ihn in einem späteren Live-Termin nach</li>
</ul>
```
(Zeile 3 nur, wenn der Wortlaut von `faq.ts` „verpasst“ gilt – „soweit dort Platz ist“ in der FAQ beibehalten.)

**V4 – FAQ um Azubi-Fragen erweitern (Zeile 68–70, nur IDs wählen)**
```ts
: ['kursabend', 'verpasst', 'betrieb', 'fachwissen', 'storno', 'absage', 'technik', ...(d.saeule === 'ihk-pruefung' ? (['pruefung-anmeldung'] as FaqId[]) : [])];
```
Reihenfolge nach Azubi-Sorge: Ablauf des Abends → verpasst/krank → wer zahlt → schaffe ich das → Storno.

**V5 – Mobile Leiste + Microcopy (Zeile 424–433)**
```astro
<p class="min-w-0 leading-tight">
  <span class="font-serif text-xl font-semibold tabular-nums">{formatEuro(d.preis.betrag)}</span>
  <span class="block truncate text-xs text-gedaempft">kostenlos anfragen · keine Buchung</span>
</p>
<a href={anfrage.url} class="btn btn-accent shrink-0 rounded-full px-5">Unverbindlich anfragen</a>
```
Dazu im Vertrauenssatz (Zeile 140): `{BEWEIS_DOZENTEN}` + kleiner Nachsatz „– sie kennen die Prüfung von der anderen Seite“ (Wortlaut aus `faq.ts:15`, keine neue Behauptung).

Danach in Tests prüfen: genau ein primärer Knopf je Ansicht, Text „Zahlungspflichtig anmelden“ nur im Anmeldeformular, kein „anmelden“ auf unverbindlichen Knöpfen.
