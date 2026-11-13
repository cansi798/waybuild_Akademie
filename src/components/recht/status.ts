// Status der Rechtstexte (Impressum, Datenschutz, Teilnahmebedingungen, Widerruf).
// Solange RECHT_GEPRUEFT = false gilt, zeigt jede Rechtsseite – in der Vorschau UND im Live-Build – das Entwurfsband.
// Erst nach anwaltlicher Prüfung auf true setzen und RECHT_STAND auf das Datum der geprüften Fassung ändern.
export const RECHT_GEPRUEFT = false;

/** Datum der Fassung (wird auf allen vier Seiten als „Stand“ gezeigt). */
export const RECHT_STAND = '13.11.2026';

/** Firmendaten für die Rechtstexte. Übernommen aus dem Impressum der Firmen-Website (waybuild_website, src/config/site.ts).
 *  Felder mit `null` sind dort noch offen und erscheinen als markierter Platzhalter <mark>[…]</mark>. */
export const FIRMA = {
  name: 'Waybuild UG (haftungsbeschränkt)',
  strasse: 'Rathausallee 76',
  plz: '22846',
  ort: 'Norderstedt',
  land: 'Deutschland',
  geschaeftsfuehrer: 'Can Siebert',
  /** Noch keine bestätigte Telefonnummer → bewusst offen (Platzhalter). */
  telefon: null as string | null,
  registergericht: null as string | null,
  registernummer: null as string | null,
  ustId: null as string | null,
} as const;

/** Adresse der Online-Widerrufsfunktion (§ 356a BGB), relativ zur Website. */
export const WIDERRUF_PFAD = '/widerruf/#widerrufsformular';
