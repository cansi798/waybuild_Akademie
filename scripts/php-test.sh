#!/usr/bin/env bash
# PHP-Tests der Formular-Endpunkte (public/api/) im Docker-Image php:8.3-cli – ohne echten Mailversand.
#   scripts/php-test.sh
# Ablauf: public/api/ in einen Test-Webroot kopieren, eine Terminliste mit Daten relativ zu heute anlegen,
# sendmail_path auf ein Skript umbiegen, das jede Mail als Datei ablegt, per `php -S` POSTs schicken und
# Statuscodes sowie Mail-Inhalte prüfen. Zusätzlich: Syntaxprüfung (php -l) und – falls gebaut – dist/api/termine.json.
set -euo pipefail
cd "$(dirname "$0")/.."

IMAGE=php:8.3-cli
docker image inspect "$IMAGE" >/dev/null 2>&1 || docker pull "$IMAGE"

T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
mkdir -p "$T/konto/web/api" "$T/mails"
cp -a public/api/. "$T/konto/web/api/"
[[ -f dist/api/termine.json ]] && cp dist/api/termine.json "$T/dist-termine.json"

cat > "$T/sendmail.sh" <<'SH'
#!/bin/sh
# Ersatz für sendmail: jede Mail als eigene Datei ablegen
cat > "/t/mails/$(date +%s%N)-$$.eml"
SH
chmod +x "$T/sendmail.sh"

cat > "$T/test.php" <<'PHP'
<?php
declare(strict_types=1);
date_default_timezone_set('Europe/Berlin');

$ok = 0; $fehler = 0;
function pruefe(bool $b, string $name): void {
    global $ok, $fehler;
    if ($b) { $ok++; echo "  ok      $name\n"; } else { $fehler++; echo "  FEHLER  $name\n"; }
}
function gruppe(string $t): void { echo "\n$t\n"; }

const API = '/t/konto/web/api';
const DATEN = '/t/konto/akademie-daten';

function tag(int $plus): string { return (new DateTimeImmutable('today'))->modify(($plus >= 0 ? '+' : '') . $plus . ' days')->format('Y-m-d'); }

// Terminliste (S-06) mit Daten relativ zu heute
file_put_contents(API . '/termine.json', json_encode(['version' => 1, 'erzeugt' => date('c'), 'kurse' => [
    'testkurs' => ['titel' => 'Vorbereitung auf die IHK-Prüfung AP1', 'art' => 'kurs', 'status' => 'freigegeben', 'ue' => 35, 'dauer' => 'ca. 5 Wochen',
        'zeiten' => 'Di + Do, 18:00–20:45 Uhr', 'preis' => 349, 'raten' => false, 'pakete' => [], 'termine' => [
            ['id' => 'spaet', 'start' => tag(40), 'ende' => tag(70), 'anmeldeschluss' => tag(33), 'pruefung' => tag(75)],
            ['id' => 'bald', 'start' => tag(10), 'ende' => tag(40), 'anmeldeschluss' => tag(3), 'pruefung' => null],
            ['id' => 'zu', 'start' => tag(5), 'ende' => tag(30), 'anmeldeschluss' => tag(-2), 'pruefung' => null],
        ]],
    'entwurfkurs' => ['titel' => 'Entwurf', 'art' => 'kurs', 'status' => 'entwurf', 'ue' => 10, 'dauer' => 'x', 'zeiten' => 'x', 'preis' => 99, 'raten' => true, 'pakete' => [],
        'termine' => [['id' => 'e1', 'start' => tag(40), 'ende' => tag(50), 'anmeldeschluss' => tag(33), 'pruefung' => null]]],
    'coaching' => ['titel' => 'Individuelles Prüfungscoaching', 'art' => 'coaching', 'status' => 'freigegeben', 'ue' => null, 'dauer' => 'je 60 Minuten', 'zeiten' => 'flexibel',
        'preis' => 69, 'raten' => false, 'termine' => [], 'pakete' => [
            ['id' => 'einzelcoaching', 'name' => 'Einzelcoaching', 'betrag' => 69, 'beschreibung' => '1 × 60 Minuten'],
            ['id' => 'coaching-paket', 'name' => 'Coaching-Paket', 'betrag' => 189, 'beschreibung' => '3 × 60 Minuten'],
        ]],
]], JSON_UNESCAPED_UNICODE));

