<?php
// Einstellungen für die Formular-Endpunkte der waybuild Akademie (ALL-INKL).
// Hier stehen KEINE Geheimnisse – das Repository ist öffentlich. Das Formular-Geheimnis liegt außerhalb des
// Webroots (siehe 'geheimnis_datei' und public/api/LIESMICH.md).
declare(strict_types=1);

if (isset($_SERVER['SCRIPT_FILENAME']) && realpath((string) $_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    http_response_code(404);
    exit;
}

// Konto-Verzeichnis oberhalb des Webroots: …/waybuild-akademie.de/api/ → … (zwei Ebenen höher)
$ausserhalb = dirname(__DIR__, 2) . '/akademie-daten';

return [
    // Empfänger (S-05): Anmeldung, Coaching und Widerruf → anmeldung@ · Interesse und Kontakt → info@
    'empfaenger' => [
        'anmeldung' => 'anmeldung@waybuild-akademie.de',
        'coaching'  => 'anmeldung@waybuild-akademie.de',
        'widerruf'  => 'anmeldung@waybuild-akademie.de',
        'interesse' => 'info@waybuild-akademie.de',
        'kontakt'   => 'info@waybuild-akademie.de',
    ],
    // Absender der Eingangsbestätigungen (Postfach bei ALL-INKL, sonst landen Mails im Spam)
    'absender' => [
        'anmeldung' => 'anmeldung@waybuild-akademie.de',
        'info'      => 'info@waybuild-akademie.de',
    ],
    'absender_name' => 'waybuild Akademie',
    // Absolute Adresse für Links in E-Mails und Basis-Pfad für Weiterleitungen (live: "/")
    'website' => 'https://waybuild-akademie.de',
    'basis'   => '/',
    // Terminliste aus dem Build (S-06) – liegt im Webroot neben diesem Skript
    'termine_datei' => __DIR__ . '/termine.json',
    // Außerhalb des Webroots: Formular-Geheimnis und Rate-Limit-Hashes (TTL 1 h). Keine Formulardaten!
    'datenverzeichnis' => $ausserhalb,
    'geheimnis_datei'  => $ausserhalb . '/formular-geheimnis.txt',
    // Spam-Schutz
    'min_sekunden'     => 3,          // Zeitfalle: frühestens 3 s nach dem Laden absenden
    'max_alter'        => 2 * 86400,  // Formular-Zeitstempel gilt 2 Tage
    'rate_limit_max'   => 15,         // höchstens 15 Absendungen je Stunde und Anschluss (IP-Hash)
    'rate_limit_fenster' => 3600,
    'bestaetigungen_je_adresse' => 3, // höchstens 3 Eingangsbestätigungen je Empfängeradresse und Stunde
];
