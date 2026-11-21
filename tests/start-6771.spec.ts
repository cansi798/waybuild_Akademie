// Startseite neu (Can #6771/#6772): Berufsauswahl, drei Bereiche mit Video-Platz, Kurzanfrage mit Vorauswahl, Navigation.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Startseite: Berufsauswahl und Kurzanfrage', () => {
  test('Reihenfolge: Hero → Berufe → Prüfung → IHK → Akademie → Katalog → Formular', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('h1')).toContainText('IHK-Prüfung');
    await expect(page.getByRole('link', { name: 'Kurs anfragen' }).first()).toBeVisible();
    await expect(page.locator('[data-unterricht-hinweis]').first()).toContainText('17–20 Uhr');
    const ids = await page.$$eval('main section[id^="bereich-"]', (els) => els.map((e) => e.id));
    expect(ids).toEqual(['bereich-pruefung', 'bereich-ihk-weiterbildung', 'bereich-akademie']);
    await expect(page.locator('#bereich-pruefung [data-beruf-wahl]')).toBeVisible();
    await expect(page.locator('[data-video-platzhalter], [data-video]')).toHaveCount(3);
    await expect(page.locator('form#anfrage')).toBeVisible();
    await expect(page.locator('[data-zusage-anfrage]')).toHaveText('Deine Anfrage ist unverbindlich – verbindlich wird es erst mit unserer Bestätigung per E-Mail.');
    await expect(page.locator('main')).not.toContainText('Unverbindlich anmelden');
  });

  test('Sofortfilter findet Beruf ohne Seitenwechsel, Kachel ist ein Link (Tastatur)', async ({ page }) => {
    await page.goto('./');
    const suche = page.getByLabel('Beruf suchen');
    await suche.fill('fisi');
    await expect(page.locator('[data-beruf-treffer]').first()).toHaveText('1 Beruf gefunden');
    const kachel = page.getByRole('link', { name: /Fachinformatiker Systemintegration/ }).first();
    await expect(kachel).toBeVisible();
    await kachel.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/pruefungsvorbereitung\/fachinformatiker-systemintegration\/$/);
    await expect(page.locator('h1')).toContainText('Fachinformatiker Systemintegration (m/w/d)');
  });

  test('leere Suche zeigt Hinweis mit Anfrage-Link', async ({ page }) => {
    await page.goto('./');
    await page.getByLabel('Beruf suchen').fill('xyzunbekannt');
    await expect(page.locator('[data-beruf-leer]').first()).toBeVisible();
  });

  test('2 Taps bis zum Formular mit vorausgefülltem Kurs (mobil 390)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./');
    await page.getByRole('link', { name: /Fachinformatiker Systemintegration/ }).first().click(); // Tap 1
    const knopf = page.locator('[data-teil-knopf="ap2-fachinformatiker-systemintegration"]');
    await knopf.click(); // Tap 2
    await expect(page.locator('#anfrage-name')).toBeFocused();
    await expect(page.locator('#anfrage-kurs')).toHaveValue('ap2-fachinformatiker-systemintegration');
    await expect(page.locator('#anfrage-thema')).toHaveValue('pruefung');
    await expect(page.locator('#anfrage-nachricht')).toHaveValue(/Fachinformatiker Systemintegration/);
  });

  test('Bereichs-CTA wählt Bereich vor; Adresse ?bereich=&kurs= ebenso', async ({ page }) => {
    await page.goto('./');
    await page.locator('#bereich-akademie a[data-anfrage-bereich="akademie"]').click();
    await expect(page.locator('#anfrage-thema')).toHaveValue('akademie');
    await page.goto('./?bereich=pruefung&kurs=ap1-it-berufe#anfrage');
    await expect(page.locator('#anfrage-kurs')).toHaveValue('ap1-it-berufe');
    await expect(page.locator('#anfrage-thema')).toHaveValue('pruefung');
  });

  test('Demo-Absenden ohne Nachricht führt zur Danke-Seite', async ({ page }) => {
    await page.goto('./');
    test.skip((await page.locator('form#anfrage').getAttribute('data-demo')) !== 'true', 'nur im Vorschau-Build (Demo ohne PHP)');
    await page.locator('#anfrage-thema').selectOption('pruefung');
    await page.locator('#anfrage-name').fill('Test Person');
    await page.locator('#anfrage-email').fill('test@beispiel.de');
    await page.locator('#anfrage-einwilligung').check();
    await page.locator('form#anfrage [data-absenden]').click();
    await expect(page).toHaveURL(/danke\/\?art=anfrage/);
    await expect(page.locator('h1:visible')).toContainText('unverbindliche Kursanfrage');
    await expect(page.locator('main')).toContainText('Wir prüfen den Termin und schicken dir eine Bestätigung per E-Mail.');
  });

  test('Hauptmenü: drei Bereiche + Kontakt, Knopf „Anfragen“', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('./kontakt/');
    const nav = page.getByRole('navigation', { name: 'Hauptmenü', exact: true });
    await expect(nav.getByRole('link')).toHaveText(['Prüfungsvorbereitung', 'IHK-Weiterbildung', 'waybuild Weiterbildung', 'Kontakt']);
    await expect(page.locator('[data-kopf-anfrage]')).toBeVisible();
  });

  test('Bereichsseiten aus dem Menü: nie leer – Kurse oder „in Vorbereitung“, immer mit Formular', async ({ page }) => {
    for (const [pfad, bereich] of [['./ihk-weiterbildung/', 'ihk-weiterbildung'], ['./waybuild-weiterbildung/', 'akademie']]) {
      await page.goto(pfad);
      await expect(page.locator('#anfrage-thema')).toHaveValue(bereich);
      const kurse = await page.locator('#kurse-titel ~ div a[href*="/kurse/"]').count();
      if (kurse === 0) await expect(page.locator('[data-bereich-vorbereitung]')).toContainText('Kurse in Vorbereitung – frag unverbindlich an');
    }
  });

  test('mobil: feste Leiste „Unverbindlich anfragen“, verschwindet am Formular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./');
    const leiste = page.locator('[data-sticky-anfrage]');
    await expect(leiste).toBeVisible();
    await page.locator('form#anfrage').scrollIntoViewIfNeeded();
    await expect(leiste).toBeHidden();
  });

  test('strukturierte Daten: WebSite, FAQPage, ItemList; Berufsseite: BreadcrumbList + Course', async ({ page }) => {
    const typen = async () =>
      (await page.$$eval('script[type="application/ld+json"]', (s) => s.flatMap((x) => JSON.parse(x.textContent || '[]')))).map((o: { '@type': string }) => o['@type']);
    await page.goto('./');
    expect(await typen()).toEqual(expect.arrayContaining(['EducationalOrganization', 'WebSite', 'FAQPage', 'ItemList']));
    await page.goto('./pruefungsvorbereitung/fachinformatiker-systemintegration/');
    expect(await typen()).toEqual(expect.arrayContaining(['BreadcrumbList', 'Course']));
  });

  test('llms-full.txt nennt Berufe und Unterrichtszeit', async ({ request }) => {
    const t = await (await request.get('llms-full.txt')).text();
    expect(t).toContain('Fachinformatiker Systemintegration (m/w/d)');
    expect(t).toContain('17:00');
  });

  for (const breite of [390, 1440]) {
    test(`axe 0 + kein H-Scroll bei ${breite} px (Start, Berufsseite)`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: breite, height: 900 });
      for (const pfad of ['./', './pruefungsvorbereitung/fachinformatiker-anwendungsentwicklung/', './pruefungsvorbereitung/']) {
        await page.goto(pfad);
        const r = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(r, pfad).toBeLessThanOrEqual(0);
        const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
        expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`), pfad).toEqual([]);
      }
    });
  }
});

test('Bildschirmfotos 390/1440 (nur Chromium)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium' || !process.env.FOTOS, 'nur mit FOTOS=1');
  test.setTimeout(120_000);
  for (const breite of [390, 1440]) {
    await page.setViewportSize({ width: breite, height: breite === 390 ? 844 : 900 });
    for (const [name, pfad] of [['start', './'], ['beruf-fisi', './pruefungsvorbereitung/fachinformatiker-systemintegration/'], ['beruf-buero', './pruefungsvorbereitung/kaufmann-bueromanagement/'], ['pruefung', './pruefungsvorbereitung/'], ['ihk', './ihk-weiterbildung/']]) {
      await page.goto(pfad);
      await page.waitForTimeout(400);
      await page.screenshot({ path: `fotos-6771/${name}-${breite}.png`, fullPage: true });
      await page.screenshot({ path: `fotos-6771/${name}-${breite}-erste-ansicht.png` });
    }
  }
});
