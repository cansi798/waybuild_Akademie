<?php
// Anmeldung zu einem Kurstermin (verbindlich, „Zahlungspflichtig anmelden“) und Coaching-Anfrage (unverbindlich, „Paket anfragen“).
// Ablauf laut Sequenzdiagramm (docs/04-architektur.md, Abschnitt 4): nur POST → Lockfeld → Rate-Limit/Zeitfalle →
// serverseitige Prüfung gegen die Terminliste (S-06) → Preis selbst berechnen → Mail an anmeldung@ → Eingangsbestätigung → 303.
declare(strict_types=1);
require __DIR__ . '/_lib.php';

nur_post();
$k = konfig();

if (spam_pruefen()) {
    weiter('danke/?art=anmeldung'); // Lockfeld ausgefüllt: wie Erfolg antworten, nichts senden
}

$kurse = termine_laden();
$f = [];

// ---- Kurs, Termin bzw. Paket (nie Werte aus dem Formular übernehmen, immer aus der Terminliste)
$kursId = einzeilig('kurs');
$kurs = $kurse[$kursId] ?? null;
if (!is_array($kurs) || ($kurs['status'] ?? '') !== 'freigegeben') {
    $kurs = null;
    $f['kurs'] = FEHLER['kurs'];
}
$coaching = $kurs !== null && ($kurs['art'] ?? '') === 'coaching';
$termin = null;
$paket = null;
if ($kurs !== null && !$coaching) {
    $terminId = einzeilig('termin');
    foreach ($kurs['termine'] ?? [] as $t) {
        if (($t['id'] ?? null) === $terminId) {
            $termin = $t;
        }
    }
    if ($terminId === '' || $termin === null) {
        $f['termin'] = FEHLER['termin'];
    } elseif (tage_bis((string) $termin['anmeldeschluss']) < 0) {
        $f['termin'] = FEHLER['terminGeschlossen']; // GR-01/GR-11: Anmeldeschluss vorbei
        $termin = null;
    }
}
if ($coaching) {
    $paketId = einzeilig('paket');
    foreach ($kurs['pakete'] ?? [] as $p) {
        if (($p['id'] ?? null) === $paketId) {
            $paket = $p;
        }
    }
    if ($paket === null) {
        $f['paket'] = FEHLER['paket'];
    }
}

// ---- Teilnehmende (1–5; die erste Person ist Ansprechperson)
$personenFeld = einzeilig('personen');
$anzahl = ctype_digit($personenFeld) ? (int) $personenFeld : 1;
if ($anzahl > MAX_PERSONEN || einzeilig('p6_vorname') . einzeilig('p6_email') !== '') {
    $f['personen'] = FEHLER['personenMax'];
}
$anzahl = max(1, min(MAX_PERSONEN, $anzahl));
for ($i = MAX_PERSONEN; $i > $anzahl; $i--) {
    if (einzeilig("p{$i}_vorname") . einzeilig("p{$i}_nachname") . einzeilig("p{$i}_email") !== '') {
        $anzahl = $i; // ohne JavaScript: ausgefüllte Personen zählen mit
        break;
    }
}
if ($coaching) {
    $anzahl = 1; // Coaching ist 1:1
}
$personen = [];
$gesehen = [];
for ($i = 1; $i <= $anzahl; $i++) {
    $p = ['vorname' => einzeilig("p{$i}_vorname"), 'nachname' => einzeilig("p{$i}_nachname"), 'email' => einzeilig("p{$i}_email")];
    if ($i === 1) {
        if ($p['vorname'] === '' || preg_match('/^\d+$/', $p['vorname']) || laenge($p['vorname']) > 60) {
            $f['p1_vorname'] = FEHLER['vorname'];
        }
        pruefe_text($f, 'p1_nachname', $p['nachname'], 1, 60, FEHLER['nachname']);
        pruefe_email($f, 'p1_email', $p['email'], FEHLER['email']);
        $p['telefon'] = einzeilig('p1_telefon');
        pruefe_telefon($f, 'p1_telefon', $p['telefon']);
    } else {
        $text = "Bitte ergänze Vorname, Nachname und E-Mail für Person {$i}.";
        foreach (['vorname', 'nachname', 'email'] as $teil) {
            if ($p[$teil] === '' || laenge($p[$teil]) > ($teil === 'email' ? 254 : 60) || ($teil === 'vorname' && preg_match('/^\d+$/', $p[$teil]))) {
                $f["p{$i}_{$teil}"] = $text;
            }
        }
        if ($p['email'] !== '' && !isset($f["p{$i}_email"]) && !email_ok($p['email'])) {
            $f["p{$i}_email"] = FEHLER['email'];
        }
    }
    $schluessel = mb_strtolower($p['email']);
    if ($p['email'] !== '' && !isset($f["p{$i}_email"])) {
        if (isset($gesehen[$schluessel])) {
            $f["p{$i}_email"] = FEHLER['emailDoppelt'];
        }
        $gesehen[$schluessel] = true;
    }
    $personen[] = $p;
}

