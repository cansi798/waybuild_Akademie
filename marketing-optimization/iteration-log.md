# Iterationsprotokoll

## Runde 1 – Baseline und Audit (20:11–20:26)

```yaml
round: 1
focus: "Baseline: Journey, Funnel, Site-Map, SEO/GEO/Technik, Copy/Trust/Regeln"
mode: read-only (main 786c8aa + uncommitteter Stand start-6771)
agents: [Journey/Funnel/IA, SEO/GEO/Perf/A11y, Copy/Trust/Compliance]  # 3 Subagenten parallel, nur lesend
artefakte: [site-map.md, customer-journey.md, funnel-map.md, audit/seo-geo-technik.md, audit/copy-trust-compliance.md, backlog.md, strategy.md, decisions.md]
checks: {build_main: pass (87 Seiten, astro check ok), playwright_main: siehe baseline/test-main-786c8aa.txt}
qa_gate: "n/a (keine Änderung)"
impact: "keine – nur Befunde"
next: "R2: freie Dateien (Kurs-FAQ-Einwände, Zahler-Hinweis im Kopf, Titel-Länge, Gender-Fix Coaching); Befunde für andere Helfer an Jan"
```

Wichtigste Befunde: kein unverbindlicher Weg auf Kursseiten; Zeit 17–20 vs. Kursdaten 18:00–20:30; „verbindlich erst nach E-Mail-Bestätigung“ fehlt; ~250 Genderformen in Kursdateien; live nur 3 von 70 Kursen freigegeben. An Jan gemeldet 20:26 → verteilt (start-6771: Wortlaut/Danke/Menü; recht-6771: Mail/PHP; kalk-6771 mit start-6771 mergen; Gendern in content/kurse übernimmt Loop nach Merge).

## Runde 2 – freie Dateien (20:30–20:40)

```yaml
round: 2
focus: "decision: Kursseite – Einwände und Zahler; awareness: Titel-Länge"
change_ids: [MKT-006, MKT-007, MKT-009, MKT-015 (Coaching-Teil)]
files_changed: [src/pages/kurse/[slug].astro, src/layouts/Basis.astro, src/pages/coaching/index.astro]
checks: {astro_check: pass, build: pass, playwright_chromium_conversion+seiten: 29 pass / 2 skip}
commit: 119049b
qa_gate: "siehe Runde 3 (gemeinsames QA)"
impact: hypothesis_only
```

Danach `git merge main` (recht-6771, d6682c5: Anmeldung = unverbindliche Buchungsanfrage) – konfliktfrei.

## Runde 3 – Ein Tap zum Formular (20:40–20:47)

```yaml
round: 3
focus: "decision: Kursseite ohne unverbindlichen Weg (MKT-001)"
hypothese: "Wenn die Hauptaktion der Kursseite direkt zur (seit recht-6771 unverbindlichen) Buchungsanfrage führt und die Verbindlichkeit erklärt, schicken mehr Besucher eine Anfrage ab als über den Umweg Termin wählen → Anmelden."
change_ids: [MKT-001]
files_changed: [src/pages/kurse/[slug].astro, src/components/seiten/TerminKarte.astro, tests/conversion.spec.ts, tests/seiten.spec.ts]
checks: {build: pass, playwright_chromium_conversion+seiten+formulare+barrierefreiheit: 58 pass / 2 skip}
commit: 174ea3d
qa_gate: "ausstehend (unabhängiger QA-Agent)"
impact: hypothesis_only
next: "QA-Befund einarbeiten; nach Merge start-6771+kalk-6771: Entgendern content/kurse (Skript vorbereitet, Trockenlauf 68 Dateien, 0 echte Reste), Kursseite ↔ Berufsseite verlinken"
```

### QA Runde 2+3 (unabhängiger Agent, 20:50–20:58) → Fixes (21:00–21:20)

Gate: G1 PASS · G2 PASS_WITH_LIMITATIONS (320 px Leiste schnitt Startdatum ab) · G3 PASS (axe 0) · G5 PASS_WITH_LIMITATIONS (19 Titel ohne Marke, Fast-Dublette Vorkenntnisse) · G6 PASS. Fixes umgesetzt: Satz „mit deiner Zusage und unserer Buchungsbestätigung“ (Rechtsmodell), Leiste „Anfragen“, „deinen Betrieb“ (Umschüler), Raten-/Rabatt-Text an Buchungsmodell angepasst, fachwissen nicht bei eigener Vorkenntnis-Frage, Titel-Stufe „| waybuild“, Course `alternateName` (MKT-010). Tests seriell: conversion+seiten+barrierefreiheit 36/36 pass (parallel 1–3 Timeouts durch Serverlast ~55, nicht reproduzierbar). Offen (recht-Datei): AnmeldeFormular.astro:255 nennt die Zusage nicht → an Jan.

## Runde 4 – Verlinkung und Sackgassen (21:45–22:05, auf main 1744f34 = start + recht + Loop R1–3)

```yaml
round: 4
focus: "consideration: Kursseite ↔ Berufsseite (MKT-008), Sackgassen 404/Über uns (MKT-012), Genderformen außerhalb der Kursdateien (MKT-015)"
hypothese: "Rücklinks „Passt zu deinem Beruf“ helfen Azubis, die über eine Kursseite einsteigen, und stärken die interne Verlinkung; 404/Über uns führen zur Anfrage statt ins Leere."
files_changed: [src/pages/kurse/[slug].astro, src/pages/404.astro, src/pages/ueber-uns/index.astro, src/pages/llms.txt.ts, src/pages/llms-full.txt.ts, src/components/formulare/anmeldung-client.ts, src/components/formulare/AnmeldeFormular.astro (nur Kommentare), src/lib/zusagen.ts (nur Kommentar)]
checks: {build: pass (106 Seiten), playwright_chromium_voll: 117 pass / 5 skip, formulare+seiten nach Textfix: 36 pass / 2 skip}
qa_gate: "ausstehend"
impact: hypothesis_only
next: "Entgendern content/kurse erst nach kalk-Merge (Jan); 22 Dateien hätten sonst Konflikte"
```
