<?php
// Elektronische Widerrufsfunktion (§ 356a BGB): Schritt 1 „Vertrag jetzt widerrufen“ → Schritt 2 „Widerruf bestätigen“.
// Pflicht sind nur Name, E-Mail für die Bestätigung und eine Vertragsangabe (Kurs aus der Liste oder Vorgangsnummer) –
// ein Grund wird nicht verlangt. Danach: Mail an anmeldung@ (mit allem) und unverzüglich eine Eingangsbestätigung mit
// Inhalt, Datum und Uhrzeit an die Person – dort nur strukturierte, geprüfte Werte, nie Freitext (kein Spam-Relay).
// Ohne JavaScript zeigt Schritt 1 eine Bestätigungsseite (HTML) mit dem Knopf „Widerruf bestätigen“.
declare(strict_types=1);
require __DIR__ . '/_lib.php';

nur_post();
$k = konfig();

if (spam_pruefen()) {
    weiter('widerruf/');
}

$kurse = termine_laden();
$f = [];
$name = einzeilig('name');
$email = einzeilig('email');
$kursId = einzeilig('kurs');
$datum = einzeilig('anmeldedatum');
$vorgangAngabe = strtoupper(einzeilig('vorgang'));
$nachricht = mehrzeilig('nachricht');

pruefe_text($f, 'name', $name, 2, 100, FEHLER['name']);
pruefe_email($f, 'email', $email, FEHLER['email']);
$kurs = ($kursId !== '' && is_array($kurse[$kursId] ?? null) && ($kurse[$kursId]['status'] ?? '') === 'freigegeben') ? $kurse[$kursId] : null;
if ($kursId !== '' && $kurs === null) {
    $f['kurs'] = FEHLER['vertrag'];
}
if ($vorgangAngabe !== '' && !preg_match('/^[AC]-\d{8}-[A-HJ-NP-Z2-9]{4}$/', $vorgangAngabe)) {
    $f['vorgang'] = FEHLER['vorgang'];
}
if ($kursId === '' && $vorgangAngabe === '') {
    $f['kurs'] = FEHLER['vertrag'];
}
$datumDe = '';
if ($datum !== '') {
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $datum, new DateTimeZone('Europe/Berlin'));
    $tage = $d ? (int) heute()->diff($d)->format('%r%a') : 1;
    if (!$d || $d->format('Y-m-d') !== $datum || $tage > 0 || $tage < -400) {
        $f['anmeldedatum'] = FEHLER['anmeldedatum'];
    } else {
        $datumDe = $d->format('d.m.Y');
    }
}
pruefe_text($f, 'nachricht', $nachricht, 0, 2000, FEHLER['nachricht'], false);

if ($f) {
    fehler_antwort(422, 'validierung', 'Bitte prüfe deine Angaben – ein paar Felder fehlen noch oder stimmen nicht.', $f);
}

// Strukturierter Inhalt (nur geprüfte Werte) – erscheint in der Eingangsbestätigung
$inhalt = ['Erklärung: Hiermit widerrufe ich den von mir abgeschlossenen Vertrag.'];
if ($kurs !== null) {
    $inhalt[] = 'Kurs: ' . $kurs['titel'];
}
if ($datumDe !== '') {
    $inhalt[] = 'Anmeldedatum: ' . $datumDe;
}
if ($vorgangAngabe !== '') {
    $inhalt[] = 'Vorgangsnummer der Anmeldung: ' . $vorgangAngabe;
}

// ---- Schritt 1 ohne JavaScript: Angaben zeigen und Bestätigung verlangen (Antwort an den Browser, keine Mail)
if (einzeilig('schritt') !== '2') {
    if (will_json()) {
        json_antwort(200, ['ok' => true, 'schritt' => 2]);
    }
    $versteckt = '';
    foreach (['name' => $name, 'email' => $email, 'kurs' => $kursId, 'anmeldedatum' => $datum, 'vorgang' => $vorgangAngabe, 'nachricht' => $nachricht, 'ts' => einzeilig('ts'), 'sig' => einzeilig('sig')] as $feld => $wert) {
        $versteckt .= '<input type="hidden" name="' . e($feld) . '" value="' . e($wert) . '">';
    }
    $liste = '<dt>Name</dt><dd>' . e($name) . '</dd><dt>E-Mail für die Bestätigung</dt><dd>' . e($email) . '</dd>';
    foreach (array_slice($inhalt, 1) as $z) {
        [$titel, $wert] = explode(': ', $z, 2);
        $liste .= '<dt>' . e($titel) . '</dt><dd>' . e($wert) . '</dd>';
    }
    if ($nachricht !== '') {
        $liste .= '<dt>Nachricht</dt><dd>' . e($nachricht) . '</dd>';
    }
    html_seite(200, 'Widerruf bestätigen', '<p>Bitte prüfe deine Angaben. Erst mit dem Knopf „Widerruf bestätigen“ schickst du den Widerruf ab.</p>'
        . '<div class="karte"><dl>' . $liste . '</dl></div>'
        . '<form method="post" action="' . e(pfad('api/widerruf.php')) . '">' . $versteckt
        . '<input type="hidden" name="schritt" value="2"><button type="submit">Widerruf bestätigen</button></form>'
        . '<p>Etwas falsch? <a href="' . e(zurueck_adresse()) . '">Zurück zum Formular</a> – oder mit dem Zurück-Knopf deines Browsers.</p>');
}