// ---- Zahlweg und Rechnungsempfänger (GR-04)
$zahlweg = einzeilig('zahlweg');
$rechnung = [];
if ($zahlweg === 'selbst') {
    $rechnung = ['strasse' => einzeilig('strasse'), 'plz' => einzeilig('plz'), 'ort' => einzeilig('ort')];
    pruefe_text($f, 'strasse', $rechnung['strasse'], 3, 100, FEHLER['strasse']);
    pruefe_plz($f, 'plz', $rechnung['plz']);
    pruefe_text($f, 'ort', $rechnung['ort'], 2, 60, FEHLER['ort']);
} elseif ($zahlweg === 'betrieb') {
    $rechnung = [
        'firma' => einzeilig('firma'),
        'ansprechperson' => einzeilig('ansprechperson'),
        'strasse' => einzeilig('firma_strasse'),
        'plz' => einzeilig('firma_plz'),
        'ort' => einzeilig('firma_ort'),
        'email' => einzeilig('rechnung_email'),
        'bestellnummer' => einzeilig('bestellnummer'),
    ];
    pruefe_text($f, 'firma', $rechnung['firma'], 2, 120, FEHLER['firma']);
    pruefe_text($f, 'ansprechperson', $rechnung['ansprechperson'], 2, 100, FEHLER['ansprechperson']);
    pruefe_text($f, 'firma_strasse', $rechnung['strasse'], 3, 100, FEHLER['strasse']);
    pruefe_plz($f, 'firma_plz', $rechnung['plz']);
    pruefe_text($f, 'firma_ort', $rechnung['ort'], 2, 60, FEHLER['ort']);
    pruefe_email($f, 'rechnung_email', $rechnung['email'], FEHLER['rechnungEmail']);
    pruefe_text($f, 'bestellnummer', $rechnung['bestellnummer'], 0, 50, FEHLER['bestellnummer'], false);
} else {
    $f['zahlweg'] = FEHLER['zahlweg'];
}

// ---- Freitexte
$nachricht = mehrzeilig('nachricht');
pruefe_text($f, 'nachricht', $nachricht, 0, 2000, FEHLER['nachricht'], false);
$anliegen = $pruefungszeitraum = $wunschzeiten = '';
if ($coaching) {
    $anliegen = mehrzeilig('anliegen');
    pruefe_text($f, 'anliegen', $anliegen, 10, 2000, FEHLER['anliegen']);
    $pruefungszeitraum = einzeilig('pruefungszeitraum');
    pruefe_text($f, 'pruefungszeitraum', $pruefungszeitraum, 0, 100, FEHLER['pruefungszeitraum'], false);
    $wunschzeiten = einzeilig('wunschzeiten');
    pruefe_text($f, 'wunschzeiten', $wunschzeiten, 0, 200, FEHLER['wunschzeiten'], false);
}

// ---- Bestätigungen (Button-Lösung, Widerruf)
$agb = angehakt('agb');
$datenschutz = angehakt('datenschutz');
$wertersatz = angehakt('wertersatz');
if (!$coaching && !$agb) {
    $f['agb'] = FEHLER['agb'];
}
if (!$datenschutz) {
    $f['datenschutz'] = FEHLER['datenschutz'];
}
$tageBisStart = $termin !== null ? tage_bis((string) $termin['start']) : null;
$wertersatzPflicht = $tageBisStart !== null && $tageBisStart <= WIDERRUFSFRIST_TAGE;
if ($wertersatzPflicht && !$wertersatz) {
    $f['wertersatz'] = FEHLER['wertersatz'];
}

