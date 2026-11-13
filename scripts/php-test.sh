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
trap 'chmod -R u+w "$T" 2>/dev/null; rm -rf "$T"' EXIT
mkdir -p "$T/konto/web/api" "$T/mails"
cp -a public/api/. "$T/konto/web/api/"
# Zweite Installation ohne beschreibbares Konto-Verzeichnis: Geheimnis kann nicht entstehen → „fail closed“ (503)
mkdir -p "$T/konto2/web/api" && cp -a public/api/. "$T/konto2/web/api/" && chmod 555 "$T/konto2"
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

function limit_leeren(): void { foreach (glob(DATEN . '/{ratelimit,empfaenger,empfaenger-widerruf}/*.json', GLOB_BRACE) ?: [] as $d) unlink($d); @unlink(DATEN . '/mails-24h.json'); }
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
    'p1_telefon' => '+49 40 123456', 'zahlweg' => 'selbst', 'strasse' => 'Hauptstraße 1', 'plz' => '22846', 'ort' => 'Norderstedt', 'agb' => '1', 'alter' => '1', 'datenschutz' => '1'];
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
    'Endpreis (alles inklusive): 349,00 €', 'Teilnahmebedingungen akzeptiert: ja', 'Volljährig oder mit Einverständnis der Erziehungsberechtigten bzw. Anmeldung durch den Ausbildungsbetrieb: ja', '"volljaehrigOderEinverstaendnis": true', '"gesamtpreis": 349', '"termin": "spaet"', '----- DATEN (JSON, für CRM) -----'] as $s) {
    pruefe(str_contains($t0, $s), "Team-Mail enthält „{$s}“");
}
$t1 = $m[1]['text'] ?? '';
pruefe(($m[1]['an'] ?? '') === 'lena@beispiel.de', 'Bestätigung an die Ansprechperson');
foreach (['Hallo,', 'Teilnehmende: 1 Person', 'Rechnung an: dich (Ich zahle selbst)', 'Rechnung folgt per E-Mail', 'Endpreis: 349,00 € – alles inklusive', 'https://waybuild-akademie.de/widerruf/',
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
pruefe(array_keys($f) == ['p1_vorname', 'p1_nachname', 'p1_email', 'zahlweg', 'agb', 'datenschutz', 'alter'], 'Fehler je Feld: Pflichtfelder ohne Zahlweg');
pruefe(($f['p1_email'] ?? '') === 'Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.de.', 'Fehlertext E-Mail laut Spezifikation');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['alter' => '']), true);
pruefe(array_keys($r['json']['fehler'] ?? []) == ['alter'] && str_starts_with($r['json']['fehler']['alter'], 'Bitte bestätige, dass du volljährig bist'), 'Altersbestätigung Pflicht (Anmeldung)');
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
$alt = (string) (time() - 7 * 3600);
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['ts' => $alt, 'sig' => hash_hmac('sha256', 'zeit:' . $alt, $geheim)]), true);
pruefe($r['status'] === 422 && ($r['json']['code'] ?? '') === 'abgelaufen', 'Zeitstempel älter als 6 Stunden → 422');
$fuenf = (string) (time() - 5 * 3600);
pruefe(anfrage('/api/anmeldung.php', array_merge($gueltig, ['ts' => $fuenf, 'sig' => hash_hmac('sha256', 'zeit:' . $fuenf, $geheim)]))['status'] === 303, 'Zeitstempel 5 Stunden alt → 303');
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
pruefe(!array_filter($alles, fn ($p) => !in_array($p, ['.', '..', '.htaccess', '.geheimnis.lock', 'formular-geheimnis.txt', 'mails-24h.json', 'ratelimit', 'empfaenger', 'empfaenger-widerruf'], true) && !str_starts_with($p, 'ratelimit/')), 'keine Formulardaten auf dem Server gespeichert');
// Löschung nach 1 h (Datenschutzerklärung): abgelaufene Hash-Dateien verschwinden beim nächsten Formularaufruf (token.php)
@mkdir(DATEN . '/empfaenger', 0700, true);
file_put_contents(DATEN . '/empfaenger/' . str_repeat('a', 64) . '.json', json_encode([time() - 7200]));
touch(DATEN . '/empfaenger/' . str_repeat('a', 64) . '.json', time() - 7200);
touch($dateien[0], time() - 3601);
file_put_contents(DATEN . '/ratelimit/' . str_repeat('b', 64) . '.json', json_encode([time()]));
anfrage('/api/token.php', [], false, 'GET', 8080, true);
clearstatcache();
pruefe(!is_file($dateien[0]) && !is_file(DATEN . '/empfaenger/' . str_repeat('a', 64) . '.json'), 'Hash-Dateien älter als 1 h: beim nächsten Formularaufruf gelöscht');
pruefe(is_file(DATEN . '/ratelimit/' . str_repeat('b', 64) . '.json'), 'Hash-Dateien jünger als 1 h bleiben');
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
$wid = ['name' => 'Lena Muster', 'email' => 'lena@beispiel.de', 'kurs' => 'testkurs', 'anmeldedatum' => tag(-2), 'vorgang' => 'a-20261113-7f3k',
    'nachricht' => 'Bitte hier klicken: http://phish.example/login'];
