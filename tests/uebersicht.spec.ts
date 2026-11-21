// Kursübersicht „Alle Kurse auf einen Blick“ (/kurse/: Liste/Karten, Schnellsuche, Sprungleiste) und Menü „Kurse“
// (Mega-Menü Desktop, Kategorien mobil). Läuft gegen dist/ – Vorschau-Build (mit Entwürfen) bzw. Live-Build.
import { test, expect, type Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const istVorschau = (() => {
  try {
    return readFileSync(join(process.cwd(), 'dist/index.html'), 'utf8').includes('data-vorschau-banner');
  } catch {
    return true;
  }
})();
const kursDateien = readdirSync(join(process.cwd(), 'src/content/kurse'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ slug: f.replace(/\.md$/, ''), status: /^status:\s*(\S+)/m.exec(readFileSync(join(process.cwd(), 'src/content/kurse', f), 'utf8'))?.[1] }));
const freigegeben = kursDateien.filter((k) => k.status === 'freigegeben').map((k) => k.slug);
const sichtbar = istVorschau ? kursDateien.map((k) => k.slug) : freigegeben;

const zahlText = (n: number) => `${n} ${n === 1 ? 'Kurs' : 'Kurse'}`;
async function keinHScroll(page: Page, wo: string) {
  const r = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(r, `horizontales Scrollen auf ${wo}`).toBeLessThanOrEqual(0);
}

