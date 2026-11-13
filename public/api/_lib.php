<?php
// Gemeinsame Bausteine der Formular-Endpunkte (PHP 8.x, ohne Composer):
// nur POST, Spam-Schutz (Lockfeld, signierte Zeitfalle, Rate-Limit je IP-Hash), Eingaben bereinigen und prüfen,
// Mails sicher aufbauen (keine eingeschleusten Kopfzeilen), Antworten als 303/HTML (ohne JavaScript) oder JSON (fetch).
// Regeln und Fehlertexte entsprechen src/lib/formular.ts (Spezifikation 5.4) – bei Änderungen beide Seiten anpassen.
declare(strict_types=1);

if (isset($_SERVER['SCRIPT_FILENAME']) && realpath((string) $_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    http_response_code(404);
    exit;
}

// Nie PHP-Warnungen, Pfade oder Stacktraces an Besucher ausgeben – nur ins Fehlerprotokoll (ALL-INKL: KAS → Logs).
ini_set('display_errors', '0');
ini_set('log_errors', '1');

date_default_timezone_set('Europe/Berlin');
mb_internal_encoding('UTF-8');

const FEHLER = [
    'kurs' => 'Bitte wähle einen Kurs aus.',
    'termin' => 'Bitte wähle einen Termin aus.',
    'terminGeschlossen' => 'Für diesen Termin ist die Anmeldung leider geschlossen. Wähle einen anderen Termin oder merke dein Interesse vor.',
    'vorname' => 'Bitte gib deinen Vornamen ein.',
    'nachname' => 'Bitte gib deinen Nachnamen ein.',
    'email' => 'Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.de.',
    'telefon' => 'Bitte prüfe deine Telefonnummer – erlaubt sind Ziffern, Leerzeichen und + / -.',
    'zahlweg' => 'Bitte wähle aus, wer die Rechnung bekommt.',
    'strasse' => 'Bitte gib Straße und Hausnummer ein.',
    'plz' => 'Bitte gib eine gültige Postleitzahl ein.',
    'ort' => 'Bitte gib deinen Ort ein.',
    'firma' => 'Bitte gib den Namen deines Betriebs ein.',
    'ansprechperson' => 'Bitte gib an, wer bei euch die Rechnung bearbeitet.',
    'rechnungEmail' => 'Bitte gib die E-Mail-Adresse für die Rechnung ein.',
    'bestellnummer' => 'Die Bestellnummer darf höchstens 50 Zeichen lang sein.',
    'personenMax' => 'Pro Anmeldung sind höchstens 5 Personen möglich.',
    'emailDoppelt' => 'Diese E-Mail-Adresse ist schon eingetragen.',
    'nachricht' => 'Deine Nachricht ist zu lang – bitte kürze sie auf 2.000 Zeichen.',
    'agb' => 'Bitte bestätige die Teilnahmebedingungen.',
    'alter' => 'Bitte bestätige, dass du volljährig bist – oder dass deine Erziehungsberechtigten einverstanden sind bzw. dein Ausbildungsbetrieb dich anmeldet.',
    'datenschutz' => 'Bitte bestätige, dass du Datenschutzerklärung und Widerrufsbelehrung gelesen hast.',
    'wertersatz' => 'Dein Kurs startet innerhalb der 14-tägigen Widerrufsfrist. Bitte bestätige, dass wir schon vorher mit dem Kurs beginnen dürfen.',
    'zuSchnell' => 'Das ging sehr schnell – bitte versuche es in einer Minute erneut.',
    'name' => 'Bitte gib deinen Namen ein.',
    'wunschzeitraum' => 'Bitte fasse deinen Wunschzeitraum kürzer (höchstens 100 Zeichen).',
    'einwilligungInteresse' => 'Bitte bestätige, dass wir dich per E-Mail benachrichtigen dürfen.',
    'paket' => 'Bitte wähle ein Paket aus.',
    'anliegen' => 'Beschreib kurz, wobei wir dir helfen sollen.',
    'pruefungszeitraum' => 'Bitte fasse den Prüfungszeitraum kürzer (höchstens 100 Zeichen).',
    'wunschzeiten' => 'Bitte fasse deine Wunschzeiten kürzer (höchstens 200 Zeichen).',
    'thema' => 'Bitte wähle ein Thema aus.',
    'kontaktNachricht' => 'Bitte schreib uns kurz, worum es geht.',
    'einwilligungKontakt' => 'Bitte bestätige, dass wir deine Angaben zur Beantwortung deiner Anfrage nutzen dürfen.',
    'vertrag' => 'Bitte wähle den Kurs aus oder gib die Vorgangsnummer aus deiner Bestätigungs-E-Mail an.',
    'vorgang' => 'Die Vorgangsnummer findest du in deiner Bestätigungs-E-Mail, z. B. A-20261113-7F3K.',
    'anmeldedatum' => 'Bitte gib ein gültiges Anmeldedatum ein – es darf nicht in der Zukunft liegen.',
];

const MAX_PERSONEN = 5;
const RABATT_AB_PERSONEN = 3;
const RABATT_PROZENT = 10;
const WIDERRUFSFRIST_TAGE = 14;

function konfig(): array
{
    static $k = null;
    return $k ??= require __DIR__ . '/config.php';
}

/** HTML-Ausgabe immer escapen. */
function e(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
}

// ---------------------------------------------------------------- Anfrage

function nur_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        header('Content-Type: text/plain; charset=utf-8');
        http_response_code(405);
        echo "Dieses Formular nimmt nur Daten per POST entgegen.\n";
        exit;
    }
}

