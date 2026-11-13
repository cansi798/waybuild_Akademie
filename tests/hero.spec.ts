// Hero-Bühne „Von der Anmeldung bis zum Abschluss“ (src/components/hero/).
import { test, expect, type Page } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

const DAUER = [4000, 3200, 3800, 3400, 3800]; // wie STATIONEN in ReiseBuehne.astro

const buehne = (page: Page) => page.locator('[data-reise]');
const aktiv = (page: Page, i: number) => expect(buehne(page)).toHaveAttribute('data-hr-aktiv', String(i));
/** Uhr der Seite anhalten, bevor sie lädt – Timer laufen dann nur mit clock.runFor (unabhängig von der Rechnerlast). */
async function uhrAnhalten(page: Page) {
  const t0 = new Date('2026-12-01T09:00:00+01:00');
  await page.clock.install({ time: t0 });
  await page.clock.pauseAt(new Date(t0.getTime() + 1000));
}

/** Nächster buchbarer Termin eines Kurses direkt aus der Inhaltsdatei (gleiche Regel wie lib/kurse: Anmeldeschluss ≥ heute). */
function naechsterTermin(slug: string) {
  const md = readFileSync(`src/content/kurse/${slug}.md`, 'utf8');
  const bloecke = md.split(/\n\s+- id: /).slice(1);
  const heute = new Date().toISOString().slice(0, 10);
  const termine = bloecke.map((b) => ({
    start: b.match(/start: (\d{4}-\d{2}-\d{2})/)![1],
    pruefung: b.match(/pruefung: (\d{4}-\d{2}-\d{2})/)?.[1],
    anmeldeschluss: b.match(/anmeldeschluss: (\d{4}-\d{2}-\d{2})/)![1],
  }));
  return termine.filter((t) => t.anmeldeschluss >= heute).sort((a, b) => a.start.localeCompare(b.start))[0];
}
const deutsch = (iso: string) => iso.split('-').reverse().join('.');
const tageZwischen = (von: string, bis: string) => Math.round((Date.parse(`${bis}T00:00:00Z`) - Date.parse(`${von}T00:00:00Z`)) / 86_400_000);

