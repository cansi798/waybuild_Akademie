// Browser-Teil aller Formulare (Vanilla TS, ohne Framework). Ohne JavaScript senden die Formulare normal per POST.
// Mit JavaScript: Prüfung am Feld (Du-Ton, aria-invalid, aria-describedby), Fehler-Zusammenfassung, Fokus auf das erste
// Fehlerfeld, Versand per fetch (JSON-Antwort des PHP-Endpunkts), Zeitfalle-Token, Demo-Modus in der Vorschau.
import { MUSTER } from '../../lib/formular';

export type Zeile = [string, string];
export interface Zusammenfassung {
  art: string;
  zeilen: Zeile[];
  vorgang?: string;
}
export interface FormularOptionen {
  art: () => string;
  /** zusätzliche Prüfungen (z. B. doppelte E-Mail-Adressen) – gibt Fehler je Feldname zurück */
  zusatz?: () => Record<string, string>;
  zusammenfassung?: () => Zeile[];
  /** Erfolg selbst behandeln (z. B. Widerruf: Meldung im Formular statt Danke-Seite). true = erledigt */
  erfolg?: (antwort: Record<string, unknown>) => boolean;
  /** Vor dem Absenden (nach erfolgreicher Prüfung). false = nicht senden (z. B. erster Widerrufsschritt) */
  vorSenden?: () => boolean;
}

const SPEICHER = 'akademie-formular';
type Steuer = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function aktiv(el: Steuer): boolean {
  return !el.disabled && !el.closest('[hidden]') && !el.closest('fieldset:disabled');
}

function leer(el: Steuer, form: HTMLFormElement): boolean {
  if (el instanceof HTMLInputElement && el.type === 'checkbox') return !el.checked;
  if (el instanceof HTMLInputElement && el.type === 'radio') {
    return !form.querySelector(`input[type=radio][name="${CSS.escape(el.name)}"]:checked`);
  }
  return el.value.trim() === '';
}

/** Prüft ein Feld nach seinen data-Regeln; gibt den Fehlertext oder '' zurück. */
export function feldPruefen(el: Steuer, form: HTMLFormElement): string {
  if (!aktiv(el)) return '';
  const d = el.dataset;
  const pflichtText = d.fehlerPflicht ?? 'Bitte fülle dieses Feld aus.';
  const formatText = d.fehlerFormat ?? pflichtText;
  if (leer(el, form)) return d.pflicht !== undefined ? pflichtText : '';
  const wert = el.value.trim();
  const laenge = [...wert].length;
  if (d.min && laenge < Number(d.min)) return formatText;
  if (d.max && laenge > Number(d.max)) return formatText;
  switch (d.regel) {
    case 'email':
      if (wert.length > 254 || !new RegExp(MUSTER.email).test(wert)) return formatText;
      break;
    case 'telefon':
      if (!new RegExp(MUSTER.telefon).test(wert)) return formatText;
      break;
    case 'plz':
      if (!new RegExp(MUSTER.plz).test(wert)) return formatText;
      break;
    case 'vorgang':
      if (!new RegExp(MUSTER.vorgang).test(wert)) return formatText;
      break;
    case 'vorname':
      if (/^\d+$/.test(wert)) return formatText;
      break;
  }
  return '';
}

function felderVon(form: HTMLFormElement, name: string): Steuer[] {
  return [...form.querySelectorAll<Steuer>(`[name="${CSS.escape(name)}"]`)].filter((el) => el.type !== 'hidden');
}

export function fehlerZeigen(form: HTMLFormElement, name: string, text: string): void {
  const p = form.querySelector<HTMLElement>(`[data-fehler-fuer="${CSS.escape(name)}"]`);
  if (p) {
    p.textContent = text;
    p.hidden = text === '';
  }
  for (const el of felderVon(form, name)) {
    if (text) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
  }
}

