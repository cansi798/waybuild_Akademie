// Status der Rechtstexte (Impressum, Datenschutz, Teilnahmebedingungen, Widerruf).
// Solange RECHT_GEPRUEFT = false gilt, zeigt jede Rechtsseite – in der Vorschau UND im Live-Build – das Entwurfsband.
// Erst nach anwaltlicher Prüfung auf true setzen und RECHT_STAND auf das Datum der geprüften Fassung ändern.
export const RECHT_GEPRUEFT = false;

/** Datum der Fassung (wird auf allen vier Seiten als „Stand“ gezeigt). */
export const RECHT_STAND = '21.11.2026';

/** Firmendaten für die Rechtstexte. Stand 21.11.2026: Anschrift, Registergericht und Registernummer laut
 *  Handelsregisterauszug (Angabe Can, 15.11.2026). Felder mit `null` sind noch offen und erscheinen als markierter
 *  Platzhalter <mark>[…]</mark> – nie erfinden. */
export const FIRMA = {
  name: 'Waybuild UG (haftungsbeschränkt)',
  strasse: 'Kuno-Liesenberg-Kehre 32a',
  plz: '22844',
  ort: 'Norderstedt',
  land: 'Deutschland',
  geschaeftsfuehrer: 'Can Siebert',
  /** Noch keine bestätigte Telefonnummer → bewusst offen (Platzhalter). */
  telefon: null as string | null,
  registergericht: 'Amtsgericht Kiel' as string | null,
  registernummer: 'HRB 29883 KI' as string | null,
  /** USt-IdNr. bzw. Wirtschafts-IdNr. unbekannt → offen (§ 5 Abs. 1 Nr. 6 DDG: nur angeben, wenn vorhanden). */
  ustId: null as string | null,
} as const;

/** Adresse der Online-Widerrufsfunktion (§ 356a BGB), relativ zur Website. */
export const WIDERRUF_PFAD = '/widerruf/#widerrufsformular';