test.describe('Hero-Reise', () => {
  test.describe.configure({ timeout: 45_000 });
  test('Stationen wechseln automatisch und laufen in Schleife', async ({ page }) => {
    await uhrAnhalten(page);
    await page.goto('./');
    await expect(buehne(page)).toHaveClass(/ist-an/);
    await aktiv(page, 0);
    await expect(page.locator('[data-hr-station="0"]')).toBeVisible();
    await expect(page.locator('[data-hr-station="1"]')).toBeHidden();
    for (let i = 0; i < 5; i++) {
      await page.clock.runFor(DAUER[i] + 100);
      await aktiv(page, (i + 1) % 5);
    }
    await expect(page.locator('[data-hr-punkt="0"]')).toHaveAttribute('aria-current', 'step');
    await page.clock.runFor(DAUER[0] + 100);
    await aktiv(page, 1);
    await expect(page.locator('[data-hr-station="1"]')).toBeVisible();
    await expect(page.locator('[data-hr-punkt="1"]')).toHaveAttribute('aria-current', 'step');
    await expect(page.locator('[data-hr-punkt="0"]')).not.toHaveAttribute('aria-current', /./);
  });

  test('Pause hält an, Weiter läuft weiter; Stationsname wird angesagt', async ({ page }) => {
    await uhrAnhalten(page);
    await page.goto('./');
    await expect(buehne(page)).toHaveClass(/ist-an/);
    await aktiv(page, 0);
    await page.clock.runFor(DAUER[0] + 100);
    await aktiv(page, 1);
    const knopf = page.locator('[data-hr-pause]');
    await expect(knopf).toHaveText('Pause');
    await knopf.click();
    await expect(knopf).toHaveText('Weiter');
    await expect(buehne(page)).toHaveClass(/ist-pausiert/);
    await page.clock.runFor(20_000);
    await aktiv(page, 1);
    // Direkt anspringen, Ansage im Live-Bereich
    await page.locator('[data-hr-punkt="3"]').click();
    await aktiv(page, 3);
    const live = page.locator('[data-hr-live]');
    await expect(live).toHaveAttribute('aria-live', 'polite');
    await expect(live).toHaveText('Schritt 4 von 5: Prüfungstag');
    await page.clock.runFor(10_000);
    await aktiv(page, 3);
    await knopf.click();
    await expect(knopf).toHaveText('Pause');
    await page.clock.runFor(DAUER[3] + 100);
    await aktiv(page, 4);
  });

  test('reduzierte Bewegung: alle Stationen statisch als Bildfolge, keine Steuerung', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await uhrAnhalten(page);
    await page.goto('./');
    await expect(buehne(page)).not.toHaveClass(/ist-an/);
    const oben: number[] = [];
    for (let i = 0; i < 5; i++) {
      const s = page.locator(`[data-hr-station="${i}"]`);
      await expect(s).toBeVisible();
      oben.push((await s.boundingBox())!.y);
    }
    expect([...oben].sort((a, b) => a - b)).toEqual(oben); // untereinander, nicht übereinander
    await expect(page.locator('[data-hr-pause]')).toBeHidden();
    await expect(page.locator('[data-hr-punkt="0"]')).toBeHidden();
    await page.clock.runFor(20_000);
    await aktiv(page, 0);
  });

  test('Kursstart und Prüfungstag kommen aus den Kursdaten (Zeit fixiert)', async ({ page }) => {
    const heute = '2026-12-01';
    await page.clock.setFixedTime(new Date(`${heute}T10:00:00+01:00`));
    await page.goto('./');
    const ap1 = naechsterTermin('ap1-it-berufe');
    expect(ap1?.pruefung).toBeTruthy();
    const b = buehne(page);
    await expect(b.locator('[data-hr-f="kursStart"]')).toHaveText(`AP1 · Start ${deutsch(ap1.start)}`);
    await expect(b.locator('[data-hr-f="tag"]')).toHaveText(String(Number(ap1.pruefung!.slice(8))));
    await expect(b.locator('time[data-hr-f="datum"]')).toContainText(deutsch(ap1.pruefung!));
    await expect(b.locator('time[data-hr-f="datum"]')).toHaveAttribute('datetime', ap1.pruefung!);
    const tage = String(tageZwischen(heute, ap1.pruefung!));
    for (const el of await b.locator('[data-hr-f="tage"]').all()) await expect(el).toHaveText(tage);
    await expect(b.locator('[data-hr-f="uhr"]')).toHaveText('18:00 Uhr');

    // Countdown-Schalter auf AP2 → Bühne zeigt den AP2-Termin
    const ap2 = naechsterTermin('ap2-fachinformatiker-systemintegration');
    await page.locator('.cd-schalter label').nth(1).click();
    await expect(b.locator('[data-hr-f="kursStart"]')).toHaveText(`AP2 · Start ${deutsch(ap2.start)}`);
    await expect(b.locator('time[data-hr-f="datum"]')).toContainText(deutsch(ap2.pruefung!));
    await expect(b.locator('[data-hr-f="tage"]').first()).toHaveText(String(tageZwischen(heute, ap2.pruefung!)));
  });

  test('keine Termine fest im Code der Hero-Bauteile', async () => {
    for (const datei of readdirSync('src/components/hero')) {
      const code = readFileSync(`src/components/hero/${datei}`, 'utf8');
      expect(code, datei).not.toMatch(/\b20\d\d-\d\d-\d\d\b|\b\d\d\.\d\d\.20\d\d\b/);
    }
  });

  for (const breite of [320, 375, 768, 1280, 1440]) {
    test(`kein horizontales Scrollen bei ${breite} px (alle Stationen)`, async ({ page }) => {
      test.setTimeout(60_000); // fünf Stationen × Klick, auch auf ausgelasteten Rechnern
      await uhrAnhalten(page);
      await page.setViewportSize({ width: breite, height: 900 });
      await page.goto('./');
      const pruefen = async () => {
        const r = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(r).toBeLessThanOrEqual(0);
      };
      await page.locator('[data-hr-pause]').click();
      for (let i = 0; i < 5; i++) {
        await page.locator(`[data-hr-punkt="${i}"]`).click();
        await aktiv(page, i);
        await pruefen();
      }
    });
  }

  for (const [b, h] of [[390, 844], [375, 667], [360, 740], [320, 568]]) {
    test(`Bühne mobil höchstens 70 % der Höhe (${b} × ${h})`, async ({ page }) => {
      await page.setViewportSize({ width: b, height: h });
      await page.goto('./');
      const box = await buehne(page).boundingBox();
      expect(box!.height).toBeLessThanOrEqual(h * 0.7);
      expect(box!.width).toBeLessThanOrEqual(b);
    });
  }

  test('Hauptknopf „Kurs & Termin wählen“ führt zu den Kursen', async ({ page }) => {
    await page.goto('./');
    await page.locator('[data-hero-buchen]').click();
    await expect(page).toHaveURL(/\/kurse\/$/);
  });
});