function limit_leeren(): void { foreach (glob(DATEN . '/ratelimit/*.json') ?: [] as $d) unlink($d); }
function mails_leeren(): void { foreach (glob('/t/mails/*.eml') ?: [] as $d) unlink($d); }
/** @return list<array{kopf:string,text:string,an:string,betreff:string}> */
function mails(): array {
    $liste = glob('/t/mails/*.eml') ?: [];
    sort($liste);
    return array_map(function ($d) {
        $roh = str_replace("\r\n", "\n", (string) file_get_contents($d));
        [$kopf, $text] = array_pad(explode("\n\n", $roh, 2), 2, '');
        preg_match('/^To: (.*)$/m', $kopf, $an);
        preg_match('/^Subject: (.*(?:\n[ \t].*)*)$/m', $kopf, $b);
        return ['kopf' => $kopf, 'text' => $text, 'an' => trim($an[1] ?? ''), 'betreff' => mb_decode_mimeheader(str_replace("\n", '', $b[1] ?? ''))];
    }, $liste);
}

/** @return array{status:int,kopf:array<string,string>,text:string,json:?array} */
function anfrage(string $pfad, array $felder = [], bool $json = false, string $methode = 'POST', int $port = 8080, bool $limitBehalten = false): array {
    if (!$limitBehalten) limit_leeren();
    $kopf = ['Content-Type: application/x-www-form-urlencoded'];
    if ($json) $kopf[] = 'Accept: application/json';
    $ctx = stream_context_create(['http' => ['method' => $methode, 'header' => implode("\r\n", $kopf), 'content' => $methode === 'POST' ? http_build_query($felder) : '',
        'ignore_errors' => true, 'follow_location' => 0, 'timeout' => 10]]);
    $text = (string) @file_get_contents("http://127.0.0.1:$port$pfad", false, $ctx);
    $status = 0; $h = [];
    foreach ($http_response_header ?? [] as $z) {
        if (preg_match('~^HTTP/\S+ (\d{3})~', $z, $m)) $status = (int) $m[1];
        elseif (str_contains($z, ':')) { [$n, $w] = explode(':', $z, 2); $h[strtolower(trim($n))] = trim($w); }
    }
    return ['status' => $status, 'kopf' => $h, 'text' => $text, 'json' => json_decode($text, true)];
}

$gueltig = ['kurs' => 'testkurs', 'termin' => 'spaet', 'personen' => '1', 'p1_vorname' => 'Lena', 'p1_nachname' => 'Muster', 'p1_email' => 'lena@beispiel.de',
    'p1_telefon' => '+49 40 123456', 'zahlweg' => 'selbst', 'strasse' => 'Hauptstraße 1', 'plz' => '22846', 'ort' => 'Norderstedt', 'agb' => '1', 'datenschutz' => '1'];
$betrieb = array_merge($gueltig, ['zahlweg' => 'betrieb', 'personen' => '3', 'firma' => 'Beispiel GmbH', 'ansprechperson' => 'Frau Kaya', 'firma_strasse' => 'Werkweg 5',
    'firma_plz' => '20095', 'firma_ort' => 'Hamburg', 'rechnung_email' => 'rechnung@beispiel.de', 'bestellnummer' => 'PO-77',
    'p2_vorname' => 'Ali', 'p2_nachname' => 'Demir', 'p2_email' => 'ali@beispiel.de', 'p3_vorname' => 'Mia', 'p3_nachname' => 'Roth', 'p3_email' => 'mia@beispiel.de']);
unset($betrieb['strasse'], $betrieb['plz'], $betrieb['ort']);