$r = anfrage('/api/widerruf.php', $wid);
pruefe($r['status'] === 200 && str_contains($r['text'], 'Widerruf bestätigen') && str_contains($r['text'], 'name="schritt" value="2"'), 'ohne JS Schritt 1 → Bestätigungsseite „Widerruf bestätigen“');
pruefe(str_contains($r['text'], 'Zurück zum Formular'), 'Bestätigungsseite mit Link zurück');
pruefe(count(mails()) === 0, 'Schritt 1 sendet noch nichts');
$r = anfrage('/api/widerruf.php', ['name' => '', 'email' => 'x'], true);
pruefe(array_keys($r['json']['fehler'] ?? []) == ['name', 'email', 'kurs'], 'Pflicht: Name, E-Mail und Kurs oder Vorgangsnummer');
pruefe(anfrage('/api/widerruf.php', array_merge($wid, ['kurs' => '']), true)['status'] === 200, 'Vorgangsnummer allein genügt');
$r = anfrage('/api/widerruf.php', array_merge($wid, ['vorgang' => 'irgendwas', 'anmeldedatum' => tag(3)]), true);
pruefe(isset($r['json']['fehler']['vorgang']) && isset($r['json']['fehler']['anmeldedatum']), 'Vorgangsnummer-Format und Datum (nicht in der Zukunft) geprüft');
$r = anfrage('/api/widerruf.php', array_merge($wid, ['kurs' => 'erfunden']), true);
pruefe(isset($r['json']['fehler']['kurs']), 'Kurs nur aus der Liste');
$r = anfrage('/api/widerruf.php', array_merge($wid, ['schritt' => '2']));
$m = mails();
$datumDe = (new DateTimeImmutable(tag(-2)))->format('d.m.Y');
pruefe($r['status'] === 200 && str_contains($r['text'], 'Dein Widerruf ist eingegangen') && preg_match('/\d{2}\.\d{2}\.\d{4} um \d{2}:\d{2} Uhr/', $r['text']), 'Schritt 2 → Bestätigung mit Datum und Uhrzeit');
pruefe(($m[0]['an'] ?? '') === 'anmeldung@waybuild-akademie.de' && str_contains($m[0]['text'] ?? '', 'Hiermit widerrufe ich') && str_contains($m[0]['text'] ?? '', 'http://phish.example/login') && str_contains($m[0]['text'] ?? '', 'Name: Lena Muster'), 'Team-Mail enthält alles (auch Freitext)');
$t1 = $m[1]['text'] ?? '';
pruefe(($m[1]['an'] ?? '') === 'lena@beispiel.de' && preg_match('/Eingang: \d{2}\.\d{2}\.\d{4} um \d{2}:\d{2} Uhr/', $t1), 'Eingangsbestätigung mit Datum und Uhrzeit');
pruefe(str_contains($t1, 'Kurs: Vorbereitung auf die IHK-Prüfung AP1') && str_contains($t1, 'Anmeldedatum: ' . $datumDe) && str_contains($t1, 'Vorgangsnummer der Anmeldung: A-20261113-7F3K'), 'Inhalt aus strukturierten Feldern');
pruefe(!str_contains($t1, 'phish') && !str_contains($t1, 'http://') && !str_contains($t1, 'Lena'), 'kein Freitext und kein Name in der Bestätigung');
pruefe(!preg_match('/angenommen|wirksam/i', $t1), 'Bestätigung behauptet keine Wirksamkeit');
$r = anfrage('/api/widerruf.php', array_merge($wid, ['schritt' => '2']), true);
pruefe(($r['json']['ok'] ?? false) === true && preg_match('/^\d{2}\.\d{2}\.\d{4} um \d{2}:\d{2} Uhr$/', $r['json']['eingang'] ?? ''), 'JSON mit Eingangszeit');