if ($f) {
    fehler_antwort(422, 'validierung', 'Bitte prüfe deine Angaben – ein paar Felder fehlen noch oder stimmen nicht.', $f);
}

// ---- Preis selbst berechnen (GR-03) – Werte aus dem Formular werden ignoriert
$einzel = (float) ($coaching ? $paket['betrag'] : $kurs['preis']);
$zwischensumme = round($einzel * $anzahl, 2);
$rabattProzent = $anzahl >= RABATT_AB_PERSONEN ? RABATT_PROZENT : 0;
$rabatt = round($zwischensumme * $rabattProzent / 100, 2);
$gesamt = round($zwischensumme - $rabatt, 2);

$art = $coaching ? 'coaching' : 'anmeldung';
$vorgang = vorgangsnummer($coaching ? 'C' : 'A');
$eingang = time();
$erste = $personen[0];

// ---- Text der Anmeldung (feste Reihenfolge, US-24)
$zeilen = [];
$zeilen[] = ($coaching ? 'COACHING-ANFRAGE (unverbindlich)' : 'ANMELDUNG (verbindlich, zahlungspflichtig)') . ' – Vorgang ' . $vorgang;
$zeilen[] = 'Eingang: ' . jetzt_text($eingang);
$zeilen[] = '';
$zeilen[] = 'KURS';
$zeilen[] = 'Kurs: ' . $kurs['titel'] . ' (' . $kursId . ')';
if ($coaching) {
    $zeilen[] = 'Paket: ' . $paket['name'] . ' – ' . $paket['beschreibung'];
    $zeilen[] = 'Prüfungszeitraum: ' . ($pruefungszeitraum ?: '–');
    $zeilen[] = 'Wunschzeiten: ' . ($wunschzeiten ?: '–');
} else {
    $zeilen[] = 'Termin: ' . datum_de($termin['start']) . ' – ' . datum_de($termin['ende']) . ' (' . $termin['id'] . ')';
    $zeilen[] = 'Zeiten: ' . $kurs['zeiten'];
    if (!empty($termin['pruefung'])) {
        $zeilen[] = 'IHK-Prüfung (Orientierung): ' . datum_de($termin['pruefung']);
    }
}
$zeilen[] = '';
$zeilen[] = 'TEILNEHMENDE (' . $anzahl . ')';
foreach ($personen as $i => $p) {
    $zeilen[] = ($i + 1) . '. ' . $p['vorname'] . ' ' . $p['nachname'] . ' <' . $p['email'] . '>'
        . ($i === 0 ? ' – Ansprechperson' . ($p['telefon'] !== '' ? ', Tel. ' . $p['telefon'] : '') : '');
}
$zeilen[] = '';
if ($zahlweg === 'selbst') {
    $zeilen[] = 'RECHNUNG AN: PRIVAT (Ich zahle selbst)';
    $zeilen[] = $erste['vorname'] . ' ' . $erste['nachname'];
    $zeilen[] = $rechnung['strasse'];
    $zeilen[] = $rechnung['plz'] . ' ' . $rechnung['ort'];
    $zeilen[] = 'Rechnung per E-Mail an: ' . $erste['email'];
} else {
    $zeilen[] = 'RECHNUNG AN: FIRMA (Mein Betrieb zahlt)';
    $zeilen[] = 'Firma: ' . $rechnung['firma'];
    $zeilen[] = 'Ansprechperson: ' . $rechnung['ansprechperson'];
    $zeilen[] = 'Anschrift: ' . $rechnung['strasse'] . ', ' . $rechnung['plz'] . ' ' . $rechnung['ort'];
    $zeilen[] = 'Rechnungs-E-Mail: ' . $rechnung['email'];
    $zeilen[] = 'Bestellnummer: ' . ($rechnung['bestellnummer'] !== '' ? $rechnung['bestellnummer'] : '–');
}
$zeilen[] = '';
$zeilen[] = 'PREIS (vom Server berechnet)';
$zeilen[] = ($coaching ? 'Paketpreis: ' : 'Teilnahmegebühr je Person: ') . euro($einzel);
if (!$coaching) {
    $zeilen[] = 'Personen: ' . $anzahl . ' – Zwischensumme ' . euro($zwischensumme);
    if ($rabattProzent > 0) {
        $zeilen[] = 'Gruppenrabatt ' . $rabattProzent . ' %: −' . euro($rabatt);
    }
}
$zeilen[] = 'Endpreis (alles inklusive): ' . euro($gesamt);
if (!empty($kurs['raten'])) {
    $zeilen[] = 'Ratenzahlung möglich – mit der Person absprechen.';
}
$zeilen[] = '';
$zeilen[] = 'BESTÄTIGUNGEN';
if (!$coaching) {
    $zeilen[] = 'Teilnahmebedingungen akzeptiert: ja';
}
$zeilen[] = 'Datenschutzerklärung und Widerrufsbelehrung gelesen: ja';
if (!$coaching) {
    $zeilen[] = 'Beginn vor Ablauf der Widerrufsfrist ausdrücklich verlangt (Wertersatz bekannt): '
        . ($wertersatz ? 'ja' : 'nein') . ' – Kursstart in ' . $tageBisStart . ' Tagen' . ($wertersatzPflicht ? ' (Pflicht)' : '');
}
if ($coaching) {
    $zeilen[] = '';
    $zeilen[] = 'ANLIEGEN';
    $zeilen[] = $anliegen;
}
$zeilen[] = '';
$zeilen[] = 'NACHRICHT';
$zeilen[] = $nachricht !== '' ? $nachricht : '–';
$zeilen[] = '';
$zeilen[] = json_block([
    'vorgang' => $vorgang,
    'art' => $art,
    'eingang' => date('c', $eingang),
    'kurs' => $kursId,
    'termin' => $termin['id'] ?? null,
    'paket' => $paket['id'] ?? null,
    'zahlweg' => $zahlweg,
    'personen' => array_map(fn ($p) => ['vorname' => $p['vorname'], 'nachname' => $p['nachname'], 'email' => $p['email']] + (isset($p['telefon']) && $p['telefon'] !== '' ? ['telefon' => $p['telefon']] : []), $personen),
    'rechnung' => $zahlweg === 'selbst'
        ? ['name' => $erste['vorname'] . ' ' . $erste['nachname'], 'strasse' => $rechnung['strasse'], 'plz' => $rechnung['plz'], 'ort' => $rechnung['ort'], 'email' => $erste['email']]
        : $rechnung,
    'rabattProzent' => $rabattProzent,
    'gesamtpreis' => $gesamt,
    'wertersatzVerlangt' => $wertersatz,
    'nachricht' => $nachricht,
] + ($coaching ? ['anliegen' => $anliegen, 'pruefungszeitraum' => $pruefungszeitraum, 'wunschzeiten' => $wunschzeiten] : []));

