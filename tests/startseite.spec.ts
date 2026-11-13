import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Vorschau- oder Live-Build in dist/? (Vorschau-Banner ja/nein) */
const istVorschau = (() => {
  try {
    return readFileSync(join(process.cwd(), 'dist/index.html'), 'utf8').includes('data-vorschau-banner');
  } catch {
    return true;
  }
})();

const BREITEN = [320, 375, 768, 1280, 1440];

async function keinHScroll(page: Page) {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(r.sw, `scrollWidth ${r.sw} > clientWidth ${r.cw}`).toBeLessThanOrEqual(r.cw);
}

test('Startseite lädt ohne Konsolenfehler', async ({ page }) => {
  const fehler: string[] = [];
  page.on('console', (m) => m.type() === 'error' && fehler.push(m.text()));
  page.on('pageerror', (e) => fehler.push(e.message));
  const antwort = await page.goto('./');
  expect(antwort?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText('Gut vorbereitet in die Prüfung');
  // „load“ statt „networkidle“: Die Bühnen-Animationen laufen weiter, networkidle war unter Last unzuverlässig.
  // Module-Skripte laufen vor „load“; die kurze Wartezeit fängt späte Fehler (Timer, Beobachter) ab.
  await page.waitForLoadState('load');
  await page.waitForTimeout(1000);
  expect(fehler).toEqual([]);
});

for (const breite of BREITEN) {
  test(`kein horizontales Scrollen bei ${breite} px`, async ({ page }) => {
    await page.setViewportSize({ width: breite, height: 900 });
    await page.goto('./');
    await keinHScroll(page);
    // Bühne und Lernpfad einmal ins Bild holen
    await page.locator('[data-warum]').scrollIntoViewIfNeeded();
    await keinHScroll(page);
  });
}

test('Countdown zeigt positive Tageszahl bis zur AP1 am 24.02.2027', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-12-01T10:00:00+01:00'));
  await page.goto('./');
  const tafel = page.locator('[data-cd-tafel="0"]');
  await expect(tafel).toBeVisible();
  await expect(tafel.locator('[data-cd-datum]')).toHaveText('24.02.2027');
  await expect(tafel.locator('[data-cd-tage]')).toHaveText('85');
  await expect(tafel).toContainText('Dein Kurs startet am 19.01.2027');
  // Umschalter auf AP2
  await page.getByText('AP2', { exact: true }).click();
  await expect(page.locator('[data-cd-tafel="1"]')).toBeVisible();
  await expect(tafel).toBeHidden();
  const tageAp2 = Number(await page.locator('[data-cd-tafel="1"] [data-cd-tage]').textContent());
  expect(tageAp2).toBeGreaterThan(0);
});

test('mobiles Menü ist per Tastatur bedienbar', async ({ page, browserName }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('./');
  const knopf = page.locator('[data-menue] > summary');
  await knopf.focus();
  await expect(knopf).toBeFocused();
  await page.keyboard.press('Enter');
  const liste = page.locator('#menue-mobil-liste');
  await expect(liste).toBeVisible();
  // Mit Tab in die Menüpunkte (WebKit: Links nur mit Alt+Tab, wie Safari-Standard)
  await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
  await expect(liste.getByRole('link', { name: 'Kurse' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(liste).toBeHidden();
  await expect(knopf).toBeFocused();
});

test('alle internen Links liefern 200', async ({ page, request, baseURL }) => {
  test.setTimeout(120_000); // mit Kursentwürfen ~60 Seiten und ~90 Adressen
  const base = new URL(baseURL!);
  const offen = [base.href];
  const gesehen = new Set<string>();
  const geladen = new Set<string>(); // Pfade, deren Links schon gesammelt sind
  while (offen.length) {
    const url = offen.shift()!;
    if (gesehen.has(url)) continue;
    gesehen.add(url);
    const antwort = await request.get(url);
    expect(antwort.status(), url).toBe(200);
    if (!(antwort.headers()['content-type'] ?? '').includes('text/html')) continue;
    // Statische Seiten: ?kurs=…-Varianten liefern dasselbe HTML – Links je Pfad nur einmal im Browser sammeln
    const pfad = new URL(url).pathname;
    if (geladen.has(pfad)) continue;
    geladen.add(pfad);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const links = await page.$$eval('a[href], link[rel="icon"], link[rel="apple-touch-icon"], img[src]', (els) =>
      els.map((e) => (e as HTMLAnchorElement).href || (e as HTMLImageElement).src),
    );
    for (const l of links) {
      const u = new URL(l);
      if (u.origin !== base.origin) continue;
      u.hash = '';
      if (!gesehen.has(u.href)) offen.push(u.href);
    }
  }
  expect(gesehen.size).toBeGreaterThan(15);
});

test('Vorschau: noindex und robots.txt sperrt alles', async ({ page, request }) => {
  test.skip(!istVorschau, 'nur im Vorschau-Build');
  await page.goto('./');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('[data-vorschau-banner]')).toBeVisible();
  const robots = await request.get('robots.txt');
  expect(await robots.text()).toContain('Disallow: /');
});

test('Live: indexierbar, robots.txt mit Sitemap, kein Vorschau-Banner', async ({ page, request }) => {
  test.skip(istVorschau, 'nur im Live-Build');
  await page.goto('./');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://waybuild-akademie.de/');
  await expect(page.locator('[data-vorschau-banner]')).toHaveCount(0);
  const robots = await (await request.get('robots.txt')).text();
  expect(robots).not.toContain('Disallow: /');
  expect(robots).toContain('Sitemap: https://waybuild-akademie.de/sitemap-index.xml');
});

test('IHK-Hinweis steht im Fuß', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('[data-ihk-hinweis]')).toContainText('keine Veranstaltung der IHK');
});

