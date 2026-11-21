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
    // Kurzanfrage der Startseite / Berufsseiten (Can #6771): Bereich + optional Kurs, Nachricht freiwillig
    'pruefung' => 'Anfrage Prüfungsvorbereitung',
    'ihk-weiterbildung' => 'Anfrage IHK-Weiterbildung',
    'akademie' => 'Anfrage waybuild Weiterbildung',
];
const ANFRAGE_THEMEN = ['pruefung', 'ihk-weiterbildung', 'akademie'];

$f = [];
$name = einzeilig('name');
$email = einzeilig('email');
$telefon = einzeilig('telefon');
$thema = einzeilig('thema');
$nachricht = mehrzeilig('nachricht');
$kursId = einzeilig('kurs');
$istAnfrage = in_array($thema, ANFRAGE_THEMEN, true);
$kursTitel = '';

pruefe_text($f, 'name', $name, 2, 100, FEHLER['name']);
pruefe_email($f, 'email', $email, FEHLER['email']);
pruefe_telefon($f, 'telefon', $telefon);
if (!isset(THEMEN[$thema])) {
    $f['thema'] = FEHLER['thema'];
}
if ($istAnfrage && $nachricht === '') {
    // Kurzanfrage: Nachricht freiwillig
} elseif (!$istAnfrage && ($nachricht === '' || laenge($nachricht) < 10)) {
    $f['nachricht'] = FEHLER['kontaktNachricht'];
} elseif (laenge($nachricht) > 2000) {
    $f['nachricht'] = FEHLER['nachricht'];
}
if (!angehakt('einwilligung')) {
    $f['einwilligung'] = FEHLER['einwilligungKontakt'];
}
// Kurs (freiwillig, nur bei der Kurzanfrage): muss in der Terminliste stehen – nie Freitext übernehmen
if ($kursId !== '') {
    $kurs = $istAnfrage ? (termine_laden()[$kursId] ?? null) : null;
    if (!is_array($kurs)) {
        $f['kurs'] = FEHLER['kurs'];
    } else {
        $kursTitel = (string) $kurs['titel'];
    }
}

if ($f) {
    fehler_antwort(422, 'validierung', 'Bitte prüfe deine Angaben – ein paar Felder fehlen noch oder stimmen nicht.', $f);
}

$vorgang = vorgangsnummer('K');
$eingang = time();
$bestaetigen = bestaetigung_erlaubt($email);
$text = implode("\n", [
    'KONTAKT – Vorgang ' . $vorgang,
    'Eingang: ' . jetzt_text($eingang),
    bestaetigung_vermerk($bestaetigen),
    '',
    'Thema: ' . THEMEN[$thema],
    'Kurs: ' . ($kursTitel !== '' ? $kursTitel . ' (' . $kursId . ')' : '–'),
    'Name: ' . $name,
    'E-Mail: ' . $email,
    'Telefon: ' . ($telefon !== '' ? $telefon : '–'),
    '',
    'NACHRICHT',
    $nachricht !== '' ? $nachricht : '–',
    '',
    json_block(['vorgang' => $vorgang, 'art' => 'kontakt', 'eingang' => date('c', $eingang), 'thema' => $thema, 'kurs' => $kursId, 'name' => $name, 'email' => $email, 'telefon' => $telefon, 'nachricht' => $nachricht]),
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
    ...($kursTitel !== '' ? ['Kurs: ' . $kursTitel] : []),
    'Vorgangsnummer: ' . $vorgang,
    'Eingang: ' . jetzt_text($eingang),
    '',
    'Datenschutzerklärung: ' . link_zu('datenschutz/'),
    '',
    'Viele Grüße',
    'dein Team der waybuild Akademie',
], $k['absender']['info'], $bestaetigen);

weiter('danke/?art=kontakt&vorgang=' . rawurlencode($vorgang), ['vorgang' => $vorgang]);