function zusammenfassungZeigen(form: HTMLFormElement, fehler: [string, string][]): void {
  const box = form.querySelector<HTMLElement>('[data-fehler-summary]');
  if (!box) return;
  const liste = box.querySelector('[data-summary-liste]')!;
  liste.replaceChildren();
  if (fehler.length === 0) {
    box.hidden = true;
    box.removeAttribute('role');
    return;
  }
  box.querySelector('[data-summary-titel]')!.textContent =
    fehler.length === 1 ? 'Bitte prüfe 1 Angabe:' : `Bitte prüfe ${fehler.length} Angaben:`;
  for (const [name, text] of fehler) {
    const el = felderVon(form, name)[0];
    const li = document.createElement('li');
    if (el?.id) {
      const a = document.createElement('a');
      a.href = `#${el.id}`;
      a.className = 'link-fliess';
      a.textContent = text;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        el.focus();
      });
      li.append(a);
    } else {
      li.textContent = text;
    }
    liste.append(li);
  }
  box.setAttribute('role', 'alert');
  box.hidden = false;
}

function meldung(form: HTMLFormElement, text: string): void {
  const m = form.querySelector<HTMLElement>('[data-formular-meldung]');
  if (!m) return;
  m.querySelector('[data-meldung-text]')!.textContent = text;
  m.hidden = text === '';
}

/** Alle aktiven Felder prüfen, Fehler anzeigen. Gibt die Fehler in Formular-Reihenfolge zurück. */
export function allesPruefen(form: HTMLFormElement, zusatz?: () => Record<string, string>): [string, string][] {
  const fehler = new Map<string, string>();
  const namen: string[] = [];
  for (const el of form.querySelectorAll<Steuer>('[data-feld]')) {
    if (namen.includes(el.name)) continue;
    namen.push(el.name);
    const text = feldPruefen(el, form);
    if (text) fehler.set(el.name, text);
  }
  for (const [name, text] of Object.entries(zusatz?.() ?? {})) if (!fehler.has(name)) fehler.set(name, text);
  for (const name of namen) fehlerZeigen(form, name, fehler.get(name) ?? '');
  // Reihenfolge wie im Formular
  const reihenfolge = [...form.querySelectorAll<Steuer>('[name]')].map((el) => el.name);
  return [...fehler.entries()].sort((a, b) => reihenfolge.indexOf(a[0]) - reihenfolge.indexOf(b[0]));
}

function ersteFokussieren(form: HTMLFormElement, fehler: [string, string][]): void {
  const el = fehler.length ? felderVon(form, fehler[0][0]).find(aktiv) : undefined;
  el?.focus();
}

export function speichern(z: Zusammenfassung): void {
  try {
    sessionStorage.setItem(SPEICHER, JSON.stringify(z));
  } catch {
    /* privater Modus – Danke-Seite zeigt dann nur den allgemeinen Text */
  }
}

export function laden(): Zusammenfassung | null {
  try {
    const roh = sessionStorage.getItem(SPEICHER);
    return roh ? (JSON.parse(roh) as Zusammenfassung) : null;
  } catch {
    return null;
  }
}

