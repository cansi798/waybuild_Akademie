<?php
// Double-Opt-in, Schritt 2 (Interesse vormerken): GET zeigt nur eine Seite mit dem Knopf „Vormerkung bestätigen“
// (Mail-Programme und Virenscanner rufen Links automatisch ab – ein GET darf deshalb nichts auslösen).
// Erst der POST bestätigt: Dann geht die Vormerkung mit beiden Zeitpunkten (Anfrage, Bestätigung) als Nachweis an info@.
declare(strict_types=1);
require __DIR__ . '/_lib.php';

$k = konfig();
$methode = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($methode !== 'GET' && $methode !== 'POST') {
    http_response_code(405);
    header('Allow: GET, POST');
    exit;
}
geheimnis(); // fail closed
$token = $methode === 'POST' ? roh('t') : (string) ($_GET['t'] ?? '');
$d = doi_lesen($token);
$kurse = termine_laden();
$kurs = is_array($d) ? ($kurse[(string) ($d['kurs'] ?? '')] ?? null) : null;

if ($d === null || !is_array($kurs)) {
    html_seite(400, 'Link ungültig oder abgelaufen', '<p>Dieser Bestätigungslink ist nicht mehr gültig (er gilt 7 Tage) oder unvollständig.</p>'
        . '<p>Du kannst dich jederzeit neu vormerken.</p><p><a class="knopf" href="' . e(pfad('interesse/')) . '">Interesse vormerken</a></p>');
}

if ($methode === 'GET') {
    html_seite(200, 'Vormerkung bestätigen', '<p>Bitte bestätige, dass wir dich per E-Mail benachrichtigen dürfen, sobald es Termine für diesen Kurs gibt:</p>'
        . '<div class="karte"><dl><dt>Kurs</dt><dd>' . e((string) $kurs['titel']) . '</dd><dt>Vorgangsnummer</dt><dd>' . e((string) $d['vorgang']) . '</dd></dl></div>'
        . '<form method="post" action="' . e(pfad('api/interesse-bestaetigen.php')) . '"><input type="hidden" name="t" value="' . e($token) . '">'
        . '<button type="submit">Vormerkung bestätigen</button></form>'
        . '<p>Du kannst die Einwilligung jederzeit widerrufen – eine kurze E-Mail an ' . e((string) $k['empfaenger']['interesse']) . ' genügt.</p>');
}

rate_limit_pruefen();
$jetzt = time();
$text = implode("\n", [
    'INTERESSE (unverbindlich, per Double-Opt-in bestätigt) – Vorgang ' . $d['vorgang'],
    'Eingang der Vormerkung: ' . jetzt_text((int) $d['t']),
    'Bestätigt über den Link: ' . jetzt_text($jetzt),
    '',
    'Kurs: ' . $kurs['titel'] . ' (' . $d['kurs'] . ')',
    'Name: ' . (string) $d['name'],
    'E-Mail: ' . (string) $d['email'],
    'Wunschzeitraum: ' . ((string) $d['wunschzeitraum'] !== '' ? (string) $d['wunschzeitraum'] : '–'),
    'Einwilligung zur Benachrichtigung per E-Mail: ja (erteilt ' . jetzt_text((int) $d['t']) . ', bestätigt ' . jetzt_text($jetzt) . ')',
    '',
    'NACHRICHT',
    (string) $d['nachricht'] !== '' ? (string) $d['nachricht'] : '–',
    '',
    json_block(['vorgang' => $d['vorgang'], 'art' => 'interesse', 'eingang' => date('c', (int) $d['t']), 'bestaetigt' => date('c', $jetzt),
        'kurs' => $d['kurs'], 'name' => $d['name'], 'email' => $d['email'], 'wunschzeitraum' => $d['wunschzeitraum'],
        'einwilligungBenachrichtigung' => true, 'doubleOptIn' => true, 'nachricht' => $d['nachricht']]),
]);
$postfach = $k['empfaenger']['interesse'];
if (!mail_senden($postfach, 'Interesse · ' . $kurs['titel'], $text, $k['absender']['info'], (string) $d['email'])) {
    html_seite(500, 'Das hat leider nicht geklappt', '<p>Die Bestätigung konnte nicht übermittelt werden. Bitte schreib uns an ' . e($postfach) . '.</p>');
}
html_seite(200, 'Danke – du bist vorgemerkt', '<p>Wir melden uns per E-Mail, sobald es Termine für „' . e((string) $kurs['titel']) . '“ gibt. Die Vormerkung ist unverbindlich und kostenlos.</p>'
    . '<p>Keine Nachricht mehr gewünscht? Eine kurze E-Mail an ' . e($postfach) . ' genügt – dann löschen wir deine Vormerkung.</p>'
    . '<p><a class="knopf" href="' . e(pfad('kurse/')) . '">Zu den Kursen</a></p>');