function will_json(): bool
{
    return str_contains((string) ($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json');
}

/** Rohwert aus dem Formular (nur Zeichenketten, gültiges UTF-8). */
function roh(string $name): string
{
    $w = $_POST[$name] ?? '';
    if (!is_string($w) || !mb_check_encoding($w, 'UTF-8')) {
        return '';
    }
    return $w;
}

/** Einzeiliges Feld: Steuerzeichen inkl. CR/LF entfernen (Schutz vor eingeschleusten Kopfzeilen), trimmen. */
function einzeilig(string $name): string
{
    return trim((string) preg_replace('/[\x00-\x1F\x7F\x{2028}\x{2029}]+/u', ' ', roh($name)));
}

/** Mehrzeiliges Feld (Nachricht): Zeilenenden vereinheitlichen, übrige Steuerzeichen entfernen. */
function mehrzeilig(string $name): string
{
    $s = str_replace(["\r\n", "\r"], "\n", roh($name));
    return trim((string) preg_replace('/[\x00-\x08\x0B-\x1F\x7F]/u', '', $s));
}

function angehakt(string $name): bool
{
    return roh($name) !== '';
}

function laenge(string $s): int
{
    return mb_strlen($s);
}

function pruefe_text(array &$f, string $feld, string $wert, int $min, int $max, string $text, bool $pflicht = true): void
{
    if ($wert === '') {
        if ($pflicht) {
            $f[$feld] = $text;
        }
        return;
    }
    $l = laenge($wert);
    if ($l < $min || $l > $max) {
        $f[$feld] = $text;
    }
}

/**
 * Nur „gewöhnliche“ Adressen (dot-atom, Domain mit Punkt und Buchstaben-TLD). filter_var allein lässt Anführungszeichen,
 * Kommas, spitze Klammern und IP-Literale zu (z. B. "a@evil.example>,<b"@x.de) – solche Adressen legen Mailserver und
 * Mailprogramme in To:/Reply-To: unterschiedlich aus. Deshalb zusätzlich ein strenges Muster.
 */
function email_ok(string $s): bool
{
    return $s !== '' && strlen($s) <= 254
        && preg_match('/^[A-Za-z0-9.!#$%&\'*+\/=?^_`{|}~-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+(?:[A-Za-z]{2,63}|xn--[A-Za-z0-9-]{1,59})$/D', $s) === 1
        && filter_var($s, FILTER_VALIDATE_EMAIL) !== false;
}

function pruefe_email(array &$f, string $feld, string $wert, string $text, bool $pflicht = true): void
{
    if ($wert === '' && !$pflicht) {
        return;
    }
    if (!email_ok($wert)) {
        $f[$feld] = $text;
    }
}

function pruefe_telefon(array &$f, string $feld, string $wert): void
{
    if ($wert !== '' && !preg_match('~^[0-9 +/()\-]{6,30}$~', $wert)) {
        $f[$feld] = FEHLER['telefon'];
    }
}

function pruefe_plz(array &$f, string $feld, string $wert): void
{
    if (!preg_match('/^[A-Za-z0-9 ]{4,10}$/', $wert)) {
        $f[$feld] = FEHLER['plz'];
    }
}

// ---------------------------------------------------------------- Daten außerhalb des Webroots

/** Verzeichnis außerhalb des Webroots (Fallback: System-Temp). null, wenn nichts beschreibbar ist. */
function datenverzeichnis(string $unter = ''): ?string
{
    $kandidaten = [rtrim((string) konfig()['datenverzeichnis'], '/'), rtrim(sys_get_temp_dir(), '/') . '/akademie-daten'];
    foreach ($kandidaten as $basis) {
        $dir = $unter === '' ? $basis : $basis . '/' . $unter;
        if (!is_dir($dir)) {
            @mkdir($dir, 0700, true);
        }
        if (is_dir($dir) && is_writable($dir)) {
            verzeichnis_sperren($basis);
            return $dir;
        }
    }
    return null;
}

/**
 * Sperrt das Datenverzeichnis zusätzlich per .htaccess. Bei ALL-INKL ist das Konto-Verzeichnis oberhalb des Webroots
 * je nach Einrichtung selbst über eine Domain (z. B. w0123456.kasserver.com) erreichbar – dann schützt nur diese Datei
 * Geheimnis und Hashes vor dem Abruf über das Web.
 */
function verzeichnis_sperren(string $basis): void
{
    if (is_dir($basis) && !is_file($basis . '/.htaccess')) {
        @file_put_contents($basis . '/.htaccess', "Require all denied\n");
    }
}

/**
 * Formular-Geheimnis für HMAC (Zeitfalle, Rate-Limit-Hashes). Reihenfolge: Umgebungsvariable AKADEMIE_FORM_SECRET →
 * Datei außerhalb des Webroots (config 'geheimnis_datei') → beim ersten Aufruf zufällig erzeugen (random_bytes(32),
 * Rechte 0600, atomar über temporäre Datei + rename, gesperrt mit flock). Es gibt KEINEN festen Ersatzschlüssel
 * (der stünde im öffentlichen Repository). Gelingt nichts, antwortet jedes Formular mit 503 und versendet nichts.
 */
function geheimnis(): string
{
    static $g = null;
    if ($g !== null) {
        return $g;
    }
    $env = getenv('AKADEMIE_FORM_SECRET');
    if (is_string($env) && strlen($env) >= 32) {
        return $g = $env;
    }
    $datei = (string) konfig()['geheimnis_datei'];
    $lesen = function () use ($datei): ?string {
        $s = is_readable($datei) ? trim((string) @file_get_contents($datei)) : '';
        return strlen($s) >= 64 && ctype_xdigit($s) ? $s : null;
    };
    if (($s = $lesen()) !== null) {
        return $g = $s;
    }
    $dir = dirname($datei);
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    if (is_dir($dir) && is_writable($dir)) {
        verzeichnis_sperren($dir); // token.php kann vor dem ersten Formular laufen – auch dann schon sperren
        $umask = umask(0077);      // alle neuen Dateien nur für das eigene Konto lesbar
        $sperre = @fopen($dir . '/.geheimnis.lock', 'c');
        if ($sperre !== false && flock($sperre, LOCK_EX)) {
            $s = $lesen(); // inzwischen von einer anderen Anfrage erzeugt?
            if ($s === null) {
                $tmp = @tempnam($dir, '.geheimnis-');
                if ($tmp !== false && dirname($tmp) === $dir) {
                    $neu = bin2hex(random_bytes(32));
                    if (@file_put_contents($tmp, $neu . "\n") !== false && @chmod($tmp, 0600) && @rename($tmp, $datei)) {
                        $s = $neu;
                        error_log('[waybuild-akademie] Formular-Geheimnis neu erzeugt: ' . $datei);
                    }
                    if (is_file($tmp)) {
                        @unlink($tmp);
                    }
                } elseif ($tmp !== false) {
                    @unlink($tmp); // tempnam ist in ein anderes Verzeichnis ausgewichen
                }
            }
            flock($sperre, LOCK_UN);
            fclose($sperre);
            umask($umask);
            if ($s !== null) {
                return $g = $s;
            }
        } else {
            umask($umask);
        }
    }
    error_log('[waybuild-akademie] FEHLER: Kein Formular-Geheimnis verfügbar – Formulare antworten mit 503. Siehe api/LIESMICH.md.');
    nicht_erreichbar();
}

/** „Fail closed“: freundliche 503-Antwort, nichts wird versendet. */
function nicht_erreichbar(): never
{
    header('Retry-After: 3600');
    fehler_antwort(503, 'technik', 'Gerade technisch nicht erreichbar – schreib uns an ' . konfig()['empfaenger']['kontakt'] . '.');
}

function zeitstempel_signatur(string $ts, string $geheimnis): string
{
    return hash_hmac('sha256', 'zeit:' . $ts, $geheimnis);
}

// ---------------------------------------------------------------- Spam-Schutz

/**
 * Lockfeld, Rate-Limit und Zeitfalle. Gibt true zurück, wenn das Lockfeld ausgefüllt ist:
 * Dann antwortet der Endpunkt wie bei Erfolg, verschickt aber nichts (Bots bekommen keinen Hinweis).
 */
function spam_pruefen(): bool
{
    geheimnis();           // fail closed, bevor irgendetwas passiert
    mail_flut_pruefen();   // offensichtliche Flut: gar nichts mehr annehmen
    $lockfeld = roh('website') !== '';
    rate_limit_pruefen();
    if ($lockfeld) {
        return true;
    }
    zeitfalle_pruefen();
    return false;
}

/**
 * Zähler je Schlüssel-Hash und Stunde (Rate-Limit). Gespeichert werden nur ein nicht rückrechenbarer HMAC-Hash
 * und die Zeitpunkte der letzten Stunde; ältere Einträge werden gelöscht (TTL 1 h). true = noch erlaubt (und gezählt).
 */
function zaehler(string $bereich, string $schluessel, int $max): bool
{
    $dir = datenverzeichnis($bereich);
    if ($dir === null) {
        return true; // lieber annehmen als echte Anmeldungen verlieren
    }
    $fenster = (int) konfig()['rate_limit_fenster'];
    $hash = hash_hmac('sha256', $bereich . ':' . $schluessel, geheimnis());
    $jetzt = time();
    $erlaubt = true;
    $fp = @fopen($dir . '/' . $hash . '.json', 'c+');
    if ($fp !== false) {
        flock($fp, LOCK_EX);
        $liste = json_decode((string) stream_get_contents($fp), true);
        $liste = array_values(array_filter(is_array($liste) ? $liste : [], fn ($t) => is_int($t) && $t > $jetzt - $fenster));
        $erlaubt = count($liste) < $max;
        if ($erlaubt) {
            $liste[] = $jetzt;
        }
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($liste));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
    }
    abgelaufene_loeschen();
    return $erlaubt;
}

/** Bereiche mit Hash-Dateien (Rate-Limit, Bestätigungen je Adresse) – TTL 'rate_limit_fenster' (1 h). */
const ZAEHLER_BEREICHE = ['ratelimit', 'empfaenger', 'empfaenger-widerruf'];

/**
 * Löscht abgelaufene Hash-Dateien (letzte Änderung älter als das Fenster) – bei jedem Zähler-Aufruf und bei jedem
 * Abruf von token.php, also spätestens beim nächsten Formularaufruf nach Ablauf der Stunde (Datenschutzerklärung).
 * Ohne Besucher läuft nichts; die Datenschutzerklärung beschreibt das so.
 */
function abgelaufene_loeschen(): void
{
    $basis = rtrim((string) konfig()['datenverzeichnis'], '/');
    $grenze = time() - (int) konfig()['rate_limit_fenster'];
    foreach ([$basis, rtrim(sys_get_temp_dir(), '/') . '/akademie-daten'] as $wurzel) {
        foreach (ZAEHLER_BEREICHE as $bereich) {
            foreach (glob($wurzel . '/' . $bereich . '/*.json') ?: [] as $datei) {
                if (@filemtime($datei) < $grenze) {
                    @unlink($datei);
                }
            }
        }
    }
}

/**
 * Schlüssel für das Rate-Limit: IPv4 unverändert, IPv6 auf das /64-Netz gekürzt (ein Anschluss bekommt meist ein ganzes
 * /64 – sonst könnte ein Absender mit jeder Anfrage eine neue Adresse nehmen). IPv4-mapped IPv6 zählt als IPv4.
 */
function ip_schluessel(string $ip): string
{
    $bin = @inet_pton($ip);
    if ($bin === false || strlen($bin) !== 16) {
        return $ip;
    }
    if (str_starts_with($bin, str_repeat("\0", 10) . "\xff\xff")) {
        return (string) inet_ntop(substr($bin, 12));
    }
    return bin2hex(substr($bin, 0, 8)) . '::/64';
}

function rate_limit_pruefen(): void
{
    $ip = ip_schluessel((string) ($_SERVER['REMOTE_ADDR'] ?? 'unbekannt'));
    if (!zaehler('ratelimit', $ip, (int) konfig()['rate_limit_max'])) {
        $mail = konfig()['empfaenger']['kontakt'];
        fehler_antwort(429, 'zu_viele', "Von deinem Anschluss kamen gerade sehr viele Anfragen. Bitte versuche es in einer Stunde noch einmal oder schreib uns an {$mail}.");
    }
}

/**
 * Höchstens 3 Eingangsbestätigungen je Empfängeradresse und Stunde (Schutz gegen Missbrauch als Mail-Schleuder).
 * Die Mail an das Team geht trotzdem raus und sagt, ob die Bestätigung versendet wird.
 * Widerrufe zählen in einem eigenen Bereich: Die gesetzlich vorgeschriebene Eingangsbestätigung (§ 356a BGB) darf nicht
 * dadurch ausfallen, dass jemand vorher Kontakt- oder Interesse-Formulare mit derselben Adresse abgeschickt hat.
 */
function bestaetigung_erlaubt(string $email, string $bereich = 'empfaenger'): bool
{
    global $bestaetigungGrund;
    // Globales Tageslimit: Team-Mail dieser Anfrage mitgerechnet; darüber nur noch Team-Mails
    if (mails_heute() + 1 >= (int) konfig()['mail_tag_max']) {
        $bestaetigungGrund = 'Tageslimit von ' . (int) konfig()['mail_tag_max'] . ' Mails erreicht';
        return false;
    }
    if (!zaehler($bereich, mb_strtolower(kopf($email)), (int) konfig()['bestaetigungen_je_adresse'])) {
        $bestaetigungGrund = 'Limit je Empfängeradresse erreicht';
        return false;
    }
    return true;
}

/** Zeile für die Team-Mail: wird die Eingangsbestätigung versendet? */
function bestaetigung_vermerk(bool $erlaubt): string
{
    global $bestaetigungGrund;
    return 'Eingangsbestätigung an die Person: ' . ($erlaubt
        ? 'wird automatisch versendet'
        : 'NICHT versendet (' . ($bestaetigungGrund ?? 'Limit erreicht') . ') – bitte selbst bestätigen, falls die Anfrage echt ist');
}

// ---------------------------------------------------------------- Globales Mail-Limit (je Installation, 24 h)

/** Zeitpunkte der versendeten Mails der letzten 24 h lesen bzw. (mit $plus) einen hinzufügen – mit flock. */
function mail_zaehler(bool $plus): int
{
    $dir = datenverzeichnis();
    if ($dir === null) {
        return 0;
    }
    $jetzt = time();
    $fp = @fopen($dir . '/mails-24h.json', 'c+');
    if ($fp === false) {
        return 0;
    }
    flock($fp, $plus ? LOCK_EX : LOCK_SH);
    $liste = json_decode((string) stream_get_contents($fp), true);
    $liste = array_values(array_filter(is_array($liste) ? $liste : [], fn ($t) => is_int($t) && $t > $jetzt - 86400));
    if ($plus) {
        $liste[] = $jetzt;
        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($liste));
        fflush($fp);
    }
    flock($fp, LOCK_UN);
    fclose($fp);
    return count($liste);
}

