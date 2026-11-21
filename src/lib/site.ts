// Zentrale Angaben der Akademie (eine Quelle für Kopf, Fuß, Kontakt, strukturierte Daten).
export const AKADEMIE = {
  name: 'waybuild Akademie',
  domain: 'waybuild-akademie.de',
  mailInfo: 'info@waybuild-akademie.de',
  mailAnmeldung: 'anmeldung@waybuild-akademie.de',
  beschreibung:
    'Live-Online-Kurse der waybuild Akademie: IHK-Prüfungsvorbereitung, Prüfungscoaching und berufsbegleitende Weiterbildung – mit festen Terminen und Endpreisen.',
} as const;

/** Pflichthinweis (Fuß + IHK-Kursseiten, US-19) – wörtlich laut Plan. */
export const IHK_HINWEIS =
  'Unabhängiges Bildungsangebot der waybuild Akademie – keine Veranstaltung der IHK. Die Prüfung legst du bei deiner zuständigen IHK ab; verbindlich sind deren Termine.';

/** Hauptmenü (Can #6771): drei Bereiche + Kontakt; dazu im Kopf der feste Knopf „Anfragen“ (→ Startseite #anfrage). */
export const MENUE = [
  { name: 'Prüfungsvorbereitung', pfad: '/pruefungsvorbereitung/' },
  { name: 'IHK-Weiterbildung', pfad: '/ihk-weiterbildung/' },
  { name: 'waybuild Weiterbildung', pfad: '/waybuild-weiterbildung/' },
  { name: 'Kontakt', pfad: '/kontakt/' },
] as const;

/** Fuß: alle Seiten (der Kopf ist bewusst knapp). */
export const FUSS_MENUE = [
  { name: 'Prüfungsvorbereitung', pfad: '/pruefungsvorbereitung/' },
  { name: 'Alle Kurse', pfad: '/kurse/' },
  { name: 'Termine', pfad: '/termine/' },
  { name: 'Coaching', pfad: '/coaching/' },
  { name: 'Über uns', pfad: '/ueber-uns/' },
  { name: 'Kontakt', pfad: '/kontakt/' },
] as const;

/** Ziel des Anfrage-Knopfs (Formular auf der Startseite). */
export const ANFRAGE_PFAD = '/#anfrage';

/**
 * Unterrichtszeit als allgemeiner Hinweis (Can #6771: „abends 17:00–20:00 Uhr, live online“).
 * Die genauen Zeiten je Kurs stehen in den Kursdaten (Feld `zeiten`) und gehen bei Abweichungen vor.
 */
export const UNTERRICHT = {
  zeit: '17:00–20:00 Uhr',
  kurz: 'Abends 17–20 Uhr · live online',
  satz: 'Unterricht abends von 17:00 bis 20:00 Uhr, live online per Videokonferenz.',
} as const;

/**
 * Videos der Startseite (je Bereich eins). Dateien legt der Video-Helfer in public/video/ ab:
 *   <id>-16x9.mp4, <id>-9x16.mp4, <id>-poster.jpg, <id>-poster-9x16.jpg (Untertitel eingebrannt, stumm startfähig).
 * Fehlt die mp4, zeigt die Seite den Poster-Platzhalter „Video folgt“. `text` = gesprochener Text (Transkript).
 */
export const VIDEOS = {
  pruefung: {
    id: 'akademie-pruefung',
    titel: 'Prüfungsvorbereitung kurz erklärt',
    text: 'Jamil: Deine IHK-Abschlussprüfung rückt näher – und du weißt nicht, wo du anfangen sollst? Can: Dann bist du hier richtig: Wir bereiten dich gezielt auf AP1 und AP2 vor. Jamil: Für kaufmännische Berufe und für IT-Berufe. Can: Abends von 17 bis 20 Uhr, live online – deine Fragen stellst du direkt im Unterricht. Jamil: Wir trainieren prüfungsnahe Aufgaben – mit Dozenten mit IHK-Prüfer-Erfahrung. Can: So gehst du mit einem klaren Plan in deine Prüfung. Jamil: Faire Festpreise – den Preis siehst du direkt beim Kurs. Can: Deine Anfrage ist unverbindlich. Verbindlich wird es erst nach Bestätigung per E-Mail. Jamil und Can: Frag jetzt unverbindlich an – direkt hier unter dem Video.',
  },
  ihk: {
    id: 'akademie-ihk-weiterbildung',
    titel: 'IHK-Weiterbildung neben dem Job',
    text: 'Can: Du willst beruflich weiterkommen – ohne deinen Job aufzugeben? Jamil: Dann mach deine IHK-Weiterbildung berufsbegleitend bei der waybuild Akademie. Can: Zum Beispiel Fachwirt, Betriebswirt, Bilanzbuchhalter oder Meister. Jamil: Der Unterricht läuft abends von 17 bis 20 Uhr, live online. Can: Deine Fragen stellst du direkt im Unterricht – und bekommst gleich eine Antwort. Jamil: Schritt für Schritt bereiten wir dich auf deine IHK-Prüfung vor. Can: Faire Festpreise – den Preis siehst du direkt beim Kurs. Jamil: Deine Anfrage ist unverbindlich. Verbindlich wird es erst nach Bestätigung per E-Mail. Jamil und Can: Frag jetzt unverbindlich an – direkt hier unter dem Video.',
  },
  akademie: {
    id: 'akademie-weiterbildung',
    titel: 'Weiterbildung der waybuild Akademie',
    text: 'Jamil: KI, IT oder Programmierung – willst du das endlich selbst anwenden? Can: Dann schau dir die eigenen Kurse der waybuild Akademie an. Jamil: Zum Beispiel KI im Büroalltag, KI-Automatisierung und Workflows oder KI-Manager. Can: Oder Python-Programmierung, Webentwicklung und IT-Sicherheit im Unternehmen. Jamil: Alles abends von 17 bis 20 Uhr, live online – Schritt für Schritt mit eigenen Übungen. Can: Du fragst direkt nach, statt allein vor Videos zu sitzen. Jamil: Faire Festpreise – den Preis siehst du beim jeweiligen Kurs. Can: Deine Anfrage ist unverbindlich. Verbindlich wird es erst nach Bestätigung per E-Mail. Jamil und Can: Frag jetzt unverbindlich an – direkt hier unter dem Video.',
  },
} as const;

export const RECHTLICHES = [
  { name: 'Impressum', pfad: '/impressum/' },
  { name: 'Datenschutz', pfad: '/datenschutz/' },
  { name: 'Teilnahmebedingungen', pfad: '/teilnahmebedingungen/' },
  { name: 'Widerruf', pfad: '/widerruf/' },
] as const;
