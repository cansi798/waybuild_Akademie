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