function mails_heute(): int
{
    return mail_zaehler(false);
}

/** Mehr als 'mail_tag_flut' Mails in 24 h: offensichtliche Flut → 503, nichts wird versendet. */
function mail_flut_pruefen(): void
{
    if (mails_heute() >= (int) konfig()['mail_tag_flut']) {
        error_log('[waybuild-akademie] Mail-Flut: Tagesgrenze ' . (int) konfig()['mail_tag_flut'] . ' erreicht – Formulare antworten mit 503.');
        nicht_erreichbar();
    }
}

/**
 * Eingangsbestätigung an die (unbestätigte) Absender-Adresse: nur feste Textbausteine und serverseitig geprüfte,
 * strukturierte Werte – nie Freitext aus dem Formular (kein Spam-/Phishing-Relay). $erlaubt kommt aus
 * bestaetigung_erlaubt() (vor der Team-Mail geprüft). Gibt zurück, ob versendet wurde.
 */
function bestaetigung_senden(string $an, string $betreff, array $zeilen, string $von, bool $erlaubt): bool
{
    if (!$erlaubt) {
        error_log('[waybuild-akademie] Eingangsbestätigung nicht versendet: Limit je Empfängeradresse erreicht.');
        return false;
    }
    return mail_senden($an, $betreff, implode("\n", $zeilen), $von, $von, true);
}