gruppe('Eingangsbestätigungen ohne Freitext (kein Spam-Relay)');
$boese = 'Gewinn! Jetzt hier: http://phish.example/login www.boese.example';
mails_leeren();
anfrage('/api/kontakt.php', ['name' => 'www.boese.example Gewinnspiel', 'email' => 'opfer@beispiel.de', 'thema' => 'allgemein', 'nachricht' => $boese, 'einwilligung' => '1']);
$m = mails();
pruefe(str_contains($m[0]['text'] ?? '', 'phish.example') && str_contains($m[0]['text'] ?? '', 'www.boese.example Gewinnspiel'), 'Kontakt: Team-Mail mit Nachricht und Name');
pruefe(($m[1]['an'] ?? '') === 'opfer@beispiel.de' && str_starts_with($m[1]['text'] ?? '', 'Hallo,') && !preg_match('~phish|boese|http://|www\.|Gewinn~i', ($m[1]['text'] ?? '') . ($m[1]['betreff'] ?? '')), 'Kontakt: Bestätigung ohne Nachricht, Name, URL');
mails_leeren();
anfrage('/api/interesse.php', ['name' => 'Klick www.boese.example', 'email' => 'opfer@beispiel.de', 'kurs' => 'testkurs', 'wunschzeitraum' => 'http://phish.example', 'nachricht' => $boese, 'einwilligung' => '1']);
$m = mails();
pruefe(count($m) === 2 && !preg_match('~phish|boese|http://|www\.~i', ($m[1]['text'] ?? '') . ($m[1]['betreff'] ?? '')), 'Interesse: Bestätigung ohne Freitext');
mails_leeren();
anfrage('/api/anmeldung.php', array_merge($betrieb, ['p1_vorname' => 'www.boese.example', 'nachricht' => $boese, 'bestellnummer' => 'http://phish.example', 'firma' => 'Gewinn GmbH www.boese.example']));
$m = mails();
pruefe(count($m) === 2 && str_contains($m[0]['text'] ?? '', 'Bestellnummer: http://phish.example'), 'Anmeldung: Team-Mail mit allen Angaben');
pruefe(!preg_match('~phish|boese|http://p|www\.|Gewinn|Lena|Ali~i', ($m[1]['text'] ?? '') . ($m[1]['betreff'] ?? '')) && str_contains($m[1]['text'] ?? '', 'Teilnehmende: 3 Personen'), 'Anmeldung: Bestätigung nur mit festen Bausteinen und geprüften Werten');

