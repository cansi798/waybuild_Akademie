# Entscheidungen und Sperren

| Datum | Entscheidung | Quelle |
|---|---|---|
| 21.11. | Lauf bis 22.11. 01:00, local-edit-and-test, Push nur durch Jan | Can #6786/#6788/#6792 |
| 21.11. | Runden 1–2 nur Audit/Backlog; Implementierung erst nach Merge von start-6771 + recht-6771, vorher nur freie Dateien | Jan-Auftrag |
| 21.11. | Repo öffentlich → Artefakte ohne Interna (keine Kalkulation, keine Rechtsrisiken, keine Personen außer GF) | Orchestrator |

| 23.11. | Can 06:55 „Alle Vorschläge umsetzen“ → alles ohne fehlende Fakten umsetzen (MKT-013, MKT-021, Weiterbildungsseiten, Organization-Schema); Faktenfragen bleiben offen | Can über Jan |

## Gesperrte Bereiche (Change Owner = andere Helfer)

- **start-6771:** Startseite, Kopf/Fuß, Berufe (`src/lib/berufe.ts`, `/pruefungsvorbereitung/*`), AnfrageFormular, llms*.txt, seo.ts/site.ts, Tests startseite/uebersicht/conversion
- **recht-6771:** Rechtsseiten, PHP-API, Anmelde-/Interesse-/Kontaktformular, danke, faq.ts, zusagen.ts, formular.ts
- **kalk-6771:** `src/content/kurse/*.md` (Preise/Zeiten) – wartet auf Can
- **Immer:** Preise, Rechtstexte, Tracking

## Wiederholungsverbote / verworfene Maßnahmen

(werden je Runde ergänzt)

- Organization-Schema: keine Telefonnummer und kein `sameAs`, solange Can sie nicht bestätigt (nie erfinden).
- Eingebettete Kurzanfrage nur auf freigegebenen Kursen mit Termin (Server lehnt Entwürfe ab); Coaching behält seine eigene Anfrage.