gruppe('Zugriff');
$r = anfrage('/api/anmeldung.php', [], false, 'GET');
pruefe($r['status'] === 405 && ($r['kopf']['allow'] ?? '') === 'POST', 'GET auf anmeldung.php → 405 mit Allow: POST');
foreach (['interesse', 'kontakt', 'widerruf'] as $n) {
    pruefe(anfrage("/api/$n.php", [], false, 'GET')['status'] === 405, "GET auf $n.php → 405");
}
pruefe(anfrage('/api/config.php', [], false, 'GET')['status'] === 404, 'config.php direkt → 404');
pruefe(anfrage('/api/_lib.php', [], false, 'GET')['status'] === 404, '_lib.php direkt → 404');
$tok = anfrage('/api/token.php', [], false, 'GET');
pruefe($tok['status'] === 200 && ctype_digit((string) ($tok['json']['ts'] ?? '')) && strlen((string) $tok['json']['sig']) === 64, 'token.php liefert signierten Zeitstempel');
pruefe(is_file(DATEN . '/formular-geheimnis.txt') && strlen(trim((string) file_get_contents(DATEN . '/formular-geheimnis.txt'))) === 64, 'Geheimnis außerhalb des Webroots erzeugt');
pruefe(!is_file('/t/konto/web/formular-geheimnis.txt') && !glob(API . '/*.txt'), 'kein Geheimnis im Webroot');

gruppe('Anmeldung gültig – Ich zahle selbst');
mails_leeren();
$r = anfrage('/api/anmeldung.php', $gueltig);
pruefe($r['status'] === 303 && preg_match('~^/danke/\?art=anmeldung&vorgang=A-\d{8}-[A-Z0-9]{4}$~', $r['kopf']['location'] ?? ''), '303 → /danke/?art=anmeldung&vorgang=…');
$m = mails();
pruefe(count($m) === 2, 'zwei Mails (Team + Bestätigung)');
pruefe(($m[0]['an'] ?? '') === 'anmeldung@waybuild-akademie.de', 'Team-Mail an anmeldung@');
pruefe(str_starts_with($m[0]['betreff'] ?? '', 'Anmeldung · Vorbereitung auf die IHK-Prüfung AP1 · '), 'Betreff „Anmeldung · Kurs · Startdatum“');
pruefe(str_contains($m[0]['kopf'] ?? '', 'Reply-To: lena@beispiel.de'), 'Reply-To = Ansprechperson');
pruefe(str_contains($m[0]['kopf'] ?? '', 'Content-Type: text/plain; charset=UTF-8'), 'Klartext UTF-8');
$t0 = $m[0]['text'] ?? '';
foreach (['RECHNUNG AN: PRIVAT', 'Hauptstraße 1', '22846 Norderstedt', '1. Lena Muster <lena@beispiel.de> – Ansprechperson, Tel. +49 40 123456',
    'Endpreis (alles inklusive): 349,00 €', 'Teilnahmebedingungen akzeptiert: ja', '"gesamtpreis": 349', '"termin": "spaet"', '----- DATEN (JSON, für CRM) -----'] as $s) {
    pruefe(str_contains($t0, $s), "Team-Mail enthält „{$s}“");
}
$t1 = $m[1]['text'] ?? '';
pruefe(($m[1]['an'] ?? '') === 'lena@beispiel.de', 'Bestätigung an die Ansprechperson');
foreach (['Hallo Lena,', 'Rechnung folgt per E-Mail', 'Endpreis: 349,00 € – alles inklusive', 'https://waybuild-akademie.de/widerruf/',
    'https://waybuild-akademie.de/teilnahmebedingungen/', 'Zugang zum Live-Raum', 'noch keine Annahme'] as $s) {
    pruefe(str_contains($t1, $s), "Bestätigung enthält „{$s}“");
}

gruppe('Anmeldung gültig – Mein Betrieb zahlt, 3 Personen');
mails_leeren();
$r = anfrage('/api/anmeldung.php', $betrieb);
pruefe($r['status'] === 303, '303');
$t0 = mails()[0]['text'] ?? '';
foreach (['RECHNUNG AN: FIRMA', 'Firma: Beispiel GmbH', 'Rechnungs-E-Mail: rechnung@beispiel.de', 'Bestellnummer: PO-77', 'TEILNEHMENDE (3)', '3. Mia Roth <mia@beispiel.de>',
    'Zwischensumme 1.047,00 €', 'Gruppenrabatt 10 %: −104,70 €', 'Endpreis (alles inklusive): 942,30 €'] as $s) {
    pruefe(str_contains($t0, $s), "Team-Mail enthält „{$s}“");
}
mails_leeren();
anfrage('/api/anmeldung.php', array_merge($betrieb, ['personen' => '2', 'p3_vorname' => '', 'p3_nachname' => '', 'p3_email' => '']));
pruefe(str_contains(mails()[0]['text'] ?? '', 'Endpreis (alles inklusive): 698,00 €') && !str_contains(mails()[0]['text'] ?? '', 'Gruppenrabatt'), '2 Personen: 698 € ohne Rabatt');

