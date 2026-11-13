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

const EURO = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2, minimumFractionDigits: 0 });

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
