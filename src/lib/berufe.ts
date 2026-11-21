// Berufsauswahl der Prüfungsvorbereitung (Can #6772): Azubis suchen nur ihren Beruf – keine langen Texte.
// Ein Beruf = Name (m/w/d, nicht gendern) + Zuordnung zu den Kursdateien je Prüfungsteil. Die Kursdaten selbst
// (Titel, Preise, UE, Zeiten, Termine) bleiben in src/content/kurse/ – hier steht nur, welcher Kurs zu welchem Beruf gehört.
// Sichtbar ist ein Beruf nur, wenn mindestens einer seiner Kurse sichtbar ist (live: freigegeben, Vorschau: auch Entwürfe).
import { alleKurse, type Kurs } from './kurse';

export interface BerufTeil {
  /** Knopftext, z. B. „AP1 – Teil 1“ */
  name: string;
  /** Kurz für Formular/Anfrage, z. B. „AP1“ */
  kurz: string;
  kurs: string;
}

export interface BerufDef {
  slug: string;
  name: string;
  gruppe: 'IT-Berufe' | 'Kaufmännische Berufe';
  /** weitere Suchwörter für den Sofortfilter (Abkürzungen, Alltagsnamen) */
  such: string[];
  /** häufig gesucht → Kachel direkt sichtbar */
  oft?: boolean;
  teile: BerufTeil[];
}

const AP1_IT: BerufTeil = { name: 'AP1 – Teil 1', kurz: 'AP1', kurs: 'ap1-it-berufe' };
const ap2 = (kurs: string): BerufTeil => ({ name: 'AP2 – Teil 2', kurz: 'AP2', kurs });
const teil1 = (kurs: string): BerufTeil => ({ name: 'Teil 1 (AP1)', kurz: 'Teil 1', kurs });
const teil2 = (kurs: string, zusatz = ''): BerufTeil => ({ name: `Teil 2 (AP2)${zusatz}`, kurz: `Teil 2${zusatz}`, kurs });
const ganz = (kurs: string): BerufTeil => ({ name: 'Abschlussprüfung', kurz: 'Abschlussprüfung', kurs });