gruppe('Falscher Preis aus dem Formular wird ignoriert');
mails_leeren();
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['gesamtpreis' => '1', 'preis' => '1', 'einzelpreis' => '0.5', 'rabatt' => '99']));
pruefe($r['status'] === 303 && str_contains(mails()[0]['text'] ?? '', 'Endpreis (alles inklusive): 349,00 €'), 'Mail enthält den Server-Preis 349,00 €');

gruppe('Ungültige Eingaben');
mails_leeren();
$r = anfrage('/api/anmeldung.php', ['kurs' => 'testkurs', 'termin' => 'spaet']);
pruefe($r['status'] === 422 && str_contains($r['kopf']['content-type'] ?? '', 'text/html'), 'ohne JS: 422 als HTML-Seite');
foreach (['Bitte gib deinen Vornamen ein.', 'Bitte gib deinen Nachnamen ein.', 'Bitte wähle aus, wer die Rechnung bekommt.', 'Bitte bestätige die Teilnahmebedingungen.', 'Zurück'] as $s) {
    pruefe(str_contains($r['text'], htmlspecialchars($s, ENT_QUOTES | ENT_HTML5)), "Fehlerseite nennt „{$s}“");
}
$r = anfrage('/api/anmeldung.php', ['kurs' => 'testkurs', 'termin' => 'spaet'], true);
$f = $r['json']['fehler'] ?? [];
pruefe($r['status'] === 422 && ($r['json']['ok'] ?? null) === false, 'mit JS: 422 als JSON');
pruefe(array_keys($f) == ['p1_vorname', 'p1_nachname', 'p1_email', 'zahlweg', 'agb', 'datenschutz'], 'Fehler je Feld: Pflichtfelder ohne Zahlweg');
pruefe(($f['p1_email'] ?? '') === 'Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.de.', 'Fehlertext E-Mail laut Spezifikation');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['zahlweg' => 'selbst', 'strasse' => '', 'plz' => '1', 'ort' => '']), true);
pruefe(array_keys($r['json']['fehler'] ?? []) == ['strasse', 'plz', 'ort'], 'Ich zahle selbst: Straße, PLZ, Ort Pflicht');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['zahlweg' => 'betrieb']), true);
pruefe(array_keys($r['json']['fehler'] ?? []) == ['firma', 'ansprechperson', 'firma_strasse', 'firma_plz', 'firma_ort', 'rechnung_email'], 'Mein Betrieb zahlt: Firma, Ansprechperson, Anschrift, Rechnungs-Mail Pflicht');
$r = anfrage('/api/anmeldung.php', array_merge($betrieb, ['bestellnummer' => str_repeat('x', 51)]), true);
pruefe(($r['json']['fehler']['bestellnummer'] ?? '') === 'Die Bestellnummer darf höchstens 50 Zeichen lang sein.', 'Bestellnummer max. 50 Zeichen');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['p1_telefon' => 'abc']), true);
pruefe(isset($r['json']['fehler']['p1_telefon']), 'Telefon ungültig');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['personen' => '6']), true);
pruefe(($r['json']['fehler']['personen'] ?? '') === 'Pro Anmeldung sind höchstens 5 Personen möglich.', '6 Personen abgelehnt');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['personen' => '2', 'p2_vorname' => 'Ali']), true);
pruefe(($r['json']['fehler']['p2_nachname'] ?? '') === 'Bitte ergänze Vorname, Nachname und E-Mail für Person 2.', 'Person 2 unvollständig');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['p3_vorname' => 'Mia', 'p3_nachname' => 'Roth', 'p3_email' => 'mia@beispiel.de']), true);
pruefe(isset($r['json']['fehler']['p2_vorname']), 'ohne JS ausgefüllte Person 3 zählt mit → Person 2 fehlt');
$r = anfrage('/api/anmeldung.php', array_merge($betrieb, ['p3_email' => 'ALI@beispiel.de']), true);
pruefe(($r['json']['fehler']['p3_email'] ?? '') === 'Diese E-Mail-Adresse ist schon eingetragen.', 'doppelte E-Mail-Adresse');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['nachricht' => str_repeat('a', 2001)]), true);
pruefe(isset($r['json']['fehler']['nachricht']), 'Nachricht max. 2.000 Zeichen');
pruefe(count(mails()) === 0, 'keine Mail bei ungültigen Eingaben');

