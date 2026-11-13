// Zentrale Angaben der Akademie (eine Quelle für Kopf, Fuß, Kontakt, strukturierte Daten).
export const AKADEMIE = {
  name: 'waybuild Akademie',
  domain: 'waybuild-akademie.de',
  mailInfo: 'info@waybuild-akademie.de',
  mailAnmeldung: 'anmeldung@waybuild-akademie.de',
  beschreibung:
    'Live-Online-Kurse der waybuild Akademie: Vorbereitung auf die IHK-Abschlussprüfung für IT-Berufe, Prüfungscoaching und berufsbegleitende Weiterbildungen – mit fairen, klaren Preisen.',
} as const;

/** Pflichthinweis (Fuß + IHK-Kursseiten, US-19) – wörtlich laut Plan. */
export const IHK_HINWEIS =
  'Unabhängiges Bildungsangebot der waybuild Akademie – keine Veranstaltung der IHK. Die Prüfung legst du bei deiner zuständigen IHK ab; verbindlich sind deren Termine.';

export const MENUE = [
  { name: 'Kurse', pfad: '/kurse/' },
  { name: 'Prüfungsvorbereitung', pfad: '/pruefungsvorbereitung/' },
  { name: 'Termine', pfad: '/termine/' },
  { name: 'Coaching', pfad: '/coaching/' },
  { name: 'Über uns', pfad: '/ueber-uns/' },
  { name: 'Kontakt', pfad: '/kontakt/' },
] as const;

export const RECHTLICHES = [
  { name: 'Impressum', pfad: '/impressum/' },
  { name: 'Datenschutz', pfad: '/datenschutz/' },
  { name: 'Teilnahmebedingungen', pfad: '/teilnahmebedingungen/' },
  { name: 'Widerruf', pfad: '/widerruf/' },
] as const;