export const BERUFE: BerufDef[] = [
  { slug: 'fachinformatiker-anwendungsentwicklung', name: 'Fachinformatiker Anwendungsentwicklung (m/w/d)', gruppe: 'IT-Berufe', such: ['FIAE', 'FiAe', 'Programmierer', 'Softwareentwickler'], oft: true, teile: [AP1_IT, ap2('ap2-fachinformatiker-anwendungsentwicklung')] },
  { slug: 'fachinformatiker-systemintegration', name: 'Fachinformatiker Systemintegration (m/w/d)', gruppe: 'IT-Berufe', such: ['FISI', 'FiSi', 'Admin', 'Netzwerk'], oft: true, teile: [AP1_IT, ap2('ap2-fachinformatiker-systemintegration')] },
  { slug: 'fachinformatiker-daten-und-prozessanalyse', name: 'Fachinformatiker Daten- und Prozessanalyse (m/w/d)', gruppe: 'IT-Berufe', such: ['FIDP', 'Daten'], teile: [AP1_IT, ap2('ap2-fachinformatiker-daten-und-prozessanalyse')] },
  { slug: 'fachinformatiker-digitale-vernetzung', name: 'Fachinformatiker Digitale Vernetzung (m/w/d)', gruppe: 'IT-Berufe', such: ['FIDV', 'Vernetzung'], teile: [AP1_IT, ap2('ap2-fachinformatiker-digitale-vernetzung')] },
  { slug: 'it-system-elektroniker', name: 'IT-System-Elektroniker (m/w/d)', gruppe: 'IT-Berufe', such: ['ITSE', 'Elektroniker'], teile: [AP1_IT, ap2('ap2-it-system-elektroniker')] },
  { slug: 'kaufmann-digitalisierungsmanagement', name: 'Kaufmann für Digitalisierungsmanagement (m/w/d)', gruppe: 'IT-Berufe', such: ['Kauffrau', 'Kaufleute', 'KDM', 'Digitalisierung'], teile: [AP1_IT, ap2('ap2-kaufleute-digitalisierungsmanagement')] },
  { slug: 'kaufmann-it-system-management', name: 'Kaufmann für IT-System-Management (m/w/d)', gruppe: 'IT-Berufe', such: ['Kauffrau', 'Kaufleute', 'KITS', 'IT-Systemkaufmann'], teile: [AP1_IT, ap2('ap2-kaufleute-it-system-management')] },
  { slug: 'kaufmann-bueromanagement', name: 'Kaufmann für Büromanagement (m/w/d)', gruppe: 'Kaufmännische Berufe', such: ['Kauffrau', 'Kaufleute', 'Büro', 'Bürokaufmann', 'KfB'], oft: true, teile: [teil1('bueromanagement-teil-1'), teil2('bueromanagement-teil-2')] },
  { slug: 'industriekaufmann', name: 'Industriekaufmann (m/w/d)', gruppe: 'Kaufmännische Berufe', such: ['Industriekauffrau', 'Industriekaufleute', 'IK'], oft: true, teile: [teil1('industriekaufleute-teil-1'), teil2('industriekaufleute-teil-2'), { name: 'Abschlussprüfung (alte Ordnung 2002)', kurz: 'Abschlussprüfung alte Ordnung', kurs: 'industriekaufleute-alte-ausbildungsordnung' }] },
  { slug: 'kaufmann-einzelhandel', name: 'Kaufmann im Einzelhandel (m/w/d)', gruppe: 'Kaufmännische Berufe', such: ['Kauffrau', 'Kaufleute', 'Einzelhandel', 'Verkäufer'], oft: true, teile: [teil1('kaufleute-im-einzelhandel-teil-1'), teil2('kaufleute-im-einzelhandel')] },
  { slug: 'kaufmann-gross-und-aussenhandelsmanagement', name: 'Kaufmann für Groß- und Außenhandelsmanagement (m/w/d)', gruppe: 'Kaufmännische Berufe', such: ['Kauffrau', 'Kaufleute', 'Großhandel', 'Außenhandel', 'Groß- und Außenhandel'], oft: true, teile: [teil1('gross-und-aussenhandelsmanagement-teil-1'), teil2('gross-und-aussenhandelsmanagement', ' Großhandel'), teil2('gross-und-aussenhandelsmanagement-aussenhandel-teil-2', ' Außenhandel')] },
  { slug: 'kaufmann-e-commerce', name: 'Kaufmann im E-Commerce (m/w/d)', gruppe: 'Kaufmännische Berufe', such: ['Kauffrau', 'Kaufleute', 'Onlinehandel', 'eCommerce'], oft: true, teile: [teil1('kaufleute-im-e-commerce-teil-1'), teil2('kaufleute-im-e-commerce')] },
  { slug: 'automobilkaufmann', name: 'Automobilkaufmann (m/w/d)', gruppe: 'Kaufmännische Berufe', such: ['Automobilkauffrau', 'Automobilkaufleute', 'Autohaus'], teile: [teil2('automobilkaufleute-teil-2')] },
  { slug: 'immobilienkaufmann', name: 'Immobilienkaufmann (m/w/d)', gruppe: 'Kaufmännische Berufe', such: ['Immobilienkauffrau', 'Immobilienkaufleute', 'Makler'], teile: [ganz('immobilienkaufleute')] },
  { slug: 'kaufmann-gesundheitswesen', name: 'Kaufmann im Gesundheitswesen (m/w/d)', gruppe: 'Kaufmännische Berufe', such: ['Kauffrau', 'Kaufleute', 'Gesundheit', 'Krankenhaus'], teile: [ganz('kaufleute-im-gesundheitswesen')] },
  { slug: 'kaufmann-spedition-und-logistikdienstleistung', name: 'Kaufmann für Spedition und Logistikdienstleistung (m/w/d)', gruppe: 'Kaufmännische Berufe', such: ['Kauffrau', 'Kaufleute', 'Spedition', 'Logistik'], teile: [ganz('kaufleute-spedition-und-logistikdienstleistung')] },
  { slug: 'fachkraft-lagerlogistik', name: 'Fachkraft für Lagerlogistik (m/w/d)', gruppe: 'Kaufmännische Berufe', such: ['Lager', 'Logistik', 'Lagerist', 'FaLa'], teile: [ganz('fachkraft-fuer-lagerlogistik')] },
];

export interface Beruf extends Omit<BerufDef, 'teile'> {
  teile: (BerufTeil & { daten?: Kurs })[];
}

/** Sichtbare Berufe mit ihren Kursen (Teile ohne sichtbaren Kurs bleiben als Anfrage-Möglichkeit erhalten). */
export async function sichtbareBerufe(): Promise<Beruf[]> {
  const kurse = new Map((await alleKurse()).map((k) => [k.id, k]));
  return BERUFE.map((b) => ({ ...b, teile: b.teile.map((t) => ({ ...t, daten: kurse.get(t.kurs) })) })).filter((b) => b.teile.some((t) => t.daten));
}

/** Kurzform ohne (m/w/d) – z. B. für Knöpfe und Titel. */
export function berufKurz(b: Pick<BerufDef, 'name'>): string {
  return b.name.replace(/\s*\(m\/w\/d\)$/, '');
}

export function berufUrl(b: Pick<BerufDef, 'slug'>): string {
  return `/pruefungsvorbereitung/${b.slug}/`;
}
