# Entwicklungsprozess waybuild Akademie

Die Website wird in drei Phasen entwickelt. Jede Phase endet mit einem Freigabepunkt (Gate).
Erst nach der Freigabe beginnt die nächste Phase.

| Phase | Ergebnis (Dokumente) | Gate |
|---|---|---|
| **1 Konzeption** | `01-projektdokumentation.md` · `02-anforderungen.md` · `03-spezifikation.md` | Freigabe Can (Inhalt + Umfang) |
| **2 Erarbeitung** | `04-architektur.md` · Umsetzung im Repo (Astro) · `05-technical-debt.md` | Freigabe Vorschau |
| **3 Finalisierung** | `06-tests.md` (Strategie + Protokoll) · `07-benutzeranleitung.md` · `08-abschlussbericht.md` | Freigabe Livegang |

## Phase 1 – Konzeption

1. **Projektdokumentation**
   - Projektübersicht: Ziel, Nutzen für Kunden (Customer Value), Umfang, Abgrenzung.
   - Risikomanagement: Risiken mit Eintrittswahrscheinlichkeit, Schwere, Gegenmaßnahme.
   - Zeitplan: Arbeitspakete und Meilensteine.
2. **Anforderungsdokument**
   - Stakeholder und ihre Ziele.
   - Funktionale Anforderungen als User Stories mit Akzeptanzkriterien, dazu ein UML-Use-Case-Diagramm.
   - Nichtfunktionale Anforderungen (Leistung, Barrierefreiheit, Datenschutz, Wartbarkeit …).
   - Glossar.
3. **Spezifikationsdokument**
   - Datenmodell (Kurse, Termine, Dozenten, Preise, Anfragen) mit UML-Klassendiagramm.
   - Geschäftsprozesse, ein Kernprozess als UML-Aktivitätsdiagramm.
   - Geschäftsregeln (Preise, Gruppengrößen, Fristen, rechtliche Formulierungen).
   - Systemschnittstellen (Formular-Versand, Kalender, später CRM).
   - Benutzeroberflächen: Seitenentwürfe (Mockups), Dialogflüsse, Eingabeprüfung.

## Phase 2 – Erarbeitung

1. **Architekturdokument**: Technologien mit Begründung, Architekturübersicht,
   Struktur (UML-Klassendiagramm der Inhaltstypen/Komponenten), Verhalten (UML-Sequenzdiagramm, z. B. Anmeldung).
2. **Implementierung** in kleinen, geprüften Schritten (Plan → Umsetzung je Aufgabe → Review), alles in GitHub.
3. **Technical Debt**: bewusst aufgeschobene Punkte mit Grund und Folge.

## Phase 3 – Finalisierung

1. **Testdokument**: Teststrategie (Einheit, Integration, System/End-to-End) und Testprotokoll
   (ID, Kurzbeschreibung, Vorbedingungen, Eingaben, erwartetes und tatsächliches Ergebnis).
2. **Benutzeranleitung**: Wie pflegt das Team Kurse, Termine und Preise; wie bucht ein Teilnehmer.
3. **Abschlussbericht**: Rückblick, Erkenntnisse (Lessons Learned), nächste Schritte.

## Grundsätze

- Kundennutzen zuerst: Besucher verstehen in Sekunden, was sie bekommen, was es kostet und wie sie starten.
- Selbsterklärende Oberfläche, mobil zuerst, barrierearm.
- Interne Unterlagen (Konzept, Rechtsfragen) liegen in `docs/intern/` und werden **nicht** veröffentlicht – das Repo ist öffentlich.
