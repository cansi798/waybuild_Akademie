import { test, expect } from '@playwright/test';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Erklärung zur Barrierefreiheit (BFSG § 14, Anlage 3): Laden, H1, Entwurfsband, Pflichtabschnitte,
// Fuß-Link auf allen Seiten, 320 px, axe ohne Verstöße (chromium + webkit).
const PFAD = 'barrierefreiheit/';
const DIST = new URL('../dist/', import.meta.url).pathname;
// axe-core ist (noch) keine Abhängigkeit im Repo: Test läuft, sobald node_modules/axe-core vorhanden ist.
const AXE = new URL('../node_modules/axe-core/axe.min.js', import.meta.url).pathname;

test('lädt mit H1, Entwurfsband und Stand', async ({ page }) => {
  const antwort = await page.goto(`./${PFAD}`);
  expect(antwort?.status()).toBe(200);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Erklärung zur Barrierefreiheit');
  const band = page.locator('[data-recht-entwurf]');
  await expect(band).toBeVisible();
  await expect(band).toContainText('Entwurf – rechtlich noch nicht geprüft.');
  await expect(page.locator('[data-recht-stand]')).toContainText('Stand:');
});

test('enthält die Pflichtangaben nach Anlage 3 BFSG und den Feedback-Kontakt', async ({ page }) => {
  await page.goto(`./${PFAD}`);
  const text = page.locator('[data-recht-text]');
  for (const id of ['geltungsbereich', 'angebot', 'ablauf', 'umsetzung', 'einschraenkungen', 'feedback', 'behoerde', 'kleinstunternehmen', 'stand']) {
    await expect(text.locator(`h2#${id}`), id).toHaveCount(1);
  }
  await expect(text).toContainText('WCAG 2.2');
  await expect(text.locator('a[href="mailto:info@waybuild-akademie.de"]').first()).toBeVisible();
  const mlbf = text.locator('[data-mlbf]');
  await expect(mlbf).toContainText('Marktüberwachungsstelle der Länder für die Barrierefreiheit von Produkten und Dienstleistungen');
  await expect(mlbf).toContainText('39112 Magdeburg');
  await expect(text.locator('a[href="https://www.mlbf-barrierefrei.de/impressum"]')).toHaveCount(1);
  await expect(text.locator('mark[data-platzhalter]', { hasText: 'Anwalt prüfen: Ausnahme für Kleinstunternehmen' })).toHaveCount(1);
  // Platzhalter einheitlich als <mark>[…]</mark>
  const marken = await text.locator('mark[data-platzhalter]').allTextContents();
  expect(marken.length).toBeGreaterThan(0);
  for (const m of marken) expect(m).toMatch(/^\[.+\]$/);
});

test('Fuß-Link „Barrierefreiheit“ steht auf allen Seiten des Builds', async () => {
  const seiten: string[] = [];
  const sammeln = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const voll = join(dir, name);
      if (statSync(voll).isDirectory()) {
        if (name !== '_astro') sammeln(voll);
      } else if (name.endsWith('.html')) seiten.push(voll);
    }
  };
  sammeln(DIST);
  expect(seiten.length).toBeGreaterThan(10);
  for (const datei of seiten) {
    const html = readFileSync(datei, 'utf8');
    // Weiterleitungs-Seiten ohne Fuß auslassen
    if (!html.includes('<footer')) continue;
    expect(html, relative(DIST, datei)).toMatch(/<a href="[^"]*\/barrierefreiheit\/"[^>]*data-barrierefreiheit-link[^>]*>Barrierefreiheit<\/a>/);
  }
});

test('Fuß-Link führt von jeder Seite zur Erklärung', async ({ page }) => {
  for (const pfad of ['', 'kurse/', 'termine/', 'impressum/', 'anmeldung/', 'gibt-es-nicht/']) {
    await page.goto(`./${pfad}`);
    const link = page.locator('footer [data-barrierefreiheit-link]');
    await expect(link, `/${pfad}`).toHaveCount(1);
    await expect(link, `/${pfad}`).toHaveText('Barrierefreiheit');
  }
  await page.locator('footer [data-barrierefreiheit-link]').click();
  await expect(page).toHaveURL(/\/barrierefreiheit\/$/);
  await expect(page.locator('h1')).toHaveText('Erklärung zur Barrierefreiheit');
});

test('kein horizontales Scrollen bei 320 px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`./${PFAD}`);
  const r = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(r).toBeLessThanOrEqual(0);
});

for (const breite of [1280, 320]) {
  test(`axe: keine Verstöße (WCAG 2.x A/AA + best-practice) bei ${breite} px`, async ({ page }) => {
    test.skip(!existsSync(AXE), 'axe-core nicht installiert (node_modules/axe-core)');
    await page.setViewportSize({ width: breite, height: 900 });
    await page.goto(`./${PFAD}`);
    await page.addScriptTag({ path: AXE });
    const verstoesse = await page.evaluate(async () => {
      // @ts-expect-error axe kommt aus dem eingefügten Skript
      const r = await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      });
      return r.violations.map((v: { id: string; nodes: { target: string[] }[] }) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
    });
    expect(verstoesse).toEqual([]);
  });
}
