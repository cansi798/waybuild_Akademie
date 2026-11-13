# Diagramme waybuild Akademie

PlantUML-Quelltexte (`*.puml`, gemeinsamer Stil in `_stil.iuml`, Blau-Töne #003a70 / #0077b6),
gerendert nach `svg/` (zum Einbinden in die Dokumente) und `png/` (zum Ansehen und Prüfen).

Neu rendern (im Ordner `docs/diagramme`):

```bash
cd docs/diagramme
docker run --rm -e HOME=/tmp -u $(id -u):$(id -g) -v $PWD:/data -w /data plantuml/plantuml:1.2024.8 -tsvg -o svg *.puml
docker run --rm -e HOME=/tmp -u $(id -u):$(id -g) -v $PWD:/data -w /data plantuml/plantuml:1.2024.8 -tpng -o png *.puml
```

Der Name nach `@startuml` bestimmt den Dateinamen der Ausgabe (z. B. `@startuml 1-use-cases` → `svg/1-use-cases.svg`).

| Datei | Inhalt | Verwendet in |
|---|---|---|
| `_stil.iuml` | Gemeinsamer Stil (Schrift, Farben, Rundungen) | allen Diagrammen |
| `0-zeitplan.puml` | Gantt-Diagramm: Arbeitspakete und Meilensteine M1–M5 bis zum ersten Kursstart | `docs/01-projektdokumentation.md` |
| `1-use-cases.puml` | UML-Use-Case-Diagramm der Website (Akteure, Anwendungsfälle, include/extend) | `docs/02-anforderungen.md` |
| `2-klassen-datenmodell.puml` | UML-Klassendiagramm Datenmodell (Kurs, Termin, Preis, Paket, Modul, FAQ, Anmeldung, Teilnehmer, Rechnungsempfänger, Interesse) | `docs/03-spezifikation.md` |
| `3-aktivitaet-anmeldung.puml` | UML-Aktivitätsdiagramm Kernprozess „Anmeldung zu einem Kurstermin“ inkl. Backoffice | `docs/03-spezifikation.md` |
| `4-mockup-anmeldung.puml` | Wireframe Anmeldeformular (PlantUML Salt) | `docs/03-spezifikation.md` |
| `5-architektur.puml` | Architekturübersicht (Komponenten und Verteilung: GitHub, ALL-INKL, Postfächer) | `docs/04-architektur.md` |
| `6-struktur.puml` | UML-Klassendiagramm der Module (Seiten, Layout, Komponenten, `lib/kurse.ts`, Schema, PHP) | `docs/04-architektur.md` |
| `7-sequenz-anmeldung.puml` | UML-Sequenzdiagramm „Anmeldung absenden“ mit Fehlerpfaden | `docs/04-architektur.md` |