/** Fester Schluss jeder Eingangsbestätigung. */
const BESTAETIGUNG_FUSS = [
    '',
    'Fragen oder etwas falsch eingetragen? Antworte einfach auf diese E-Mail.',
    '',
    'Viele Grüße',
    'dein Team der waybuild Akademie',
];

function zeitfalle_pruefen(): void
{
    $ts = roh('ts');
    $sig = roh('sig');
    if ($ts === '' && $sig === '') {
        return; // ohne JavaScript gibt es keinen Zeitstempel (Spezifikation 5.4)
    }
    $g = geheimnis();
    if (!ctype_digit($ts) || !hash_equals(zeitstempel_signatur($ts, $g), $sig)) {
        fehler_antwort(400, 'zeitstempel', 'Da ist etwas durcheinandergeraten. Bitte lade die Seite neu und sende das Formular noch einmal.');
    }
    $alter = time() - (int) $ts;
    if ($alter < (int) konfig()['min_sekunden']) {
        fehler_antwort(429, 'zu_schnell', FEHLER['zuSchnell']);
    }
    if ($alter > (int) konfig()['max_alter']) {
        fehler_antwort(422, 'abgelaufen', 'Die Seite war sehr lange geöffnet. Bitte lade sie neu und sende das Formular noch einmal.');
    }
}

