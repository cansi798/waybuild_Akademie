import { test, expect } from '@playwright/test';

// Rechtsseiten (Task 5): Laden, H1, Inhaltsverzeichnis, Entwurfsband, Widerrufs-Link im Fuß, 320 px.
const SEITEN = [
  { pfad: 'impressum/', h1: 'Impressum' },
  { pfad: 'datenschutz/', h1: 'Datenschutzerklärung' },
  { pfad: 'teilnahmebedingungen/', h1: 'Teilnahmebedingungen' },
  { pfad: 'widerruf/', h1: 'Widerrufsbelehrung' },
];

for (const s of SEITEN) {
  test.describe(`/${s.pfad}`, () => {
    test('lädt mit H1 und Entwurfsband', async ({ page }) => {
      const antwort = await page.goto(`./${s.pfad}`);
      expect(antwort?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveText(s.h1);
      const band = page.locator('[data-recht-entwurf]');
      await expect(band).toBeVisible();
      await expect(band).toContainText('Entwurf – rechtlich noch nicht geprüft. Vor Veröffentlichung anwaltlich prüfen lassen.');
      await expect(page.locator('[data-recht-stand]')).toContainText('Stand:');
    });

    test('Inhaltsverzeichnis: jeder Anker hat ein Ziel und springt dorthin', async ({ page }) => {
      await page.goto(`./${s.pfad}`);
      const links = page.locator('[data-recht-toc] a');
      const anzahl = await links.count();
      expect(anzahl).toBeGreaterThan(3);
      const ziele = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
      for (const ziel of ziele) {
        expect(ziel).toMatch(/^#[a-z0-9-]+$/);
        await expect(page.locator(`[data-recht-text] ${ziel}`), ziel).toHaveCount(1);
      }
      // Letzten Anker anklicken: URL-Fragment wechselt, Ziel ist im Bild
      const letzter = ziele[ziele.length - 1];
      await links.last().click();
      await expect(page).toHaveURL(new RegExp(`${letzter}$`));
      await expect(page.locator(letzter)).toBeInViewport();
    });

    test('Fuß-Link „Vertrag widerrufen“ führt zu /widerruf/#widerrufsformular', async ({ page }) => {
      await page.goto(`./${s.pfad}`);
      const link = page.locator('footer [data-widerruf-link]');
      await expect(link).toBeVisible();
      await expect(link).toHaveText('Vertrag widerrufen');
      await link.click();
      await expect(page).toHaveURL(/\/widerruf\/#widerrufsformular$/);
      await expect(page.locator('#widerrufsformular')).toBeInViewport();
    });

    test('kein horizontales Scrollen bei 320 px', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(`./${s.pfad}`);
      const r = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(r).toBeLessThanOrEqual(0);
    });
  });
}

test('Fuß-Link „Vertrag widerrufen“ steht auf jeder Seite', async ({ page }) => {
  for (const pfad of ['', 'kurse/', 'termine/', 'kontakt/', 'anmeldung/', 'gibt-es-nicht/']) {
    await page.goto(`./${pfad}`);
    const link = page.locator('footer [data-widerruf-link]');
    await expect(link, `/${pfad}`).toHaveCount(1);
    expect(await link.getAttribute('href'), `/${pfad}`).toMatch(/\/widerruf\/#widerrufsformular$/);
  }
});

test('Widerruf: Belehrung, Muster-Formular und Bereich #widerrufsformular vorhanden', async ({ page }) => {
  await page.goto('./widerruf/');
  await expect(page.locator('[data-widerrufsbelehrung]')).toContainText('binnen vierzehn Tagen');
  await expect(page.locator('[data-widerrufsbelehrung]')).toContainText('Widerrufsfunktion');
  await expect(page.locator('[data-widerrufsbelehrung]')).toContainText('angemessenen Betrag');
  await expect(page.locator('[data-muster-widerrufsformular]')).toContainText('Unzutreffendes streichen');
  // Formular (Task 4) oder Ersatzhinweis – eins von beiden ist da
  const app = page.locator('[data-widerruf-app]');
  await expect(app).toBeVisible();
  expect(await app.locator('form, [data-widerruf-folgt]').count()).toBeGreaterThan(0);
});

test('Teilnahmebedingungen: Nachweisvorbehalt bei Storno', async ({ page }) => {
  await page.goto('./teilnahmebedingungen/');
  await expect(page.locator('#storno ~ p').filter({ hasText: 'Nachweis' }).first()).toContainText('geringerer Schaden');
});
