// Formulare: Anmeldung, Interesse, Kontakt, Danke, Widerruf. Die serverseitige Prüfung testet scripts/php-test.sh.
// Vorschau-Build: Demo-Modus (kein Versand). Live-Build (BASE=/): Versand per fetch an /api/*.php – hier durch eine
// nachgebildete PHP-Antwort ersetzt ({ ok, weiter }); reine Demo-Prüfungen werden live übersprungen.
import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = (process.env.BASE ?? '/waybuild_Akademie').replace(/\/+$/, '');
const istVorschau = (() => {
  try {
    return readFileSync(join(process.cwd(), 'dist/index.html'), 'utf8').includes('data-vorschau-banner');
  } catch {
    return true;
  }
})();
/** Ziel nach erfolgreichem Absenden: Vorschau …&demo=1, live die Adresse aus der (nachgebildeten) PHP-Antwort */
const danke = (art: string) => (istVorschau ? new RegExp(`danke/\\?art=${art}&demo=1$`) : new RegExp(`danke/\\?art=${art}&vorgang=T-1$`));

// Live: PHP-Endpunkte nachbilden (der Test-Server liefert nur dist/ aus)
test.beforeEach(async ({ page }) => {
  if (istVorschau) return;
  await page.route('**/api/*.php', async (r) => {
    const url = r.request().url();
    if (url.endsWith('/token.php')) return r.fulfill({ json: { ts: '1', sig: 'x' } });
    const form = url.match(/\/api\/(\w+)\.php/)?.[1] ?? '';
    const art = form === 'anmeldung' && (r.request().postData() ?? '').includes('pruefungscoaching') ? 'coaching' : form;
    return r.fulfill({ json: { ok: true, weiter: `${BASE}/danke/?art=${art}&vorgang=T-1`, vorgang: 'T-1' } });
  });
});

test.describe.configure({ mode: 'default' }); // Datei in einem Worker nacheinander – entlastet parallele Läufe

const AP1 = 'anmeldung/?kurs=ap1-it-berufe&termin=ap1-2027-fruehjahr';
/** Start AP1 21.01.2027 – 51 Tage später: außerhalb der Widerrufsfrist */
const VOR_FRIST = new Date('2026-12-01T10:00:00+01:00');
/** 13 Tage vor Start: innerhalb der Widerrufsfrist, Anmeldeschluss (14.01.) noch offen */
const IN_FRIST = new Date('2027-01-08T10:00:00+01:00');

const fehler = (page: Page, name: string, form = 'anmeldung') => page.locator(`#${form} [data-fehler-fuer="${name}"]`);
const feld = (page: Page, name: string, form = 'anmeldung') => page.locator(`#${form}-${name}`);

async function person1(page: Page) {
  await feld(page, 'p1_vorname').fill('Lena');
  await feld(page, 'p1_nachname').fill('Muster');
  await feld(page, 'p1_email').fill('lena@beispiel.de');
}

async function gueltigSelbst(page: Page) {
  await person1(page);
  await page.locator('input[name="zahlweg"][value="selbst"]').check();
  await feld(page, 'strasse').fill('Hauptstraße 1');
  await feld(page, 'plz').fill('22846');
  await feld(page, 'ort').fill('Norderstedt');
  await feld(page, 'agb').check();
  await feld(page, 'alter').check();
  await feld(page, 'datenschutz').check();
}

async function keinHScroll(page: Page) {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(r.sw, `scrollWidth ${r.sw} > clientWidth ${r.cw}`).toBeLessThanOrEqual(r.cw);
}

// Entfernt (Kurse auf Anfrage, Can #7206): die Beschreibblöcke „Anmeldung“, „Kursstart innerhalb der Widerrufsfrist“ und
// „Coaching“. Die Seite /anmeldung/ gibt es nicht mehr (nur noch Weiterleitung auf /#anfrage); das AnmeldeFormular wird
// nirgends mehr eingebunden. Kurs- und Coaching-Anfragen laufen über das AnfrageFormular (Kurzanfrage) – geprüft in
// start-6771.spec.ts. Interesse- und Widerruf-Formular bleiben und werden unten weiter geprüft.