gruppe('Höchstens 3 Bestätigungen je Empfängeradresse und Stunde');
limit_leeren();
mails_leeren();
$codes = [];
for ($i = 1; $i <= 4; $i++) {
    $codes[] = anfrage('/api/kontakt.php', ['name' => 'Test', 'email' => 'ziel@beispiel.de', 'thema' => 'allgemein', 'nachricht' => "Nachricht Nummer $i", 'einwilligung' => '1'], false, 'POST', 8080, true)['status'];
}
$m = mails();
$anTeam = count(array_filter($m, fn ($x) => $x['an'] === 'info@waybuild-akademie.de'));
$anZiel = count(array_filter($m, fn ($x) => $x['an'] === 'ziel@beispiel.de'));
pruefe($codes === [303, 303, 303, 303], 'alle vier Anfragen angenommen (303)');
pruefe($anTeam === 4, 'Team bekommt alle 4 Mails');
pruefe($anZiel === 3, '4. Bestätigung an dieselbe Adresse wird nicht versendet');
$teamTexte = array_values(array_map(fn ($x) => $x['text'], array_filter($m, fn ($x) => $x['an'] === 'info@waybuild-akademie.de')));
pruefe(str_contains($teamTexte[0] ?? '', 'Eingangsbestätigung an die Person: wird automatisch versendet') && str_contains($teamTexte[3] ?? '', 'Eingangsbestätigung an die Person: NICHT versendet'), 'Team-Mail vermerkt, ob die Bestätigung versendet wurde');
$r = anfrage('/api/interesse.php', ['name' => 'Test', 'email' => 'ZIEL@beispiel.de', 'kurs' => 'testkurs', 'einwilligung' => '1'], false, 'POST', 8080, true);
pruefe(count(array_filter(mails(), fn ($x) => strtolower($x['an']) === 'ziel@beispiel.de')) === 3, 'Limit gilt formularübergreifend und ohne Groß-/Kleinschreibung');
$dateien = glob(DATEN . '/empfaenger/*') ?: [];
pruefe(count($dateien) === 1 && preg_match('/^[0-9a-f]{64}\.json$/', basename($dateien[0])) && !str_contains((string) file_get_contents($dateien[0]), '@'), 'gespeichert wird nur ein Hash der Adresse');
$wid2 = ['name' => 'Ziel Person', 'email' => 'ziel@beispiel.de', 'vorgang' => 'A-20261113-7F3K', 'schritt' => '2'];
mails_leeren();
$r = anfrage('/api/widerruf.php', $wid2, true, 'POST', 8080, true);
pruefe(($r['json']['bestaetigung'] ?? null) === true && count(array_filter(mails(), fn ($x) => $x['an'] === 'ziel@beispiel.de')) === 1, 'Widerruf: eigener Zähler – Bestätigung kommt trotz ausgeschöpftem Formular-Limit');
for ($i = 0; $i < 3; $i++) { $r = anfrage('/api/widerruf.php', $wid2, true, 'POST', 8080, true); }
pruefe(($r['json']['bestaetigung'] ?? null) === false && count(array_filter(mails(), fn ($x) => $x['an'] === 'ziel@beispiel.de')) === 3, 'Widerruf: 4. Bestätigung je Stunde unterbleibt, Antwort meldet bestaetigung=false');
$r = anfrage('/api/widerruf.php', $wid2, false, 'POST', 8080, true);
pruefe($r['status'] === 200 && str_contains($r['text'], 'schicken wir dir gesondert'), 'Widerruf ohne JS: Seite sagt ehrlich, dass die Bestätigung gesondert kommt');
limit_leeren();

gruppe('Angriffe (Review)');
mails_leeren();
// Header-Injection in Feldern, die im Betreff landen (Kontakt: Name; Coaching: Name)
$r = anfrage('/api/kontakt.php', ['name' => "Jan\r\nBcc: boese@example.com\r\nSubject: Gewinn", 'email' => 'jan@beispiel.de', 'thema' => 'allgemein', 'nachricht' => 'Eine ganz normale Frage.', 'einwilligung' => '1']);
$m = mails();
pruefe($r['status'] === 303 && count($m) === 2, 'Kontakt: Name mit CR/LF → Versand ok, Umbruch entfernt');
pruefe(!preg_match('/^(Bcc|Subject: Gewinn)/mi', ($m[0]['kopf'] ?? '') . "\n" . ($m[1]['kopf'] ?? '')) && substr_count($m[0]['kopf'] ?? '', "\nSubject:") + (str_starts_with($m[0]['kopf'] ?? '', 'Subject:') ? 1 : 0) <= 1, 'Betreff: keine eingeschleuste Kopfzeile');
pruefe(str_contains($m[0]['betreff'] ?? '', 'Jan Bcc: boese@example.com Subject: Gewinn'), 'Betreff enthält den Namen einzeilig (MIME-kodiert)');
mails_leeren();
$r = anfrage('/api/anmeldung.php', ['kurs' => 'coaching', 'paket' => 'einzelcoaching', 'p1_vorname' => "Tom\nCc: boese@example.com", 'p1_nachname' => "Berg\r\n\r\nText", 'p1_email' => 'tom@beispiel.de', 'zahlweg' => 'selbst',
    'strasse' => 'Weg 2', 'plz' => '22846', 'ort' => 'Norderstedt', 'anliegen' => 'Feedback zu meinem Projektantrag', 'datenschutz' => '1']);
