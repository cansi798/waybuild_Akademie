<?php
// Elektronische Widerrufsfunktion (§ 356a BGB): Schritt 1 „Vertrag jetzt widerrufen“ → Schritt 2 „Widerruf bestätigen“.
// Pflicht sind nur Name, Vertragsangabe und E-Mail für die Bestätigung – ein Grund wird nicht verlangt.
// Danach: Mail an anmeldung@ und unverzüglich eine Eingangsbestätigung mit Inhalt, Datum und Uhrzeit an die Person.
// Ohne JavaScript zeigt Schritt 1 eine Bestätigungsseite (HTML) mit dem Knopf „Widerruf bestätigen“.
declare(strict_types=1);
require __DIR__ . '/_lib.php';

nur_post();
$k = konfig();

if (spam_pruefen()) {
    weiter('widerruf/');
}

$f = [];
$name = einzeilig('name');
$email = einzeilig('email');
$vertrag = einzeilig('vertrag');
$nachricht = mehrzeilig('nachricht');

pruefe_text($f, 'name', $name, 2, 100, FEHLER['name']);
pruefe_email($f, 'email', $email, FEHLER['email']);
pruefe_text($f, 'vertrag', $vertrag, 3, 200, FEHLER['vertrag']);
pruefe_text($f, 'nachricht', $nachricht, 0, 2000, FEHLER['nachricht'], false);

if ($f) {
    fehler_antwort(422, 'validierung', 'Bitte prüfe deine Angaben – ein paar Felder fehlen noch oder stimmen nicht.', $f);
}

// ---- Schritt 1 ohne JavaScript: Angaben zeigen und Bestätigung verlangen
if (einzeilig('schritt') !== '2') {
    if (will_json()) {
        json_antwort(200, ['ok' => true, 'schritt' => 2]);
    }
    $versteckt = '';
    foreach (['name' => $name, 'email' => $email, 'vertrag' => $vertrag, 'nachricht' => $nachricht, 'ts' => einzeilig('ts'), 'sig' => einzeilig('sig')] as $feld => $wert) {
        $versteckt .= '<input type="hidden" name="' . e($feld) . '" value="' . e($wert) . '">';
    }
    html_seite(200, 'Widerruf bestätigen', '<p>Bitte prüfe deine Angaben. Erst mit dem Knopf „Widerruf bestätigen“ schickst du den Widerruf ab.</p>'
        . '<div class="karte"><dl><dt>Name</dt><dd>' . e($name) . '</dd><dt>E-Mail für die Bestätigung</dt><dd>' . e($email) . '</dd>'
        . '<dt>Vertrag (Kurs und Termin, Anmeldedatum oder Vorgangsnummer)</dt><dd>' . e($vertrag) . '</dd>'
        . ($nachricht !== '' ? '<dt>Nachricht</dt><dd>' . e($nachricht) . '</dd>' : '') . '</dl></div>'
        . '<form method="post" action="' . e(pfad('api/widerruf.php')) . '">' . $versteckt
        . '<input type="hidden" name="schritt" value="2"><button type="submit">Widerruf bestätigen</button></form>'
        . '<p>Etwas falsch? Geh mit dem Zurück-Knopf deines Browsers zum Formular.</p>');
}

// ---- Schritt 2: Widerruf absenden
$vorgang = vorgangsnummer('W');
$eingang = time();
$eingangText = jetzt_text($eingang);
$inhalt = [
    'Name: ' . $name,
    'E-Mail: ' . $email,
    'Vertrag: ' . $vertrag,
    'Nachricht: ' . ($nachricht !== '' ? $nachricht : '–'),
];

$postfach = $k['empfaenger']['widerruf'];
$text = implode("\n", array_merge([
    'WIDERRUF über die Online-Widerrufsfunktion – Vorgang ' . $vorgang,
    'Eingang: ' . $eingangText,
    '',
    'Erklärung: Hiermit widerrufe ich den von mir abgeschlossenen Vertrag.',
], $inhalt, [
    '',
    'Bitte Widerruf prüfen, Erstattung veranlassen und der Person antworten (Reply-To).',
    '',
    json_block(['vorgang' => $vorgang, 'art' => 'widerruf', 'eingang' => date('c', $eingang), 'name' => $name, 'email' => $email, 'vertrag' => $vertrag, 'nachricht' => $nachricht]),
]));
if (!mail_senden($postfach, 'Widerruf · ' . $name . ' · Eingang ' . date('d.m.Y H:i', $eingang), $text, $k['absender']['anmeldung'], $email)) {
    versand_fehler($postfach);
}

mail_senden($email, 'Eingangsbestätigung deines Widerrufs (' . $vorgang . ')', implode("\n", array_merge([
    'Hallo ' . $name . ',',
    '',
    'wir haben deinen Widerruf am ' . $eingangText . ' erhalten.',
    'Diese E-Mail bestätigt nur den Eingang. Wir prüfen deinen Widerruf und melden uns bei dir.',
    '',
    'INHALT DEINES WIDERRUFS',
    'Erklärung: Hiermit widerrufe ich den von mir abgeschlossenen Vertrag.',
], $inhalt, [
    'Eingang: ' . $eingangText,
    'Vorgangsnummer: ' . $vorgang,
    '',
    'Widerrufsbelehrung: ' . link_zu('widerruf/'),
    '',
    'Viele Grüße',
    'dein Team der waybuild Akademie',
])), $k['absender']['anmeldung'], $k['absender']['anmeldung'], true);

if (will_json()) {
    json_antwort(200, ['ok' => true, 'eingang' => $eingangText, 'vorgang' => $vorgang]);
}
html_seite(200, 'Dein Widerruf ist eingegangen', '<p>Wir haben deinen Widerruf am <strong>' . e($eingangText) . '</strong> erhalten.</p>'
    . '<p>Eine Eingangsbestätigung mit dem Inhalt deines Widerrufs haben wir an <strong>' . e($email) . '</strong> geschickt. Wir prüfen deinen Widerruf und melden uns bei dir.</p>'
    . '<p>Vorgangsnummer: <strong>' . e($vorgang) . '</strong></p><p><a class="knopf" href="' . e(pfad('')) . '">Zur Startseite</a></p>');
