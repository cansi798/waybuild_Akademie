// Tests für Katalog, Kursseiten, Termine, Landing, Coaching, Über uns und FAQ (Task 3).
// Läuft gegen dist/: Vorschau-Build (Standard, mit Entwürfen) bzw. Live-Build (BASE=/ scripts/test.sh tests/seiten.spec.ts).
// Welche Gruppe läuft, entscheidet der Build in dist/ (Vorschau-Banner ja/nein).
import { test, expect, type Page } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const KURSE_DIR = join(process.cwd(), 'src/content/kurse');
const istVorschau = (() => {
  try {
    return readFileSync(join(DIST, 'index.html'), 'utf8').includes('data-vorschau-banner');
  } catch {
    return true;
  }
})();

/** Kursdateien mit Status (Slug = Dateiname). */
const kursDateien = readdirSync(KURSE_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const text = readFileSync(join(KURSE_DIR, f), 'utf8');
    return { slug: f.replace(/\.md$/, ''), status: /^status:\s*(\S+)/m.exec(text)?.[1] ?? '' };
  });
const freigegeben = kursDateien.filter((k) => k.status === 'freigegeben').map((k) => k.slug);
const entwuerfe = kursDateien.filter((k) => k.status === 'entwurf').map((k) => k.slug);

async function keinHScroll(page: Page, wo: string) {
  const r = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(r, `horizontales Scrollen auf ${wo}`).toBeLessThanOrEqual(0);
}