// ---------------------------------------------------------------- Termine (S-06)

function termine_laden(): array
{
    $datei = (string) konfig()['termine_datei'];
    $daten = is_readable($datei) ? json_decode((string) file_get_contents($datei), true) : null;
    if (!is_array($daten) || !isset($daten['kurse']) || !is_array($daten['kurse'])) {
        error_log('[waybuild-akademie] Terminliste fehlt oder ist ungültig: ' . $datei);
        $mail = konfig()['empfaenger']['anmeldung'];
        fehler_antwort(500, 'termine', "Die Anmeldung ist gerade leider nicht möglich. Bitte schreib uns an {$mail} – wir kümmern uns sofort darum.");
    }
    return $daten['kurse'];
}

function heute(): DateTimeImmutable
{
    return new DateTimeImmutable('today', new DateTimeZone('Europe/Berlin'));
}

/** Kalendertage von heute bis zum ISO-Datum (heute = 0, gestern = -1). */
function tage_bis(string $iso): int
{
    $ziel = DateTimeImmutable::createFromFormat('!Y-m-d', $iso, new DateTimeZone('Europe/Berlin'));
    if ($ziel === false) {
        return -9999;
    }
    return (int) heute()->diff($ziel)->format('%r%a');
}

function datum_de(?string $iso): string
{
    if (!$iso) {
        return '';
    }
    $d = DateTimeImmutable::createFromFormat('!Y-m-d', $iso);
    return $d ? $d->format('d.m.Y') : $iso;
}

