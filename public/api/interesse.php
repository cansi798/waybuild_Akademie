<?php
// Interesse vormerken (US-14, unverbindlich): Name, E-Mail, Kurs, optional Wunschzeitraum und Nachricht, Einwilligung.
// Mail an info@ und Eingangsbestätigung an die Person. Gespeichert wird nichts (die Liste führt das Backoffice im Postfach).
declare(strict_types=1);
require __DIR__ . '/_lib.php';

nur_post();
$k = konfig();

if (spam_pruefen()) {
    weiter('danke/?art=interesse');
}

$kurse = termine_laden();
$f = [];

$name = einzeilig('name');
$email = einzeilig('email');
$kursId = einzeilig('kurs');
$kurs = $kurse[$kursId] ?? null;
$wunschzeitraum = einzeilig('wunschzeitraum');
$nachricht = mehrzeilig('nachricht');

pruefe_text($f, 'name', $name, 2, 100, FEHLER['name']);
pruefe_email($f, 'email', $email, FEHLER['email']);
if (!is_array($kurs) || ($kurs['status'] ?? '') !== 'freigegeben') {
    $f['kurs'] = FEHLER['kurs'];
}
pruefe_text($f, 'wunschzeitraum', $wunschzeitraum, 0, 100, FEHLER['wunschzeitraum'], false);
pruefe_text($f, 'nachricht', $nachricht, 0, 2000, FEHLER['nachricht'], false);
if (!angehakt('einwilligung')) {
    $f['einwilligung'] = FEHLER['einwilligungInteresse'];
}

if ($f) {
    fehler_antwort(422, 'validierung', 'Bitte prüfe deine Angaben – ein paar Felder fehlen noch oder stimmen nicht.', $f);
}

$vorgang = vorgangsnummer('I');
$eingang = time();
$text = implode("\n", [
    'INTERESSE (unverbindlich) – Vorgang ' . $vorgang,
    'Eingang: ' . jetzt_text($eingang),
    '',
    'Kurs: ' . $kurs['titel'] . ' (' . $kursId . ')',
    'Name: ' . $name,
    'E-Mail: ' . $email,
    'Wunschzeitraum: ' . ($wunschzeitraum !== '' ? $wunschzeitraum : '–'),
    'Einwilligung zur Benachrichtigung per E-Mail: ja (' . jetzt_text($eingang) . ')',
    '',
    'NACHRICHT',
    $nachricht !== '' ? $nachricht : '–',
    '',
    json_block(['vorgang' => $vorgang, 'art' => 'interesse', 'eingang' => date('c', $eingang), 'kurs' => $kursId, 'name' => $name, 'email' => $email, 'wunschzeitraum' => $wunschzeitraum, 'einwilligungBenachrichtigung' => true, 'nachricht' => $nachricht]),
]);

$postfach = $k['empfaenger']['interesse'];
if (!mail_senden($postfach, 'Interesse · ' . $kurs['titel'], $text, $k['absender']['info'], $email)) {
    versand_fehler($postfach);
}

// Bestätigung ohne Freitext und ohne Namen (kein Spam-Relay): nur Kurstitel aus der Terminliste und Vorgangsnummer
bestaetigung_senden($email, 'Dein Interesse ist vorgemerkt (' . $vorgang . ')', [
    'Hallo,',
    '',
    'danke für dein Interesse an „' . $kurs['titel'] . '“. Wir melden uns, sobald Termine feststehen.',
    'Die Vormerkung ist unverbindlich und kostenlos.',
    '',
    'Vorgangsnummer: ' . $vorgang,
    'Eingang: ' . jetzt_text($eingang),
    '',
    'Du möchtest keine Nachricht mehr von uns? Antworte einfach auf diese E-Mail – dann löschen wir deine Vormerkung.',
    'Datenschutzerklärung: ' . link_zu('datenschutz/'),
    '',
    'Viele Grüße',
    'dein Team der waybuild Akademie',
], $k['absender']['info']);

weiter('danke/?art=interesse&vorgang=' . rawurlencode($vorgang), ['vorgang' => $vorgang]);
