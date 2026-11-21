<?php
// Kontakt- und Beratungsanfrage (US-16): Name, E-Mail, optional Telefon, Thema, Nachricht, Kenntnisnahme Datenschutzhinweis (keine Einwilligung, Art. 6 Abs. 1 lit. b/f DSGVO) → info@.
// Zweite Art „anfrage“ (Kurzanfrage auf Startseite/Berufsseiten, Feld art=anfrage): unverbindliche Kursanfrage.
//   Felder: name, email (Pflicht); telefon, kurs (Slug aus der Terminliste), thema, nachricht (freiwillig).
//   Mailtexte: „Deine unverbindliche Kursanfrage“, nächster Schritt (Termin prüfen, verbindlich erst mit unserer
//   Buchungsbestätigung per E-Mail), Hinweis für Minderjährige. Danke-Seite: /danke/?art=anfrage.
declare(strict_types=1);
require __DIR__ . '/_lib.php';

nur_post();
$k = konfig();

const ARTEN = ['kontakt', 'anfrage'];
$art = einzeilig('art');
$art = in_array($art, ARTEN, true) ? $art : 'kontakt'; // unbekannte Werte → normales Kontaktformular
$anfrage = $art === 'anfrage';

if (spam_pruefen()) {
    weiter('danke/?art=' . $art);
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

$f = [];
$name = einzeilig('name');
$email = einzeilig('email');
$telefon = einzeilig('telefon');
$thema = einzeilig('thema');
$nachricht = mehrzeilig('nachricht');

pruefe_text($f, 'name', $name, 2, 100, FEHLER['name']);
pruefe_email($f, 'email', $email, FEHLER['email']);
pruefe_telefon($f, 'telefon', $telefon);
$kurs = null;
if ($anfrage) {
    // Kursanfrage: Thema und Nachricht freiwillig; Kurs nur aus der Terminliste übernehmen (nie Freitext)
    if ($thema !== '' && !isset(THEMEN[$thema])) {
        $f['thema'] = FEHLER['thema'];
    }
    $thema = isset(THEMEN[$thema]) ? $thema : 'beratung';
    $kursId = einzeilig('kurs');
    if ($kursId !== '') {
        $kurse = termine_laden();
        $kurs = is_array($kurse[$kursId] ?? null) && ($kurse[$kursId]['status'] ?? '') === 'freigegeben' ? $kurse[$kursId] : null;
        if ($kurs === null) {
            $f['kurs'] = FEHLER['kurs'];
        }
    }
    pruefe_text($f, 'nachricht', $nachricht, 0, 2000, FEHLER['nachricht'], false);
} else {
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
}

if ($f) {
    fehler_antwort(422, 'validierung', 'Bitte prüfe deine Angaben – ein paar Felder fehlen noch oder stimmen nicht.', $f);
}

$vorgang = vorgangsnummer('K');
$eingang = time();
$bestaetigen = bestaetigung_erlaubt($email);
$text = implode("\n", [
    ($anfrage ? 'KURSANFRAGE (unverbindlich – Termin prüfen, ggf. Buchungsangebot nach Vorlage A schicken)' : 'KONTAKT') . ' – Vorgang ' . $vorgang,
    'Eingang: ' . jetzt_text($eingang),
    bestaetigung_vermerk($bestaetigen),
    '',
    'Thema: ' . THEMEN[$thema],
    ...($anfrage ? ['Kurs: ' . ($kurs !== null ? $kurs['titel'] . ' (' . $kursId . ')' : '–')] : []),
    'Name: ' . $name,
    'E-Mail: ' . $email,
    'Telefon: ' . ($telefon !== '' ? $telefon : '–'),
    '',
    'NACHRICHT',
    $nachricht !== '' ? $nachricht : '–',
    '',
    json_block(['vorgang' => $vorgang, 'art' => $art, 'kurs' => $kurs !== null ? $kursId : null, 'eingang' => date('c', $eingang), 'thema' => $thema, 'name' => $name, 'email' => $email, 'telefon' => $telefon, 'nachricht' => $nachricht]),
]);

$postfach = $k['empfaenger']['kontakt'];
if (!mail_senden($postfach, ($anfrage ? 'Kursanfrage · ' . ($kurs['titel'] ?? THEMEN[$thema]) : 'Kontakt · ' . THEMEN[$thema]) . ' · ' . $name, $text, $k['absender']['info'], $email)) {
    versand_fehler($postfach);
}

// Bestätigung ohne Freitext und ohne Namen (kein Spam-Relay): nur feste Bausteine, Thema/Kurs aus festen Listen, Vorgangsnummer
$bausteine = $anfrage ? [
    'Hallo,',
    '',
    'danke für deine unverbindliche Kursanfrage. Sie ist bei uns eingegangen – Kosten oder eine Zahlungspflicht entstehen dadurch nicht.',
    '',
    ...($kurs !== null ? ['Kurs: ' . $kurs['titel']] : []),
    'Vorgangsnummer: ' . $vorgang,
    'Eingang: ' . jetzt_text($eingang),
    '',
    'SO GEHT ES WEITER',
    '1. Wir prüfen den passenden Termin und melden uns in der Regel innerhalb von zwei Werktagen per E-Mail.',
    '2. Möchtest du buchen, schicken wir dir ein Buchungsangebot mit allen Unterlagen; du sagst per Antwort-Mail zu.',
    '3. Verbindlich wird es erst mit deiner Zusage und unserer Buchungsbestätigung per E-Mail. Bis dahin kannst du jederzeit formlos absagen.',
    '',
    'Bist du noch nicht volljährig? Dann brauchen wir für die Buchung die Zustimmung deiner Eltern – oder dein Ausbildungsbetrieb meldet dich an.',
    '',
    'Teilnahmebedingungen: ' . link_zu('teilnahmebedingungen/'),
    'Datenschutzerklärung: ' . link_zu('datenschutz/'),
] : [
    'Hallo,',
    '',
    'danke für deine Nachricht. Wir antworten dir in der Regel innerhalb von zwei Werktagen.',
    '',
    'Thema: ' . THEMEN[$thema],
    'Vorgangsnummer: ' . $vorgang,
    'Eingang: ' . jetzt_text($eingang),
    '',
    'Datenschutzerklärung: ' . link_zu('datenschutz/'),
];
bestaetigung_senden(
    $email,
    ($anfrage ? 'Deine unverbindliche Kursanfrage' : 'Deine Nachricht ist angekommen') . ' (' . $vorgang . ')',
    array_merge($bausteine, ['', 'Viele Grüße', 'dein Team der waybuild Akademie', '', ...FIRMA_ZEILEN]),
    $k['absender']['info'],
    $bestaetigen,
);

weiter('danke/?art=' . $art . '&vorgang=' . rawurlencode($vorgang), ['vorgang' => $vorgang]);