gruppe('Kurs und Termin gegen die Terminliste');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['termin' => 'gibtsnicht']), true);
pruefe(($r['json']['fehler']['termin'] ?? '') === 'Bitte wähle einen Termin aus.', 'unbekannter Termin');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['termin' => 'zu']), true);
pruefe(($r['json']['fehler']['termin'] ?? '') === 'Für diesen Termin ist die Anmeldung leider geschlossen. Wähle einen anderen Termin oder merke dein Interesse vor.', 'Anmeldeschluss vorbei');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['kurs' => 'entwurfkurs', 'termin' => 'e1']), true);
pruefe(($r['json']['fehler']['kurs'] ?? '') === 'Bitte wähle einen Kurs aus.', 'Entwurf nicht buchbar');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['kurs' => 'erfunden']), true);
pruefe(isset($r['json']['fehler']['kurs']), 'unbekannter Kurs');

gruppe('Wertersatz bei Kursstart innerhalb von 14 Tagen');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['termin' => 'bald']), true);
pruefe(str_starts_with($r['json']['fehler']['wertersatz'] ?? '', 'Dein Kurs startet innerhalb der 14-tägigen Widerrufsfrist.'), 'Start in 10 Tagen: Bestätigung Pflicht');
mails_leeren();
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['termin' => 'bald', 'wertersatz' => '1']));
pruefe($r['status'] === 303 && str_contains(mails()[1]['text'] ?? '', 'Wertersatz für bereits erbrachte Leistungen'), 'mit Bestätigung: 303, Mail bestätigt das Verlangen');
pruefe(anfrage('/api/anmeldung.php', $gueltig)['status'] === 303, 'Start in 40 Tagen: Bestätigung freiwillig');

gruppe('Coaching-Anfrage (unverbindlich)');
$coach = ['kurs' => 'coaching', 'paket' => 'coaching-paket', 'p1_vorname' => 'Tom', 'p1_nachname' => 'Berg', 'p1_email' => 'tom@beispiel.de', 'zahlweg' => 'selbst',
    'strasse' => 'Weg 2', 'plz' => '22846', 'ort' => 'Norderstedt', 'anliegen' => 'Feedback zu meinem Projektantrag', 'wunschzeiten' => 'abends', 'datenschutz' => '1'];
mails_leeren();
$r = anfrage('/api/anmeldung.php', $coach);
pruefe($r['status'] === 303 && str_starts_with($r['kopf']['location'] ?? '', '/danke/?art=coaching&vorgang=C-'), '303 → /danke/?art=coaching');
$m = mails();
pruefe(str_contains($m[0]['text'] ?? '', 'Paketpreis: 189,00 €') && str_contains($m[0]['text'] ?? '', 'COACHING-ANFRAGE'), 'Paketpreis vom Server');
pruefe(str_contains($m[1]['text'] ?? '', 'noch unverbindlich'), 'Bestätigung: unverbindlich');
$r = anfrage('/api/anmeldung.php', array_merge($coach, ['paket' => '', 'anliegen' => '']), true);
pruefe(($r['json']['fehler']['paket'] ?? '') === 'Bitte wähle ein Paket aus.' && ($r['json']['fehler']['anliegen'] ?? '') === 'Beschreib kurz, wobei wir dir helfen sollen.', 'Paket und Anliegen Pflicht');

