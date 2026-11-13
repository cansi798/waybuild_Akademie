// Kurs-, Termin- und Preisdaten für die Formulare – dieselbe Form im Browser (Anmeldeseite) und in /api/termine.json (S-06).
// Quelle ist immer src/lib/kurse.ts: live nur freigegebene Kurse, in der Vorschau zusätzlich Entwürfe (gekennzeichnet).
import { alleKurse, buchbareTermine, formatDatum, isoDatum, saeulenName, type Kurs } from '../../lib/kurse';
import { paketId } from '../../lib/formular';

export interface FormTermin {
  id: string;
  start: string; // ISO "2027-01-19"
  ende: string;
  anmeldeschluss: string;
  pruefung?: string;
  /** "19.01.–18.02.2027" */
  zeitraum: string;
}

export interface FormPaket {
  id: string;
  name: string;
  betrag: number;
  beschreibung: string;
}

export interface FormKurs {
  id: string;
  titel: string;
  untertitel: string;
  saeule: string;
  art: 'kurs' | 'coaching';
  status: 'freigegeben' | 'entwurf';
  ue?: number;
  dauer: string;
  zeiten: string;
  preis: number;
  raten: boolean;
  pakete: FormPaket[];
  termine: FormTermin[];
}

export interface FormDaten {
  version: 1;
  erzeugt: string;
  kurse: FormKurs[];
}

function zeitraum(start: Date, ende: Date): string {
  return `${formatDatum(start, 'tagmonat')}–${formatDatum(ende)}`;
}

export function formKurs(kurs: Kurs, jetzt: Date = new Date()): FormKurs {
  const d = kurs.data;
  return {
    id: kurs.id,
    titel: d.titel,
    untertitel: d.untertitel,
    saeule: saeulenName(d.saeule),
    art: d.art,
    status: d.status,
    ue: d.ue,
    dauer: d.dauer,
    zeiten: d.zeiten,
    preis: d.preis.betrag,
    raten: d.preis.raten,
    pakete: (d.pakete ?? []).map((p) => ({ id: paketId(p.name), name: p.name, betrag: p.betrag, beschreibung: p.beschreibung })),
    termine: d.art === 'coaching'
      ? []
      : buchbareTermine(kurs, jetzt).map((t) => ({
          id: t.id,
          start: isoDatum(t.start),
          ende: isoDatum(t.ende),
          anmeldeschluss: isoDatum(t.anmeldeschluss),
          pruefung: t.pruefung ? isoDatum(t.pruefung) : undefined,
          zeitraum: zeitraum(t.start, t.ende),
        })),
  };
}

export async function formularDaten(jetzt: Date = new Date()): Promise<FormDaten> {
  const kurse = await alleKurse();
  return { version: 1, erzeugt: jetzt.toISOString(), kurse: kurse.map((k) => formKurs(k, jetzt)) };
}
