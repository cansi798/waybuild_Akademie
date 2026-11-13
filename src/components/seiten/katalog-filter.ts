// Filter für die Terminübersicht (Progressive Enhancement, NFA-05); die Kursübersicht /kurse/ steuert components/uebersicht/uebersicht.ts.
// Ohne JavaScript bleibt alles sichtbar; mit JavaScript: Chips (aria-pressed), Filter in der Adresse,
// Trefferzahl in einer aria-live-Region.
import { saeuleAusParameter } from './filter-parameter';

/** Heute in Europe/Berlin als "YYYY-MM-DD". */
export function heuteIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/** Termine mit abgelaufenem Anmeldeschluss markieren (nach dem Build, US-25). */
export function markiereAbgelaufene(wurzel: ParentNode) {
  const heute = heuteIso();
  wurzel.querySelectorAll<HTMLElement>('[data-anmeldeschluss]').forEach((el) => {
    if ((el.dataset.anmeldeschluss ?? '') < heute) {
      el.hidden = true;
      el.dataset.abgelaufen = 'true';
    }
  });
}

const zahlText = (n: number, einzahl: string, mehrzahl: string) => `${n} ${n === 1 ? einzahl : mehrzahl}`;

export function setzeAdresse(werte: Record<string, string>) {
  const url = new URL(location.href);
  for (const [k, v] of Object.entries(werte)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  history.replaceState(null, '', url);
}

export function druecke(knoepfe: HTMLButtonElement[], attr: string, wert: string) {
  knoepfe.forEach((b) => b.setAttribute('aria-pressed', String((b.getAttribute(attr) ?? '') === wert)));
}

/** Terminübersicht /termine/: abgelaufene Termine ausblenden, optional Filter nach Säule. */
export function initTerminFilter() {
  const wurzel = document.querySelector<HTMLElement>('[data-termine-seite]');
  if (!wurzel) return;
  markiereAbgelaufene(wurzel);
  const leiste = wurzel.querySelector<HTMLElement>('[data-filter]');
  const knoepfe = leiste ? [...leiste.querySelectorAll<HTMLButtonElement>('[data-filter-saeule]')] : [];
  const eintraege = [...wurzel.querySelectorAll<HTMLElement>('li[data-termin]')];
  const gruppen = [...wurzel.querySelectorAll<HTMLElement>('[data-termin-gruppe]')];
  const treffer = leiste?.querySelector<HTMLElement>('[data-treffer]');
  const leer = wurzel.querySelector<HTMLElement>('[data-keine-treffer]');
  const gueltig = new Set(knoepfe.map((b) => b.dataset.filterSaeule).filter(Boolean));
  let saeule = saeuleAusParameter(new URLSearchParams(location.search).get('saeule')) ?? '';
  if (!gueltig.has(saeule)) saeule = '';

  const anwenden = (adresse: boolean) => {
    druecke(knoepfe, 'data-filter-saeule', saeule);
    let sichtbar = 0;
    eintraege.forEach((li) => {
      const passt = li.dataset.abgelaufen !== 'true' && (!saeule || li.dataset.saeule === saeule);
      li.hidden = !passt;
      if (passt) sichtbar++;
    });
    gruppen.forEach((g) => (g.hidden = g.querySelectorAll('li[data-termin]:not([hidden])').length === 0));
    if (treffer) {
      treffer.textContent = zahlText(sichtbar, 'Termin', 'Termine');
      treffer.dataset.anzahl = String(sichtbar);
    }
    if (leer) leer.hidden = sichtbar > 0;
    if (adresse) setzeAdresse({ saeule });
  };
  knoepfe.forEach((b) =>
    b.addEventListener('click', () => {
      saeule = b.dataset.filterSaeule ?? '';
      anwenden(true);
    }),
  );
  if (leiste) leiste.hidden = false;
  anwenden(false);
  wurzel.dataset.filterBereit = 'true';
}