async function kursSlugs(page: Page): Promise<string[]> {
  await page.goto('./kurse/');
  return page.locator('li[data-kurs]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.kurs!));
}

test.describe('Seiten (Vorschau-Build)', () => {
  test.skip(!istVorschau, 'nur im Vorschau-Build');

  test('Katalog: Filter nach Säule und Kategorie mit Trefferzahl und Adresse', async ({ page }) => {
    await page.goto('./kurse/');
    await expect(page.locator('[data-katalog]')).toHaveAttribute('data-filter-bereit', 'true');
    const alle = await page.locator('li[data-kurs]').count();
    expect(alle).toBe(kursDateien.length);
    await expect(page.locator('[data-treffer]')).toHaveText(`${alle} Kurse`);
    await expect(page.locator('[data-filter-saeule=""]')).toHaveAttribute('aria-pressed', 'true');

    const chip = page.locator('[data-filter-saeule="ihk-pruefung"]');
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-filter-saeule=""]')).toHaveAttribute('aria-pressed', 'false');
    await expect(page).toHaveURL(/[?&]saeule=ihk-pruefung/);
    const n = await page.locator('li[data-kurs]:visible').count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(alle);
    expect(await page.locator('li[data-kurs]:visible:not([data-saeule="ihk-pruefung"])').count()).toBe(0);
    await expect(page.locator('[data-treffer]')).toHaveText(`${n} Kurse`);
    await expect(page.locator('[data-saeule-gruppe="akademie"]')).toBeHidden();

    // Kategorie: nur Kategorien der gewählten Säule werden angeboten
    const auswahl = page.locator('[data-filter-kategorie-auswahl]');
    await expect(auswahl.locator('option[value="ki"]')).toHaveCount(0);
    await auswahl.selectOption('it-berufe');
    await expect(page).toHaveURL(/kategorie=it-berufe/);
    const m = await page.locator('li[data-kurs]:visible').count();
    expect(m).toBeGreaterThan(0);
    expect(await page.locator('li[data-kurs]:visible:not([data-kategorie="it-berufe"])').count()).toBe(0);
    await expect(page.locator('[data-treffer]')).toHaveText(m === 1 ? '1 Kurs' : `${m} Kurse`);

    // Zurücksetzen
    await page.locator('[data-filter] [data-filter-zuruecksetzen]').click();
    await expect(page.locator('li[data-kurs]:visible')).toHaveCount(alle);
    await expect(page).not.toHaveURL(/saeule=/);
  });

  test('Katalog: Filter aus der Adresse (?saeule=, auch Kurzform)', async ({ page }) => {
    await page.goto('./kurse/?saeule=akademie');
    await expect(page.locator('[data-filter-saeule="akademie"]')).toHaveAttribute('aria-pressed', 'true');
    const n = await page.locator('li[data-kurs]:visible').count();
    expect(n).toBeGreaterThan(0);
    expect(await page.locator('li[data-kurs]:visible:not([data-saeule="akademie"])').count()).toBe(0);
    await expect(page.locator('[data-saeule-gruppe="ihk-pruefung"]')).toBeHidden();

    await page.goto('./kurse/?saeule=pruefungsvorbereitung');
    await expect(page.locator('[data-filter-saeule="ihk-pruefung"]')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.locator('li[data-kurs]:visible:not([data-saeule="ihk-pruefung"])').count()).toBe(0);

    // Unbekannter Wert → alle Kurse
    await page.goto('./kurse/?saeule=gibt-es-nicht');
    await expect(page.locator('li[data-kurs]:visible')).toHaveCount(kursDateien.length);
  });

  test.describe('ohne JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('Katalog zeigt alle Kurse, nach Säulen gegliedert', async ({ page }) => {
      await page.goto('./kurse/?saeule=akademie');
      await expect(page.locator('[data-filter]')).toBeHidden();
      await expect(page.locator('li[data-kurs]')).toHaveCount(kursDateien.length);
      await expect(page.locator('li[data-kurs]:visible')).toHaveCount(kursDateien.length);
      const gruppen = await page.locator('[data-saeule-gruppe]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.saeuleGruppe));
      expect(gruppen).toEqual(['ihk-pruefung', 'ihk-weiterbildung', 'akademie']);
      for (const g of gruppen) await expect(page.locator(`[data-saeule-gruppe="${g}"] h2`)).toBeVisible();
    });

    test('Termine und FAQ sind ohne JavaScript lesbar', async ({ page }) => {
      await page.goto('./termine/');
      expect(await page.locator('li[data-termin]:visible').count()).toBeGreaterThan(1);
      await page.goto('./faq/');
      await page.locator('[data-faq-gruppe="allgemein"] summary').first().click();
      await expect(page.locator('[data-faq-gruppe="allgemein"] details').first()).toContainText('Nein');
    });
  });

  test('Katalog: Entwürfe tragen das gelbe Band', async ({ page }) => {
    await page.goto('./kurse/');
    for (const slug of entwuerfe.slice(0, 5)) {
      await expect(page.locator(`[data-kurskarte="${slug}"] [data-entwurf-band]`)).toBeVisible();
    }
    for (const slug of freigegeben) await expect(page.locator(`[data-kurskarte="${slug}"] [data-entwurf-band]`)).toHaveCount(0);
    await page.goto(`./kurse/${entwuerfe[0]}/`);
    await expect(page.locator('[data-entwurf-band]')).toContainText('Entwurf – noch nicht freigegeben');
    await expect(page.locator('[data-anmelden]')).toHaveCount(0);
  });

  test('Kursseiten: Sprungnavigation und Anmelde-Links mit Kurs und Termin', async ({ page }) => {
    test.setTimeout(120_000); // läuft über alle Kursseiten
    await page.clock.setFixedTime(new Date('2026-12-01T10:00:00+01:00'));
    const slugs = await kursSlugs(page);
    expect(slugs.length).toBe(kursDateien.length);
    let anmeldeLinks = 0;
    for (const slug of slugs) {
      await page.goto(`./kurse/${slug}/`);
      const nav = page.locator('nav[data-sprungnavigation]');
      await expect(nav, slug).toBeVisible();
      const ziele = await nav.locator('a').evaluateAll((els) => els.map((e) => [e.textContent?.trim(), e.getAttribute('href')]));
      expect(ziele.map((z) => z[0]).slice(0, 5), slug).toEqual(['Überblick', 'Inhalte', 'Termine', 'Preis', 'Voraussetzungen']);
      for (const [, ziel] of ziele) expect(await page.locator(ziel!).count(), `${slug} ${ziel}`).toBe(1);
      if (await page.locator('#faq').count()) expect(ziele.map((z) => z[0])).toContain('FAQ');

      const paare = await page.locator('li[data-termin] a[data-anmelden]').evaluateAll((els) =>
        els.map((a) => ({ href: (a as HTMLAnchorElement).href, termin: (a.closest('li[data-termin]') as HTMLElement).dataset.termin! })),
      );
      for (const p of paare) {
        const u = new URL(p.href);
        expect(u.pathname, slug).toMatch(/\/anmeldung\/$/);
        expect(u.searchParams.get('kurs'), slug).toBe(slug);
        expect(u.searchParams.get('termin'), slug).toBe(p.termin);
        anmeldeLinks++;
      }
    }
    expect(anmeldeLinks).toBeGreaterThanOrEqual(4);
  });

  test('Kurse ohne Termin zeigen „Interesse vormerken“', async ({ page }) => {
    test.setTimeout(120_000); // läuft über alle Kursseiten
    const slugs = await kursSlugs(page);
    let ohne = 0;
    for (const slug of slugs) {
      await page.goto(`./kurse/${slug}/`);
      const hatTermine = (await page.locator('li[data-termin]').count()) > 0;
      const coaching = (await page.locator('[data-termine-coaching]').count()) > 0;
      if (hatTermine || coaching) continue;
      ohne++;
      const link = page.locator('[data-interesse]');
      await expect(link, slug).toBeVisible();
      expect(new URL(await link.evaluate((a) => (a as HTMLAnchorElement).href)).search, slug).toBe(`?kurs=${slug}`);
      await expect(page.locator('[data-hauptaktion]'), slug).toHaveText('Interesse vormerken');
      await expect(page.locator(`[data-anmelden]`), slug).toHaveCount(0);
    }
    expect(ohne).toBeGreaterThan(0);
    // Kurskarte: Termin in Planung
    await page.goto('./kurse/');
    await expect(page.locator('[data-kurskarte="webentwicklung-html-css-javascript"]')).toContainText('Termin in Planung – Interesse vormerken');
  });

  test('Coaching: Kursseite und Coaching-Seite führen zur Anfrage', async ({ page }) => {
    await page.goto('./kurse/pruefungscoaching/');
    await expect(page.locator('[data-hauptaktion]')).toHaveAttribute('href', /\/anmeldung\/\?kurs=pruefungscoaching$/);
    // Entwurf mit Terminen: keine Anmeldung, kein Vormerken – nur Termine ansehen
    await page.goto('./kurse/wirtschaftsfachwirt-ihk/');
    await expect(page.locator('[data-hauptaktion]')).toHaveText('Termine ansehen');
    await expect(page.locator('[data-anmelden]')).toHaveCount(0);
    await page.goto('./coaching/');
    await expect(page.locator('[data-selbst-hinweis]')).toContainText('Beratung und Feedback – deine Prüfungsleistungen erstellst du selbst.');
    const preise = await page.locator('[data-pakete] li').allTextContents();
    expect(preise.join(' ')).toMatch(/69\s*€[\s\S]*189\s*€[\s\S]*299\s*€/);
    const ziele = await page.locator('a[data-coaching-anfrage]').evaluateAll((els) => els.map((a) => new URL((a as HTMLAnchorElement).href).searchParams.get('kurs')));
    expect(ziele.length).toBeGreaterThanOrEqual(3);
    expect(new Set(ziele)).toEqual(new Set(['pruefungscoaching']));
  });

  test('Termine: chronologisch, vergangene ausgeblendet', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-12-01T10:00:00+01:00'));
    await page.goto('./termine/');
    await expect(page.locator('[data-ihk-einladung]')).toContainText('Verbindlich ist die Einladung deiner IHK');
    const lesen = () =>
      page.locator('li[data-termin]:visible').evaluateAll((els) =>
        els.map((e) => ({ start: (e as HTMLElement).dataset.start!, schluss: (e as HTMLElement).dataset.anmeldeschluss!, id: (e as HTMLElement).dataset.termin! })),
      );
    const vorher = await lesen();
    expect(vorher.length).toBeGreaterThan(3);
    expect(vorher.map((t) => t.start)).toEqual([...vorher.map((t) => t.start)].sort());
    expect(vorher.every((t) => t.schluss >= '2026-12-01')).toBe(true);
    expect(vorher.map((t) => t.id)).toContain('ap1-2027-fruehjahr');
    const monate = await page.locator('[data-termin-gruppe]:visible').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.terminGruppe!));
    expect(monate).toEqual([...monate].sort());

    // Zeit läuft weiter: Anmeldeschluss AP1 Frühjahr (12.01.2027) ist vorbei
    await page.clock.setFixedTime(new Date('2027-02-01T10:00:00+01:00'));
    await page.reload();
    await expect(page.locator('li[data-termin="ap1-2027-fruehjahr"]')).toBeHidden();
    await expect(page.locator('li[data-termin="ap2-2027-sommer"]')).toBeVisible();
    await expect(page.locator('[data-termin-gruppe="2027-01"]')).toBeHidden();
    const nachher = await lesen();
    expect(nachher.every((t) => t.schluss >= '2027-02-01')).toBe(true);
    await expect(page.locator('[data-treffer]')).toHaveText(`${nachher.length} Termine`);

    // Kursseite blendet den abgelaufenen Termin ebenfalls aus
    await page.goto('./kurse/ap1-it-berufe/');
    await expect(page.locator('li[data-termin="ap1-2027-fruehjahr"]')).toBeHidden();
    await expect(page.locator('li[data-termin="ap1-2027-herbst"]')).toBeVisible();
  });

  test('Termine: Filter nach Säule', async ({ page }) => {
    await page.goto('./termine/?saeule=pruefungsvorbereitung');
    await expect(page.locator('[data-filter-saeule="ihk-pruefung"]')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.locator('li[data-termin]:visible:not([data-saeule="ihk-pruefung"])').count()).toBe(0);
    await page.locator('[data-filter-saeule=""]').click();
    const alle = await page.locator('li[data-termin]:visible').count();
    expect(alle).toBeGreaterThan(await page.locator('li[data-termin][data-saeule="ihk-pruefung"]').count());
    for (const a of await page.locator('li[data-termin]:visible a[data-anmelden]').all()) {
      const u = new URL(await a.evaluate((x) => (x as HTMLAnchorElement).href));
      expect(u.searchParams.get('kurs')).toBeTruthy();
      expect(u.searchParams.get('termin')).toBeTruthy();
    }
  });

  test('320 px: kein horizontales Scrollen, auch beim längsten Kurstitel', async ({ page }) => {
    test.setTimeout(120_000); // läuft über alle Kursseiten
    await page.setViewportSize({ width: 320, height: 800 });
    const slugs = await kursSlugs(page);
    const titel = await page.locator('li[data-kurs] h3').evaluateAll((els) => els.map((e) => e.textContent?.trim() ?? ''));
    const laengster = slugs[titel.reduce((m, t, i) => (t.length > titel[m].length ? i : m), 0)];
    await keinHScroll(page, '/kurse/');
    for (const s of ['termine/', 'pruefungsvorbereitung/', 'coaching/', 'ueber-uns/', 'faq/', `kurse/${laengster}/`, ...slugs.map((x) => `kurse/${x}/`)]) {
      await page.goto(`./${s}`);
      await keinHScroll(page, s);
    }
    // Filter-Leiste und Terminliste aufgeklappt bzw. gefiltert
    await page.goto('./kurse/?saeule=ihk-weiterbildung');
    await keinHScroll(page, '/kurse/?saeule=ihk-weiterbildung');
  });

  test('mobil: klebende Handlungsleiste erscheint nach dem Kopf', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./kurse/ap1-it-berufe/');
    const leiste = page.locator('[data-cta-leiste]');
    await expect(leiste).toHaveClass(/ist-verdeckt/);
    await page.locator('#voraussetzungen').scrollIntoViewIfNeeded();
    await expect(leiste).not.toHaveClass(/ist-verdeckt/);
    // nach der Einblend-Animation sitzt die Leiste am unteren Rand im Bild
    await expect.poll(async () => {
      const box = await leiste.boundingBox();
      return box ? Math.round(box.y + box.height) : 9999;
    }).toBeLessThanOrEqual(845);
    await expect(leiste.getByRole('link')).toHaveAttribute('href', '#termine');
  });

  test('strukturierte Daten: JSON-LD ist gültiges JSON', async ({ page }) => {
    const seiten = ['kurse/', 'kurse/ap1-it-berufe/', 'kurse/ap2-fachinformatiker-systemintegration/', 'kurse/pruefungscoaching/', `kurse/${entwuerfe[0]}/`, 'termine/', 'pruefungsvorbereitung/', 'coaching/', 'ueber-uns/', 'faq/'];
    const typen: Record<string, string[]> = {};
    for (const s of seiten) {
      await page.goto(`./${s}`);
      const bloecke = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(bloecke.length, s).toBeGreaterThan(0);
      typen[s] = [];
      for (const b of bloecke) {
        let daten: unknown;
        expect(() => (daten = JSON.parse(b)), s).not.toThrow();
        for (const o of ([] as Record<string, unknown>[]).concat(daten as never)) typen[s].push(String(o['@type']));
      }
    }
    expect(typen['kurse/ap1-it-berufe/']).toEqual(expect.arrayContaining(['Course', 'Event', 'FAQPage']));
    expect(typen['faq/']).toContain('FAQPage');
    expect(typen['coaching/']).toContain('FAQPage');
    expect(typen[`kurse/${entwuerfe[0]}/`]).not.toContain('Course');

    await page.goto('./kurse/ap1-it-berufe/');
    const kurs = (await page.locator('script[type="application/ld+json"]').allTextContents())
      .flatMap((b) => JSON.parse(b))
      .find((o: Record<string, unknown>) => o['@type'] === 'Course');
    expect(kurs.hasCourseInstance[0].courseMode).toBe('online');
    expect(kurs.offers.price).toBe(349);
    expect(kurs.offers.priceCurrency).toBe('EUR');
  });

  test('AP1: Zeiten mit 3- und 4-UE-Abenden', async ({ page }) => {
    await page.goto('./kurse/ap1-it-berufe/');
    await expect(page.locator('[data-kerndaten]')).toContainText('5 × 18:00–20:45 Uhr (3 UE) und 5 × 18:00–21:30 Uhr (4 UE)');
    await expect(page.locator('[data-kerndaten]')).toContainText('35 UE');
  });
});