gruppe('Spam-Schutz');
mails_leeren();
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['website' => 'http://spam.example']));
pruefe($r['status'] === 303 && str_starts_with($r['kopf']['location'] ?? '', '/danke/'), 'Lockfeld: Antwort wie Erfolg (303)');
pruefe(count(mails()) === 0, 'Lockfeld: keine Mail');
$tok = anfrage('/api/token.php', [], false, 'GET')['json'];
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['ts' => $tok['ts'], 'sig' => $tok['sig']]), true);
pruefe($r['status'] === 429 && ($r['json']['code'] ?? '') === 'zu_schnell' && ($r['json']['meldung'] ?? '') === 'Das ging sehr schnell – bitte versuche es in einer Minute erneut.', 'Zeitfalle: sofort abgeschickt → 429');
$geheim = trim((string) file_get_contents(DATEN . '/formular-geheimnis.txt'));
$ts = (string) (time() - 10);
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['ts' => $ts, 'sig' => hash_hmac('sha256', 'zeit:' . $ts, $geheim)]));
pruefe($r['status'] === 303, 'Zeitfalle: nach 10 s → 303');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['ts' => $ts, 'sig' => str_repeat('0', 64)]), true);
pruefe($r['status'] === 400 && ($r['json']['code'] ?? '') === 'zeitstempel', 'gefälschte Signatur → 400');
$alt = (string) (time() - 3 * 86400);
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['ts' => $alt, 'sig' => hash_hmac('sha256', 'zeit:' . $alt, $geheim)]), true);
pruefe($r['status'] === 422 && ($r['json']['code'] ?? '') === 'abgelaufen', 'Zeitstempel älter als 2 Tage → 422');
limit_leeren();
$codes = [];
for ($i = 1; $i <= 16; $i++) {
    $codes[] = anfrage('/api/kontakt.php', ['name' => 'x'], true, 'POST', 8080, true)['status'];
}
pruefe(count(array_filter($codes, fn ($c) => $c === 422)) === 15 && end($codes) === 429, 'Rate-Limit: 15 Anfragen je Stunde, die 16. → 429');
$dateien = glob(DATEN . '/ratelimit/*') ?: [];
pruefe(count($dateien) === 1 && preg_match('/^[0-9a-f]{64}\.json$/', basename($dateien[0])), 'Rate-Limit speichert nur einen IP-Hash');
$inhalt = json_decode((string) file_get_contents($dateien[0]), true);
pruefe(is_array($inhalt) && count($inhalt) === 15 && array_filter($inhalt, 'is_int') === $inhalt, 'Rate-Limit-Datei enthält nur Zeitpunkte');
$alles = array_map(fn ($p) => substr($p, strlen(DATEN) + 1), array_merge(glob(DATEN . '/*') ?: [], glob(DATEN . '/.*') ?: [], $dateien));
pruefe(!array_filter($alles, fn ($p) => !in_array($p, ['.', '..', '.htaccess', 'formular-geheimnis.txt', 'ratelimit'], true) && !str_starts_with($p, 'ratelimit/')), 'keine Formulardaten auf dem Server gespeichert');
limit_leeren();

gruppe('Header-Injection');
mails_leeren();
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['p1_email' => "lena@beispiel.de\r\nBcc: boese@example.com"]), true);
pruefe($r['status'] === 422 && isset($r['json']['fehler']['p1_email']), 'E-Mail mit Zeilenumbruch → 422');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['p1_vorname' => "Lena\r\nBcc: boese@example.com", 'ort' => "Norderstedt\nX-Test: 1"]));
$m = mails();
pruefe($r['status'] === 303 && count($m) === 2, 'Name mit Zeilenumbruch: Umbruch entfernt, Versand ok');
pruefe(!preg_match('/^(Bcc|X-Test):/mi', ($m[0]['kopf'] ?? '') . "\n" . ($m[1]['kopf'] ?? '')), 'keine eingeschleusten Kopfzeilen');
pruefe(!preg_match('/^Bcc:/mi', $m[0]['text'] ?? ''), 'kein Zeilenanfang „Bcc:“ im Text');
pruefe(str_contains($m[0]['text'] ?? '', 'Lena Bcc: boese@example.com Muster'), 'Eingabe bleibt einzeilig im Text');
$r = anfrage('/api/anmeldung.php', ['kurs' => '<script>alert(1)</script>']);
pruefe(!str_contains($r['text'], '<script>alert'), 'Fehlerseite escapet Eingaben');

