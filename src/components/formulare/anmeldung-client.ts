// Anmeldeformular im Browser: Vorauswahl aus ?kurs=&termin=&paket=, Termine passend zum Kurs (abgelaufene nicht wählbar),
// Personen 1–5, Zahlweg-Bereiche, Wertersatz-Pflicht bei Start innerhalb der Widerrufsfrist, Live-Preis und Zusammenfassung.
import { bereich, formularEinrichten, wert, type Zeile } from './formular';
import type { FormDaten, FormKurs, FormTermin } from './daten';
import { FEHLER, MAX_PERSONEN, berechnePreis, buchbarIso, euro, paketId, tageBisIso, wertersatzPflicht } from '../../lib/formular';

// Zusatz für Entwürfe nur im Vorschau-Build: Vite setzt PUBLIC_PREVIEW beim Bauen ein, live fällt der Text ganz weg.
const ENTWURF_ZUSATZ = import.meta.env.PUBLIC_PREVIEW === 'true' ? ' (Entwurf – live nicht buchbar)' : '';

const form = document.querySelector<HTMLFormElement>('[data-anmeldeformular]');
if (form) einrichten(form);

function datumDe(iso: string): string {
  const [j, m, t] = iso.split('-');
  return `${t}.${m}.${j}`;
}

function einrichten(form: HTMLFormElement) {
  const daten = JSON.parse(document.getElementById('anmeldung-daten')?.textContent ?? '{"kurse":[]}') as FormDaten;
  const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector<T>(s);
  const $$ = <T extends Element = HTMLElement>(s: string) => [...form.querySelectorAll<T>(s)];
  const kursSel = form.elements.namedItem('kurs') as HTMLSelectElement;
  const terminSel = form.elements.namedItem('termin') as HTMLSelectElement;
  const personenSel = form.elements.namedItem('personen') as HTMLSelectElement;
  const wertersatz = form.elements.namedItem('wertersatz') as HTMLInputElement;
  const knopf = form.querySelector<HTMLButtonElement>('[data-absenden]')!;
  const params = new URLSearchParams(location.search);

  for (const el of $$('[data-ohne-js-hinweis]')) el.hidden = true;

  const kurs = (): FormKurs | undefined => daten.kurse.find((k) => k.id === kursSel.value);
  const termin = (): FormTermin | undefined => kurs()?.termine.find((t) => t.id === terminSel.value);
  const istCoaching = () => kurs()?.art === 'coaching';
  const paket = () => kurs()?.pakete.find((p) => p.id === wert(form, 'paket'));
  const anzahl = () => (istCoaching() ? 1 : Math.min(MAX_PERSONEN, Math.max(1, Number(personenSel.value) || 1)));

  function termineAufbauen(vorwahl?: string | null) {
    const k = kurs();
    terminSel.replaceChildren(new Option('Bitte Termin wählen', ''));
    let erster = '';
    for (const t of k?.termine ?? []) {
      const offen = buchbarIso(t.anmeldeschluss);
      const o = new Option(`${t.zeitraum} · ${k!.zeiten}${offen ? '' : ' – Anmeldung geschlossen'}`, t.id);
      o.disabled = !offen;
      terminSel.append(o);
      if (offen && !erster) erster = t.id;
    }
    const gewuenscht = k?.termine.find((t) => t.id === vorwahl && buchbarIso(t.anmeldeschluss));
    terminSel.value = gewuenscht?.id ?? erster;
    const keine = $('[data-keine-termine]');
    if (keine) {
      keine.hidden = !k || k.art === 'coaching' || erster !== '';
      const link = keine.querySelector<HTMLAnchorElement>('[data-interesse-link]');
      if (link && k) link.href = `${link.href.split('?')[0]}?kurs=${encodeURIComponent(k.id)}`;
    }
  }

  function personenNamen(): string[] {
    return Array.from({ length: anzahl() }, (_, i) => `${wert(form, `p${i + 1}_vorname`)} ${wert(form, `p${i + 1}_nachname`)}`.trim()).filter(Boolean);
  }

  function rechnungText(): string {
    const zw = wert(form, 'zahlweg');
    if (zw === 'selbst') {
      const name = personenNamen()[0] ?? 'Person 1';
      return [name, wert(form, 'strasse'), `${wert(form, 'plz')} ${wert(form, 'ort')}`.trim()].filter(Boolean).join(', ');
    }
    if (zw === 'betrieb') {
      return [wert(form, 'firma'), wert(form, 'ansprechperson'), wert(form, 'firma_strasse'), `${wert(form, 'firma_plz')} ${wert(form, 'firma_ort')}`.trim(), wert(form, 'rechnung_email')]
        .filter(Boolean)
        .join(', ');
    }
    return '';
  }

  function zusammenfassung(): Zeile[] {
    const k = kurs();
    if (!k) return [];
    const z: Zeile[] = [['Kurs', `${k.titel}${k.status === 'entwurf' ? ENTWURF_ZUSATZ : ''}`]];
    const t = termin();
    const p = paket();
    if (istCoaching()) {
      if (p) z.push(['Paket', `${p.name} (${p.beschreibung})`]);
      const ws = wert(form, 'wunschzeiten');
      if (ws) z.push(['Wunschzeitraum', ws]);
    } else {
      if (t) z.push(['Termin', `${t.zeitraum}, ${k.zeiten}, live online`]);
      if (k.ue) z.push(['Umfang', `${k.ue} Unterrichtseinheiten · ${k.dauer}`]);
      if (t?.pruefung) z.push(['IHK-Prüfung', `${datumDe(t.pruefung)} (verbindlich ist die Einladung deiner IHK)`]);
    }
    const namen = personenNamen();
    if (namen.length) z.push([anzahl() === 1 ? 'Teilnehmer/in' : `Teilnehmende (${anzahl()})`, namen.join(', ')]);
    const r = rechnungText();
    if (r) z.push([wert(form, 'zahlweg') === 'betrieb' ? 'Rechnung an (Firma)' : 'Rechnung an', r]);
    const preis = aktuellerPreis();
    if (preis) z.push(['Endpreis', `${euro(preis.gesamt)}, alles inklusive${preis.rabattProzent ? ` (inkl. ${preis.rabattProzent} % Gruppenrabatt)` : ''}`]);
    return z;
  }

  function aktuellerPreis() {
    const k = kurs();
    if (!k) return null;
    if (istCoaching()) {
      const p = paket();
      return p ? berechnePreis(p.betrag, 1) : null;
    }
    return berechnePreis(k.preis, anzahl());
  }

  // Nur ändern, was sich wirklich ändert: Ersetzte Textknoten unter dem Mauszeiger lassen WebKit den Klick verwerfen
  function setzeText(sel: string, text: string) {
    for (const el of document.querySelectorAll<HTMLElement>(sel)) if (el.textContent !== text) el.textContent = text;
  }

  function aktualisieren() {
    const k = kurs();
    const coaching = istCoaching();
    // Bereiche: zuerst außen, dann innen (bereich() schaltet alle enthaltenen Felder)
    for (const el of $$('[data-bereich="kurs"]')) bereich(el, !coaching);
    for (const el of $$('[data-bereich="coaching"]')) bereich(el, coaching);
    for (const el of $$('[data-paket-kurs]')) bereich(el, coaching && el.dataset.paketKurs === k?.id);
    // Seitenleiste (außerhalb des Formulars): „So läuft's“ für Kurs bzw. Coaching
    for (const el of document.querySelectorAll<HTMLElement>('[data-seiten-bereich]')) el.hidden = (el.dataset.seitenBereich === 'coaching') !== coaching;
    const n = anzahl();
    for (const el of $$('[data-person]')) bereich(el, Number(el.dataset.person) <= n);
    const zw = wert(form, 'zahlweg');
    bereich($('[data-zahlweg-bereich="selbst"]'), zw === 'selbst');
    bereich($('[data-zahlweg-bereich="betrieb"]'), zw === 'betrieb');

    // Wertersatz: Pflicht bei Kursstart innerhalb der Widerrufsfrist (Zeitpunkt: jetzt im Browser, verbindlich prüft der Server)
    const t = termin();
    const pflicht = !coaching && !!t && wertersatzPflicht(t.start);
    wertersatz.toggleAttribute('data-pflicht', pflicht);
    wertersatz.setAttribute('aria-required', String(pflicht));
    form.querySelector('[data-feld-rahmen="wertersatz"] [data-pflicht-stern]')?.classList.toggle('hidden', !pflicht);
    const hinweis = form.querySelector<HTMLElement>('[data-feld-rahmen="wertersatz"] [data-haken-hinweis]');
    if (hinweis) {
      hinweis.textContent = !t
        ? 'Pflicht, wenn dein Kurs innerhalb von 14 Tagen nach heute startet – sonst freiwillig.'
        : pflicht
          ? `Pflicht: Dein Kurs startet in ${tageBisIso(t.start)} Tagen – also noch innerhalb der 14-tägigen Widerrufsfrist.`
          : 'Freiwillig: Dein Kurs startet erst nach Ablauf der 14-tägigen Widerrufsfrist.';
    }
    if (!pflicht && wertersatz.getAttribute('aria-invalid')) {
      wertersatz.removeAttribute('aria-invalid');
      const p = form.querySelector<HTMLElement>('[data-fehler-fuer="wertersatz"]');
      if (p) p.hidden = true;
    }

    // Kursinfo
    const info = $('[data-kursinfo]');
    if (info) {
      info.hidden = !k;
      if (k) {
        setzeText('[data-info-umfang]', coaching ? '60 Minuten je Termin' : k.ue ? `${k.ue} UE · ${k.dauer}` : k.dauer);
        setzeText('[data-info-zeiten]', k.zeiten);
        setzeText('[data-info-preis-titel]', coaching ? 'Pakete' : 'Teilnahmegebühr je Person');
        setzeText('[data-info-preis]', coaching ? `ab ${euro(Math.min(...k.pakete.map((p) => p.betrag)))}` : euro(k.preis));
        const pz = $('[data-info-pruefung-zeile]');
        if (pz) pz.hidden = !t?.pruefung;
        setzeText('[data-info-pruefung]', t?.pruefung ? `IHK-Prüfung zur Orientierung: ${datumDe(t.pruefung)} – verbindlich ist die Einladung deiner IHK.` : '');
      }
    }

    // Preis
    const preis = aktuellerPreis();
    const zeilen = $('[data-preis-zeilen]');
    if (zeilen) zeilen.hidden = !preis;
    if (preis) {
      setzeText('[data-preis-einzel-titel]', coaching ? 'Paketpreis' : 'Teilnahmegebühr je Person');
      setzeText('[data-preis-einzel]', euro(preis.einzel));
      setzeText('[data-preis-personen-titel]', `× ${preis.personen} ${preis.personen === 1 ? 'Person' : 'Personen'}`);
      setzeText('[data-preis-zwischen]', euro(preis.zwischensumme));
      const pz = $('[data-preis-personen-zeile]');
      if (pz) pz.hidden = coaching;
      const rz = $('[data-preis-rabatt-zeile]');
      if (rz) rz.hidden = preis.rabatt === 0;
      setzeText('[data-preis-rabatt]', `−${euro(preis.rabatt)}`);
    }
    setzeText('[data-preis-gesamt]', preis ? euro(preis.gesamt) : '–');
    setzeText('[data-auswahl-preis]', preis ? euro(preis.gesamt) : '–');
    const raten = $('[data-raten]');
    if (raten) raten.hidden = !(k?.raten && !coaching);

    // Seitenleiste
    setzeText('[data-auswahl-kurs]', k ? k.titel : 'Noch kein Kurs gewählt');
    setzeText('[data-auswahl-termin]', coaching ? (paket() ? `${paket()!.name} · ${paket()!.beschreibung}` : 'Paket wählen') : t ? `${t.zeitraum} · ${k!.zeiten}` : '');
    setzeText('[data-rechnung-name]', personenNamen()[0] || 'Person 1');

    // Zusammenfassung
    const dl = $('[data-zusammenfassung]');
    const box = $('[data-zusammenfassung-box]');
    const z = zusammenfassung();
    const schluessel = JSON.stringify(z);
    if (dl && box && dl.dataset.stand !== schluessel) {
      dl.dataset.stand = schluessel;
      box.hidden = z.length === 0;
      dl.replaceChildren(
        ...z.flatMap(([a, b]) => {
          const dt = document.createElement('dt');
          dt.className = 'text-gedaempft';
          dt.textContent = a;
          const dd = document.createElement('dd');
          dd.className = 'trennen font-semibold';
          dd.textContent = b;
          return [dt, dd];
        }),
      );
    }

    // Knopf: verbindliche Anmeldung vs. unverbindliche Coaching-Anfrage (GR-07, GR-14)
    const knopfText = coaching ? 'Paket anfragen' : 'Zahlungspflichtig anmelden';
    if (knopf.textContent !== knopfText) knopf.textContent = knopfText;
    setzeText('[data-knopf-hinweis]', coaching
      ? 'Unverbindliche Anfrage – wir melden uns zur Terminabstimmung. Die Rechnung kommt danach per E-Mail.'
      : 'Die Rechnung kommt per E-Mail – eine Online-Zahlung ist nicht nötig. Die Prüfungsgebühr deiner IHK ist nicht enthalten.');
  }

  // Vorauswahl aus der Adresse
  const kursParam = params.get('kurs');
  if (kursParam && daten.kurse.some((k) => k.id === kursParam)) kursSel.value = kursParam;
  termineAufbauen(params.get('termin'));
  // ?paket= nimmt den Paketnamen (Links von /coaching/, z. B. „Coaching-Paket“) oder die Paket-ID; Unbekanntes wird ignoriert
  const paketParam = params.get('paket')?.trim();
  const gewaehlt = paketParam ? kurs()?.pakete.find((p) => p.name === paketParam || p.id === paketParam || p.id === paketId(paketParam)) : undefined;
  if (gewaehlt) {
    const r = form.querySelector<HTMLInputElement>(`input[name="paket"][value="${CSS.escape(gewaehlt.id)}"]`);
    if (r) r.checked = true;
  }
  aktualisieren();

  kursSel.addEventListener('change', () => {
    termineAufbauen();
    aktualisieren();
  });
  form.addEventListener('input', aktualisieren);
  form.addEventListener('change', aktualisieren);

  formularEinrichten(form, {
    art: () => (istCoaching() ? 'coaching' : 'anmeldung'),
    zusammenfassung,
    zusatz: () => {
      const f: Record<string, string> = {};
      const k = kurs();
      if (k && k.art === 'kurs' && k.termine.every((t) => !buchbarIso(t.anmeldeschluss))) f.termin = FEHLER.termin;
      const gesehen = new Set<string>();
      for (let i = 1; i <= anzahl(); i++) {
        const e = wert(form, `p${i}_email`).toLowerCase();
        if (!e) continue;
        if (gesehen.has(e)) f[`p${i}_email`] = FEHLER.emailDoppelt;
        gesehen.add(e);
      }
      return f;
    },
  });
}
