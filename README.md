# waybuild Akademie

Website der waybuild Akademie (Live-Online-Kurse, IHK-Prüfungsvorbereitung). Statisch gebaut mit **Astro**, Gestaltung mit **Tailwind CSS 4 + daisyUI 5** (Theme „akademie“ in `src/styles/global.css`), Schriften selbst gehostet (Fraunces, Inter).

- **Vorschau:** https://cansi798.github.io/waybuild_Akademie/ (GitHub Pages, `noindex`, mit Entwürfen)
- **Live (später):** https://waybuild-akademie.de (ALL-INKL; Paket „akademie-allinkl-upload“ unter Actions → Artifacts)

## Bauen und testen (Node nur per Docker)

```bash
scripts/bau.sh          # astro check + Vorschau-Build (SITE/BASE/PUBLIC_PREVIEW=true)
scripts/bau.sh live     # Live-Build (https://waybuild-akademie.de, BASE=/)
scripts/test.sh         # Playwright (chromium + webkit) gegen dist/, Image mcr.microsoft.com/playwright:v1.48.2-jammy
```

ENV: `SITE`, `BASE` (`/waybuild_Akademie` bzw. `/`), `PUBLIC_PREVIEW` (`true` = Vorschau: noindex, robots.txt `Disallow: /`, Vorschau-Banner, Entwurfs-Kurse sichtbar).

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