gruppe('Versand fehlgeschlagen');
$r = anfrage('/api/anmeldung.php', $gueltig, true, 'POST', 8081);
pruefe($r['status'] === 500 && ($r['json']['code'] ?? '') === 'versand' && str_contains($r['json']['meldung'] ?? '', 'anmeldung@waybuild-akademie.de'), 'mail() schlägt fehl → 500 mit E-Mail-Adresse als Ausweg');
$r = anfrage('/api/anmeldung.php', $gueltig, false, 'POST', 8081);
pruefe($r['status'] === 500 && str_contains($r['text'], 'anmeldung@waybuild-akademie.de'), 'ohne JS: Fehlerseite mit E-Mail-Adresse');

gruppe('Interesse vormerken');
mails_leeren();
$int = ['name' => 'Sara Yilmaz', 'email' => 'sara@beispiel.de', 'kurs' => 'testkurs', 'wunschzeitraum' => 'Frühjahr', 'einwilligung' => '1'];
$r = anfrage('/api/interesse.php', $int);
$m = mails();
pruefe($r['status'] === 303 && str_starts_with($r['kopf']['location'] ?? '', '/danke/?art=interesse'), '303 → /danke/?art=interesse');
pruefe(($m[0]['an'] ?? '') === 'info@waybuild-akademie.de' && str_starts_with($m[0]['betreff'] ?? '', 'Interesse · '), 'Mail an info@');
pruefe(str_contains($m[1]['text'] ?? '', 'Wir melden uns, sobald Termine feststehen.'), 'Bestätigung „Wir melden uns, sobald Termine feststehen.“');
$r = anfrage('/api/interesse.php', array_merge($int, ['einwilligung' => '', 'kurs' => '', 'wunschzeitraum' => str_repeat('x', 101)]), true);
pruefe(array_keys($r['json']['fehler'] ?? []) == ['kurs', 'wunschzeitraum', 'einwilligung'], 'Kurs, Wunschzeitraum, Einwilligung geprüft');

gruppe('Kontakt');
mails_leeren();
$kon = ['name' => 'Jan Peters', 'email' => 'jan@beispiel.de', 'thema' => 'betrieb', 'nachricht' => 'Wir möchten fünf Azubis anmelden.', 'einwilligung' => '1'];
$r = anfrage('/api/kontakt.php', $kon);
$m = mails();
pruefe($r['status'] === 303 && str_starts_with($r['kopf']['location'] ?? '', '/danke/?art=kontakt'), '303 → /danke/?art=kontakt');
pruefe(($m[0]['an'] ?? '') === 'info@waybuild-akademie.de' && str_contains($m[0]['text'] ?? '', 'Thema: Anmeldung für meinen Betrieb'), 'Mail an info@ mit Thema');
$r = anfrage('/api/kontakt.php', array_merge($kon, ['thema' => 'werbung', 'nachricht' => 'kurz', 'einwilligung' => '']), true);
pruefe(($r['json']['fehler']['thema'] ?? '') === 'Bitte wähle ein Thema aus.' && ($r['json']['fehler']['nachricht'] ?? '') === 'Bitte schreib uns kurz, worum es geht.' && isset($r['json']['fehler']['einwilligung']), 'Thema, Nachricht (min. 10), Einwilligung');

