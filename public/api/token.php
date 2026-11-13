<?php
// Zeitfalle: liefert einen HMAC-signierten Zeitstempel, den das Formular per JavaScript beim Laden abholt.
// Der Endpunkt prüft beim Absenden: Signatur gültig, frühestens 3 Sekunden alt, höchstens 2 Tage alt.
// Ohne Geheimnis (siehe LIESMICH.md) kommt { "ts": null } zurück – die Formulare funktionieren dann ohne Zeitfalle.
declare(strict_types=1);
require __DIR__ . '/_lib.php';

$g = geheimnis();
$ts = (string) time();
json_antwort(200, $g === null ? ['ts' => null, 'sig' => null] : ['ts' => $ts, 'sig' => zeitstempel_signatur($ts, $g)]);
