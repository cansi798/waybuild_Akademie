// Eine Datenquelle für Karten, Kursseiten, Terminübersicht, Countdown und Formular (US-03 AK3, NFA-18).
import { getCollection, type CollectionEntry } from 'astro:content';
import { IS_PREVIEW } from './env';

export type Kurs = CollectionEntry<'kurse'>;
export type Termin = Kurs['data']['termine'][number];
export type Saeule = Kurs['data']['saeule'];
export interface TerminMitKurs {
  kurs: Kurs;
  termin: Termin;
}

const TAG_MS = 24 * 60 * 60 * 1000;

/** Heutiges Datum in Europe/Berlin als UTC-Mitternacht (Inhaltsdaten sind reine Kalenderdaten = UTC-Mitternacht). */
export function heute(jetzt: Date = new Date()): Date {
  const teile = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(jetzt); // "2026-11-13"
  return new Date(`${teile}T00:00:00Z`);
}

/** Ganze Kalendertage von heute bis zum Datum (heute = 0). */
export function tageBis(datum: Date, jetzt: Date = new Date()): number {
  return Math.round((datum.getTime() - heute(jetzt).getTime()) / TAG_MS);
}

/** Buchbar = Anmeldeschluss heute oder später (US-25). Vergangene Termine verschwinden mit dem nächsten Build. */
export function istBuchbar(t: Termin, jetzt: Date = new Date()): boolean {
  return t.anmeldeschluss.getTime() >= heute(jetzt).getTime();
}

/** Alle sichtbaren Kurse: live nur freigegebene, in der Vorschau zusätzlich Entwürfe (US-22). Sortiert nach `reihenfolge`, dann Titel. */
export async function alleKurse(): Promise<Kurs[]> {
  const kurse = await getCollection('kurse', ({ data }) => IS_PREVIEW || data.status === 'freigegeben');
  return kurse.sort((a, b) => a.data.reihenfolge - b.data.reihenfolge || a.data.titel.localeCompare(b.data.titel, 'de'));
}

/** Nur freigegebene Kurse (auch in der Vorschau) – z. B. für Countdown und Startseiten-Highlights. */
export async function freigegebeneKurse(): Promise<Kurs[]> {
  return (await alleKurse()).filter((k) => k.data.status === 'freigegeben');
}

/** Buchbare Termine eines Kurses, nach Start sortiert. */
export function buchbareTermine(kurs: Kurs, jetzt: Date = new Date()): Termin[] {
  return kurs.data.termine.filter((t) => istBuchbar(t, jetzt)).sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Nächster buchbarer Termin oder undefined („Termin in Planung – Interesse vormerken“). */
export function naechsterTermin(kurs: Kurs, jetzt: Date = new Date()): Termin | undefined {
  return buchbareTermine(kurs, jetzt)[0];
}

/** Alle künftigen (buchbaren) Termine aller sichtbaren Kurse, nach Startdatum sortiert. */
export async function alleTermine(jetzt: Date = new Date()): Promise<TerminMitKurs[]> {
  const kurse = await alleKurse();
  return kurse
    .flatMap((kurs) => buchbareTermine(kurs, jetzt).map((termin) => ({ kurs, termin })))
    .sort((a, b) => a.termin.start.getTime() - b.termin.start.getTime());
}

const EURO = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 2 });

/** 349 → "349 €", 69.5 → "69,50 €" */
export function formatEuro(n: number): string {
  return EURO.format(n).replace(/,00(?=\s*€)/, '');
}

type DatumStil = 'kurz' | 'lang' | 'tagmonat' | 'wochentag';
const DATUM: Record<DatumStil, Intl.DateTimeFormatOptions> = {
  kurz: { day: '2-digit', month: '2-digit', year: 'numeric' }, // 24.02.2027
  lang: { day: 'numeric', month: 'long', year: 'numeric' }, // 24. Februar 2027
  tagmonat: { day: '2-digit', month: '2-digit' }, // 24.02.
  wochentag: { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }, // Mi., 24.02.2027
};

/** Kalenderdatum (UTC-Mitternacht) deutsch formatieren. */
export function formatDatum(d: Date, stil: DatumStil = 'kurz'): string {
  return new Intl.DateTimeFormat('de-DE', { ...DATUM[stil], timeZone: 'UTC' }).format(d);
}

