// Kurzanfrage: Kurs wählt den passenden Bereich mit; Links mit data-anfrage-* füllen das Formular auf derselben Seite vor
// (ohne Neuladen), holen es in den Blick und setzen den Fokus ins Namensfeld. Ohne JavaScript führt der Link (?bereich=…&kurs=…#anfrage)
// zur Startseite – dort wählt einfach-client.ts aus der Adresse vor.
const form = document.querySelector<HTMLFormElement>('[data-anfrage-formular]');
if (form) {
  const bereich = form.querySelector<HTMLSelectElement>('select[name="thema"]')!;
  const kurs = form.querySelector<HTMLSelectElement>('select[name="kurs"]')!;
  const nachricht = form.querySelector<HTMLTextAreaElement>('textarea[name="nachricht"]');
  const passend = () => {
    const b = kurs.selectedOptions[0]?.dataset.bereich;
    if (b) bereich.value = b;
  };
  kurs.addEventListener('change', passend);
  passend();

  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-anfrage-bereich], a[data-anfrage-kurs]');
    if (!a) return;
    const ziel = new URL(a.href, location.href);
    // Nur auf derselben Seite abfangen – sonst normal navigieren
    if (ziel.pathname !== location.pathname) return;
    e.preventDefault();
    const k = a.dataset.anfrageKurs ?? '';
    kurs.value = [...kurs.options].some((o) => o.value === k) ? k : '';
    if (a.dataset.anfrageBereich) bereich.value = a.dataset.anfrageBereich;
    passend();
    const text = a.dataset.anfrageText;
    if (text && nachricht && !nachricht.value) {
      nachricht.value = text;
      form.querySelector<HTMLDetailsElement>('[data-anfrage-mehr]')!.open = true;
    }
    for (const el of [bereich, kurs]) el.dispatchEvent(new Event('change', { bubbles: true }));
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    form.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    form.querySelector<HTMLInputElement>('input[name="name"]')?.focus({ preventScroll: true });
    history.replaceState(null, '', `${location.pathname}#anfrage`);
  });
}