function euro(float $n): string
{
    return number_format($n, 2, ',', '.') . ' €';
}

function jetzt_text(?int $ts = null): string
{
    return date('d.m.Y', $ts ?? time()) . ' um ' . date('H:i', $ts ?? time()) . ' Uhr';
}

function vorgangsnummer(string $praefix): string
{
    $zeichen = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    $z = '';
    for ($i = 0; $i < 4; $i++) {
        $z .= $zeichen[random_int(0, strlen($zeichen) - 1)];
    }
    return $praefix . '-' . date('Ymd') . '-' . $z;
}

// ---------------------------------------------------------------- Mail

/** Kopfzeilen-Wert ohne Zeilenumbrüche (Header-Injection). */
function kopf(string $s): string
{
    return trim(str_replace(["\r", "\n", "\0"], '', $s));
}

function mail_senden(string $an, string $betreff, string $text, string $von, ?string $antwortAn = null, bool $automatisch = false): bool
{
    $an = kopf($an);
    $von = kopf($von);
    if (!email_ok($an) || !email_ok($von)) {
        return false;
    }
    $name = mb_encode_mimeheader(kopf((string) konfig()['absender_name']), 'UTF-8', 'Q');
    $kopfzeilen = [
        'From: ' . $name . ' <' . $von . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'X-Formular: waybuild-akademie',
    ];
    if ($antwortAn !== null && email_ok(kopf($antwortAn))) {
        $kopfzeilen[] = 'Reply-To: ' . kopf($antwortAn);
    }
    if ($automatisch) {
        $kopfzeilen[] = 'Auto-Submitted: auto-generated';
    }
    $betreffKodiert = mb_encode_mimeheader(kopf($betreff), 'UTF-8', 'B', "\r\n", 9);
    // Zeilen unter 998 Zeichen halten (RFC 5322)
    $zeilen = array_map(fn ($z) => wordwrap($z, 900, "\n", true), explode("\n", str_replace(["\r\n", "\r"], "\n", $text)));
    $ok = mail($an, $betreffKodiert, implode("\n", $zeilen) . "\n", implode("\r\n", $kopfzeilen), '-f' . $von);
    if ($ok) {
        mail_zaehler(true); // globales Tageslimit
    }
    return $ok;
}

