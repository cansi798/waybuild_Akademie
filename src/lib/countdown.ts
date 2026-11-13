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
}