test.describe('Warum-Bühne', () => {
  test('Szenen laufen nacheinander, Pause hält an', async ({ page }) => {
    await page.clock.install();
    await page.goto('./');
    const buehne = page.locator('[data-warum]');
    await expect(buehne).toHaveClass(/ist-buehne/);
    await buehne.scrollIntoViewIfNeeded();
    await expect(buehne).toHaveAttribute('data-wb-aktiv', '0');
    await page.clock.runFor(4000);
    await expect(buehne).toHaveAttribute('data-wb-aktiv', '1');
    await page.clock.runFor(4000);
    await expect(buehne).toHaveAttribute('data-wb-aktiv', '2');
    await page.locator('[data-wb-pause]').click();
    await expect(page.locator('[data-wb-pause]')).toHaveAttribute('aria-pressed', 'true');
    await page.clock.runFor(12000);
    await expect(buehne).toHaveAttribute('data-wb-aktiv', '2');
    await expect(page.locator('[data-wb-szene="2"]')).toBeVisible();
    await expect(page.locator('[data-wb-szene="3"]')).toBeHidden();
    // Weiter-Knopf und Punkte
    await page.locator('[data-wb-weiter]').click();
    await expect(buehne).toHaveAttribute('data-wb-aktiv', '3');
    await page.locator('[data-wb-punkt="0"]').click();
    await expect(buehne).toHaveAttribute('data-wb-aktiv', '0');
    // Abspielen
    await page.locator('[data-wb-pause]').click();
    await page.clock.runFor(4000);
    await expect(buehne).toHaveAttribute('data-wb-aktiv', '1');
  });

  test('reduzierte Bewegung: statische Bildfolge mit allen Szenen', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    const buehne = page.locator('[data-warum]');
    await expect(buehne).not.toHaveClass(/ist-buehne/);
    for (let i = 0; i < 6; i++) await expect(page.locator(`[data-wb-szene="${i}"]`)).toBeVisible();
    await expect(page.locator('[data-wb-pause]')).toBeHidden();
  });

  test('Buchen-Knopf führt zu den Kursen', async ({ page }) => {
    await page.goto('./');
    await page.locator('[data-wb-buchen]').click();
    await expect(page).toHaveURL(/\/kurse\/$/);
  });
});

test('alle Seiten ohne horizontales Scrollen bei 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const seiten = ['', 'kurse/', 'kurse/ap1-it-berufe/', 'kurse/ap2-fachinformatiker-systemintegration/', 'kurse/pruefungscoaching/',
    'termine/', 'pruefungsvorbereitung/', 'coaching/', 'ueber-uns/', 'faq/', 'kontakt/', 'anmeldung/', 'interesse/', 'danke/',
    'impressum/', 'datenschutz/', 'teilnahmebedingungen/', 'widerruf/', 'gibt-es-nicht/'];
  for (const s of seiten) {
    await page.goto(`./${s}`);
    const r = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(r, `/${s}`).toBeLessThanOrEqual(0);
  }
});
