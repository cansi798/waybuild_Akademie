// Kursübersicht /kurse/ (Progressive Enhancement): Ohne JavaScript steht die vollständige gruppierte Liste da.
// Mit JavaScript: Umschalter Liste/Karten (gemerkt in localStorage), Schnellsuche, Filter Säule + Kategorie
// (Adresse ?saeule=…&kategorie=…), Trefferzahl (aria-live), Zähler in Gruppen und Sprungleiste, leere Meldung.
import { saeuleAusParameter } from '../seiten/filter-parameter';
import { druecke, setzeAdresse } from '../seiten/katalog-filter';
import { suchNormal } from './suche';

export const ANSICHT_SCHLUESSEL = 'akademie-kursansicht';

const alle = <T extends Element>(w: ParentNode, s: string) => [...w.querySelectorAll<T>(s)];
const zahl = (n: number) => `${n} ${n === 1 ? 'Kurs' : 'Kurse'}`;

export function initUebersicht() {
  const w = document.querySelector<HTMLElement>('[data-katalog]');
  if (!w) return;
  const p = new URLSearchParams(location.search);
  // Link auf eine Säule ohne Kurse: Hinweis „in Vorbereitung“ statt leerer Liste
  const gewuenscht = saeuleAusParameter(p.get('saeule'));
  const vorb = gewuenscht && w.querySelector<HTMLElement>(`[data-saeule-vorbereitung="${gewuenscht}"]`);
  if (vorb) vorb.hidden = false;

  // Ansicht Liste/Karten
  const ansichtKnoepfe = alle<HTMLButtonElement>(w, '[data-ansicht-wahl]');
  const zeigeAnsicht = (a: string) => {
    w.dataset.ansicht = a;
    ansichtKnoepfe.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ansichtWahl === a)));
  };
  ansichtKnoepfe.forEach((b) =>
    b.addEventListener('click', () => {
      zeigeAnsicht(b.dataset.ansichtWahl!);
      try {
        localStorage.setItem(ANSICHT_SCHLUESSEL, b.dataset.ansichtWahl!);
      } catch {
        /* Speicher gesperrt (privates Fenster) – Wahl gilt nur für diesen Besuch */
      }
    }),
  );
  zeigeAnsicht(w.dataset.ansicht ?? 'liste');

  const leiste = w.querySelector<HTMLElement>('[data-filter]');
  if (!leiste) return;
  const saeulenKnoepfe = alle<HTMLButtonElement>(leiste, '[data-filter-saeule]');
  const auswahl = leiste.querySelector<HTMLSelectElement>('[data-filter-kategorie-auswahl]');
  const katOptionen = auswahl ? [...auswahl.options].map((o) => ({ wert: o.value, text: o.text, saeulen: (o.dataset.saeulen ?? '').split(' ') })) : [];
  const suche = leiste.querySelector<HTMLInputElement>('[data-suche-feld]');
  const eintraege = alle<HTMLElement>(w, 'li[data-kurs]');
  const kats = alle<HTMLElement>(w, '[data-kat-gruppe]');
  const gruppen = alle<HTMLElement>(w, '[data-saeule-gruppe]');
  const sprungZeilen = alle<HTMLElement>(w, '[data-sprung-saeule]');
  const sprungleiste = w.querySelector<HTMLElement>('[data-sprungleiste]');
  const treffer = leiste.querySelector<HTMLElement>('[data-treffer]')!;
  const leer = w.querySelector<HTMLElement>('[data-keine-treffer]');
  const leerBegriff = w.querySelector<HTMLElement>('[data-keine-treffer-begriff]');
  const zurueck = alle<HTMLButtonElement>(w, '[data-filter-zuruecksetzen]');

  const gueltig = new Set(saeulenKnoepfe.map((b) => b.dataset.filterSaeule));
  let saeule = saeuleAusParameter(p.get('saeule')) ?? '';
  if (!gueltig.has(saeule)) saeule = '';
  let kategorie = (p.get('kategorie') ?? '').toLowerCase();
  if (!katOptionen.some((o) => o.wert && o.wert === kategorie)) kategorie = '';

  const anwenden = (adresse: boolean) => {
    if (auswahl) {
      const angeboten = katOptionen.filter((o) => !o.wert || !saeule || o.saeulen.includes(saeule));
      if (!angeboten.some((o) => o.wert === kategorie)) kategorie = '';
      auswahl.replaceChildren(...angeboten.map((o) => new Option(o.text, o.wert, false, o.wert === kategorie)));
      auswahl.value = kategorie;
    }
    druecke(saeulenKnoepfe, 'data-filter-saeule', saeule);
    const woerter = (suche?.value ?? '').split(/\s+/).map(suchNormal).filter(Boolean);

    let n = 0;
    for (const li of eintraege) {
      const d = li.dataset;
      li.hidden = !((!saeule || d.saeule === saeule) && (!kategorie || d.kategorie === kategorie) && woerter.every((x) => d.suche!.includes(x)));
      if (!li.hidden) n++;
    }
    const zaehle = (el: HTMLElement, zaehler: string) => {
      const k = el.querySelectorAll('li[data-kurs]:not([hidden])').length;
      el.hidden = k === 0;
      el.querySelectorAll(zaehler).forEach((z) => (z.textContent = zahl(k)));
      return k;
    };
    for (const k of kats) {
      const m = zaehle(k, '[data-kat-zahl]');
      const s = w.querySelector<HTMLElement>(`[data-sprung="${k.id}"]`);
      if (s) {
        s.hidden = m === 0;
        s.querySelector('[data-sprung-zahl]')!.textContent = String(m);
      }
    }
    gruppen.forEach((g) => zaehle(g, '[data-gruppe-zahl]'));
    sprungZeilen.forEach((z) => (z.hidden = !z.querySelector('[data-sprung]:not([hidden])')));
    if (sprungleiste) sprungleiste.hidden = n === 0;

    treffer.textContent = zahl(n);
    treffer.dataset.anzahl = String(n);
    if (leer) leer.hidden = n > 0;
    if (leerBegriff) leerBegriff.textContent = suche?.value.trim() ? ` zu „${suche.value.trim()}“` : '';
    const gefiltert = !!(saeule || kategorie || woerter.length);
    zurueck.forEach((b) => (b.hidden = !gefiltert && !!b.closest('[data-filter]')));
    if (adresse) setzeAdresse({ saeule, kategorie });
  };

  saeulenKnoepfe.forEach((b) =>
    b.addEventListener('click', () => {
      saeule = b.dataset.filterSaeule ?? '';
      anwenden(true);
    }),
  );
  auswahl?.addEventListener('change', () => {
    kategorie = auswahl.value;
    anwenden(true);
  });
  suche?.addEventListener('input', () => anwenden(false));
  zurueck.forEach((b) =>
    b.addEventListener('click', () => {
      saeule = kategorie = '';
      if (suche) suche.value = '';
      anwenden(true);
      suche?.focus();
    }),
  );

  anwenden(false);
  w.dataset.filterBereit = 'true';
}
