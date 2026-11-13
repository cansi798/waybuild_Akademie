// Tempo mobil (NFA: Lighthouse mobil ≥ 95): Absicherung der Maßnahmen aus bau/tempo.
// Die Lighthouse-Messung selbst läuft getrennt (Bericht .superpowers/sdd/tempo-report.md); hier wird geprüft,
// dass die Maßnahmen wirken und nichts kaputt machen (kein Layout-Sprung, Inhalte erreichbar, Bühnen wie gehabt).
import { test, expect, type Page } from '@playwright/test';

const SEITEN = ['./', 'pruefungsvorbereitung/', 'coaching/', 'kurse/', 'kurse/ap1-it-berufe/', 'anmeldung/'];

/** Summe der Layout-Verschiebungen (ohne solche direkt nach Eingaben) bis kurz nach dem Laden. */
async function cls(page: Page) {
  return page.evaluate(
    () =>
      new Promise<number>((fertig) => {
        let summe = 0;
        new PerformanceObserver((liste) => {
          for (const e of liste.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) if (!e.hadRecentInput) summe += e.value;
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => fertig(summe), 2500);
      }),
  );
}

test.describe('Tempo', () => {
  for (const [name, viewport] of [
    ['mobil', { width: 412, height: 823 }],
    ['Desktop', { width: 1440, height: 900 }],
  ] as const) {
    test(`kein Layout-Sprung beim Laden (${name})`, async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'layout-shift gibt es nur in Chromium');
      test.setTimeout(90_000);
      await page.setViewportSize(viewport);
      for (const s of SEITEN) {
        await page.goto(s);
        expect(await cls(page), s).toBeLessThan(0.1);
      }
    });
  }

  test('Abschnitte unter dem ersten Bild werden erst bei Annäherung gezeichnet, Inhalte bleiben erreichbar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./');
    const cta = page.locator('main > section').last();
    await expect(cta).toHaveCSS('content-visibility', 'auto');
    await expect(page.locator('body > footer')).toHaveCSS('content-visibility', 'auto');
    // Bühnen und Lernpfad bleiben ausgenommen (IntersectionObserver / view-timeline)
    await expect(page.locator('main > section:has([data-warum])')).toHaveCSS('content-visibility', 'visible');
    await expect(page.locator('main > section:has(.lernpfad)')).toHaveCSS('content-visibility', 'visible');
    // Fuß per Tastatur/Scrollen erreichbar und sichtbar
    const ihk = page.locator('[data-ihk-hinweis]');
    await ihk.scrollIntoViewIfNeeded();
    await expect(ihk).toBeVisible();
    await expect(ihk).toContainText('keine Veranstaltung der IHK');
  });

  test('Warum-Bühne: nur die aktive Szene zeichnet ihre Grafik, Höhe bleibt beim Wechsel gleich', async ({ page }) => {
    await page.clock.install();
    await page.goto('./');
    const buehne = page.locator('[data-warum]');
    await buehne.scrollIntoViewIfNeeded();
    await expect(buehne).toHaveClass(/ist-buehne/);
    await expect(page.locator('[data-wb-szene="0"] .wb-bild')).toHaveCSS('content-visibility', 'visible');
    for (let i = 1; i < 6; i++) await expect(page.locator(`[data-wb-szene="${i}"] .wb-bild`)).toHaveCSS('content-visibility', 'hidden');
    const hoehe = async () => (await page.locator('[data-wb-liste]').boundingBox())!.height;
    const vorher = await hoehe();
    await page.locator('[data-wb-weiter]').click();
    await expect(buehne).toHaveAttribute('data-wb-aktiv', '1');
    await expect(page.locator('[data-wb-szene="1"] .wb-bild')).toHaveCSS('content-visibility', 'visible');
    expect(Math.abs((await hoehe()) - vorher)).toBeLessThan(1);
    // Grafik der aktiven Szene hat ihre volle Größe (Seitenverhältnis 320 : 220)
    const bild = (await page.locator('[data-wb-szene="1"] .wb-bild svg').boundingBox())!;
    expect(Math.abs(bild.width / bild.height - 320 / 220)).toBeLessThan(0.02);
  });

  test('Hero-Bühne: Fortschritts-Variablen hängen an der Spur, nicht an der ganzen Bühne', async ({ page }) => {
    await page.clock.install();
    await page.goto('./');
    const buehne = page.locator('[data-reise]');
    await expect(buehne).toHaveClass(/ist-an/);
    expect(await buehne.getAttribute('style')).toBeNull();
    await page.locator('[data-hr-punkt="2"]').click();
    await expect(buehne).toHaveAttribute('data-hr-aktiv', '2');
    await expect(page.locator('[data-hr-spur]')).toHaveAttribute('style', /--hr-pos:\s*2/);
    await expect(page.locator('[data-hr-station="2"]')).toHaveClass(/ist-laeuft/);
    await expect(page.locator('[data-hr-station="0"]')).not.toHaveClass(/ist-laeuft/);
  });
});