// ---- Schritt 2: Widerruf absenden
$vorgang = vorgangsnummer('W');
$eingang = time();
$eingangText = jetzt_text($eingang);
$bestaetigen = bestaetigung_erlaubt($email, 'empfaenger-widerruf'); // eigener Zähler, siehe _lib.php

$postfach = $k['empfaenger']['widerruf'];
$text = implode("\n", array_merge([
    'WIDERRUF über die Online-Widerrufsfunktion – Vorgang ' . $vorgang,
    'Eingang: ' . $eingangText,
    bestaetigung_vermerk($bestaetigen),
    '',
    'Name: ' . $name,
    'E-Mail: ' . $email,
], $inhalt, [
    'Nachricht: ' . ($nachricht !== '' ? $nachricht : '–'),
    '',
    'Bitte Widerruf prüfen, Erstattung veranlassen und der Person antworten (Reply-To).',
    '',
    json_block(['vorgang' => $vorgang, 'art' => 'widerruf', 'eingang' => date('c', $eingang), 'name' => $name, 'email' => $email,
        'kurs' => $kurs !== null ? $kursId : null, 'anmeldedatum' => $datum !== '' ? $datum : null, 'anmeldungVorgang' => $vorgangAngabe !== '' ? $vorgangAngabe : null, 'nachricht' => $nachricht]),
]));
if (!mail_senden($postfach, 'Widerruf · Eingang ' . date('d.m.Y H:i', $eingang) . ' · ' . $vorgang, $text, $k['absender']['anmeldung'], $email)) {
    versand_fehler($postfach);
}

// Eingangsbestätigung (dauerhafter Datenträger): Inhalt, Datum und Uhrzeit – ohne Freitext und ohne Namen
$gesendet = bestaetigung_senden($email, 'Eingangsbestätigung deines Widerrufs (' . $vorgang . ')', array_merge([
    'Hallo,',
    '',
    'wir haben deinen Widerruf am ' . $eingangText . ' erhalten.',
    'Diese E-Mail bestätigt nur den Eingang. Wir prüfen deinen Widerruf und melden uns bei dir.',
    '',
    'INHALT DEINES WIDERRUFS',
], $inhalt, [
    'Eingang: ' . $eingangText,
    'Vorgangsnummer des Widerrufs: ' . $vorgang,
    '',
    'Widerrufsbelehrung: ' . link_zu('widerruf/'),
    '',
    'Viele Grüße',
    'dein Team der waybuild Akademie',
]), $k['absender']['anmeldung'], $bestaetigen);

if (will_json()) {
    json_antwort(200, ['ok' => true, 'eingang' => $eingangText, 'vorgang' => $vorgang, 'bestaetigung' => $gesendet]);
}
html_seite(200, 'Dein Widerruf ist eingegangen', '<p>Wir haben deinen Widerruf am <strong>' . e($eingangText) . '</strong> erhalten.</p>'
    . ($gesendet
        ? '<p>Eine Eingangsbestätigung mit dem Inhalt deines Widerrufs haben wir an <strong>' . e($email) . '</strong> geschickt. Wir prüfen deinen Widerruf und melden uns bei dir.</p>'
        : '<p>Die Eingangsbestätigung per E-Mail an <strong>' . e($email) . '</strong> schicken wir dir gesondert. Bitte bewahre diese Seite (oder einen Screenshot) mit Datum, Uhrzeit und Vorgangsnummer auf. Wir prüfen deinen Widerruf und melden uns bei dir.</p>')
    . '<p>Vorgangsnummer: <strong>' . e($vorgang) . '</strong></p><p><a class="knopf" href="' . e(pfad('')) . '">Zur Startseite</a></p>');
