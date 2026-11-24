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
  // Kurse auf Anfrage (Can #7206): feste Termine, die Buchung am Preis und die Anmeldeseite /anmeldung/ sind entfallen –
  // damit auch die Risikoumkehr auf Kursseite, Terminübersicht und Anmeldeseite. Übrig und geprüft: der allgemeine Hinweis
  // auf /kurse/, die Coaching-Zusage auf /coaching/ und die verlinkten Teilnahmebedingungen. Die Zusage der Kurzanfrage
  // (Startseite/Berufsseiten) prüft start-6771.spec.ts ([data-zusage-anfrage]).
  test('Übersicht und Coaching nennen die Zusagen, Teilnahmebedingungen verlinkt', async ({ page }) => {
    await page.goto('./kurse/');
    await expect(page.locator('[data-zusage="kurs"]').first()).toContainText(ersterTeil(KURS));
    await page.goto('./coaching/');
    await expect(page.locator('#pakete [data-zusage="coaching"]')).toContainText(ersterTeil(COACHING));
    // Ziel der Verweise existiert
    await page.goto('./teilnahmebedingungen/');
    await expect(page.locator('#storno')).toHaveCount(1);
    await expect(page.locator('#coaching')).toHaveCount(1);
  });
});

test.describe('Hauptaktion und Kursseite', () => {
  test('Kursseite: „Unverbindlich anfragen“ mit einem Tap zur Kurzanfrage; Kurskarten: „Unverbindlich anfragen“ zur Kursseite', async ({ page }) => {
    await page.goto('./kurse/ap1-it-berufe/');
    await expect(page.locator('[data-hauptaktion]')).toHaveText('Unverbindlich anfragen');
    // Kurse auf Anfrage (Can #7206): Hauptaktion springt zur eingebetteten Kurzanfrage (#kurz-fragen), nicht mehr zur Buchung.
    await expect(page.locator('[data-hauptaktion]')).toHaveAttribute('href', '#kurz-fragen');
    await expect(page.locator('[data-kopf-verbindlich]')).toContainText('verbindlich erst mit deiner Zusage und unserer Buchungsbestätigung per E-Mail');
    await expect(page.locator('[data-cta-leiste] a')).toHaveText('Anfragen');
    await page.goto('./pruefungsvorbereitung/');
    const karte = page.locator('[data-kurskarte="ap1-it-berufe"] a.btn');
    await expect(karte).toContainText('Unverbindlich anfragen');
    await expect(karte).toHaveAttribute('href', /\/kurse\/ap1-it-berufe\/#kurz-fragen$/);
    await expect(page.locator('[data-kurskarte="pruefungscoaching"] a.btn')).toContainText('Coaching anfragen');
    // Hero der Landing: genau ein Knopf
    await expect(page.locator('main section').first().locator('a.btn')).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('./kurse/');
    await page.locator('[data-menue] > summary').click();
    // Seit #6771: Kopf mit „Anfragen“, im Mobilmenü „Kurs anfragen“ (Kurzanfrage auf der Startseite)
    await expect(page.locator('header a.btn-accent')).toHaveText(['Anfragen', 'Kurs anfragen']);
  });

  test('mobil 390: Preis, „Start auf Anfrage“ und Knopf in der ersten Ansicht', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const slug of ['ap1-it-berufe', 'ap2-fachinformatiker-systemintegration']) {
      await page.goto(`./kurse/${slug}/`);
      // Kurse auf Anfrage (Can #7206): statt eines festen Starttermins steht „Start auf Anfrage“ im Kopf. Geprüft werden
      // Preis, die Start-Zeile und der Knopf (nicht der ganze Kopfblock, der weiter unten noch Hinweise trägt).
      const stelle = {
        Preis: page.locator('[data-kopf-preis]'),
        Start: page.locator('[data-start-kopf] p').filter({ hasText: 'auf Anfrage' }),
        Knopf: page.locator('[data-hauptaktion]'),
      };
      for (const [name, loc] of Object.entries(stelle)) {
        const box = (await loc.boundingBox())!;
        expect(box.y + box.height, `${slug} ${name}`).toBeLessThanOrEqual(844);
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

  for (const s of ['kurse/ap1-it-berufe/', 'kurse/ap2-fachinformatiker-systemintegration/', 'kurse/pruefungscoaching/']) {
    test(`${s}: Kurs-FAQ um gemeinsame Fragen auf 8–10 aufgefüllt, ohne Doppelte, Schema = Liste`, async ({ page }) => {
      await page.goto(`./${s}`);
      const fragen = (await page.locator('#faq [data-faq-eintrag] h3').allTextContents()).map((f) => f.trim());
      expect(fragen.length, s).toBeGreaterThanOrEqual(8);
      expect(fragen.length, s).toBeLessThanOrEqual(10);
      expect(new Set(fragen.map((f) => f.toLowerCase())).size, 'keine doppelten Fragen').toBe(fragen.length);
      const schema = (await page.locator('script[type="application/ld+json"]').allTextContents())
        .flatMap((b) => ([] as Record<string, unknown>[]).concat(JSON.parse(b)))
        .find((o) => o['@type'] === 'FAQPage') as unknown as { mainEntity: { name: string }[] } | undefined;
      if (schema) expect(schema.mainEntity.map((q) => q.name)).toEqual(fragen);
    });
  }

  test('So läuft\'s: vier Schritte, gleich auf Kursseite, Landing und Coaching', async ({ page }) => {
    for (const s of ['kurse/ap1-it-berufe/', 'pruefungsvorbereitung/']) {
      await page.goto(`./${s}`);
      const titel = await page.locator('[data-ablauf] [data-schritt] :is(h3,h4)').allTextContents();
      expect(titel.map((t) => t.replace(/^Schritt \d: /, '').trim()), s).toEqual(['Unverbindlich anfragen', 'Buchungsangebot per E-Mail', 'Zusage per Antwort-Mail', 'Unsere Bestätigung']);
    }
    await page.goto('./coaching/');
    await expect(page.locator('[data-ablauf] [data-schritt]')).toHaveCount(4);
    await expect(page.locator('[data-ablauf] [data-schritt="4"]')).toContainText('Unsere Bestätigung');
    await expect(page.locator('[data-ablauf] [data-schritt="4"]')).toContainText('verbindlich');
  });
});

// axe auf allen in Teil 1 geänderten Seiten (axe-core kommt über die devDependency @axe-core/playwright)
const AXE = join(process.cwd(), 'node_modules/axe-core/axe.min.js');
for (const breite of [1280, 320]) {
  test(`axe: geänderte Seiten ohne Verstöße bei ${breite} px`, async ({ page }) => {
    test.skip(!existsSync(AXE), 'axe-core nicht installiert (node_modules/axe-core)');
    test.setTimeout(120_000);
    // reduzierte Bewegung: keine Zwischenzustände der Warum-Bühne (Überblendung) im Kontrast-Check
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: breite, height: 900 });
    // /termine/ und /anmeldung/ sind seit „Kurse auf Anfrage“ (Can #7206) Weiterleitungen (meta-refresh) – nicht per axe prüfbar.
    for (const s of ['kurse/ap1-it-berufe/', 'kurse/pruefungscoaching/', 'kurse/ki-manager/', 'pruefungsvorbereitung/', 'coaching/', 'faq/', 'kurse/', 'kontakt/']) {
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
