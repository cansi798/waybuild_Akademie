<?php
// Zeitfalle: liefert einen HMAC-signierten Zeitstempel, den das Formular per JavaScript beim Laden abholt.
// Der Endpunkt prüft beim Absenden: Signatur gültig, frühestens 3 Sekunden alt, höchstens 6 Stunden alt.
// Ohne Geheimnis (siehe LIESMICH.md) antwortet der Endpunkt mit 503 – die Formulare versenden dann nichts.
declare(strict_types=1);
require __DIR__ . '/_lib.php';

$g = geheimnis(); // ohne Geheimnis: 503 („fail closed“)
$ts = (string) time();
json_antwort(200, ['ts' => $ts, 'sig' => zeitstempel_signatur($ts, $g)]);