$m = mails();
pruefe($r['status'] === 303 && !preg_match('/^Cc:/mi', ($m[0]['kopf'] ?? '') . "\n" . ($m[1]['kopf'] ?? '')), 'Coaching: Name im Betreff ohne Header-Injection');
// E-Mail-Adressen, die filter_var durchlässt, die aber in To:/Reply-To: mehrdeutig sind
foreach (['"a@evil.example>,<b"@beispiel.de', '"x,y@evil.example"@beispiel.de', 'lena@[127.0.0.1]', "lena@beispiel.de\nBcc: boese@example.com", 'lena@beispiel.de%0ABcc:x@y.de', 'lena@beispiel'] as $adr) {
    $r = anfrage('/api/kontakt.php', ['name' => 'Test', 'email' => $adr, 'thema' => 'allgemein', 'nachricht' => 'Eine ganz normale Frage.', 'einwilligung' => '1'], true);
    pruefe($r['status'] === 422 && isset($r['json']['fehler']['email']), 'E-Mail abgelehnt: ' . json_encode($adr));
}
foreach (['o\'brien@beispiel.de', 'vor.name+tag@sub.beispiel.de', 'x@xn--bcher-kva.de'] as $adr) {
    $r = anfrage('/api/kontakt.php', ['name' => 'Test', 'email' => $adr, 'thema' => 'allgemein', 'nachricht' => 'Eine ganz normale Frage.', 'einwilligung' => '1'], true);
    pruefe($r['status'] === 200, 'E-Mail angenommen: ' . $adr);
}
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['rechnung_email' => 'x', 'p1_email' => '"a,b@evil.example"@beispiel.de']), true);
pruefe(isset($r['json']['fehler']['p1_email']), 'Anmeldung: mehrdeutige Adresse als Empfänger abgelehnt');
// Überlange Felder
$lang = ['p1_vorname' => str_repeat('a', 61), 'p1_nachname' => str_repeat('b', 61), 'p1_email' => str_repeat('c', 250) . '@x.de', 'strasse' => str_repeat('s', 101), 'ort' => str_repeat('o', 61), 'p1_telefon' => str_repeat('1', 31)];
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, $lang), true);
pruefe(array_keys($r['json']['fehler'] ?? []) == ['p1_vorname', 'p1_nachname', 'p1_email', 'p1_telefon', 'strasse', 'ort'], 'Anmeldung: alle Längengrenzen greifen');
$r = anfrage('/api/anmeldung.php', array_merge($betrieb, ['firma' => str_repeat('f', 121), 'ansprechperson' => str_repeat('a', 101), 'p2_vorname' => str_repeat('v', 61)]), true);
pruefe(isset($r['json']['fehler']['firma'], $r['json']['fehler']['ansprechperson'], $r['json']['fehler']['p2_vorname']), 'Betrieb/Person 2: Längengrenzen');
$r = anfrage('/api/kontakt.php', ['name' => str_repeat('n', 101), 'email' => 'jan@beispiel.de', 'thema' => 'allgemein', 'nachricht' => str_repeat('m', 2001), 'einwilligung' => '1'], true);
pruefe(isset($r['json']['fehler']['name'], $r['json']['fehler']['nachricht']), 'Kontakt: Name max. 100, Nachricht max. 2.000');
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['p1_vorname' => ['Array'], 'kurs' => ['testkurs']]), true);
pruefe($r['status'] === 422 && isset($r['json']['fehler']['p1_vorname'], $r['json']['fehler']['kurs']), 'Felder als Array → wie leer behandelt (keine PHP-Warnung)');
// Manipulierter Preis und Personenzahl
mails_leeren();
$r = anfrage('/api/anmeldung.php', array_merge($betrieb, ['gesamtpreis' => '0', 'rabattProzent' => '100', 'preis' => '-349']));
pruefe($r['status'] === 303 && str_contains(mails()[0]['text'] ?? '', 'Endpreis (alles inklusive): 942,30 €'), 'Preisfelder aus dem Formular ignoriert (3 Personen = 942,30 €)');
foreach (['0' => 1, '-3' => 1, '99999999999999999999' => null, '3abc' => 1] as $wert => $erwartet) {
    mails_leeren();
    $r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['personen' => (string) $wert]), true);
    pruefe($erwartet === null ? isset($r['json']['fehler']['personen']) : ($r['status'] === 200 && str_contains(mails()[0]['text'] ?? '', 'TEILNEHMENDE (1)')), "Personenzahl „{$wert}“ sicher behandelt");
}
// Fremder Termin, Grenzfälle Anmeldeschluss, Pfade im Kurs-Slug
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['termin' => 'e1']), true);
pruefe(($r['json']['fehler']['termin'] ?? '') === 'Bitte wähle einen Termin aus.', 'Termin eines anderen Kurses abgelehnt');
foreach (['../config', '../../etc/passwd', 'testkurs/../coaching', '%2e%2e%2fconfig', "testkurs\0", 'testkurs '] as $slug) {
    $r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['kurs' => $slug]), true);
    $bereinigt = in_array($slug, ['testkurs ', "testkurs\0"], true); // Steuerzeichen/Leerzeichen werden entfernt → gültiger Slug
    $erfuellt = $bereinigt ? $r['status'] === 200 : ($r['status'] === 422 && isset($r['json']['fehler']['kurs']));
    pruefe($erfuellt, 'Kurs-Slug ' . json_encode($slug) . ($bereinigt ? ' bereinigt und angenommen' : ' abgelehnt'));
}
$r = anfrage('/api/interesse.php', ['name' => 'Sara', 'email' => 'sara@beispiel.de', 'kurs' => '../config', 'einwilligung' => '1'], true);
pruefe(isset($r['json']['fehler']['kurs']), 'Interesse: Pfad als Kurs abgelehnt');
// Zeitfalle: manipulierte HMAC-Varianten
$ts = (string) (time() - 10);
$sig = hash_hmac('sha256', 'zeit:' . $ts, $geheim);
foreach ([
    'andere Zeit, alte Signatur' => ['ts' => (string) (time() - 20), 'sig' => $sig],
    'Großbuchstaben' => ['ts' => $ts, 'sig' => strtoupper($sig)],
    'gekürzt' => ['ts' => $ts, 'sig' => substr($sig, 0, 63)],
    'nur Signatur' => ['ts' => '', 'sig' => $sig],
    'nur Zeit' => ['ts' => $ts, 'sig' => ''],
    'Zeit mit Vorzeichen' => ['ts' => '+' . $ts, 'sig' => hash_hmac('sha256', 'zeit:+' . $ts, $geheim)],
    'Zukunft' => ['ts' => (string) (time() + 3600), 'sig' => 'x'],
    'Signatur als Array' => ['ts' => $ts, 'sig' => [$sig]],
    'ohne Geheimnis signiert' => ['ts' => $ts, 'sig' => hash_hmac('sha256', 'zeit:' . $ts, '')],
] as $fall => $felder) {
    $r = anfrage('/api/anmeldung.php', array_merge($gueltig, $felder), true);
    pruefe($r['status'] === 400 && ($r['json']['code'] ?? '') === 'zeitstempel', "Zeitfalle manipuliert ({$fall}) → 400");
}
$zukunft = (string) (time() + 3600);
$r = anfrage('/api/anmeldung.php', array_merge($gueltig, ['ts' => $zukunft, 'sig' => hash_hmac('sha256', 'zeit:' . $zukunft, $geheim)]), true);
pruefe($r['status'] === 429, 'gültig signierter Zeitstempel aus der Zukunft → zu schnell (429)');
// Zurück-Link nur pfad-relativ (kein //fremd.example)
foreach (['http://127.0.0.1:8080//boese.example/x' => '/', 'http://127.0.0.1:8080/\\boese.example' => '/', 'http://boese.example/anmeldung/' => '/', 'http://127.0.0.1:8080/anmeldung/?kurs=testkurs' => '/anmeldung/?kurs=testkurs'] as $ref => $ziel) {
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => "Content-Type: application/x-www-form-urlencoded\r\nReferer: $ref", 'content' => 'kurs=x', 'ignore_errors' => true]]);
    limit_leeren();
    $html = (string) @file_get_contents('http://127.0.0.1:8080/api/anmeldung.php', false, $ctx);
    pruefe(str_contains($html, 'href="' . htmlspecialchars($ziel, ENT_QUOTES | ENT_HTML5) . '">Zurück zum Formular'), "Zurück-Link bei Referer {$ref} → {$ziel}");
}
// XSS über Fehlerseite und Widerruf-Bestätigungsseite
$r = anfrage('/api/widerruf.php', ['name' => '"><img src=x onerror=alert(1)>', 'email' => 'lena@beispiel.de', 'vorgang' => 'A-20261113-7F3K', 'nachricht' => '</dd><script>alert(1)</script>', 'ts' => '"><script>', 'sig' => '']);
pruefe($r['status'] === 400 || ($r['status'] === 200 && !preg_match('/<script>|<img src=x/i', $r['text'])), 'Widerruf Schritt 1: Eingaben escaped');
$r = anfrage('/api/widerruf.php', ['name' => '"><img src=x onerror=alert(1)>', 'email' => 'lena@beispiel.de', 'vorgang' => 'A-20261113-7F3K', 'nachricht' => '</dd><script>alert(1)</script>']);
pruefe($r['status'] === 200 && !preg_match('/<script>|<img src=x/i', $r['text']) && str_contains($r['text'], '&lt;/dd&gt;&lt;script&gt;'), 'Widerruf Schritt 1 ohne Zeitfalle: Eingaben escaped');
// Keine CORS-Freigabe, JSON mit nosniff
$r = anfrage('/api/kontakt.php', ['name' => 'x'], true);
pruefe(!isset($r['kopf']['access-control-allow-origin']) && str_starts_with($r['kopf']['content-type'] ?? '', 'application/json') && ($r['kopf']['x-content-type-options'] ?? '') === 'nosniff', 'JSON-Antwort ohne CORS-Freigabe, mit nosniff');