test.describe('Live-Build', () => {
  test.skip(istVorschau, 'nur im Live-Build (scripts/bau.sh live, BASE=/ scripts/test.sh)');

  test('nirgends „Entwurf“, keine Entwurfsseiten', async () => {
    const dateien: string[] = [];
    const laufen = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) laufen(p);
        else if (/\.(html|xml|json|txt|js)$/.test(f)) dateien.push(p);
      }
    };
    laufen(DIST);
    expect(dateien.length).toBeGreaterThan(10);
    const treffer = dateien.filter((p) => /Entwurf|data-entwurf|Preisvorschlag/.test(readFileSync(p, 'utf8')));
    expect(treffer).toEqual([]);
    const kursSeiten = readdirSync(join(DIST, 'kurse')).filter((f) => statSync(join(DIST, 'kurse', f)).isDirectory());
    expect(kursSeiten.sort()).toEqual([...freigegeben].sort());
    const sitemap = readdirSync(DIST)
      .filter((f) => f.startsWith('sitemap'))
      .map((f) => readFileSync(join(DIST, f), 'utf8'))
      .join('\n');
    for (const e of entwuerfe) expect(sitemap, e).not.toContain(`/kurse/${e}/`);
  });

  test('Katalog und Termine zeigen nur freigegebene Kurse', async ({ page }) => {
    const slugs = await kursSlugs(page);
    expect(slugs.sort()).toEqual([...freigegeben].sort());
    await expect(page.locator('[data-entwurf-band]')).toHaveCount(0);
    await page.goto('./termine/');
    const kurse = await page.locator('li[data-termin]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.kurs!));
    for (const k of kurse) expect(freigegeben).toContain(k);
    await page.goto('./kurse/?saeule=akademie');
    await expect(page.locator('[data-saeule-vorbereitung="akademie"]')).toBeVisible();
  });
});
