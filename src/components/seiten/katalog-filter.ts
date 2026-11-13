// Filter für Katalog und Terminübersicht (Progressive Enhancement, NFA-05).
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

function setzeAdresse(werte: Record<string, string>) {
  const url = new URL(location.href);
  for (const [k, v] of Object.entries(werte)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  history.replaceState(null, '', url);
}

function druecke(knoepfe: HTMLButtonElement[], attr: string, wert: string) {
  knoepfe.forEach((b) => b.setAttribute('aria-pressed', String((b.getAttribute(attr) ?? '') === wert)));
}

/** Kurskatalog /kurse/ */
export function initKatalog() {
  const wurzel = document.querySelector<HTMLElement>('[data-katalog]');
  if (!wurzel) return;
  // Link auf eine Säule ohne Kurse (z. B. von der Startseite): Hinweis „in Vorbereitung“ statt leerer Liste
  const gewuenscht = saeuleAusParameter(new URLSearchParams(location.search).get('saeule'));
  const vorbereitung = gewuenscht && wurzel.querySelector<HTMLElement>(`[data-saeule-vorbereitung="${gewuenscht}"]`);
  if (vorbereitung) vorbereitung.hidden = false;
  const leiste = wurzel.querySelector<HTMLElement>('[data-filter]');
  if (!leiste) return;
  const saeulenKnoepfe = [...leiste.querySelectorAll<HTMLButtonElement>('[data-filter-saeule]')];
  const auswahl = leiste.querySelector<HTMLSelectElement>('[data-filter-kategorie-auswahl]')!;
  // Alle Kategorien merken; je Säule werden nur passende angeboten (leere Kategorien nicht, US-02 AK1)
  const katOptionen = [...auswahl.options].map((o) => ({ wert: o.value, text: o.text, saeulen: (o.dataset.saeulen ?? '').split(' ').filter(Boolean) }));
  const eintraege = [...wurzel.querySelectorAll<HTMLElement>('li[data-kurs]')];
  const gruppen = [...wurzel.querySelectorAll<HTMLElement>('[data-saeule-gruppe]')];
  const treffer = leiste.querySelector<HTMLElement>('[data-treffer]')!;
  const leer = wurzel.querySelector<HTMLElement>('[data-keine-treffer]');
  const zuruecksetzen = [...wurzel.querySelectorAll<HTMLButtonElement>('[data-filter-zuruecksetzen]')];
  const gueltigeSaeulen = new Set(saeulenKnoepfe.map((b) => b.dataset.filterSaeule).filter(Boolean));
  const gueltigeKat = new Set(katOptionen.map((o) => o.wert).filter(Boolean));

  const p = new URLSearchParams(location.search);
  let saeule = saeuleAusParameter(p.get('saeule')) ?? '';
  if (!gueltigeSaeulen.has(saeule)) saeule = '';
  let kategorie = (p.get('kategorie') ?? '').toLowerCase();
  if (!gueltigeKat.has(kategorie)) kategorie = '';

  const anwenden = (adresse: boolean) => {
    const angeboten = katOptionen.filter((o) => !o.wert || !saeule || o.saeulen.includes(saeule));
    if (kategorie && !angeboten.some((o) => o.wert === kategorie)) kategorie = '';
    auswahl.replaceChildren(...angeboten.map((o) => new Option(o.text, o.wert, false, o.wert === kategorie)));
    auswahl.value = kategorie;
    druecke(saeulenKnoepfe, 'data-filter-saeule', saeule);

    let sichtbar = 0;
    eintraege.forEach((li) => {
      const passt = (!saeule || li.dataset.saeule === saeule) && (!kategorie || li.dataset.kategorie === kategorie);
      li.hidden = !passt;
      if (passt) sichtbar++;
    });
    gruppen.forEach((g) => {
      const n = g.querySelectorAll('li[data-kurs]:not([hidden])').length;
      g.hidden = n === 0;
      const z = g.querySelector<HTMLElement>('[data-gruppe-zahl]');
      if (z) z.textContent = zahlText(n, 'Kurs', 'Kurse');
    });
    treffer.textContent = zahlText(sichtbar, 'Kurs', 'Kurse');
    treffer.dataset.anzahl = String(sichtbar);
    if (leer) leer.hidden = sichtbar > 0;
    zuruecksetzen.forEach((b) => (b.hidden = !saeule && !kategorie && b.closest('[data-filter]') !== null));
    if (adresse) setzeAdresse({ saeule, kategorie });
  };

  saeulenKnoepfe.forEach((b) =>
    b.addEventListener('click', () => {
      saeule = b.dataset.filterSaeule ?? '';
      anwenden(true);
    }),
  );
  auswahl.addEventListener('change', () => {
    kategorie = auswahl.value;
    anwenden(true);
  });
  zuruecksetzen.forEach((b) =>
    b.addEventListener('click', () => {
      saeule = '';
      kategorie = '';
      anwenden(true);
    }),
  );

  leiste.hidden = false;
  anwenden(false);
  wurzel.dataset.filterBereit = 'true';
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