test.describe('Kursübersicht (Vorschau-Build)', () => {
  test.skip(!istVorschau, 'nur im Vorschau-Build');

  test('Liste ist Standard, Karten umschaltbar, Wahl wird gemerkt', async ({ page }) => {
    await page.goto('./kurse/');
    const katalog = page.locator('[data-katalog]');
    await expect(katalog).toHaveAttribute('data-filter-bereit', 'true');
    await expect(katalog).toHaveAttribute('data-ansicht', 'liste');
    await expect(page.locator('[data-ansicht-wahl="liste"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-kurszeile]:visible')).toHaveCount(sichtbar.length);
    await expect(page.locator('[data-kurskarte]:visible')).toHaveCount(0);
    // Zeile: Titel-Link, Umfang, Preis, Start bzw. „Termin folgt“
    const ap1 = page.locator('[data-kurszeile="ap1-it-berufe"]');
    await expect(ap1.getByRole('link')).toHaveAttribute('href', /\/kurse\/ap1-it-berufe\/$/);
    await expect(ap1).toContainText('35 UE');
    await expect(ap1).toContainText('349 €');
    await expect(page.locator('[data-kurszeile="webentwicklung-html-css-javascript"]')).toContainText('Termin folgt');
    // Entwürfe: kleines Badge nur an Entwürfen
    await expect(page.locator('[data-kurszeile="ap2-fachinformatiker-anwendungsentwicklung"] [data-entwurf-marke]')).toBeVisible();
    await expect(ap1.locator('[data-entwurf-marke]')).toHaveCount(0);

    await page.locator('[data-ansicht-wahl="karten"]').click();
    await expect(katalog).toHaveAttribute('data-ansicht', 'karten');
    await expect(page.locator('[data-ansicht-wahl="karten"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-kurskarte]:visible')).toHaveCount(sichtbar.length);
    await expect(page.locator('[data-kurszeile]:visible')).toHaveCount(0);

    await page.reload();
    await expect(katalog).toHaveAttribute('data-ansicht', 'karten');
    await expect(page.locator('[data-ansicht-wahl="karten"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('[data-ansicht-wahl="liste"]').click();
    await page.reload();
    await expect(katalog).toHaveAttribute('data-ansicht', 'liste');
  });

  test('gesperrter Speicher: Seite funktioniert trotzdem', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('gesperrt');
        },
      });
    });
    const fehler: string[] = [];
    page.on('pageerror', (e) => fehler.push(e.message));
    await page.goto('./kurse/');
    await expect(page.locator('[data-katalog]')).toHaveAttribute('data-filter-bereit', 'true');
    await page.locator('[data-ansicht-wahl="karten"]').click();
    await expect(page.locator('[data-katalog]')).toHaveAttribute('data-ansicht', 'karten');
    expect(fehler).toEqual([]);
  });

  test('Schnellsuche findet „Fachwirt“ und „AP1“, leere Meldung mit „Filter zurücksetzen“', async ({ page }) => {
    await page.goto('./kurse/');
    await expect(page.locator('[data-katalog]')).toHaveAttribute('data-filter-bereit', 'true');
    const feld = page.getByRole('searchbox', { name: 'Kurse durchsuchen' });
    const treffer = page.locator('[data-treffer]');

    await feld.fill('Fachwirt');
    const n = await page.locator('li[data-kurs]:visible').count();
    expect(n).toBeGreaterThanOrEqual(7);
    expect(n).toBeLessThan(sichtbar.length);
    await expect(treffer).toHaveText(zahlText(n));
    for (const t of await page.locator('li[data-kurs]:visible').allTextContents()) expect(t.toLowerCase()).toContain('fachwirt');
    await expect(page.locator('[data-saeule-gruppe="ihk-pruefung"]')).toBeHidden();
    await expect(page.locator('[data-sprung="kat-ihk-weiterbildung-fachwirte"]')).toBeVisible();
    await expect(page.locator('[data-sprung="kat-ihk-pruefung-it-berufe"]')).toBeHidden();

    await feld.fill('AP1');
    await expect(page.locator('li[data-kurs="ap1-it-berufe"]')).toBeVisible();
    const m = await page.locator('li[data-kurs]:visible').count();
    expect(m).toBeLessThan(n + 3);
    for (const t of await page.locator('li[data-kurs]:visible').allTextContents()) expect(t).toMatch(/AP1|AP 1/i);
    await expect(treffer).toHaveText(zahlText(m));

    // Suche wirkt zusammen mit dem Säulen-Filter
    await feld.fill('AP2');
    await page.locator('[data-filter-saeule="akademie"]').click();
    await expect(page.locator('li[data-kurs]:visible')).toHaveCount(0);
    const leer = page.locator('[data-keine-treffer]');
    await expect(leer).toBeVisible();
    await feld.fill('xyzkeinkurs');
    await page.locator('[data-filter-saeule=""]').click();
    await expect(leer).toContainText('Kein Kurs gefunden zu „xyzkeinkurs“');
    await expect(treffer).toHaveText('0 Kurse');
    await leer.getByRole('button', { name: 'Filter zurücksetzen' }).click();
    await expect(feld).toHaveValue('');
    await expect(leer).toBeHidden();
    await expect(page.locator('li[data-kurs]:visible')).toHaveCount(sichtbar.length);
  });

  test('Filter ?saeule= und Kategorie wirken auch in der Kartenansicht', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('akademie-kursansicht', 'karten'));
    await page.goto('./kurse/?saeule=ihk-pruefung&kategorie=it-berufe');
    await expect(page.locator('[data-katalog]')).toHaveAttribute('data-ansicht', 'karten');
    const n = await page.locator('[data-kurskarte]:visible').count();
    expect(n).toBeGreaterThan(0);
    expect(await page.locator('li[data-kurs]:visible:not([data-kategorie="it-berufe"])').count()).toBe(0);
    await expect(page.locator('[data-treffer]')).toHaveText(zahlText(n));
  });

  test('Sprungleiste springt zur Kategorie', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./kurse/');
    const ziel = page.locator('#kat-akademie-ki');
    await expect(ziel).not.toBeInViewport();
    const chip = page.locator('[data-sprung="kat-akademie-ki"]');
    await expect(chip.locator('[data-sprung-zahl]')).toHaveText(String(await ziel.locator('li[data-kurs]').count()));
    await chip.click();
    await expect(page).toHaveURL(/#kat-akademie-ki$/);
    await expect(page.locator('#kat-akademie-ki-titel')).toBeInViewport();
    // Überschrift nicht unter dem klebenden Kopf
    const box = await page.locator('#kat-akademie-ki-titel').boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(72);
  });

  test('ohne JavaScript ist die gruppierte Liste vollständig', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('./kurse/');
    await expect(page.locator('[data-filter]')).toBeHidden();
    await expect(page.locator('[data-kurszeile]:visible')).toHaveCount(sichtbar.length);
    await expect(page.locator('[data-kurskarte]:visible')).toHaveCount(0);
    await expect(page.locator('[data-sprungleiste]')).toBeVisible();
    const kategorien = await page.locator('[data-kat-gruppe]').count();
    await expect(page.locator('[data-kat-gruppe] h3:visible')).toHaveCount(kategorien);
    await expect(page.locator('[data-sprung]:visible')).toHaveCount(kategorien);
    await ctx.close();
  });
});

// Mega-Menü „Kurse“ entfällt (Can #6771: knappes Hauptmenü) – Übersicht bleibt unter /kurse/ und im Fuß.
test('320 px: kein horizontales Scrollen (Liste, Karten, Menü)', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('./kurse/');
  await keinHScroll(page, '/kurse/ Liste');
  if (await page.locator('[data-ansicht-wahl="karten"]').count()) {
    await page.locator('[data-ansicht-wahl="karten"]').click();
    await keinHScroll(page, '/kurse/ Karten');
  }
  await page.locator('[data-menue] > summary').click();
  await keinHScroll(page, 'Menü offen');
});

test.describe('Live-Build: Menü', () => {
  test.skip(istVorschau, 'nur im Live-Build (scripts/bau.sh live, BASE=/ scripts/test.sh)');

  test('keine Entwürfe im Menü und in der Übersicht', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('./');
    expect(await page.locator('#menue-mobil-liste').innerHTML()).not.toMatch(/Entwurf|data-entwurf/);
    await page.goto('./kurse/');
    await expect(page.locator('[data-entwurf-marke]')).toHaveCount(0);
  });
});