gruppe('Globales Mail-Limit (300 bzw. 500 je 24 h)');
$kon24 = ['name' => 'Jan Peters', 'email' => 'jan@beispiel.de', 'thema' => 'allgemein', 'nachricht' => 'Frage zur AP1-Vorbereitung', 'einwilligung' => '1'];
limit_leeren();
mails_leeren();
anfrage('/api/kontakt.php', $kon24, false, 'POST', 8080, true);
$stand = json_decode((string) file_get_contents(DATEN . '/mails-24h.json'), true);
pruefe(is_array($stand) && count($stand) === 2 && array_filter($stand, 'is_int') === $stand, 'Zähler zählt Team-Mail + Bestätigung (nur Zeitpunkte)');
file_put_contents(DATEN . '/mails-24h.json', json_encode(array_fill(0, 299, time() - 60)));
mails_leeren();
$r = anfrage('/api/kontakt.php', $kon24, false, 'POST', 8080, true);
$m = mails();
pruefe($r['status'] === 303 && count($m) === 1 && ($m[0]['an'] ?? '') === 'info@waybuild-akademie.de', 'ab 300 Mails: nur noch die Team-Mail');
pruefe(str_contains($m[0]['text'] ?? '', 'NICHT versendet (Tageslimit von 300 Mails erreicht)'), 'Team-Mail mit Hinweis auf das Tageslimit');
file_put_contents(DATEN . '/mails-24h.json', json_encode(array_merge(array_fill(0, 500, time() - 60), array_fill(0, 50, time() - 90000))));
mails_leeren();
$r = anfrage('/api/kontakt.php', $kon24, true, 'POST', 8080, true);
pruefe($r['status'] === 503 && ($r['json']['code'] ?? '') === 'technik' && count(mails()) === 0, 'ab 500 Mails in 24 h (Flut): 503, kein Versand');
file_put_contents(DATEN . '/mails-24h.json', json_encode(array_fill(0, 600, time() - 90000)));
mails_leeren();
pruefe(anfrage('/api/kontakt.php', $kon24, false, 'POST', 8080, true)['status'] === 303 && count(mails()) === 2, 'Einträge älter als 24 h zählen nicht');
limit_leeren();