test.describe('Interesse und Kontakt', () => {
  test('Interesse vormerken: Vorauswahl, Pflichtfelder, Danke', async ({ page }) => {
    await page.goto('interesse/?kurs=ap2-fachinformatiker-systemintegration');
    await expect(feld(page, 'kurs', 'interesse')).toHaveValue('ap2-fachinformatiker-systemintegration');
    await page.locator('#interesse [data-absenden]').click();
    await expect(fehler(page, 'name', 'interesse')).toHaveText('Bitte gib deinen Namen ein.');
    await expect(fehler(page, 'email', 'interesse')).toBeVisible();
    await expect(fehler(page, 'einwilligung', 'interesse')).toHaveText('Bitte bestätige, dass wir dich per E-Mail benachrichtigen dürfen.');
    await expect(feld(page, 'einwilligung', 'interesse')).not.toBeChecked();
    await feld(page, 'name', 'interesse').fill('Sara Yilmaz');
    await feld(page, 'email', 'interesse').fill('sara@beispiel.de');
    await feld(page, 'einwilligung', 'interesse').check();
    await page.locator('#interesse [data-absenden]').click();
    await expect(page).toHaveURL(danke('interesse'));
    await expect(page.locator('h1:visible')).toHaveText('Fast geschafft – bitte bestätige deine E-Mail-Adresse');
  });

  test('Kontakt: kein Formular mehr, E-Mail-Kontakt und Link zur Kurzanfrage', async ({ page }) => {
    // Kurse auf Anfrage (Can #7206): das Kontaktformular wurde entfernt. /kontakt/ bietet nur noch E-Mail (mailto:info@…)
    // und den Verweis auf die Kurzanfrage (/#anfrage).
    await page.goto('kontakt/');
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('a[href="mailto:info@waybuild-akademie.de"]').first()).toBeVisible();
    await expect(page.locator('a[href$="/#anfrage"]').first()).toBeVisible();
  });
});

test.describe('Widerruf (§ 356a BGB)', () => {
  test('zweistufig: „Vertrag jetzt widerrufen“ → „Widerruf bestätigen“ → Eingang mit Datum und Uhrzeit', async ({ page }) => {
    test.skip(!istVorschau, 'zweiter Schritt läuft live über widerruf.php (php-test.sh)');
    await page.clock.setFixedTime(new Date('2026-12-01T14:05:00+01:00'));
    await page.goto('widerruf/');
    test.skip((await page.locator('[data-widerruf-formular]').count()) === 0, 'Seite /widerruf/ bindet das Formular noch nicht ein');
    const w = page.locator('[data-widerruf-formular]');
    await w.getByRole('button', { name: 'Vertrag jetzt widerrufen' }).click();
    await expect(fehler(page, 'kurs', 'widerruf')).toHaveText('Bitte wähle den Kurs aus oder gib die Vorgangsnummer aus deiner Bestätigungs-E-Mail an.');
    await feld(page, 'name', 'widerruf').fill('Lena Muster');
    await feld(page, 'email', 'widerruf').fill('lena@beispiel.de');
    await feld(page, 'vorgang', 'widerruf').fill('falsch');
    await w.getByRole('button', { name: 'Vertrag jetzt widerrufen' }).click();
    await expect(fehler(page, 'vorgang', 'widerruf')).toBeVisible();
    await feld(page, 'vorgang', 'widerruf').fill('A-20261113-7F3K');
    await feld(page, 'kurs', 'widerruf').selectOption('ap1-it-berufe');
    await feld(page, 'anmeldedatum', 'widerruf').fill('2026-11-20');
    await w.getByRole('button', { name: 'Vertrag jetzt widerrufen' }).click();
    const bestaetigen = w.getByRole('button', { name: 'Widerruf bestätigen' });
    await expect(bestaetigen).toBeVisible();
    await expect(bestaetigen).toBeFocused();
    await expect(w.locator('[data-widerruf-zusammenfassung]')).toContainText('Vorbereitung auf die IHK-Abschlussprüfung Teil 1');
    await expect(w.locator('[data-widerruf-zusammenfassung]')).toContainText('20.11.2026');
    await expect(w.locator('[data-widerruf-zusammenfassung]')).toContainText('A-20261113-7F3K');
    await bestaetigen.click();
    await expect(w.locator('[data-widerruf-erfolg]')).toBeVisible();
    await expect(w.locator('[data-widerruf-zeit]')).toHaveText('01.12.2026 um 14:05 Uhr');
  });
});

test.describe('ohne JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  // Entfernt (Kurse auf Anfrage, Can #7206): „Anmeldung sendet ein normales POST …“ – die Seite /anmeldung/ gibt es nicht mehr.
  test('Interesse sendet per POST an sein PHP-Skript', async ({ page }) => {
    // Kontakt hat kein Formular mehr (Can #7206) – nur noch das Interesse-Formular prüfen.
    await page.goto('interesse/');
    await expect(page.locator('#interesse')).toHaveAttribute('method', 'post');
    await expect(page.locator('#interesse')).toHaveAttribute('action', `${BASE}/api/interesse.php`);
  });
});

test.describe('320 px ohne horizontales Scrollen', () => {
  // /anmeldung/ entfällt (Kurse auf Anfrage, Can #7206) – die Kurzanfrage auf 320 px prüft start-6771.spec.ts.
  for (const seite of ['interesse/', 'kontakt/', 'danke/?art=anmeldung', 'widerruf/']) {
    test(seite, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(seite);
      await keinHScroll(page);
      const knopf = page.locator('[data-absenden]:visible').first();
      if (await knopf.count()) {
        await knopf.click();
        await keinHScroll(page);
      }
    });
  }
});
