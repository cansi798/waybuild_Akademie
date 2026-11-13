// Risikoumkehr (Zusagen an Teilnehmende) – EINE Quelle für Kurskarte, Kursseite, Termine, Coaching und Anmeldung.
// Grundlage: Teilnahmebedingungen Nr. 8 (Storno), Nr. 9 (Ersatzperson), Nr. 10 (Absage durch uns), Nr. 4 Abs. 3 (Coaching).
// Wortlaut noch nicht entschieden (Can, Frage 29) und Teilnahmebedingungen noch Entwurf (Anwalt prüft die Pauschalen):
// Änderungen NUR hier, dann greifen sie überall gleichzeitig. Keine Zahl zur Mindestteilnehmerzahl nennen.
export const ZUSAGEN = {
  /** Kurse: eine Zeile direkt am Preis und am Absende-Knopf. */
  kurs: 'Kostenlos stornieren bis 14 Tage vor Kursstart · Ersatzperson jederzeit kostenlos',
  /** Kurse: Zusatz auf Kursseite und Terminübersicht. */
  ausfall: 'Fällt ein Kurs aus, bekommst du dein Geld zurück oder wechselst kostenlos',
  /** Prüfungscoaching (Teilnahmebedingungen Nr. 4 Abs. 3, Vertrag erst mit abgestimmten Terminen). */
  coaching: 'Anfrage unverbindlich · Termin bis 24 Stunden vorher kostenlos verschieben',
  /** Verweis auf die vollständigen Regeln. */
  link: { text: 'Teilnahmebedingungen', pfad: '/teilnahmebedingungen/#storno', pfadCoaching: '/teilnahmebedingungen/#coaching' },
} as const;

/** Einzige erlaubte Vertrauensaussage (Ruling) – nur für die Säule ihk-pruefung und das Coaching. */
export const BEWEIS_DOZENTEN = 'Dozenten mit IHK-Prüfer-Erfahrung';
