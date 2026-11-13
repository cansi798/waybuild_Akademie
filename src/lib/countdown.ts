// Datenform einer Countdown-Option (Startseite); befüllt aus den Kursterminen.
export interface CountdownOption {
  kurz: string; // "AP1"
  kursTitel: string;
  slug: string;
  terminId: string;
  pruefung: Date;
  start: Date;
  ende: Date;
  hinweis?: string;
  anmeldeschluss: Date;
  /** Spätere buchbare Termine desselben Kurses (mit Prüfungstag) – der Browser springt darauf, sobald der
   *  Anmeldeschluss des ersten Termins vorbei ist und noch kein neuer Build lief (Live-Upload ist manuell, TD-10). */
  weitere: CountdownOption[];
}
