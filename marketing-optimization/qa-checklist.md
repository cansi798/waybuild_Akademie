# QA-Checkliste (ausgeführte Checks)

| Runde | Check | Ergebnis | Hinweis |
|---|---|---|---|
| Baseline | astro check + Build main 786c8aa | pass (87 Seiten) | |
| Baseline | Playwright chromium+webkit main | 240 pass / 8 skip (15,9 min) | baseline/test-main-786c8aa.txt |
| R2 | Build + conversion/seiten (chromium) | 29 pass / 2 skip | |
| R3 | Build + conversion/seiten/formulare/barrierefreiheit | 58 pass / 2 skip | |
| R3-QA | unabhängiger Agent: Funktion, 320/390 px, axe, FAQ 8–10, Titel | PASS_WITH_LIMITATIONS → Fixes 9b1c6ce | Screenshots qa/ |
| R3-Fix | conversion/seiten/barrierefreiheit seriell | 36/36 pass | parallel 1–3 Timeouts bei Serverlast ~55 |
| R4 | Chromium voll (auf 1744f34 + R4) | 117 pass / 5 skip | |
| R4-QA | unabhängiger Agent: 105 Links, Touch ≥ 44 px, axe 0 (Kurs/404/Über uns, 320+1280), Tap-Zählung | G1–G3 PASS, G5/G6 PASS_WITH_LIMITATIONS → R5 | qa/r4-qa.mjs |
| R5 | Chromium voll + axe | 118 pass / 5 skip, axe 6/6 | axe-core nachverlinkt |

## Gates (Stand R5)

| Gate | Status | Begründung |
|---|---|---|
| G1 Funktion | PASS | Suite grün; /anmeldung/?kurs= ohne Termin geprüft |
| G2 UX & Mobile | PASS | 320/390 px ohne H-Scroll, Leiste gekürzt |
| G3 Accessibility | PASS | axe 0 auf geänderten Seiten; Touch ≥ 44 px |
| G4 Performance | PASS_WITH_LIMITATIONS | keine neuen Assets/Skripte außer ~10 Zeilen JS; nicht neu gemessen (kein Lighthouse in diesem Lauf) |
| G5 SEO & Content | PASS_WITH_LIMITATIONS | Titel ≤ 60, Rücklinks; Zeit-Widerspruch bis kalk-Merge; Genderformen in Kursdateien bis Entgendern |
| G6 Datenschutz & Sicherheit | PASS | keine neuen Datenflüsse, kein Tracking, keine Secrets |
| G7 Evidenz | PASS | iteration-log + Commits; Wirkung nur Hypothese |

Webkit nach R2 nicht erneut gelaufen (Zeit/Serverlast) → für Webkit NOT_VERIFIED.
