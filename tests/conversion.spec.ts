// Conversion Teil 1 (Konzept .superpowers/sdd/conversion-diagnose.md): Risikoumkehr am Preis, einheitliche Hauptaktion,
// Kursseite mobil (Preis + Start in der ersten Ansicht), Beweis nur wo er stimmt, FAQ 8–10 als offene Liste, „So läuft's“.
import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ZUSAGEN = readFileSync(join(process.cwd(), 'src/lib/zusagen.ts'), 'utf8');
const zusage = (schluessel: string) => new RegExp(`\\b${schluessel}:\\s*'([^']+)'`).exec(ZUSAGEN)![1];
const KURS = zusage('kurs');
const AUSFALL = zusage('ausfall');
const COACHING = zusage('coaching');
const ersterTeil = (s: string) => s.split(' · ')[0];
const normal = (s: string | null) => (s ?? '').replace(/\s+/g, ' ');

test.describe('Risikoumkehr', () => {
  test('Kursseite: am Preis im Kopf, unter den Terminen (mit Ausfall), in der Preisbox', async ({ page }) => {
    await page.goto('./kurse/ap1-it-berufe/');
    const kopf = page.locator('[data-start-kopf] [data-zusage="kurs"]');
    await expect(kopf).toContainText(ersterTeil(KURS));
    await expect(kopf.getByRole('link', { name: 'Teilnahmebedingungen' })).toHaveAttribute('href', /\/teilnahmebedingungen\/#storno$/);
    await expect(page.locator('#termine [data-zusage="kurs"]')).toContainText(AUSFALL);
    await expect(page.locator('[data-preis-zusagen]')).toContainText(AUSFALL);
    // Ziel des Links existiert
    await page.goto('./teilnahmebedingungen/');
    await expect(page.locator('#storno')).toHaveCount(1);
    await expect(page.locator('#coaching')).toHaveCount(1);
  });

  test('Kurskarten, Terminübersicht und Coaching', async ({ page }) => {
    await page.goto('./pruefungsvorbereitung/');
    await expect(page.locator('[data-kurskarte="ap1-it-berufe"] [data-zusage="kurs"]')).toContainText(ersterTeil(KURS));
    await expect(page.locator('[data-kurskarte="pruefungscoaching"] [data-zusage="coaching"]')).toContainText(ersterTeil(COACHING));
    await page.goto('./termine/');
    await expect(page.locator('[data-zusage="kurs"]').first()).toContainText(AUSFALL);
    await page.goto('./coaching/');
    await expect(page.locator('#pakete [data-zusage="coaching"]')).toContainText(ersterTeil(COACHING));
  });

  test('Anmeldung: Zusage direkt über dem Absende-Knopf, Knopftext unverändert', async ({ page }) => {
    await page.goto('./anmeldung/?kurs=ap1-it-berufe');
    const zeile = page.locator('#anmeldung [data-zusage="kurs"]');
    await expect(zeile).toBeVisible();
    await expect(zeile).toContainText(ersterTeil(KURS));
    await expect(page.locator('#anmeldung [data-absenden]')).toHaveText('Zahlungspflichtig anmelden');
    const z = (await zeile.boundingBox())!;
    const k = (await page.locator('#anmeldung [data-absenden]').boundingBox())!;
    expect(z.y).toBeLessThan(k.y);
    // Coaching: eigene Zusage
    await page.goto('./anmeldung/?kurs=pruefungscoaching');
    await expect(page.locator('#anmeldung [data-zusage="coaching"]')).toBeVisible();
    await expect(page.locator('#anmeldung [data-zusage="kurs"]')).toBeHidden();
  });
});

test.describe('Hauptaktion und Kursseite', () => {
  test('einheitlich „Termin wählen“ (Kopf, Seitenleiste, Leiste, Kurskarte, Mobilmenü)', async ({ page }) => {
    await page.goto('./kurse/ap1-it-berufe/');
    await expect(page.locator('[data-hauptaktion]')).toHaveText('Termin wählen');
    await expect(page.locator('[data-cta-leiste] a')).toHaveText('Termin wählen');
    await page.goto('./pruefungsvorbereitung/');
    const karte = page.locator('[data-kurskarte="ap1-it-berufe"] a.btn');
    await expect(karte).toContainText('Termin wählen');
    await expect(karte).toHaveAttribute('href', /\/kurse\/ap1-it-berufe\/#termine$/);
    await expect(page.locator('[data-kurskarte="pruefungscoaching"] a.btn')).toContainText('Coaching anfragen');
    // Hero der Landing: genau ein Knopf
    await expect(page.locator('main section').first().locator('a.btn')).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./termine/');
    await page.getByText('Menü', { exact: true }).click();
    await expect(page.locator('header a.btn-accent')).toHaveText('Termin wählen');
  });

  test('mobil 390: Preis, nächster Start und Knopf in der ersten Ansicht', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const slug of ['ap1-it-berufe', 'ap2-fachinformatiker-systemintegration']) {
      await page.goto(`./kurse/${slug}/`);
      for (const sel of ['[data-kopf-preis]', '[data-kopf-start]', '[data-hauptaktion]']) {
        const box = (await page.locator(sel).boundingBox())!;
        expect(box.y + box.height, `${slug} ${sel}`).toBeLessThanOrEqual(844);
      }
    }
  });

  test('Beweis „Dozenten mit IHK-Prüfer-Erfahrung“ nur bei Prüfungsvorbereitung und Coaching', async ({ page }) => {
    for (const s of ['kurse/ap1-it-berufe/', 'kurse/pruefungscoaching/', 'coaching/']) {
      await page.goto(`./${s}`);
      await expect(page.locator('[data-beweis]'), s).toContainText('Dozenten mit IHK-Prüfer-Erfahrung');
    }
    // Entwürfe anderer Säulen (nur Vorschau) tragen ihn nicht
    for (const s of ['kurse/wirtschaftsfachwirt-ihk/', 'kurse/ki-manager/']) {
      const antwort = await page.goto(`./${s}`);
      if (antwort?.status() === 404) continue;
      await expect(page.locator('[data-beweis]'), s).toHaveCount(0);
    }
  });

  test('/kurse/: keine Aussage „alle Kurse abends“ mehr', async ({ page }) => {
    await page.goto('./kurse/');
    const kopf = normal(await page.locator('main section').first().textContent());
    expect(kopf).not.toMatch(/statt – abends,/);
    expect(kopf).toContain('abends oder samstags');
  });
});