gruppe('Widerruf (§ 356a BGB)');
mails_leeren();
$wid = ['name' => 'Lena Muster', 'email' => 'lena@beispiel.de', 'vertrag' => 'AP1, Start 19.01.2027, Vorgang A-20261113-7F3K'];
$r = anfrage('/api/widerruf.php', $wid);
pruefe($r['status'] === 200 && str_contains($r['text'], 'Widerruf bestätigen') && str_contains($r['text'], 'name="schritt" value="2"'), 'ohne JS Schritt 1 → Bestätigungsseite „Widerruf bestätigen“');
pruefe(count(mails()) === 0, 'Schritt 1 sendet noch nichts');
$r = anfrage('/api/widerruf.php', ['name' => '', 'email' => 'x', 'vertrag' => ''], true);
pruefe(array_keys($r['json']['fehler'] ?? []) == ['name', 'email', 'vertrag'], 'nur Name, E-Mail, Vertrag sind Pflicht');
$r = anfrage('/api/widerruf.php', array_merge($wid, ['schritt' => '2']));
$m = mails();
pruefe($r['status'] === 200 && str_contains($r['text'], 'Dein Widerruf ist eingegangen') && preg_match('/\d{2}\.\d{2}\.\d{4} um \d{2}:\d{2} Uhr/', $r['text']), 'Schritt 2 → Bestätigung mit Datum und Uhrzeit');
pruefe(($m[0]['an'] ?? '') === 'anmeldung@waybuild-akademie.de' && str_contains($m[0]['text'] ?? '', 'Hiermit widerrufe ich'), 'Widerruf an anmeldung@');
pruefe(($m[1]['an'] ?? '') === 'lena@beispiel.de' && preg_match('/Eingang: \d{2}\.\d{2}\.\d{4} um \d{2}:\d{2} Uhr/', $m[1]['text'] ?? '') && str_contains($m[1]['text'] ?? '', 'AP1, Start 19.01.2027'), 'Eingangsbestätigung mit Inhalt, Datum, Uhrzeit');
pruefe(!preg_match('/angenommen|wirksam/i', $m[1]['text'] ?? ''), 'Bestätigung behauptet keine Wirksamkeit');
$r = anfrage('/api/widerruf.php', array_merge($wid, ['schritt' => '2']), true);
pruefe(($r['json']['ok'] ?? false) === true && preg_match('/^\d{2}\.\d{2}\.\d{4} um \d{2}:\d{2} Uhr$/', $r['json']['eingang'] ?? ''), 'JSON mit Eingangszeit');

if (is_file('/t/dist-termine.json')) {
    gruppe('Gebaute Terminliste dist/api/termine.json (S-06)');
    $d = json_decode((string) file_get_contents('/t/dist-termine.json'), true);
    pruefe(is_array($d['kurse'] ?? null) && count($d['kurse']) > 0, 'gültiges JSON mit Kursen');
    $alleOk = true;
    foreach ($d['kurse'] as $id => $k) {
        $alleOk = $alleOk && is_string($k['titel'] ?? null) && in_array($k['status'] ?? '', ['freigegeben', 'entwurf'], true) && is_numeric($k['preis'] ?? null) && is_array($k['termine'] ?? null);
        foreach ($k['termine'] ?? [] as $t) {
            $alleOk = $alleOk && preg_match('/^\d{4}-\d{2}-\d{2}$/', $t['start'] ?? '') && preg_match('/^\d{4}-\d{2}-\d{2}$/', $t['anmeldeschluss'] ?? '');
        }
    }
    pruefe($alleOk, 'Felder titel/status/preis/termine je Kurs');
}

echo "\n$ok bestanden, $fehler fehlgeschlagen\n";
exit($fehler === 0 ? 0 : 1);
PHP

docker run --rm -v "$T":/t -u "$(id -u):$(id -g)" "$IMAGE" sh -c '
  set -e
  for f in /t/konto/web/api/*.php; do php -l "$f" >/dev/null || exit 1; done
  echo "php -l: alle Dateien ohne Syntaxfehler"
  php -S 127.0.0.1:8080 -t /t/konto/web -d sendmail_path=/t/sendmail.sh -d display_errors=0 -d log_errors=1 -d error_log=/t/php.log >/t/server.log 2>&1 &
  php -S 127.0.0.1:8081 -t /t/konto/web -d sendmail_path=/bin/false -d display_errors=0 -d log_errors=1 -d error_log=/t/php.log >/t/server2.log 2>&1 &
  sleep 1
  php /t/test.php; s=$?
  if [ -s /t/php.log ] && grep -v "Formular-Geheimnis neu erzeugt" /t/php.log | grep -q .; then echo "--- PHP-Protokoll:"; cat /t/php.log; fi
  exit $s
'
