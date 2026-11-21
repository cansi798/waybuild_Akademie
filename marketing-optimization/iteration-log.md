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

### QA Runde 4 (unabhängig, 22:05–22:12)
G1 PASS (105 neue Links lösen auf, live-sicher über sichtbareBerufe) · G2 PASS (≥ 44 px, kein H-Scroll) · G3 PASS (axe 0 auf Kursseite/404/Über uns, 320+1280) · G5 PASS_WITH_LIMITATIONS („Lehrende“) · G6 PASS_WITH_LIMITATIONS (Verbindlichkeit uneinheitlich). Tap-Zählung 390 px: Start→Kachel→Formular 2 ✔ · Suche „FISI“ 3 ✘ · Kursseite 1 ✔ · /pruefungsvorbereitung/ 2 ✔.

## Runde 5 – ein Ablauf für die Verbindlichkeit, Suche mit Enter (22:12–22:28)

```yaml
round: 5
focus: "decision: Verbindlichkeit überall gleich (Anfrage → Angebot → Zusage → Bestätigung); Suchweg ≤ 2 Schritte"
files_changed: [src/lib/zusagen.ts (ZUSAGEN.anfrage), src/pages/index.astro, src/pages/pruefungsvorbereitung/[beruf].astro, src/pages/danke/index.astro, src/pages/ueber-uns/index.astro, src/pages/llms.txt.ts, src/components/start/BerufWahl.astro, tests/start-6771.spec.ts]
checks: {build: pass, playwright_chromium_voll: 118 pass / 5 skip, axe: 6/6 pass (axe-core in akad-loop nachverlinkt)}
qa_gate: "PASS_WITH_LIMITATIONS (Selbstprüfung + Suite; Wortlaut ZUSAGEN.anfrage ist eine Text-Entscheidung → Can/Jan bestätigen)"
impact: hypothesis_only
```
Hinweis: `ZUSAGEN.anfrage` war als „Wortlaut verbindlich (Audit #6771)“ markiert. Neu: „Deine Anfrage ist unverbindlich. Du bekommst ein Angebot per E-Mail – verbindlich wird es erst mit deiner Zusage und unserer Bestätigung.“ Das passt zum Rechtsmodell aus recht-6771 und folgt der Formulierung von Anmeldung und Danke-Seite. Bei Ablehnung: nur zusagen.ts:13 + Test zurücksetzen.

Jan 22:30: R4–R5 in main (5a6ac62) gepusht; Wortlaut ZUSAGEN.anfrage freigegeben.

## Runde 6 – Kopf-„Anfragen“ mit Seitenzusammenhang (22:30–22:35)

```yaml
round: 6
focus: "decision: Kopf-Knopf springt von Kurs-/Berufsseite zur Startseite und verliert den Kurs (QA R4 #5)"
hypothese: "Wer auf einer Kurs- oder Berufsseite oben „Anfragen“ tippt, landet im passenden Formular mit Vorauswahl → weniger Abbrüche"
files_changed: [src/components/Kopf.astro (kleines Inline-Skript; ohne JS unverändert /#anfrage), tests/start-6771.spec.ts]
checks: {build: pass, start-6771+startseite+conversion: 44 pass / 2 skip}
qa_gate: "PASS_WITH_LIMITATIONS (Selbstprüfung + neuer Test; kein separater QA-Agent)"
impact: hypothesis_only
```

### QA Runde 5+6 (unabhängig, 22:35–22:38) + Webkit-Gesamtlauf
Webkit voll auf f7364cd: 119 pass / 5 skip. QA: G1/G3/G5 PASS_WITH_LIMITATIONS, G6 PASS. Befunde: (1) Text verspricht fest ein „Angebot“, die Kurzanfrage (kontakt.php) sagt „möchtest du buchen, schicken wir ein Angebot“ und erlaubt offenen Kurs; (2) Vorschau-Hinweis Danke „Bestätigung“; (3) Mobilmenü bleibt bei Sprung #anfrage offen; (4) Coaching-Kursseite: Kopf führte zur Kurzanfrage ohne Coaching-Bereich; (5) Enter ohne IME-Schutz.

## Runde 7 – QA-Fixes (22:38–22:45)

```yaml
round: 7
change_ids: [R5/R6-QA 1–5]
files_changed: [src/lib/zusagen.ts, src/pages/index.astro, src/pages/pruefungsvorbereitung/[beruf].astro, src/pages/danke/index.astro, src/components/Kopf.astro, src/components/start/BerufWahl.astro, tests/start-6771.spec.ts]
text: "ZUSAGEN.anfrage → „Deine Anfrage ist unverbindlich. Wir melden uns per E-Mail mit Termin und Angebot – verbindlich wird es erst mit deiner Zusage und unserer Bestätigung.“ (Feinschliff des freigegebenen Wortlauts: kein festes Angebot vor Prüfung)"
checks: {build: pass, chromium_voll: 119 pass / 5 skip}
qa_gate: PASS_WITH_LIMITATIONS
offen: "kontakt.php-Mailtext (PHP, recht-Bereich) nicht geändert; /coaching/ Kopf → /#anfrage ohne Coaching-Bereich (Kurzanfrage kennt keinen Bereich Coaching)"
```

Jan 22:55: Signal „kalk in main“ (6a611e5, 17–20 Uhr in Kursdaten, neue Preise/Termine, Videos). Loop per Fast-Forward auf 6a611e5.

## Runde 8 – Entgendern der Kursdateien + Kurzanfrage-Mail (22:47–23:08)

```yaml
round: 8
focus: "Regel „nie gendern“ in allen 70 Kursdateien (MKT-014); Kunden-Mail nach Kurzanfrage nennt die Zusage"
method: "Skript (Paarformen → generisches Maskulinum, „Geprüfte/r X/in“ → „Geprüfter X (m/w/d)“, „/innen“ → Plural, „Mitarbeitende“ → „Mitarbeiter“, Titelzeilen ohne (m/w/d)) + Lektorats-QA (FAIL → 8 Korrekturen: 29× „bzw. zur Geprüften …in“, Kasus „Mitarbeitern“, Kaufmann/Kauffrau, Mehrfach-(m/w/d))"
files_changed: ["src/content/kurse/*.md (68 Dateien, nur Text – Zahlen/Preise/Zeiten/Termine unverändert laut QA)", public/api/kontakt.php (Schritt 3 mit Zusage), scripts/php-test.sh (Erwartung)]
checks: {build: pass, chromium_voll: 119 pass / 5 skip, php_test: 236/236}
qa_gate: "PASS_WITH_LIMITATIONS (Lektorat nach Korrektur nicht erneut durch Agent, Rest-Grep 0 echte Treffer)"
impact: "Regelkonformität; Conversion-Wirkung nicht messbar"
```

## Runde 9 – kürzerer Weg für „nur kurz fragen“ (23:07–23:25)

UX-Durchgang (unabhängiger Agent, 390×844 + 1280, Screenshots qa/r9/): Kursseite führte nur ins 5-Schritt-Formular (12–15 Pflichtfelder) statt in die Kurzanfrage (4); /anmeldung/ mobil erst unter der ersten Ansicht; Betriebsrechnung ohne Autofill; Berufsseite: Kopf-Sprung ohne Fokus; /coaching/-Kopf ohne Coaching.

```yaml
round: 9
hypothese: "Azubis, die nur eine Frage haben, brechen beim 5-Schritt-Formular ab; ein Zweitweg „Kurz fragen – nur 4 Angaben“ (Kurs vorausgewählt) fängt sie auf."
files_changed: [src/pages/kurse/[slug].astro, src/pages/anmeldung/index.astro (Einleitung 46 → 17 Wörter), src/components/formulare/AnmeldeFormular.astro (autocomplete billing …), src/components/Kopf.astro (Coaching-Seite, Fokus ins Namensfeld), tests/start-6771.spec.ts]
checks: {build: pass, chromium_voll: 121 pass / 5 skip, Vorauswahl kurs=ap1-it-berufe geprüft}
qa_gate: PASS_WITH_LIMITATIONS (Selbstprüfung + Tests; kein weiterer QA-Agent)
verworfen: "Sticky-Leiste Startseite verzögern / „Erst Beruf wählen ↓“ streichen – Startseite ist Gestaltung von start-6771/Can, Risiko 2 → Backlog MKT-019"
```

### QA Runde 9 (unabhängig) + Webkit voll auf 5235b6d: 121 pass / 5 skip
Gate PASS_WITH_LIMITATIONS: „4 Angaben“ stimmt, kein toter Link (Kurzanfrage nutzt dieselbe Kursquelle), autocomplete gültig, #anfrage-name auf 20/20 Seiten. Fixes: Anmelde-Einleitung ohne Angebotsschritt; „name“ füllte Azubi-Namen in Ansprechperson; Fokus übersprang leeres Pflichtfeld „Bereich“.

## Runde 10 – QA-Fixes R9 (23:33–23:40)

```yaml
round: 10
files_changed: [src/pages/anmeldung/index.astro, src/components/formulare/AnmeldeFormular.astro (billing organization/name/address-line1), src/components/Kopf.astro (Fokus auf erstes leeres Pflichtfeld), src/pages/kurse/[slug].astro („Kurz fragen – nur Name und E-Mail“)]
checks: {build: pass, chromium_voll: 120 pass / 1 flaky (axe 1440 /pruefungsvorbereitung/, einzeln 2/2 pass, Seite unverändert) / 5 skip}
qa_gate: PASS_WITH_LIMITATIONS
```

Jan 23:48: Can 22:25 „Entscheidung Empfehlung selbst treffen“ → MKT-019/020 umsetzen. Jan 00:00: Can 23:55 „Empfehlungen direkt umsetzen und pushen“ → Loop pusht ab jetzt selbst nach grüner Runde.

## Runde 11 – Mobile Startseite entschlacken, IHK-Hinweis ohne „verbindlich“ (23:49–00:03)

```yaml
round: 11
change_ids: [MKT-019, MKT-020]
hypothese: "Weniger gleichartige Aufrufe in der ersten Ansicht + freie zweite Berufskachel → Berufswahl wird schneller genutzt; ohne „verbindlich“ neben „unverbindlich anfragen“ keine Verunsicherung."
files_changed: [src/components/start/StickyAnfrage.astro (erst nach 0,9 Bildschirmhöhen), src/pages/index.astro („Erst Beruf wählen ↓“ entfernt), „Maßgeblich ist die Einladung deiner IHK“ statt „Verbindlich ist …“ in TerminKarte, Lernpfad, kurse/[slug], termine, pruefungsvorbereitung, faq.ts, anmeldung-client.ts, ReiseBuehne, WarumBuehne, 25 Kursdateien (pruefungHinweis); „die Termine legt sie fest“ in site.ts IHK_HINWEIS, faq.ts, index, ueber-uns; Tests]
checks: {build: pass, chromium_voll: 121 pass / 5 skip, webkit start+seiten+startseite: 45 pass / 4 skip}
qa: "unabhängig PASS_WITH_LIMITATIONS → Vorschlag „maßgeblich“ statt „legt … fest“ (Orientierungsfunktion) übernommen; IHK_HINWEIS ist rechtstextnah → Can zur Kenntnis"
qa_gate: PASS_WITH_LIMITATIONS
```