$betreff = $coaching
    ? 'Coaching-Anfrage · ' . $paket['name'] . ' · ' . $erste['vorname'] . ' ' . $erste['nachname']
    : 'Anmeldung · ' . $kurs['titel'] . ' · ' . datum_de($termin['start']);

$postfach = $k['empfaenger'][$art];
if (!mail_senden($postfach, $betreff, implode("\n", $zeilen), $k['absender']['anmeldung'], $erste['email'])) {
    versand_fehler($postfach);
}

// ---- Eingangsbestätigung an die Ansprechperson (Mailtext = Bestätigung auf dauerhaftem Datenträger)
$b = [];
$b[] = 'Hallo ' . $erste['vorname'] . ',';
$b[] = '';
if ($coaching) {
    $b[] = 'danke für deine Coaching-Anfrage. Sie ist bei uns eingegangen und noch unverbindlich: Der Vertrag kommt erst zustande, wenn wir gemeinsam die Termine abgestimmt haben.';
} else {
    $b[] = 'danke für deine Anmeldung. Mit dieser E-Mail bestätigen wir, dass sie bei uns eingegangen ist. Sie ist noch keine Annahme – der Vertrag kommt zustande, sobald wir dir die Anmeldung mit der Rechnung bestätigen.';
}
$b[] = '';
$b[] = 'Vorgangsnummer: ' . $vorgang;
$b[] = 'Eingang: ' . jetzt_text($eingang);
$b[] = '';
$b[] = 'DEINE ANGABEN';
$b[] = 'Kurs: ' . $kurs['titel'];
if ($coaching) {
    $b[] = 'Paket: ' . $paket['name'] . ' (' . $paket['beschreibung'] . ')';
    if ($wunschzeiten !== '') {
        $b[] = 'Wunschzeiten: ' . $wunschzeiten;
    }
} else {
    $b[] = 'Termin: ' . datum_de($termin['start']) . ' – ' . datum_de($termin['ende']) . ', ' . $kurs['zeiten'] . ', live online';
    if (!empty($kurs['ue'])) {
        $b[] = 'Umfang: ' . $kurs['ue'] . ' Unterrichtseinheiten (' . $kurs['dauer'] . ')';
    }
}
$b[] = 'Teilnehmende: ' . implode(', ', array_map(fn ($p) => $p['vorname'] . ' ' . $p['nachname'], $personen));
$b[] = 'Rechnung an: ' . ($zahlweg === 'selbst'
    ? $erste['vorname'] . ' ' . $erste['nachname'] . ', ' . $rechnung['strasse'] . ', ' . $rechnung['plz'] . ' ' . $rechnung['ort']
    : $rechnung['firma'] . ', ' . $rechnung['ansprechperson'] . ', ' . $rechnung['strasse'] . ', ' . $rechnung['plz'] . ' ' . $rechnung['ort'] . ' (' . $rechnung['email'] . ')');