function json_block(array $daten): string
{
    return "----- DATEN (JSON, für CRM) -----\n"
        . json_encode($daten, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        . "\n----- ENDE -----";
}

function link_zu(string $pfad): string
{
    return rtrim((string) konfig()['website'], '/') . '/' . ltrim($pfad, '/');
}

function versand_fehler(string $postfach): never
{
    fehler_antwort(500, 'versand', "Das Senden hat leider nicht geklappt. Bitte schreib uns direkt an {$postfach} – deine Eingaben sind noch im Formular.");
}

// ---------------------------------------------------------------- Antworten

function pfad(string $relativ): string
{
    return rtrim((string) konfig()['basis'], '/') . '/' . ltrim($relativ, '/');
}

/** Erfolg: 303 auf die Danke-Seite (ohne JavaScript) bzw. JSON mit Zieladresse (fetch). */
function weiter(string $relativ, array $extra = []): never
{
    $ziel = pfad($relativ);
    if (will_json()) {
        json_antwort(200, ['ok' => true, 'weiter' => $ziel] + $extra);
    }
    header('Location: ' . $ziel, true, 303);
    header('Cache-Control: no-store');
    exit;
}

function json_antwort(int $status, array $daten): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($daten, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Fehler: JSON (fetch) mit Fehlertext je Feld – oder ohne JavaScript eine einfache Seite mit allen Fehlern
 * und dem Hinweis, mit „Zurück“ zum Formular zu gehen (die Eingaben bleiben im Browser erhalten).
 */
function fehler_antwort(int $status, string $code, string $meldung, array $felder = []): never
{
    if (will_json()) {
        json_antwort($status, ['ok' => false, 'code' => $code, 'meldung' => $meldung, 'fehler' => (object) $felder]);
    }
    $liste = '';
    if ($felder) {
        $texte = [];
        foreach ($felder as $feld => $text) {
            $person = preg_match('/^p([2-5])_/', (string) $feld, $m) ? "Person {$m[1]}: " : '';
            $texte[$person . $text] = true;
        }
        $liste = '<ul>' . implode('', array_map(fn ($t) => '<li>' . e($t) . '</li>', array_keys($texte))) . '</ul>';
    }
    html_seite($status, $felder ? 'Bitte prüfe deine Angaben' : 'Das hat leider nicht geklappt', '<p>' . e($meldung) . '</p>' . $liste
        . '<p>Geh mit dem <strong>Zurück-Knopf deines Browsers</strong> zum Formular – deine Eingaben sind dort in der Regel noch vorhanden.</p>'
        . '<p><a class="knopf" href="' . e(zurueck_adresse()) . '">Zurück zum Formular</a></p>');
}

function zurueck_adresse(): string
{
    $ref = (string) ($_SERVER['HTTP_REFERER'] ?? '');
    $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
    if ($ref !== '' && $host !== '' && parse_url($ref, PHP_URL_HOST) === explode(':', $host)[0]) {
        $p = (string) parse_url($ref, PHP_URL_PATH);
        $q = parse_url($ref, PHP_URL_QUERY);
        // Nur pfad-relative Ziele: "//fremd.example" oder "/\fremd.example" würde der Browser als fremde Domain lesen
        if (preg_match('~^/(?![/\\\\])~', $p)) {
            return $p . ($q ? '?' . $q : '');
        }
    }
    return pfad('');
}

/** Minimale, eigenständige HTML-Seite (ohne externe Dateien) für Fehler und den zweiten Widerrufsschritt ohne JavaScript. */
function html_seite(int $status, string $titel, string $inhalt): never
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('X-Robots-Tag: noindex');
    echo '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
        . '<meta name="robots" content="noindex"><title>' . e($titel) . ' | waybuild Akademie</title><style>'
        . 'body{margin:0;background:#faf8f4;color:#00346b;font:1.05rem/1.65 system-ui,-apple-system,"Segoe UI",sans-serif}'
        . 'main{max-width:40rem;margin:0 auto;padding:3rem 1rem}h1{font-family:Georgia,serif;font-weight:600;font-size:2rem;line-height:1.15}'
        . 'ul{padding-left:1.2rem}li{margin:.4rem 0}.karte{background:#fff;border:1px solid #e5dfd3;border-radius:1.25rem;padding:1.25rem 1.5rem;margin:1.5rem 0}'
        . 'dl{margin:0}dt{font-weight:600;margin-top:.75rem}dd{margin:0;white-space:pre-wrap;overflow-wrap:anywhere}'
        . '.knopf,button{display:inline-flex;align-items:center;min-height:2.75rem;padding:.6rem 1.4rem;border-radius:999px;border:0;background:#00346b;color:#fff;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}'
        . 'button.warn{background:#b42318}a{color:#0079a6}:focus-visible{outline:3px solid #0079a6;outline-offset:3px}'
        . '</style></head><body><main><p><a href="' . e(pfad('')) . '">waybuild Akademie</a></p><h1>' . e($titel) . '</h1>'
        . $inhalt . '</main></body></html>';
    exit;
}
