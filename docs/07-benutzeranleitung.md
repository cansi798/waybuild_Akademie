# Benutzeranleitung waybuild Akademie

Phase 3 „Finalisierung“ · Stand: 13.11.2026 · Status: **Entwurf**

Diese Anleitung hat zwei Teile.

- **Teil A** ist für das Team der Akademie (Geschäftsführung, Redaktion, Backoffice). Man braucht dafür keine Programmierkenntnisse.
- **Teil B** ist für Teilnehmende. Er erklärt kurz, wie man einen Kurs findet und sich anmeldet.

Technische Einzelheiten stehen in der [Architektur](04-architektur.md) und in [`public/api/LIESMICH.md`](../public/api/LIESMICH.md).

---

## Inhalt

- [Teil A – Für das Team](#teil-a--für-das-team)
  - [A1 Grundlagen: Wo stehen die Inhalte?](#a1-grundlagen-wo-stehen-die-inhalte)
  - [A2 Kurs freigeben](#a2-kurs-freigeben)
  - [A3 Preis ändern](#a3-preis-ändern)
  - [A4 Termin ändern oder neu anlegen](#a4-termin-ändern-oder-neu-anlegen)
  - [A5 Termin absagen oder Ausfalltag eintragen](#a5-termin-absagen-oder-ausfalltag-eintragen)
  - [A6 Neuen Kurs anlegen](#a6-neuen-kurs-anlegen)
  - [A7 Vorschau ansehen](#a7-vorschau-ansehen)
  - [A8 Live-Upload auf ALL-INKL](#a8-live-upload-auf-all-inkl)
  - [A9 Ersteinrichtung: Formulare, Postfächer, Weiterleitung](#a9-ersteinrichtung-formulare-postfächer-weiterleitung)
  - [A10 Rechtstexte nach der Anwaltsprüfung freischalten](#a10-rechtstexte-nach-der-anwaltsprüfung-freischalten)
  - [A11 Eine Anmeldung kommt an – was tun?](#a11-eine-anmeldung-kommt-an--was-tun)
  - [A12 Wenn etwas nicht klappt](#a12-wenn-etwas-nicht-klappt)
- [Teil B – Für Teilnehmende](#teil-b--für-teilnehmende)

---

## Teil A – Für das Team

### A1 Grundlagen: Wo stehen die Inhalte?

Jeder Kurs ist **eine Textdatei**.

Alle Kursdateien liegen im GitHub-Repository `cansi798/waybuild_Akademie` im Ordner `src/content/kurse/`.

Der Dateiname ist gleichzeitig die Adresse der Kursseite.

> Beispiel: `ap1-it-berufe.md` → `https://waybuild-akademie.de/kurse/ap1-it-berufe/`

**Eine Datei im Browser ändern:**

1. Auf github.com anmelden und das Repository `cansi798/waybuild_Akademie` öffnen.
2. In den Ordner `src/content/kurse/` gehen und die Kursdatei anklicken.
3. Oben rechts auf das **Stift-Symbol** („Edit this file“) klicken.
4. Die Änderung machen.
5. Oben rechts auf **„Commit changes …“** klicken.
6. In das Feld „Commit message“ kurz schreiben, was geändert wurde, z. B. „AP1: Preis auf 369 € geändert“.
7. „Commit directly to the main branch“ auswählen und mit **„Commit changes“** bestätigen.

Danach baut GitHub die Vorschau automatisch neu (siehe [A7](#a7-vorschau-ansehen)).

Jede Änderung wird mit Datum und Namen gespeichert. So ist zum Beispiel jede Freigabe später nachvollziehbar (US-23).

**Regeln für die Kursdatei:**

- Der obere Teil zwischen den beiden Zeilen `---` ist der **Datenkopf**. Hier stehen Felder wie `titel:`, `preis:` und `termine:`.
- Unter der zweiten Zeile `---` steht die ausführliche Kursbeschreibung als normaler Text.
- **Einrückungen sind wichtig.** Eingerückt wird nur mit Leerzeichen (zwei pro Stufe), nicht mit der Tab-Taste.
- Ein Datum hat immer die Form **Jahr-Monat-Tag**, z. B. `2027-01-19`.
- Beträge stehen ohne €-Zeichen. Cent werden mit Punkt geschrieben: `349` oder `59.90`.
- Texte mit Doppelpunkt oder Anführungszeichen setzt man in Anführungszeichen: `zeiten: "Di + Do, 18:00–20:45 Uhr"`.

Wenn ein Feld fehlt oder falsch ist, **stoppt der Bau** mit einer Fehlermeldung. Die Website bleibt dann auf dem alten Stand. Es kann also nichts Halbfertiges online gehen (NFA-17). Mehr dazu in [A12](#a12-wenn-etwas-nicht-klappt).

---

### A2 Kurs freigeben

Neue Kurse stehen immer auf `status: entwurf`.

Ein Entwurf erscheint **nur in der Vorschau**, mit gelbem Band „Entwurf – noch nicht freigegeben“. Er ist dort nicht buchbar. Die Live-Website enthält ihn nicht.

**Vor der Freigabe prüfen:**

1. Stimmen die Inhalte fachlich (bei IHK-Kursen: passend zum Rahmenplan)?
2. Stimmen Umfang (`ue`), Dauer, Zeiten und Termine?
3. Stimmt der Preis? In der Vorschau steht bei Entwürfen „Preisvorschlag“.
4. Stimmen die Wörter? Diese Begriffe dürfen **nicht** vorkommen:
   - „Aufzeichnung“, „jederzeit abrufbar“, „Selbstlernkurs“, „Fernkurs“ (alle Kurse sind live, GR-21)
   - „Förderung“, „Aufstiegs-BAföG“, „Bildungsgutschein“ (erst nach Freigabe, GR-17)
   - „umsatzsteuerfrei“, „zzgl. MwSt.“ (Preise sind Endpreise, GR-12)
   - „IHK-Kurs“, „IHK-zertifiziert“, „offizieller Partner“ (NFA-20)
   - „Prüfungsgebühr“ für unsere eigene Leistung (richtig: „Teilnahmegebühr“, GR-16)
   - Namen oder Fotos von Lehrenden (GR-15)

**Freigeben:**

1. Kursdatei öffnen und bearbeiten (siehe [A1](#a1-grundlagen-wo-stehen-die-inhalte)).
2. Die Zeile

   ```yaml
   status: entwurf
   ```

   ändern in

   ```yaml
   status: freigegeben
   ```

3. Als Commit-Beschreibung z. B. „Freigabe Wirtschaftsfachwirt (Can)“ schreiben und speichern.
4. In der Vorschau prüfen, dass das gelbe Band weg ist.
5. Damit der Kurs auch **live** erscheint: den Live-Upload machen ([A8](#a8-live-upload-auf-all-inkl)).

---

### A3 Preis ändern

Der Preis steht im Datenkopf unter `preis:`.

```yaml
preis:
  betrag: 349
  hinweis: "Endpreis, alles inklusive: Live-Unterricht und Unterlagen. Die Prüfungsgebühr deiner IHK ist nicht enthalten."
  raten: false
```

| Feld | Bedeutung | Beispiel |
|---|---|---|
| `betrag` | Teilnahmegebühr je Person in Euro, Endpreis | `349` |
| `hinweis` | Kurzer Text unter dem Preis | siehe oben |
| `raten` | Ratenzahlung möglich (`true`) oder nicht (`false`) | `false` |

Beim Coaching stehen die Preise je Paket unter `pakete:` (Feld `betrag` je Paket).

**Was passiert danach?**

Der neue Preis erscheint automatisch überall: auf der Kurskarte, auf der Kursseite, in der Terminübersicht und im Anmeldeformular. Der Gruppenrabatt (10 % ab 3 Personen) wird automatisch berechnet.

**Wichtig:** Das Formular auf der Live-Website rechnet mit der Terminliste, die beim letzten Live-Upload hochgeladen wurde. Nach jeder Preisänderung muss deshalb **der Live-Upload neu gemacht werden** ([A8](#a8-live-upload-auf-all-inkl)). Sonst stehen in den Anmelde-E-Mails noch alte Preise.

---

### A4 Termin ändern oder neu anlegen

Die Termine stehen im Datenkopf unter `termine:`. Jeder Termin beginnt mit einem Strich `-`.

```yaml
termine:
  - id: ap1-2027-fruehjahr
    start: 2027-01-19
    ende: 2027-02-18
    pruefung: 2027-02-24
    pruefungHinweis: Verbindlich ist die Einladung deiner IHK.
    anmeldeschluss: 2027-01-12
```

| Feld | Pflicht | Bedeutung |
|---|---|---|
| `id` | ja | Eindeutiger Kurzname des Termins: klein, ohne Umlaute, mit Bindestrichen, z. B. `ap1-2027-herbst`. Nach dem Livegang nicht mehr ändern – die ID steht in den Anmelde-E-Mails. |
| `start` | ja | Erster Kurstag |
| `ende` | ja | Letzter Kurstag |
| `anmeldeschluss` | ja | **Immer 7 Tage vor dem Start** (GR-01). Beispiel: Start 19.01.2027 → Anmeldeschluss 12.01.2027 |
| `pruefung` | nein | Schriftlicher IHK-Prüfungstag (nur bei Prüfungsvorbereitungen) |
| `pruefungHinweis` | nein | Immer: „Verbindlich ist die Einladung deiner IHK.“ |
| `ausfall` | nein | Kurstage, die entfallen (siehe [A5](#a5-termin-absagen-oder-ausfalltag-eintragen)) |

**Neuen Termin anlegen:**

1. Einen bestehenden Termin-Block kopieren (alle Zeilen vom Strich `-` bis vor den nächsten Strich).
2. Direkt darunter einfügen. Die Einrückung muss genau gleich bleiben.
3. `id`, `start`, `ende`, `anmeldeschluss` und ggf. `pruefung` anpassen.
4. Speichern (Commit).

Hat ein Kurs vorher keinen Termin, steht die Zeile `termine: []` in der Datei. Dann `[]` löschen und den Block wie oben darunter schreiben.

**Was passiert automatisch?**

- Termine erscheinen sortiert auf der Kursseite, in der Terminübersicht und auf der Startseite.
- Nach dem Anmeldeschluss ist ein Termin nicht mehr buchbar. Die Website wird dafür jeden Tag neu gebaut (US-25).
- Hat ein Kurs keinen buchbaren Termin mehr, zeigt er automatisch „Interesse vormerken“.

Auch nach einer Terminänderung den **Live-Upload** machen ([A8](#a8-live-upload-auf-all-inkl)).

---

### A5 Termin absagen oder Ausfalltag eintragen

**Ganzen Termin absagen** (Prozess P-03, spätestens 10 Tage vor Start):

1. Das Backoffice informiert alle Angemeldeten per E-Mail. Angebot: Wechsel auf einen anderen Termin oder volle Erstattung.
2. In der Kursdatei den Termin-Block löschen oder durch den Ersatztermin ersetzen.
3. Speichern und den Live-Upload machen.

Danach ist der Termin nicht mehr buchbar. Gibt es keinen Termin mehr, zeigt der Kurs „Interesse vormerken“.

**Einzelnen Kurstag ausfallen lassen** (z. B. Feiertag):

Im Termin das Feld `ausfall:` ergänzen:

```yaml
  - id: ap2-2027-sommer
    start: 2027-03-02
    ende: 2027-04-22
    pruefung: 2027-04-27
    pruefungHinweis: Verbindlich ist die Einladung deiner IHK.
    anmeldeschluss: 2027-02-23
    ausfall:
      - 2027-03-25
```

Der Ausfalltag erscheint auf der Terminkarte. Den Nachholtermin teilt das Backoffice den Teilnehmenden per E-Mail mit.

---

### A6 Neuen Kurs anlegen

Ein neuer Kurs entsteht durch eine **neue Datei**. Am Code muss nichts geändert werden (US-21).

1. Eine ähnliche Kursdatei öffnen, die als Vorlage dient:
   - Prüfungsvorbereitung: `ap1-it-berufe.md`
   - IHK-Weiterbildung: `wirtschaftsfachwirt-ihk.md`
   - eigene Weiterbildung: `ki-manager.md`
2. Rechts oben auf „Raw“ klicken, den ganzen Text markieren und kopieren.
3. Zurück in den Ordner `src/content/kurse/`. Oben „Add file“ → **„Create new file“** wählen.
4. Den Dateinamen eingeben: klein, ohne Umlaute, mit Bindestrichen, Endung `.md`.
   Beispiel: `fachwirt-logistik-ihk.md`. Daraus wird die Adresse `/kurse/fachwirt-logistik-ihk/`.
5. Den kopierten Text einfügen und alle Felder anpassen (Tabelle unten).
6. **`status: entwurf` stehen lassen.**
7. Speichern (Commit), dann in der Vorschau ansehen.
8. Freigabe später wie in [A2](#a2-kurs-freigeben).

**Felder im Datenkopf:**

| Feld | Pflicht | Inhalt |
|---|---|---|
| `saeule` | ja | genau einer von: `ihk-pruefung` (IHK-Prüfungsvorbereitung), `ihk-weiterbildung` (IHK-Weiterbildung), `akademie` (eigene Weiterbildung) |
| `kategorie` | ja | z. B. „IT-Berufe“, „Fachwirte“, „KI“ – dient dem Filter im Katalog; vorhandene Schreibweisen übernehmen |
| `titel` | ja | Prüfungsvorbereitungen beginnen mit „Vorbereitung auf die IHK-…“ |
| `untertitel` | ja | ein kurzer Satz |
| `kurzbeschreibung` | ja | höchstens 220 Zeichen, erscheint auf der Kurskarte |
| `status` | ja | `entwurf` oder `freigegeben` |
| `art` | ja | `kurs` oder `coaching` |
| `ue` | nein | Unterrichtseinheiten à 45 Minuten, ganze Zahl |
| `dauer` | ja | z. B. „ca. 8 Wochen“ |
| `zeiten` | ja | z. B. „Di + Do, 18:00–21:15 Uhr“ |
| `preis` | ja | siehe [A3](#a3-preis-ändern) |
| `pakete` | nein | nur beim Coaching |
| `zielgruppe` | ja | Liste, je Zeile ein Punkt mit `-` |
| `voraussetzungen` | ja | Liste; Technik (Computer, Internet, Headset) immer nennen |
| `inhalte` | ja | Module mit `titel` und `punkte` |
| `abschluss` | ja | eigene Kurse: „Teilnahmezertifikat der waybuild Akademie“; IHK-Kurse: „Teilnahmebescheinigung …; die Prüfung legst du bei deiner zuständigen IHK ab.“ |
| `termine` | nein | siehe [A4](#a4-termin-ändern-oder-neu-anlegen); ohne Termin `termine: []` |
| `faq` | nein | Fragen mit `frage` und `antwort` |
| `reihenfolge` | nein | Zahl für die Sortierung im Katalog (kleiner = weiter oben) |

**Leere Vorlage** (zum Kopieren, falls keine passende Datei da ist):

```yaml
---
saeule: akademie
kategorie: KI
titel: Titel des Kurses
untertitel: Ein kurzer Satz, worum es geht
kurzbeschreibung: Höchstens 220 Zeichen – was du lernst und wie der Kurs läuft, live-online.
status: entwurf
art: kurs
ue: 32
dauer: ca. 4 Wochen
zeiten: "Di + Do, 18:00–21:15 Uhr"
preis:
  betrag: 590
  hinweis: "Endpreis, alles inklusive: Live-Unterricht und Unterlagen."
  raten: false
zielgruppe:
  - Erste Zielgruppe
  - Zweite Zielgruppe
voraussetzungen:
  - Keine Vorkenntnisse nötig
  - Computer mit stabiler Internetverbindung und aktuellem Browser
  - Headset oder Kopfhörer mit Mikrofon, Kamera optional
inhalte:
  - titel: Erstes Modul
    punkte:
      - Erster Punkt
      - Zweiter Punkt
abschluss: Teilnahmezertifikat der waybuild Akademie
termine: []
faq:
  - frage: Brauche ich Vorkenntnisse?
    antwort: Nein. Wir starten bei den Grundlagen.
reihenfolge: 100
---

Ausführliche Beschreibung des Kurses in ganzen Sätzen. Du-Ansprache, kurze Sätze, nur Live-Unterricht.
```

---

### A7 Vorschau ansehen

Die Vorschau zeigt **alle Kurse, auch die Entwürfe**:

**https://cansi798.github.io/waybuild_Akademie/**

- Oben steht ein Band „Vorschau“. Suchmaschinen sind gesperrt (`noindex`).
- Die Formulare laufen im **Demo-Modus**: Sie prüfen die Eingaben, senden aber **nichts**. Am Ende erscheint die Danke-Seite mit dem Hinweis „Demo-Modus“.

**Was passiert nach einer Änderung (Push auf `main`)?**

1. GitHub startet automatisch den Ablauf „Vorschau (GitHub Pages) + Live-Paket (ALL-INKL)“.
2. Er prüft alle Kursdateien und baut die Website.
3. Nach etwa 2–5 Minuten ist die Vorschau aktuell. Falls nicht: im Browser neu laden (Strg + F5).
4. Gleichzeitig entsteht das **Live-Paket** „akademie-allinkl-upload“ (siehe [A8](#a8-live-upload-auf-all-inkl)).
5. Zusätzlich laufen die automatischen Tests.

Den Stand sieht man im Repository unter dem Reiter **„Actions“**:

- grüner Haken = alles in Ordnung,
- rotes Kreuz = Fehler (siehe [A12](#a12-wenn-etwas-nicht-klappt)).

Außerdem läuft der Ablauf **jeden Morgen** automatisch (04:17 Uhr UTC, also 05:17 Uhr im Winter). So verschwinden abgelaufene Termine aus der Vorschau.

---

### A8 Live-Upload auf ALL-INKL

Die Live-Website `https://waybuild-akademie.de` wird **von Hand** hochgeladen (TD-10).

**Wann hochladen?**

- nach jeder Freigabe, Preis- oder Terminänderung,
- nach Änderungen an Texten oder Rechtsseiten,
- und zusätzlich **einmal pro Woche**, damit abgelaufene Termine auch live verschwinden. Das Formular lehnt abgelaufene Termine aber auf jeden Fall ab.

**Schritt 1: Paket herunterladen**

1. Im Repository auf den Reiter **„Actions“** klicken.
2. Den obersten Lauf mit **grünem Haken** öffnen (Name „Vorschau (GitHub Pages) + Live-Paket (ALL-INKL)“).
3. Unten im Bereich **„Artifacts“** auf **„akademie-allinkl-upload“** klicken. Es lädt eine ZIP-Datei herunter.
4. Die ZIP-Datei auf dem eigenen Rechner entpacken.

Das Paket wird 30 Tage aufbewahrt. Ältere Pakete sind weg – dann einfach den neuesten Lauf nehmen.

Das Live-Paket enthält **nur freigegebene Kurse** und kein Vorschau-Band.

**Schritt 2: Hochladen**

1. Mit einem FTP-Programm (z. B. FileZilla) oder dem Dateimanager im KAS von ALL-INKL anmelden. Die Zugangsdaten stehen im KAS bzw. bei der Hosting-Verwaltung – sie gehören nie ins Repository.
2. In den Ordner der Domain `waybuild-akademie.de` wechseln (das ist der „Webroot“, z. B. `/waybuild-akademie.de/`).
3. **Den gesamten Inhalt** des entpackten Ordners dort hineinladen und vorhandene Dateien überschreiben.
4. Darauf achten, dass auch versteckte Dateien mitkommen, besonders `api/.htaccess`. In FileZilla: Menü „Server“ → „Anzeige versteckter Dateien erzwingen“.
5. Den Ordner `akademie-daten` **neben** dem Webroot nicht löschen. Er enthält das Formular-Geheimnis und die Zähler.

**Schritt 3: Kurz prüfen**

1. `https://waybuild-akademie.de` öffnen. Es darf **kein** Vorschau-Band oben stehen.
2. Im Katalog dürfen nur freigegebene Kurse stehen.
3. Nach größeren Änderungen eine Testanmeldung mit einer eigenen E-Mail-Adresse schicken ([A9](#a9-ersteinrichtung-formulare-postfächer-weiterleitung), Schritt 4).

---

### A9 Ersteinrichtung: Formulare, Postfächer, Weiterleitung

Diese Schritte sind **einmalig vor dem Livegang** nötig (Arbeitspaket AP-10). Die Menübezeichnungen im KAS können leicht abweichen.

**1. Domain und Verschlüsselung**

1. Im KAS die Domain `waybuild-akademie.de` anlegen bzw. auf den Webspace zeigen lassen.
2. Ein SSL-Zertifikat aktivieren (z. B. Let's Encrypt) und die Umleitung von `http://` auf `https://` einschalten (NFA-11).

**2. PHP einstellen**

1. Im KAS bei der Domain die **PHP-Version 8.1 oder neuer** wählen.
2. Mehr ist nicht nötig. `mail()` ist bei ALL-INKL eingeschaltet.

**3. Postfächer anlegen**

1. Im KAS unter „E-Mail“ zwei Postfächer anlegen:
   - `anmeldung@waybuild-akademie.de` – für Anmeldungen, Coaching-Anfragen und Widerrufe
   - `info@waybuild-akademie.de` – für Kontaktanfragen und „Interesse vormerken“
2. Für die Domain die Absender-Prüfung einrichten: **SPF, DKIM und DMARC** (Risiko R-08). Sonst landen die Eingangsbestätigungen bei Teilnehmenden leicht im Spam.

**4. Formulare in Betrieb nehmen**

1. Live-Paket hochladen ([A8](#a8-live-upload-auf-all-inkl)).
2. Einmal die Seite `https://waybuild-akademie.de/kontakt/` öffnen. Dabei legt das System automatisch den Ordner `akademie-daten` **neben** dem Webroot an und erzeugt darin das Formular-Geheimnis. Das Geheimnis wird nie ins Repository geschrieben.
3. Prüfen, dass das Geheimnis **nicht** abrufbar ist: Die Adresse `https://<Konto-Domain>/akademie-daten/formular-geheimnis.txt` muss die Meldung **403 (verboten)** zeigen. Die Konto-Domain steht im KAS (Form `w0123456.kasserver.com`).
4. Falls die Formulare „Gerade technisch nicht erreichbar“ melden: Das Geheimnis konnte nicht erzeugt werden. Dann per FTP den Ordner `akademie-daten` neben dem Webroot von Hand anlegen (beschreibbar für PHP) und die Seite neu laden. Einzelheiten: [`public/api/LIESMICH.md`](../public/api/LIESMICH.md).
5. **Testanmeldung:** Mit der eigenen E-Mail-Adresse eine Anmeldung abschicken. Dabei **frühestens nach 3 Sekunden** absenden (Spam-Schutz). Erwartung:
   - eine Mail mit allen Angaben an `anmeldung@`,
   - eine kurze Eingangsbestätigung an die eigene Adresse.
6. Die Testanmeldung danach im Postfach als „Test“ markieren. Diesen Test **einmal im Monat** wiederholen (NFA-25).

**5. Weiterleitung top-abschluss.de**

1. Im KAS die Domain `top-abschluss.de` bearbeiten.
2. Als Ziel eine **dauerhafte Weiterleitung (301)** auf
   `https://waybuild-akademie.de/pruefungsvorbereitung/` einstellen.
3. Das Gleiche für `www.top-abschluss.de`.
4. Auch für `top-abschluss.de` ein SSL-Zertifikat aktivieren, damit `https://top-abschluss.de` ohne Warnung weiterleitet.
5. Im Browser `top-abschluss.de` und `https://www.top-abschluss.de/irgendwas` aufrufen. Beide müssen auf der Seite „Prüfungsvorbereitung“ landen.

---

### A10 Rechtstexte nach der Anwaltsprüfung freischalten

Impressum, Datenschutz, Teilnahmebedingungen und Widerrufsbelehrung sind **Entwürfe**. Auf allen vier Seiten steht deshalb ein rotes Band – auch auf der Live-Website. Offene Angaben sind gelb markiert, z. B. `[Telefon folgt]`.

**Nach der Prüfung durch die Rechtsberatung:**

1. Die Änderungen der Rechtsberatung in die vier Seiten übernehmen (Ordner `src/pages/impressum/`, `datenschutz/`, `teilnahmebedingungen/`, `widerruf/`).
2. Die fehlenden Firmendaten eintragen: in der Datei `src/components/recht/status.ts` bei `FIRMA` die Felder `telefon`, `registergericht`, `registernummer` und `ustId`.
3. In derselben Datei
   - `RECHT_GEPRUEFT = false` auf `RECHT_GEPRUEFT = true` setzen,
   - `RECHT_STAND` auf das Datum der geprüften Fassung setzen, z. B. `'11.12.2026'`.
4. Speichern, Vorschau prüfen: Das rote Band ist weg, keine gelben Platzhalter mehr.
5. Live-Upload ([A8](#a8-live-upload-auf-all-inkl)).

Diese Datei ist eine Programmdatei. Am sichersten erledigt das die Entwicklung. Die Tests prüfen danach automatisch, ob alle Seiten noch funktionieren.

Gleichzeitig prüfen, ob Texte auf anderen Seiten angepasst werden müssen (FAQ zu Storno und Absage, Wortlaut der Wertersatz-Bestätigung im Anmeldeformular).

---

### A11 Eine Anmeldung kommt an – was tun?

**So sieht die Mail aus**

- Postfach: `anmeldung@waybuild-akademie.de`
- Betreff: „Anmeldung · *Kurs* · *Startdatum*“
- Inhalt in fester Reihenfolge: Vorgangsnummer (z. B. `A-20261215-7F3K`), Kurs und Termin, **RECHNUNG AN: PRIVAT** oder **RECHNUNG AN: FIRMA** mit Anschrift, alle Teilnehmenden einzeln, Endpreis (Rabatt ab 3 Personen schon abgezogen), Bestätigungen (Teilnahmebedingungen, Volljährigkeit, ggf. Wertersatz), Nachricht.
- Am Ende steht ein Datenblock „DATEN (JSON, für CRM)“. Er ist für ein späteres CRM gedacht und kann ignoriert werden.
- Wer auf die Mail antwortet, schreibt direkt an die anmeldende Person (Ansprechperson).

**Schritte im Backoffice (Prozess P-01)**

1. **Prüfen:** Sind die Angaben vollständig und plausibel? Sonst per „Antworten“ nachfragen.
2. **Eingangsbestätigung:** Steht in der Mail „Eingangsbestätigung an die Person: **NICHT versendet**“, bitte selbst kurz bestätigen. Das passiert nur, wenn sehr viele Mails an dieselbe Adresse gingen.
3. **Durchführung entscheiden:** spätestens 10 Tage vor Kursstart. Bei Absage weiter mit [A5](#a5-termin-absagen-oder-ausfalltag-eintragen).
4. **Rechnung schreiben** – an die Privatperson oder an die Rechnungs-E-Mail der Firma.
   - Vorgangsnummer und ggf. Bestellnummer angeben.
   - Fälligkeit laut Teilnahmebedingungen.
   - Bei langen Weiterbildungen mit `raten: true` auf Wunsch einen Ratenplan.
5. **Zahlungseingang** prüfen.
6. **Zugang zum Live-Raum:** Vor Kursbeginn jeder teilnehmenden Person einzeln per E-Mail schicken. Der Zugangslink steht nie auf der Website.

**Andere Mails**

| Art | Postfach | Was tun |
|---|---|---|
| **Coaching-Anfrage** | `anmeldung@` | Unverbindlich. Innerhalb von zwei Werktagen Online-Termine vorschlagen. Rechnung erst nach der Terminabstimmung. |
| **Interesse vormerken** | `info@` | In die Liste „Interesse je Kurs“ eintragen. Steht ein Termin fest, alle Vorgemerkten benachrichtigen. Wer sich abmeldet, wird gelöscht. |
| **Kontakt** | `info@` | Innerhalb von zwei Werktagen antworten (per Mail oder Rückruf). |
| **Widerruf** | `anmeldung@` | Ernst nehmen und sofort bearbeiten: Vorgang heraussuchen, Rechnung stornieren bzw. bereits gezahlte Beträge erstatten. Steht in der Mail „NICHT versendet“, den Eingang selbst bestätigen. Bei Unklarheiten (z. B. Wertersatz, Kurs schon begonnen) die Rechtsberatung fragen. |

Das Formular speichert **keine** Daten auf dem Server. Die Mails im Postfach sind die einzige Ablage. Aufbewahrung und Löschung richten sich nach der Datenschutzerklärung.

---

### A12 Wenn etwas nicht klappt

| Problem | Ursache | Lösung |
|---|---|---|
| Im Reiter „Actions“ steht ein rotes Kreuz | Eine Kursdatei hat einen Fehler (Feld fehlt, Einrückung falsch, Datum falsch geschrieben, Kurzbeschreibung länger als 220 Zeichen) | Lauf öffnen, Schritt „check“ oder „build“ anklicken. Die Meldung nennt Datei und Feld. Fehler korrigieren und neu speichern. Bis dahin bleibt die alte Vorschau online. |
| Nur der Schritt „test“ ist rot | Ein automatischer Test hat etwas gefunden | Die Vorschau ist trotzdem aktualisiert. Der Entwicklung Bescheid geben. |
| Vorschau zeigt noch den alten Stand | Lauf noch nicht fertig oder Browser-Zwischenspeicher | 5 Minuten warten, dann Strg + F5. |
| Neuer Kurs fehlt live | Live-Upload fehlt oder Kurs steht noch auf `entwurf` | Status prüfen ([A2](#a2-kurs-freigeben)), Live-Upload ([A8](#a8-live-upload-auf-all-inkl)). |
| Formular meldet „Gerade technisch nicht erreichbar“ | Formular-Geheimnis fehlt oder Mail-Flut (mehr als 500 Mails am Tag) | [A9](#a9-ersteinrichtung-formulare-postfächer-weiterleitung), Schritt 4. Bei Spam-Flut die Entwicklung informieren. |
| Formular meldet „Das ging sehr schnell“ | Absenden weniger als 3 Sekunden nach dem Laden (Spam-Schutz) | Eine Minute warten und erneut absenden. |
| Keine Eingangsbestätigung bei Teilnehmenden | Spam-Ordner, fehlendes SPF/DKIM, Tageslimit | Spam-Ordner prüfen lassen; Absender-Einstellungen prüfen ([A9](#a9-ersteinrichtung-formulare-postfächer-weiterleitung), Schritt 3). |
| Falscher Stand ist live | – | Älteres Live-Paket aus „Actions“ herunterladen und erneut hochladen. Jeder Stand im Repository ist wiederherstellbar (NFA-25). |

---

## Teil B – Für Teilnehmende

**Kurs finden**

1. Auf **waybuild-akademie.de** auf „Kurse“ oder „Termine“ klicken.
2. Im Katalog nach Bereich (z. B. Prüfungsvorbereitung) und Kategorie filtern.
3. Auf jeder Karte stehen Preis, Umfang und der nächste Start.
4. Auf der Kursseite stehen Inhalte, Termine, Preis, Voraussetzungen und Technik.

**Anmelden**

1. Beim passenden Termin auf **„Anmelden“** klicken. Kurs und Termin sind schon ausgewählt.
2. Deinen Namen und deine E-Mail-Adresse eintragen. Telefon und Nachricht sind freiwillig.
3. Wählen, wer zahlt: **„Ich zahle selbst“** (deine Anschrift) oder **„Mein Betrieb zahlt“** (Firma, Ansprechperson, Rechnungs-E-Mail).
4. Bis zu fünf Personen kannst du in einer Anmeldung eintragen. Ab drei Personen gibt es 10 % Rabatt.
5. Teilnahmebedingungen, Datenschutz und Widerrufsbelehrung lesen und die Häkchen setzen.
6. Startet der Kurs in weniger als 14 Tagen, bestätigst du zusätzlich, dass wir schon vor Ende der Widerrufsfrist beginnen sollen.
7. Auf **„Zahlungspflichtig anmelden“** klicken. Die Anmeldung ist verbindlich.

Ohne Termin? Dann klick auf **„Interesse vormerken“**. Das ist unverbindlich und kostenlos. Wir melden uns, sobald es einen Termin gibt.

Für das **Prüfungscoaching** klickst du auf „Paket anfragen“. Die Anfrage ist unverbindlich; wir stimmen die Termine mit dir ab.

**Was danach passiert**

1. Du siehst sofort eine Danke-Seite.
2. In wenigen Minuten kommt eine Eingangsbestätigung per E-Mail (bitte auch im Spam-Ordner nachsehen).
3. Die **Rechnung kommt per E-Mail**. Eine Online-Zahlung ist nicht nötig. Zahlt dein Betrieb, geht die Rechnung an die Firma.
4. Vor Kursstart bekommt jede teilnehmende Person den **Zugang zum Live-Raum** per E-Mail.
5. Der Unterricht ist **live** an den angegebenen Abenden. Die Prüfung legst du bei deiner zuständigen IHK ab.

**Widerruf**

- Als Verbraucher/in kannst du deinen Vertrag **innerhalb von 14 Tagen** ohne Grund widerrufen.
- Am einfachsten geht das über den Knopf **„Vertrag widerrufen“** unten auf jeder Seite.
- Du gibst Name, E-Mail und Kurs oder Vorgangsnummer an, klickst auf „Vertrag jetzt widerrufen“ und danach auf **„Widerruf bestätigen“**.
- Du siehst sofort Datum und Uhrzeit des Eingangs und bekommst eine Bestätigung per E-Mail.
- Einzelheiten stehen in der Widerrufsbelehrung unter `/widerruf/`.

Fragen? Schreib an **info@waybuild-akademie.de** oder nutze das Kontaktformular.

---

## Änderungsverlauf

| Datum | Änderung |
|---|---|
| 13.11.2026 | Erste Fassung |
