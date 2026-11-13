<?php
// Kontakt- und Beratungsanfrage (US-16): Name, E-Mail, optional Telefon, Thema, Nachricht, Einwilligung → info@.
declare(strict_types=1);
require __DIR__ . '/_lib.php';

nur_post();
$k = konfig();

if (spam_pruefen()) {
    weiter('danke/?art=kontakt');
}

const THEMEN = [
    'allgemein' => 'Allgemeine Frage',
    'beratung' => 'Beratung zur Kurswahl',
    'betrieb' => 'Anmeldung für meinen Betrieb',
    'coaching' => 'Prüfungscoaching',
];

$f = [];
$name = einzeilig('name');
$email = einzeilig('email');
$telefon = einzeilig('telefon');
$thema = einzeilig('thema');
$nachricht = mehrzeilig('nachricht');

pruefe_text($f, 'name', $name, 2, 100, FEHLER['name']);
pruefe_email($f, 'email', $email, FEHLER['email']);
pruefe_telefon($f, 'telefon', $telefon);
if (!isset(THEMEN[$thema])) {
    $f['thema'] = FEHLER['thema'];
}
if ($nachricht === '' || laenge($nachricht) < 10) {
    $f['nachricht'] = FEHLER['kontaktNachricht'];
} elseif (laenge($nachricht) > 2000) {
    $f['nachricht'] = FEHLER['nachricht'];
}
if (!angehakt('einwilligung')) {
    $f['einwilligung'] = FEHLER['einwilligungKontakt'];
}

if ($f) {
    fehler_antwort(422, 'validierung', 'Bitte prüfe deine Angaben – ein paar Felder fehlen noch oder stimmen nicht.', $f);
}

$vorgang = vorgangsnummer('K');
$eingang = time();
$text = implode("\n", [
    'KONTAKT – Vorgang ' . $vorgang,
    'Eingang: ' . jetzt_text($eingang),
    '',
    'Thema: ' . THEMEN[$thema],
    'Name: ' . $name,
    'E-Mail: ' . $email,
    'Telefon: ' . ($telefon !== '' ? $telefon : '–'),
    '',
    'NACHRICHT',
    $nachricht,
    '',
    json_block(['vorgang' => $vorgang, 'art' => 'kontakt', 'eingang' => date('c', $eingang), 'thema' => $thema, 'name' => $name, 'email' => $email, 'telefon' => $telefon, 'nachricht' => $nachricht]),
]);

$postfach = $k['empfaenger']['kontakt'];
if (!mail_senden($postfach, 'Kontakt · ' . THEMEN[$thema] . ' · ' . $name, $text, $k['absender']['info'], $email)) {
    versand_fehler($postfach);
}

// Bestätigung ohne Freitext und ohne Namen (kein Spam-Relay): nur Thema aus der festen Liste und Vorgangsnummer
bestaetigung_senden($email, 'Deine Nachricht ist angekommen (' . $vorgang . ')', [
    'Hallo,',
    '',
    'danke für deine Nachricht. Wir antworten dir in der Regel innerhalb von zwei Werktagen.',
    '',
    'Thema: ' . THEMEN[$thema],
    'Vorgangsnummer: ' . $vorgang,
    'Eingang: ' . jetzt_text($eingang),
    '',
    'Datenschutzerklärung: ' . link_zu('datenschutz/'),
    '',
    'Viele Grüße',
    'dein Team der waybuild Akademie',
], $k['absender']['info']);

weiter('danke/?art=kontakt&vorgang=' . rawurlencode($vorgang), ['vorgang' => $vorgang]);
