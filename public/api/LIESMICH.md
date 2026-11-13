# Formular-Endpunkte (ALL-INKL)

PHP-Skripte für die Formulare der waybuild Akademie. Sie liegen nach dem Hochladen unter `https://waybuild-akademie.de/api/`.
Voraussetzung: **PHP 8.1 oder neuer** (im KAS unter „Domain → PHP-Version“), `mail()` aktiv (Standard bei ALL-INKL).
Ohne Composer und ohne Datenbank.

| Datei | Aufgabe |
|---|---|
| `anmeldung.php` | Anmeldung (verbindlich) und Coaching-Anfrage (unverbindlich) → `anmeldung@` |
| `interesse.php` | Interesse vormerken → `info@` |
| `kontakt.php` | Kontaktformular → `info@` |
| `widerruf.php` | Online-Widerruf (§ 356a BGB), zweistufig → `anmeldung@` |
| `token.php` | signierter Zeitstempel für die Zeitfalle (holt das Formular per JavaScript) |
| `termine.json` | beim Bauen erzeugte Terminliste (S-06): Kurse, Termine, Anmeldeschluss, Preise |
| `_lib.php`, `config.php` | gemeinsame Bausteine und Einstellungen – per `.htaccess` gesperrt |

## Einstellungen (`config.php`)

Nur Empfänger, Absender, Website-Adresse und Grenzwerte – **keine Geheimnisse** (das Repository ist öffentlich).
Die Postfächer `anmeldung@waybuild-akademie.de` und `info@waybuild-akademie.de` müssen bei ALL-INKL angelegt sein,
sonst landen die Eingangsbestätigungen im Spam oder werden abgewiesen.

## Formular-Geheimnis (Zeitfalle)

Die Zeitfalle braucht ein Geheimnis, mit dem `token.php` den Zeitstempel signiert (HMAC-SHA256). Reihenfolge:

1. Umgebungsvariable `AKADEMIE_FORM_SECRET` (mind. 32 Zeichen) – falls gesetzt.
2. Datei **außerhalb des Webroots**: `config.php` → `geheimnis_datei`, Standard
   `…/akademie-daten/formular-geheimnis.txt` zwei Ebenen über diesem Ordner
   (Beispiel: Webroot `/www/htdocs/w0123456/waybuild-akademie.de/` → `/www/htdocs/w0123456/akademie-daten/`).
3. Fehlt die Datei, erzeugt das erste Formular sie automatisch (64 Hex-Zeichen, Rechte 0600) und schreibt
   „Formular-Geheimnis neu erzeugt“ ins PHP-Fehlerprotokoll.
4. Ist nichts beschreibbar, laufen die Formulare **ohne Zeitfalle** weiter; im Fehlerprotokoll steht dann
   „HINWEIS: Kein Formular-Geheimnis verfügbar“. Abhilfe: Ordner `akademie-daten` per FTP neben dem Webroot anlegen
   (beschreibbar für PHP) oder die Datei selbst anlegen, z. B. mit dem Inhalt von `openssl rand -hex 32`.

Neues Geheimnis = Datei löschen; offene Formulare müssen danach einmal neu geladen werden.

## Spam-Schutz und Datenschutz

- **Lockfeld** `website`: für Menschen unsichtbar; ist es ausgefüllt, antwortet der Endpunkt wie bei Erfolg, sendet aber nichts.
- **Zeitfalle**: Absenden frühestens 3 Sekunden und höchstens 2 Tage nach dem Laden (nur mit JavaScript, ohne JavaScript entfällt sie).
- **Rate-Limit**: höchstens 15 Absendungen je Stunde und Anschluss (IPv6: je /64-Netz). Gespeichert wird nur ein
  HMAC-Hash der (bei IPv6 gekürzten) IP-Adresse mit den Zeitpunkten der letzten Stunde
  (`akademie-daten/ratelimit/<hash>.json`); ältere Einträge werden gelöscht (TTL 1 h).
- `akademie-daten/` bekommt automatisch eine `.htaccess` mit `Require all denied` – falls das Konto-Verzeichnis über
  eine Domain (z. B. `w0123456.kasserver.com`) erreichbar ist. Nach dem ersten Formular einmal prüfen:
  `https://<konto-domain>/akademie-daten/formular-geheimnis.txt` muss **403** liefern.
- PHP-Fehler gehen nur ins Fehlerprotokoll (`display_errors` wird in `_lib.php` abgeschaltet).
- **Eingangsbestätigungen an die Absender-Adresse** enthalten nur feste Textbausteine, die Vorgangsnummer und geprüfte
  Werte (Kurstitel, Termin, Paket, Preis aus `termine.json`, Thema aus fester Liste, Personenzahl) – **nie Freitext und
  keine Namen** aus dem Formular, damit niemand die Formulare als Spam-/Phishing-Schleuder nutzen kann. Je
  Empfängeradresse höchstens **3 Bestätigungen pro Stunde** (`akademie-daten/empfaenger/<hash>.json`, nur HMAC-Hash,
  TTL 1 h); die Mail ans Team geht immer raus und vermerkt, ob die Bestätigung versendet wurde („NICHT versendet“ →
  selbst bestätigen). Widerrufe zählen getrennt (`akademie-daten/empfaenger-widerruf/`), damit andere Formulare die
  gesetzliche Eingangsbestätigung nicht blockieren können. Mails ans Team enthalten alle Angaben, Reply-To = geprüfte
  Absender-Adresse. E-Mail-Adressen müssen eine gewöhnliche Form haben (keine Anführungszeichen, Kommas, IP-Adressen).
- **Keine Formulardaten auf dem Server** – sie gehen nur per E-Mail über das ALL-INKL-Postfach raus.
- Alle Eingaben werden serverseitig geprüft (gleiche Regeln und Texte wie im Browser, `src/lib/formular.ts`),
  Zeilenumbrüche aus einzeiligen Feldern entfernt (keine eingeschleusten Mail-Kopfzeilen), Ausgaben escaped.
- Kurs, Termin, Anmeldeschluss und Preis kommen **nur** aus `termine.json`; Preisangaben aus dem Formular werden ignoriert.

## Antworten

| Fall | ohne JavaScript | mit JavaScript (`Accept: application/json`) |
|---|---|---|
| Erfolg | `303` → `/danke/?art=…&vorgang=…` | `200 {"ok":true,"weiter":"…"}` |
| Eingaben fehlerhaft | `422` Seite mit allen Fehlern und „Zurück“ | `422 {"ok":false,"fehler":{"feld":"Text"}}` |
| zu schnell / zu viele | `429` | `429` |
| Versand fehlgeschlagen | `500` mit E-Mail-Adresse als Ausweg | `500` |
| GET o. ä. | `405` | `405` |

## Testen

`scripts/php-test.sh` (Docker `php:8.3-cli`) prüft alle Fälle mit umgebogenem `sendmail_path`.
Nach dem Hochladen einmal monatlich eine echte Testanmeldung schicken (NFA-25).
