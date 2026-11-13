// Suchmaschinen-Titel und -Beschreibungen der Kursseiten (SEO-Audit 13.11.2026, docs: .superpowers/sdd/seo-audit.md).
// Basis.astro hängt „ | waybuild Akademie“ (20 Zeichen) an → Titel ohne Marke höchstens 40 Zeichen (gesamt 50–60).
// Beschreibung 150–160 Zeichen. Preise kommen aus den Kursdaten (eine Quelle, Endpreise).
// Reihenfolge: eigener Eintrag in SEO_KURSE → sonst aus Titel/Kurzbeschreibung abgeleitet (gekürzt).
import { formatEuro, type Kurs } from './kurse';

export const MARKE_ZUSATZ = ' | waybuild Akademie';
export const TITEL_MAX = 60;
export const BESCHREIBUNG_MAX = 160;

interface KursSeo {
  titel: string;
  beschreibung: string;
}

/** Handgeschriebene Angaben für freigegebene Kurse (Schlüssel = Dateiname der Kursdatei). */
const SEO_KURSE: Record<string, (k: Kurs) => KursSeo> = {
  'ap1-it-berufe': (k) => ({
    titel: 'AP1-Vorbereitung Fachinformatiker online',
    beschreibung: `AP1-Vorbereitung für Fachinformatiker und alle IT-Berufe: prüfungsnahe Aufgaben zum IT-gestützten Arbeitsplatz, live online an 10 Abenden. ${formatEuro(k.data.preis.betrag)} Endpreis.`,
  }),
  'ap2-fachinformatiker-systemintegration': (k) => ({
    titel: 'AP2 Fachinformatiker Systemintegration',
    beschreibung: `AP2-Vorbereitung für Fachinformatiker Systemintegration: IT-Systeme, Netzwerke und WiSo gezielt prüfungsnah üben – live online an 15 Abenden, ${formatEuro(k.data.preis.betrag)} Endpreis.`,
  }),
  pruefungscoaching: (k) => ({
    titel: 'Prüfungscoaching 1:1 für IT-Berufe',
    beschreibung: `1:1-Prüfungscoaching für Fachinformatiker und IT-Berufe: Projektantrag, Dokumentation, Präsentation und Fachgespräch – online, flexibel, ab ${formatEuro(k.data.preis.betrag)} je 60 Minuten.`,
  }),
};

/** Text an einer Wortgrenze auf höchstens `max` Zeichen kürzen (mit „…“). */
export function kuerzen(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const schnitt = t.slice(0, max - 1);
  const grenze = schnitt.lastIndexOf(' ');
  return `${(grenze > max * 0.6 ? schnitt.slice(0, grenze) : schnitt).replace(/[\s,;:–-]+$/, '')}…`;
}

/** Titel (ohne Marke) und Beschreibung einer Kursseite. */
export function kursSeo(kurs: Kurs): KursSeo {
  const eigen = SEO_KURSE[kurs.id];
  if (eigen) return eigen(kurs);
  return {
    titel: kurs.data.titel,
    beschreibung: kuerzen(kurs.data.kurzbeschreibung, BESCHREIBUNG_MAX),
  };
}