gruppe('Ohne Geheimnis: „fail closed“');
mails_leeren();
$r = anfrage('/api/kontakt.php', $kon24, false, 'POST', 8082);
pruefe($r['status'] === 503 && str_contains($r['text'], 'Gerade technisch nicht erreichbar – schreib uns an info@waybuild-akademie.de'), '503 mit freundlichem Text (ohne JS)');
$r = anfrage('/api/anmeldung.php', $gueltig, true, 'POST', 8082);
pruefe($r['status'] === 503 && ($r['json']['code'] ?? '') === 'technik', '503 als JSON (mit JS)');
pruefe(anfrage('/api/token.php', [], true, 'GET', 8082)['status'] === 503, 'token.php: 503 statt ungesichertem Zeitstempel');
pruefe(anfrage('/api/anmeldung.php', array_merge($gueltig, ['website' => 'x']), false, 'POST', 8082)['status'] === 503, 'auch das Lockfeld bekommt keinen Erfolg vorgetäuscht');
pruefe(count(mails()) === 0, 'kein Versand ohne Geheimnis');
pruefe(!is_dir('/t/konto2/akademie-daten'), 'kein Datenverzeichnis angelegt');

gruppe('Einheiten: IP-Schlüssel, Datenverzeichnis');
require API . '/_lib.php';
pruefe(ip_schluessel('203.0.113.7') === '203.0.113.7', 'IPv4 unverändert');
pruefe(ip_schluessel('2001:db8:1:2:aaaa::1') === ip_schluessel('2001:db8:1:2:ffff:1:2:3') && ip_schluessel('2001:db8:1:2::1') !== ip_schluessel('2001:db8:1:3::1'), 'IPv6 auf /64 gekürzt');
pruefe(ip_schluessel('::ffff:203.0.113.7') === '203.0.113.7', 'IPv4-mapped IPv6 zählt als IPv4');
pruefe(ip_schluessel('unbekannt') === 'unbekannt', 'unlesbare Adresse bleibt Schlüssel');
pruefe(is_file(DATEN . '/.htaccess') && trim((string) file_get_contents(DATEN . '/.htaccess')) === 'Require all denied', 'Datenverzeichnis per .htaccess gesperrt');
pruefe((fileperms(DATEN . '/formular-geheimnis.txt') & 0077) === 0, 'Geheimnis-Datei nur für das eigene Konto lesbar (0600)');

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
  php -S 127.0.0.1:8080 -t /t/konto/web -d sendmail_path=/t/sendmail.sh -d display_errors=1 -d error_reporting=-1 -d log_errors=1 -d error_log=/t/php.log >/t/server.log 2>&1 &
  php -S 127.0.0.1:8081 -t /t/konto/web -d sendmail_path=/bin/false -d display_errors=0 -d log_errors=1 -d error_log=/t/php.log >/t/server2.log 2>&1 &
  php -S 127.0.0.1:8082 -t /t/konto2/web -d sendmail_path=/t/sendmail.sh -d display_errors=1 -d error_reporting=-1 -d log_errors=1 -d error_log=/t/php.log >/t/server3.log 2>&1 &
  sleep 1
  php /t/test.php; s=$?
  if [ -s /t/php.log ] && grep -vE "Formular-Geheimnis neu erzeugt|Limit je Empfängeradresse erreicht|Kein Formular-Geheimnis verfügbar|Mail-Flut" /t/php.log | grep -q .; then echo "--- PHP-Protokoll (Warnungen = Fehler):"; cat /t/php.log; s=1; fi
  exit $s
'