/** ISO-Datum "2027-02-24" (für <time datetime> und data-Attribute). */
export function isoDatum(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const SAEULEN: Record<Saeule, string> = {
  'ihk-pruefung': 'IHK-Prüfungsvorbereitung',
  'ihk-weiterbildung': 'IHK-Weiterbildung',
  akademie: 'waybuild Weiterbildung',
};

export function saeulenName(s: Saeule): string {
  return SAEULEN[s];
}

/** Kurzname für Countdown/Lernpfad: "ap1-it-berufe" → "AP1"; sonst Kategorie. */
export function kurzname(kurs: Kurs): string {
  const m = kurs.id.match(/^(ap\d)/i);
  return m ? m[1].toUpperCase() : kurs.data.kategorie;
}

// ---------------------------------------------------------------------------
// Ergänzungen Task 3 (Katalog, Kursseite, Termine) – bestehende Signaturen bleiben unverändert.

/** Feste Reihenfolge der Säulen in Katalog, Terminen und Filtern. */
export const SAEULEN_REIHENFOLGE: readonly Saeule[] = ['ihk-pruefung', 'ihk-weiterbildung', 'akademie'];

/** Ein Satz je Säule für Katalog-Gruppen und Filter. */
export const SAEULEN_TEXT: Record<Saeule, string> = {
  'ihk-pruefung': 'Vorbereitung auf die Abschlussprüfung bei deiner IHK – für Azubis und Umschüler.',
  'ihk-weiterbildung': 'Berufsbegleitende Aufstiegsfortbildungen – die Prüfung legst du bei deiner IHK ab.',
  akademie: 'Praxiskurse in KI, Programmierung und IT mit Teilnahmezertifikat der waybuild Akademie.',
};

/** Adress-Parameter ?saeule=… (auch Kurzformen wie „pruefungsvorbereitung“) – siehe components/seiten/filter-parameter.ts. */
export { saeuleAusParameter } from '../components/seiten/filter-parameter';

/** Kategorie als Adress-Wert: "IT & Cloud" → "it-cloud", "Kaufmännische Berufe" → "kaufmaennische-berufe". */
export function kategorieSlug(kategorie: string): string {
  return kategorie
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Kurse je Säule (in fester Säulen-Reihenfolge, leere Säulen entfallen). Reihenfolge innerhalb: wie alleKurse(). */
export function nachSaeule(kurse: Kurs[]): { saeule: Saeule; kurse: Kurs[] }[] {
  return SAEULEN_REIHENFOLGE.map((saeule) => ({ saeule, kurse: kurse.filter((k) => k.data.saeule === saeule) })).filter(
    (g) => g.kurse.length > 0,
  );
}

/** Alle vorkommenden Kategorien (nur nicht leere, US-02 AK1), alphabetisch, mit Säule(n). */
export function kategorienVon(kurse: Kurs[]): { name: string; slug: string; saeulen: Saeule[] }[] {
  const map = new Map<string, Set<Saeule>>();
  for (const k of kurse) {
    const s = map.get(k.data.kategorie) ?? new Set<Saeule>();
    s.add(k.data.saeule);
    map.set(k.data.kategorie, s);
  }
  return [...map.entries()]
    .map(([name, s]) => ({ name, slug: kategorieSlug(name), saeulen: SAEULEN_REIHENFOLGE.filter((x) => s.has(x)) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/** IHK-bezogen (Prüfungsvorbereitung oder IHK-Weiterbildung) → IHK-Hinweis Pflicht (US-19). */
export function istIhkKurs(kurs: Kurs): boolean {
  return kurs.data.saeule !== 'akademie';
}

/** Adresse des Anmeldeformulars mit vorausgewähltem Termin (US-07 AK4). */
export function anmeldeUrl(kurs: Kurs, termin: Termin): string {
  return `/anmeldung/?kurs=${encodeURIComponent(kurs.id)}&termin=${encodeURIComponent(termin.id)}`;
}

/** Adresse „Interesse vormerken“ (US-14). */
export function interesseUrl(kurs: Kurs): string {
  return `/interesse/?kurs=${encodeURIComponent(kurs.id)}`;
}

/** Umfang für Kennzahlen: "35 UE" bzw. "je 60 Minuten" beim Coaching. */
export function umfangText(kurs: Kurs): string | undefined {
  if (kurs.data.art === 'coaching') return 'je 60 Minuten';
  return kurs.data.ue ? `${kurs.data.ue} UE` : undefined;
}

/** "Januar 2027" */
export function formatMonat(d: Date): string {
  return new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
}

/** Termine nach Monat des Starts gruppieren (Eingabe bereits sortiert). */
export function nachMonat(liste: TerminMitKurs[]): { schluessel: string; titel: string; eintraege: TerminMitKurs[] }[] {
  const gruppen: { schluessel: string; titel: string; eintraege: TerminMitKurs[] }[] = [];
  for (const e of liste) {
    const schluessel = isoDatum(e.termin.start).slice(0, 7);
    let g = gruppen.find((x) => x.schluessel === schluessel);
    if (!g) {
      g = { schluessel, titel: formatMonat(e.termin.start), eintraege: [] };
      gruppen.push(g);
    }
    g.eintraege.push(e);
  }
  return gruppen;
}
