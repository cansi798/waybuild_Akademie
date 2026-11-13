// Daten der Hero-Reise („Anmeldung bis Abschluss“). Alles kommt aus den Kursterminen (Countdown-Optionen + Kurszeiten),
// nichts ist fest eingetragen. Die Werte sind fertig formatiert, damit das Browser-Skript nur Text tauschen muss.
import type { CountdownOption } from '../../lib/countdown';
import { formatDatum, isoDatum, tageBis, type Kurs } from '../../lib/kurse';

/** Ein Satz Anzeige-Werte; Schlüssel = data-hr-f im Markup. */
export interface ReiseWerte {
  iso: string; // Prüfungstag "JJJJ-MM-TT" (Grundlage für „Noch N Tage“ im Browser)
  schluss: string; // Anmeldeschluss "JJJJ-MM-TT" – danach springt der Browser auf den nächsten Termin (folge)
  kursStart: string; // "AP1 · Start TT.MM.JJJJ"
  start: string; // "TT.MM.JJJJ"
  datum: string; // "Mittwoch, TT.MM.JJJJ"
  tag: string; // "24"
  vortag: string; // "23" (Abreißkalender)
  vorvortag: string; // "22"
  monat: string; // "Februar 2027"
  wochentag: string; // "Mittwoch"
  pruefungTitel: string; // "Prüfung AP1"
  zeiten: string; // "Di + Do, 18:00–20:45 Uhr"
  uhr: string; // "18:00 Uhr"
  tage: string; // Stand des Builds, im Browser neu gerechnet
  einheit: string; // "Tage" | "Tag"
}

const TAG_MS = 86_400_000;
const fmt = (d: Date, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('de-DE', { ...o, timeZone: 'UTC' }).format(d);

export function reiseWerte(o: CountdownOption, kurse: Kurs[]): ReiseWerte {
  const zeiten = kurse.find((k) => k.id === o.slug)?.data.zeiten ?? '';
  const uhr = zeiten.match(/\d{1,2}:\d{2}/)?.[0];
  const tage = tageBis(o.pruefung);
  const tagVor = (n: number) => fmt(new Date(o.pruefung.getTime() - n * TAG_MS), { day: 'numeric' });
  return {
    iso: isoDatum(o.pruefung),
    schluss: isoDatum(o.anmeldeschluss),
    kursStart: `${o.kurz} · Start ${formatDatum(o.start)}`,
    start: formatDatum(o.start),
    datum: `${fmt(o.pruefung, { weekday: 'long' })}, ${formatDatum(o.pruefung)}`,
    tag: fmt(o.pruefung, { day: 'numeric' }),
    vortag: tagVor(1),
    vorvortag: tagVor(2),
    monat: fmt(o.pruefung, { month: 'long', year: 'numeric' }),
    wochentag: fmt(o.pruefung, { weekday: 'long' }),
    pruefungTitel: `Prüfung ${o.kurz}`,
    zeiten,
    uhr: uhr ? `${uhr} Uhr` : 'abends',
    tage: String(tage),
    einheit: tage === 1 ? 'Tag' : 'Tage',
  };
}
