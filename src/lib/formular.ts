// Gemeinsame Formularregeln (Spezifikation 5.4, GR-01 … GR-04, GR-14) – eine Quelle für Seiten, Browser-Prüfung und Tests.
// Der PHP-Endpunkt (public/api/_lib.php) prüft dieselben Regeln mit denselben Texten noch einmal verbindlich (NFA-14).
// Änderst du hier einen Text oder eine Grenze, passe auch public/api/_lib.php an.

export const MAX_PERSONEN = 5;
export const RABATT_AB_PERSONEN = 3;
export const RABATT_PROZENT = 10;
/** Widerrufsfrist in Tagen: startet der Kurs früher, ist das ausdrückliche Verlangen (Wertersatz) Pflicht. */
export const WIDERRUFSFRIST_TAGE = 14;

/** Feste Fehlertexte im Du-Ton (Spezifikation 5.4 – verbindlich). */
export const FEHLER = {
  kurs: 'Bitte wähle einen Kurs aus.',
  termin: 'Bitte wähle einen Termin aus.',
  terminGeschlossen: 'Für diesen Termin ist die Anmeldung leider geschlossen. Wähle einen anderen Termin oder merke dein Interesse vor.',
  vorname: 'Bitte gib deinen Vornamen ein.',
  nachname: 'Bitte gib deinen Nachnamen ein.',
  email: 'Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.de.',
  telefon: 'Bitte prüfe deine Telefonnummer – erlaubt sind Ziffern, Leerzeichen und + / -.',
  zahlweg: 'Bitte wähle aus, wer die Rechnung bekommt.',
  strasse: 'Bitte gib Straße und Hausnummer ein.',
  plz: 'Bitte gib eine gültige Postleitzahl ein.',
  ort: 'Bitte gib deinen Ort ein.',
  firma: 'Bitte gib den Namen deines Betriebs ein.',
  ansprechperson: 'Bitte gib an, wer bei euch die Rechnung bearbeitet.',
  rechnungEmail: 'Bitte gib die E-Mail-Adresse für die Rechnung ein.',
  bestellnummer: 'Die Bestellnummer darf höchstens 50 Zeichen lang sein.',
  person: (n: number) => `Bitte ergänze Vorname, Nachname und E-Mail für Person ${n}.`,
  personenMax: 'Pro Anmeldung sind höchstens 5 Personen möglich.',
  emailDoppelt: 'Diese E-Mail-Adresse ist schon eingetragen.',
  nachricht: 'Deine Nachricht ist zu lang – bitte kürze sie auf 2.000 Zeichen.',
  agb: 'Bitte bestätige die Teilnahmebedingungen.',
  datenschutz: 'Bitte bestätige, dass du Datenschutzerklärung und Widerrufsbelehrung gelesen hast.',
  wertersatz:
    'Dein Kurs startet innerhalb der 14-tägigen Widerrufsfrist. Bitte bestätige, dass wir schon vorher mit dem Kurs beginnen dürfen.',
  zuSchnell: 'Das ging sehr schnell – bitte versuche es in einer Minute erneut.',
  // Interesse
  name: 'Bitte gib deinen Namen ein.',
  wunschzeitraum: 'Bitte fasse deinen Wunschzeitraum kürzer (höchstens 100 Zeichen).',
  einwilligungInteresse: 'Bitte bestätige, dass wir dich per E-Mail benachrichtigen dürfen.',
  // Coaching
  paket: 'Bitte wähle ein Paket aus.',
  anliegen: 'Beschreib kurz, wobei wir dir helfen sollen.',
  pruefungszeitraum: 'Bitte fasse den Prüfungszeitraum kürzer (höchstens 100 Zeichen).',
  wunschzeiten: 'Bitte fasse deine Wunschzeiten kürzer (höchstens 200 Zeichen).',
  // Kontakt
  thema: 'Bitte wähle ein Thema aus.',
  kontaktNachricht: 'Bitte schreib uns kurz, worum es geht.',
  einwilligungKontakt: 'Bitte bestätige, dass wir deine Angaben zur Beantwortung deiner Anfrage nutzen dürfen.',
  // Widerruf (§ 356a BGB: nur Name, Vertragsangabe und E-Mail sind Pflicht, kein Grund)
  vertrag: 'Bitte gib an, welchen Vertrag du widerrufen möchtest – z. B. Kurs und Termin, Anmeldedatum oder Vorgangsnummer.',
} as const;

/** Muster wie im PHP-Endpunkt. */
export const MUSTER = {
  email: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$',
  telefon: '^[0-9 +/()\\-]{6,30}$',
  plz: '^[A-Za-z0-9 ]{4,10}$',
} as const;

export const KONTAKT_THEMEN = [
  { id: 'allgemein', name: 'Allgemeine Frage' },
  { id: 'beratung', name: 'Beratung zur Kurswahl' },
  { id: 'betrieb', name: 'Anmeldung für meinen Betrieb' },
  { id: 'coaching', name: 'Prüfungscoaching' },
] as const;

export interface Preis {
  einzel: number;
  personen: number;
  zwischensumme: number;
  rabattProzent: number;
  rabatt: number;
  gesamt: number;
}

const cent = (n: number) => Math.round(n * 100) / 100;

/** GR-03: Gesamtpreis = Preis × Personen, ab 3 Personen −10 % (auf Cent gerundet). */
export function berechnePreis(einzel: number, personen: number): Preis {
  const zwischensumme = cent(einzel * personen);
  const rabattProzent = personen >= RABATT_AB_PERSONEN ? RABATT_PROZENT : 0;
  const rabatt = cent((zwischensumme * rabattProzent) / 100);
  return { einzel, personen, zwischensumme, rabattProzent, rabatt, gesamt: cent(zwischensumme - rabatt) };
}

/** Kalendertage von „heute“ (Europe/Berlin) bis zum ISO-Datum "2027-01-19". */
export function tageBisIso(iso: string, jetzt: Date = new Date()): number {
  const heute = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(jetzt);
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${heute}T00:00:00Z`)) / 86_400_000);
}

/** Wertersatz-Bestätigung ist Pflicht, wenn der Kurs innerhalb der Widerrufsfrist startet. */
export function wertersatzPflicht(startIso: string, jetzt: Date = new Date()): boolean {
  return tageBisIso(startIso, jetzt) <= WIDERRUFSFRIST_TAGE;
}

/** Buchbar, solange der Anmeldeschluss heute oder später ist (GR-01, GR-11). */
export function buchbarIso(anmeldeschlussIso: string, jetzt: Date = new Date()): boolean {
  return tageBisIso(anmeldeschlussIso, jetzt) >= 0;
}

/** "Coaching-Paket" → "coaching-paket" (stabile Paket-ID für Adresse, Formular und Terminliste). */
export function paketId(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const EURO2 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** 942.3 → "942,30 €", 349 → "349,00 €" (immer zwei Nachkommastellen, wie in den Bestätigungs-Mails) */
export function euro(n: number): string {
  return EURO2.format(n);
}
