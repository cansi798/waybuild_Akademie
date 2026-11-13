import { test, expect } from '@playwright/test';

// Datenschutz-Audit (bau/dsgvo): Die Datenschutzerklärung sagt „keine Cookies, keine fremden Inhalte“ und nennt genau
// zwei Einträge im Browser-Speicher. Diese Tests halten das für jede Seite der Sitemap fest – in Vorschau und Live-Build.
const ERLAUBTER_SPEICHER = ['akademie-kursansicht', 'akademie-formular'];

test('keine Requests an fremde Server, keine Cookies, nur dokumentierter Browser-Speicher – auf jeder Seite', async ({ page, request, baseURL }) => {
  test.setTimeout(240_000);
  const sitemap = await (await request.get('sitemap-0.xml')).text();
  const eigen = new URL(baseURL!);
  // Sitemap nennt die Ziel-Domain (GitHub Pages bzw. waybuild-akademie.de) – lokal unter baseURL aufrufen
  const pfade = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(pfade.length).toBeGreaterThan(5);
  const fremd: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['http:', 'https:'].includes(u.protocol)) return;
    if (u.host !== eigen.host) fremd.push(`${page.url()} → ${r.url()}`);
  });
  for (const p of [...pfade, `${eigen.pathname}gibt-es-nicht/`, `${eigen.pathname}danke/?art=anmeldung`]) {
    await page.goto(new URL(p, eigen.origin).href, { waitUntil: 'networkidle' });
  }
  expect(fremd, 'Requests an fremde Server').toEqual([]);
  expect(await page.context().cookies(), 'Cookies').toEqual([]);
  const speicher = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]);
  expect(speicher.filter((k) => !ERLAUBTER_SPEICHER.includes(k))).toEqual([]);
});

test('Datenschutzerklärung nennt die Browser-Speicher-Einträge und keine ungeprüfte DPF-Aussage', async ({ page }) => {
  await page.goto('datenschutz/');
  const text = await page.locator('main').innerText();
  for (const k of ERLAUBTER_SPEICHER) expect(text).toContain(k);
  expect(text).toContain('§ 25 Abs. 2 Nr. 2 TDDDG');
  expect(text).not.toMatch(/GitHub ist nach dem EU-US Data Privacy Framework zertifiziert/);
});