/** Ein Formular einrichten. Erwartet data-art, data-demo, data-danke, data-token am <form>. */
export function formularEinrichten(form: HTMLFormElement, opt: FormularOptionen): { pruefen: () => boolean } {
  form.noValidate = true;
  const demo = form.dataset.demo === 'true';
  const knopf = form.querySelector<HTMLButtonElement>('[data-absenden]');
  let versucht = false;

  // Zeitfalle: signierten Zeitstempel holen (nur live – in der Vorschau gibt es kein PHP)
  // Der Zeitstempel gilt 6 Stunden – bei lange offenen Seiten alle 5 Stunden neu holen
  const holeToken = () => {
    if (demo || !form.dataset.token) return;
    fetch(form.dataset.token, { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { ts?: string | null; sig?: string | null } | null) => {
        if (j?.ts && j.sig) {
          form.querySelector<HTMLInputElement>('[data-zeit-ts]')!.value = j.ts;
          form.querySelector<HTMLInputElement>('[data-zeit-sig]')!.value = j.sig;
        }
      })
      .catch(() => {});
  };
  holeToken();
  if (!demo) setInterval(holeToken, 5 * 60 * 60 * 1000);

  // Wird gerade ein Absenden-Knopf gedrückt, nicht beim Verlassen des Feldes prüfen: Ein eingeblendeter Fehlertext
  // würde den Knopf zwischen Drücken und Loslassen verschieben – der Klick ginge ins Leere. Das Absenden prüft ohnehin alles.
  let knopfGedrueckt = false;
  form.addEventListener('pointerdown', (e) => {
    if ((e.target as Element).closest('button[type="submit"], button:not([type])')) {
      knopfGedrueckt = true;
      setTimeout(() => (knopfGedrueckt = false), 800);
    }
  });

  // Inline-Prüfung: beim Verlassen eines Feldes, danach bei jeder Änderung, solange ein Fehler angezeigt wird
  const einzeln = (e: Event) => {
    const el = e.target as Steuer;
    if (!el?.dataset || el.dataset.feld === undefined) return;
    if (knopfGedrueckt && e.type !== 'input') return;
    const istFehler = el.getAttribute('aria-invalid') === 'true';
    if (e.type === 'focusout' && !versucht && leer(el, form)) return;
    if (e.type === 'input' && !istFehler) return;
    fehlerZeigen(form, el.name, feldPruefen(el, form));
  };
  form.addEventListener('focusout', einzeln);
  form.addEventListener('input', einzeln);
  form.addEventListener('change', einzeln);

  const pruefen = () => {
    versucht = true;
    meldung(form, '');
    const fehler = allesPruefen(form, opt.zusatz);
    zusammenfassungZeigen(form, fehler);
    if (fehler.length) {
      ersteFokussieren(form, fehler);
      return false;
    }
    return true;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!pruefen()) return;
    if (opt.vorSenden && !opt.vorSenden()) return;
    const art = opt.art();
    const zeilen = opt.zusammenfassung?.() ?? [];

    if (demo) {
      if (opt.erfolg?.({ ok: true, demo: true, eingang: jetztText() })) return;
      speichern({ art, zeilen });
      location.assign(`${form.dataset.danke}?art=${encodeURIComponent(art)}&demo=1`);
      return;
    }

    knopf?.setAttribute('aria-busy', 'true');
    if (knopf) knopf.disabled = true;
    try {
      const antwort = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const json = (await antwort.json().catch(() => ({}))) as Record<string, unknown>;
      if (antwort.ok && json.ok) {
        if (opt.erfolg?.(json)) return;
        speichern({ art, zeilen, vorgang: typeof json.vorgang === 'string' ? json.vorgang : undefined });
        location.assign(String(json.weiter ?? `${form.dataset.danke}?art=${art}`));
        return;
      }
      const felder = (json.fehler ?? {}) as Record<string, string>;
      const liste = Object.entries(felder);
      for (const [name, text] of liste) fehlerZeigen(form, name, text);
      if (liste.length) {
        zusammenfassungZeigen(form, liste);
        ersteFokussieren(form, liste);
      } else {
        meldung(form, typeof json.meldung === 'string' ? json.meldung : 'Das Senden hat leider nicht geklappt. Bitte versuche es gleich noch einmal.');
        form.querySelector<HTMLElement>('[data-formular-meldung]')?.scrollIntoView({ block: 'center' });
      }
    } catch {
      meldung(form, 'Das Senden hat leider nicht geklappt – bitte prüfe deine Internetverbindung. Deine Eingaben sind noch da.');
    } finally {
      knopf?.removeAttribute('aria-busy');
      if (knopf) knopf.disabled = false;
    }
  });

  return { pruefen };
}

export function jetztText(d: Date = new Date()): string {
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', ...o }).format(d);
  return `${f({ day: '2-digit', month: '2-digit', year: 'numeric' })} um ${f({ hour: '2-digit', minute: '2-digit' })} Uhr`;
}

/** Ein Bereich mit allen Feldern ein- oder ausschalten (ausgeschaltete Felder werden nicht gesendet und nicht geprüft). */
export function bereich(el: HTMLElement | null, an: boolean): void {
  if (!el) return;
  el.hidden = !an;
  for (const f of el.querySelectorAll<Steuer>('input, select, textarea')) f.disabled = !an;
}

/** Wert eines Feldes (Radio: gewählter Wert). */
export function wert(form: HTMLFormElement, name: string): string {
  const el = form.elements.namedItem(name);
  if (el instanceof RadioNodeList) return el.value;
  return el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement ? el.value.trim() : '';
}
