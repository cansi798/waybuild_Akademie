<?php
// Interesse vormerken (US-14, unverbindlich) mit Double-Opt-in (§ 7 Abs. 2 Nr. 2 UWG, Art. 7 Abs. 1 DSGVO):
// Schritt 1 (hier): Eingaben prüfen und NUR eine Bitte um Bestätigung an die angegebene Adresse schicken. Die Vormerkung
// steckt verschlüsselt im Link (doi_token) – der Server speichert nichts, das Team bekommt noch keine Mail.
// Schritt 2 (interesse-bestaetigen.php): Erst nach Klick auf „Vormerkung bestätigen“ geht die Vormerkung an info@.
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
$bestaetigen = bestaetigung_erlaubt($email);
$token = doi_token([
    'v' => 1, 'vorgang' => $vorgang, 't' => $eingang, 'kurs' => $kursId, 'name' => $name, 'email' => $email,
    'wunschzeitraum' => $wunschzeitraum, 'nachricht' => $nachricht,
]);

// Bitte um Bestätigung – ohne Freitext und ohne Namen (kein Spam-Relay): nur Kurstitel aus der Terminliste und der Link.
bestaetigung_senden($email, 'Bitte bestätige deine Vormerkung (' . $vorgang . ')', [
    'Hallo,',
    '',
    'jemand – hoffentlich du – möchte mit dieser E-Mail-Adresse benachrichtigt werden, sobald es Termine für',
    '„' . $kurs['titel'] . '“ gibt.',
    '',
    'Bitte bestätige das über diesen Link (gültig 7 Tage):',
    link_zu('api/interesse-bestaetigen.php?t=' . $token),
    '',
    'Erst nach deiner Bestätigung merken wir dich vor. Warst du das nicht, ignoriere diese E-Mail einfach –',
    'dann speichern wir nichts und schreiben dir nicht wieder.',
    '',
    'Vorgangsnummer: ' . $vorgang,
    'Eingang: ' . jetzt_text($eingang),
    'Datenschutzerklärung: ' . link_zu('datenschutz/'),
    '',
    'Viele Grüße',
    'dein Team der waybuild Akademie',
    '',
    ...FIRMA_ZEILEN,
], $k['absender']['info'], $bestaetigen);

weiter('danke/?art=interesse&vorgang=' . rawurlencode($vorgang), ['vorgang' => $vorgang]);
