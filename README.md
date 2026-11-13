# waybuild Akademie

Website der waybuild Akademie (Live-Online-Kurse, IHK-Prüfungsvorbereitung). Statisch gebaut mit **Astro**, Gestaltung mit **Tailwind CSS 4 + daisyUI 5** (Theme „akademie“ in `src/styles/global.css`), Schriften selbst gehostet (Fraunces, Inter).

- **Vorschau:** https://cansi798.github.io/waybuild_Akademie/ (GitHub Pages, `noindex`, mit Entwürfen)
- **Live (später):** https://waybuild-akademie.de (ALL-INKL; Paket „akademie-allinkl-upload“ unter Actions → Artifacts)

## Bauen und testen (Node nur per Docker)

```bash
scripts/bau.sh          # astro check + Vorschau-Build (SITE/BASE/PUBLIC_PREVIEW=true)
scripts/bau.sh live     # Live-Build (https://waybuild-akademie.de, BASE=/)
scripts/test.sh         # Playwright (chromium + webkit) gegen dist/, Image mcr.microsoft.com/playwright:v1.48.2-jammy
BASE=/ scripts/test.sh  # dieselben Tests gegen den Live-Build (nach scripts/bau.sh live; Vorschau-Tests werden übersprungen)
                        # test.sh prüft immer, was gerade in dist/ liegt: danach wieder scripts/bau.sh für die Vorschau
scripts/php-test.sh     # PHP-Endpunkte (Docker php:8.3-cli)
```

ENV: `SITE`, `BASE` (`/waybuild_Akademie` bzw. `/`), `PUBLIC_PREVIEW` (`true` = Vorschau: noindex, robots.txt `Disallow: /`, Vorschau-Banner, Entwurfs-Kurse sichtbar).

## Live hochladen (ALL-INKL)

1. **Paket holen:** GitHub → Actions → letzter grüner Lauf „Vorschau (GitHub Pages) + Live-Paket (ALL-INKL)“ → Artifact
   `akademie-allinkl-upload` herunterladen und entpacken (oder lokal `scripts/bau.sh live` → Ordner `dist/`).
2. **Einmalig im KAS:** Die Domain `waybuild-akademie.de` auf einen **eigenen Ordner** zeigen lassen, z. B.
   `/waybuild-akademie.de/` – nicht auf die Konto-Wurzel. Nur dann kann PHP daneben den Ordner `akademie-daten/` anlegen
   (Formular-Geheimnis, Zähler; siehe `public/api/LIESMICH.md`). PHP 8.1 oder neuer, SSL-Zertifikat (Let's Encrypt) an.
   Die Postfächer `anmeldung@` und `info@waybuild-akademie.de` anlegen.
3. **Hochladen:** den gesamten Inhalt des Pakets per FTP in diesen Ordner kopieren – **mit den versteckten Dateien**
   `.htaccess` (HTTPS-Umleitung, Sicherheits-Header, 404-Seite, Zwischenspeicher) und `api/.htaccess` (sperrt die
   Formular-Bibliothek). Im FTP-Programm dafür „versteckte Dateien anzeigen“ einschalten.
4. **Prüfen nach jedem ersten Hochladen:**
   - `http://waybuild-akademie.de/` leitet auf `https://waybuild-akademie.de/` um; eine falsche Adresse zeigt die eigene 404-Seite.
   - `https://waybuild-akademie.de/api/token.php` zeigt `{"ts":…,"sig":…}` – dabei entsteht das Geheimnis. Bei
     „technisch nicht erreichbar“ (503): Ordner `akademie-daten` neben dem Webroot anlegen (LIESMICH).
   - `https://waybuild-akademie.de/api/config.php` und `…/api/LIESMICH.md` liefern **403**.
   - Eine echte Testanmeldung schicken: Mail an `anmeldung@` und Eingangsbestätigung kommen an.
   - Datenschutz: Im Mailprogramm bei beiden Mails die **Kopfzeilen (Quelltext)** öffnen. Steht dort die IP-Adresse des
     eigenen Anschlusses (z. B. in `X-PHP-Script`, `X-Originating-IP` oder einer `Received`-Zeile mit der Besucher-IP),
     speichert der Mailversand mehr als die Datenschutzerklärung sagt – dann Datenschutzerklärung anpassen bzw. bei
     ALL-INKL abschalten lassen. Ergebnis im Prüfprotokoll festhalten.
5. **Jede Änderung** an Kursen, Terminen oder Preisen braucht einen neuen Upload – live verschwinden abgelaufene Termine
   erst damit (die Seiten blenden sie im Browser aus, `anmeldung.php` lehnt sie ab; Technical Debt TD-10).

## Inhalte pflegen

- Ein Kurs = eine Datei in `src/content/kurse/<slug>.md` (Slug = Adresse `/kurse/<slug>/`). Felder und Pflichtangaben prüft `src/content.config.ts` beim Bauen.
- Neue Kurse immer mit `status: entwurf` anlegen – sie erscheinen nur in der Vorschau. Freigabe = `status: freigegeben`.
- Termine je Kurs unter `termine:` (Anmeldeschluss = Start − 7 Tage). Vergangene Termine verschwinden beim nächsten Build (täglich automatisch).
- Datenzugriff zentral über `src/lib/kurse.ts`; interne Links immer über `href()` aus `src/lib/pfad.ts`.

## Dokumentation

Entwicklung in drei Phasen nach [`docs/00-prozess.md`](docs/00-prozess.md):

| Phase | Dokumente |
|---|---|
| 1 Konzeption | [Projektdokumentation](docs/01-projektdokumentation.md) · [Anforderungen](docs/02-anforderungen.md) · [Spezifikation](docs/03-spezifikation.md) |
| 2 Erarbeitung | [Architektur](docs/04-architektur.md) · [Technical Debt](docs/05-technical-debt.md) |
| 3 Finalisierung | [Tests (Strategie + Protokoll)](docs/06-tests.md) · [Benutzeranleitung](docs/07-benutzeranleitung.md) · [Abschlussbericht](docs/08-abschlussbericht.md) |

Diagramme (PlantUML) unter [`docs/diagramme/`](docs/diagramme/LIESMICH.md), Formular-Endpunkte unter [`public/api/LIESMICH.md`](public/api/LIESMICH.md).

Live-Tests: nach `scripts/bau.sh live` → `BASE=/ scripts/test.sh tests/seiten.spec.ts tests/recht.spec.ts tests/hero.spec.ts`; danach für die Vorschau-Tests wieder `scripts/bau.sh`.

## Aufbau

`src/layouts/Basis.astro` (Kopf, Fuß, SEO, Vorschau-Banner) · `src/components/` (Kopf, Fuss, Countdown, Lernpfad, KursKarte, WarumBuehne, ImAufbau) · `src/pages/` · `public/logo/` · `tests/` · `.github/workflows/deploy.yml`.

Alle Rechte vorbehalten – siehe [LICENSE](LICENSE).
