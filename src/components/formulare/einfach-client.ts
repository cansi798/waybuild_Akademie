// Interesse- und Kontaktformular im Browser: Vorauswahl aus der Adresse (z. B. ?kurs=…, ?thema=…), Prüfung, Versand.
import { formularEinrichten, wert, type Zeile } from './formular';

for (const form of document.querySelectorAll<HTMLFormElement>('[data-einfaches-formular]')) {
  const params = new URLSearchParams(location.search);
  for (const sel of form.querySelectorAll<HTMLSelectElement>('select[data-url-param]')) {
    const v = params.get(sel.dataset.urlParam!);
    if (v && [...sel.options].some((o) => o.value === v && !o.disabled)) sel.value = v;
  }
  formularEinrichten(form, {
    art: () => form.dataset.art!,
    zusammenfassung: () => {
      const z: Zeile[] = [];
      for (const el of form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[data-zeile]')) {
        const w = el instanceof HTMLSelectElement ? el.selectedOptions[0]?.textContent?.trim() ?? '' : wert(form, el.name);
        if (w && (!(el instanceof HTMLSelectElement) || el.value)) z.push([el.dataset.zeile!, w]);
      }
      return z;
    },
  });
}
