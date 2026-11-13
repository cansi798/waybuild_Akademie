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
| `1-use-cases.puml` | UML-Use-Case-Diagramm der Website (Akteure, Anwendungsfälle, include/extend) | `docs/02-anforderungen.md` |