test.describe('FAQ und So läuft\'s', () => {
  for (const s of ['pruefungsvorbereitung/', 'coaching/']) {
    test(`${s}: 8–10 Fragen offen lesbar, Sprungmarken, FAQPage passt`, async ({ page }) => {
      await page.goto(`./${s}`);
      const eintraege = page.locator('[data-faq-liste] [data-faq-eintrag]');
      const n = await eintraege.count();
      expect(n).toBeGreaterThanOrEqual(8);
      expect(n).toBeLessThanOrEqual(10);
      await expect(eintraege.first().locator('p')).toBeVisible();
      const fragen = await eintraege.locator('h3').allTextContents();
      const schema = (await page.locator('script[type="application/ld+json"]').allTextContents())
        .flatMap((b) => ([] as Record<string, unknown>[]).concat(JSON.parse(b)))
        .find((o) => o['@type'] === 'FAQPage') as unknown as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
      expect(schema.mainEntity.map((q) => q.name)).toEqual(fragen.map((f) => f.trim()));
      expect(schema.mainEntity.every((q) => q.acceptedAnswer.text.length > 20)).toBe(true);
      // Sprungmarke führt zur Frage
      await page.setViewportSize({ width: 1440, height: 900 });
      const sprung = page.locator('[data-faq-liste] nav a').nth(2);
      const ziel = (await sprung.getAttribute('href'))!;
      await sprung.click();
      await expect(page.locator(ziel)).toBeInViewport();
    });
  }

  test('So läuft\'s: vier Schritte, gleich auf Kursseite, Landing und Coaching', async ({ page }) => {
    for (const s of ['kurse/ap1-it-berufe/', 'pruefungsvorbereitung/']) {
      await page.goto(`./${s}`);
      const titel = await page.locator('[data-ablauf] [data-schritt] :is(h3,h4)').allTextContents();
      expect(titel.map((t) => t.replace(/^Schritt \d: /, '').trim()), s).toEqual(['Termin wählen', 'Rechnung per E-Mail', 'Live-Unterricht', 'Prüfung bei deiner IHK']);
    }
    await page.goto('./coaching/');
    await expect(page.locator('[data-ablauf] [data-schritt]')).toHaveCount(4);
    await expect(page.locator('[data-ablauf] [data-schritt="4"]')).toContainText('Prüfung bei deiner IHK');
  });
});

// axe auf allen in Teil 1 geänderten Seiten (läuft nur, wenn node_modules/axe-core vorhanden ist – siehe TODO devDependency)
const AXE = join(process.cwd(), 'node_modules/axe-core/axe.min.js');
for (const breite of [1280, 320]) {
  test(`axe: geänderte Seiten ohne Verstöße bei ${breite} px`, async ({ page }) => {
    test.skip(!existsSync(AXE), 'axe-core nicht installiert (node_modules/axe-core)');
    test.setTimeout(120_000);
    // reduzierte Bewegung: keine Zwischenzustände der Warum-Bühne (Überblendung) im Kontrast-Check
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: breite, height: 900 });
    for (const s of ['kurse/ap1-it-berufe/', 'kurse/pruefungscoaching/', 'kurse/ki-manager/', 'pruefungsvorbereitung/', 'coaching/', 'faq/', 'kurse/', 'termine/', 'anmeldung/?kurs=ap1-it-berufe']) {
      await page.goto(`./${s}`);
      await page.addScriptTag({ path: AXE });
      const verstoesse = await page.evaluate(async () => {
        // @ts-expect-error axe kommt aus dem eingefügten Skript
        const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
        return r.violations.map((v: { id: string; nodes: { target: string[] }[] }) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
      });
      expect(verstoesse, s).toEqual([]);
    }
  });
}