if (!$coaching && $rabattProzent > 0) {
    $b[] = 'Preis: ' . $anzahl . ' × ' . euro($einzel) . ' = ' . euro($zwischensumme) . ', abzüglich ' . $rabattProzent . ' % Gruppenrabatt';
}
$b[] = 'Endpreis: ' . euro($gesamt) . ' – alles inklusive';
if (!empty($kurs['raten'])) {
    $b[] = 'Ratenzahlung möglich – sprechen wir nach der Anmeldung ab.';
}
if (!$coaching && $wertersatz) {
    $b[] = '';
    $b[] = 'Du hast ausdrücklich verlangt, dass wir vor Ablauf der Widerrufsfrist mit der Leistung beginnen. Dir ist bekannt, dass du bei einem Widerruf Wertersatz für bereits erbrachte Leistungen schuldest.';
}
$b[] = '';
$b[] = 'SO GEHT ES WEITER';
if ($coaching) {
    $b[] = '1. Wir melden uns per E-Mail und stimmen die Coaching-Termine mit dir ab.';
    $b[] = '2. Nach der Terminabstimmung: Rechnung folgt per E-Mail. Eine Online-Zahlung ist nicht nötig.';
    $b[] = 'Projektantrag, Dokumentation und alle Prüfungsleistungen erstellst du selbst – das Coaching ist Beratung, Rückmeldung und Training.';
} else {
    $b[] = '1. Rechnung folgt per E-Mail' . ($zahlweg === 'betrieb' ? ' an ' . $rechnung['email'] : '') . '. Eine Online-Zahlung ist nicht nötig.';
    $b[] = '2. Vor Kursstart bekommt jede teilnehmende Person den Zugang zum Live-Raum per E-Mail.';
}
$b[] = '';
$b[] = 'WICHTIGE LINKS';
$b[] = 'Teilnahmebedingungen: ' . link_zu('teilnahmebedingungen/');
$b[] = 'Widerrufsbelehrung und Online-Widerruf: ' . link_zu('widerruf/');
$b[] = 'Datenschutzerklärung: ' . link_zu('datenschutz/');
$b[] = '';
$b[] = 'Fragen oder etwas falsch eingetragen? Antworte einfach auf diese E-Mail.';
$b[] = '';
$b[] = 'Viele Grüße';
$b[] = 'dein Team der waybuild Akademie';

mail_senden(
    $erste['email'],
    ($coaching ? 'Deine Coaching-Anfrage ist angekommen' : 'Deine Anmeldung ist angekommen') . ' (' . $vorgang . ')',
    implode("\n", $b),
    $k['absender']['anmeldung'],
    $k['absender']['anmeldung'],
    true,
); // Schlägt nur die Bestätigung fehl, gilt die Anmeldung trotzdem als eingegangen (Architektur, Schritt 19–20)

weiter('danke/?art=' . $art . '&vorgang=' . rawurlencode($vorgang), ['vorgang' => $vorgang, 'gesamtpreis' => $gesamt]);
