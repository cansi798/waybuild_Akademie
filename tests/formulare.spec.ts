// Formulare im Vorschau-Build (Demo-Modus, kein PHP): Anmeldung, Interesse, Kontakt, Danke, Widerruf.
// Die serverseitige Prüfung testet scripts/php-test.sh.
import { test, expect, type Page } from '@playwright/test';

test.describe.configure({ mode: 'default' }); // Datei in einem Worker nacheinander – entlastet parallele Läufe

const AP1 = 'anmeldung/?kurs=ap1-it-berufe&termin=ap1-2027-fruehjahr';
/** Start AP1 19.01.2027 – 49 Tage später: außerhalb der Widerrufsfrist */
const VOR_FRIST = new Date('2026-12-01T10:00:00+01:00');
/** 11 Tage vor Start: innerhalb der Widerrufsfrist, Anmeldeschluss (12.01.) noch offen */
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
  await feld(page, 'datenschutz').check();
}

async function keinHScroll(page: Page) {
  const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  expect(r.sw, `scrollWidth ${r.sw} > clientWidth ${r.cw}`).toBeLessThanOrEqual(r.cw);
}

test.describe('Anmeldung', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(VOR_FRIST);
  });

  test('Kurs und Termin aus der Adresse vorausgewählt, Knopftext exakt', async ({ page }) => {
    await page.goto(AP1);
    await expect(feld(page, 'kurs')).toHaveValue('ap1-it-berufe');
    await expect(feld(page, 'termin')).toHaveValue('ap1-2027-fruehjahr');
    const knopf = page.locator('#anmeldung [data-absenden]');
    await expect(knopf).toHaveText('Zahlungspflichtig anmelden');
    expect((await knopf.textContent())?.trim()).toBe('Zahlungspflichtig anmelden');
    await expect(page.locator('[data-preis-gesamt]')).toHaveText('349,00 €');
    await expect(page.locator('[data-demo-hinweis]').first()).toContainText('Demo-Modus');
    // Links an der Bestätigungsstelle (US-20 AK2)
    await expect(page.locator('[data-feld-rahmen="agb"] a')).toHaveAttribute('href', /\/teilnahmebedingungen\/$/);
    await expect(page.locator('[data-feld-rahmen="datenschutz"] a').first()).toHaveAttribute('href', /\/datenschutz\/$/);
    await expect(page.locator('[data-feld-rahmen="datenschutz"] a').nth(1)).toHaveAttribute('href', /\/widerruf\/$/);
    await expect(page.locator('[data-feld-rahmen="wertersatz"] label')).toHaveText(
      /Ich verlange ausdrücklich, dass ihr vor Ablauf der Widerrufsfrist mit der Leistung beginnt\. Mir ist bekannt, dass ich bei Widerruf Wertersatz für bereits erbrachte Leistungen schulde\./,
    );
  });

  test('ohne Parameter: Kurs wählen, Termine passend zum Kurs', async ({ page }) => {
    await page.goto('anmeldung/');
    await expect(feld(page, 'kurs')).toHaveValue('');
    await feld(page, 'kurs').selectOption('ap2-fachinformatiker-systemintegration');
    const werte = await feld(page, 'termin').locator('option').evaluateAll((o) => o.map((x) => (x as HTMLOptionElement).value).filter(Boolean));
    expect(werte.length).toBeGreaterThan(0);
    expect(werte.every((w) => w.startsWith('ap2-'))).toBe(true);
    // Entwürfe in der Vorschau gekennzeichnet
    await expect(feld(page, 'kurs').locator('option', { hasText: '(Entwurf)' }).first()).toBeAttached();
  });

  test('Pflichtfelder bei „Ich zahle selbst“: Fehlertexte, aria, Fokus, Zusammenfassung', async ({ page }) => {
    await page.goto(AP1);
    await page.locator('input[name="zahlweg"][value="selbst"]').check();
    await page.locator('#anmeldung [data-absenden]').click();
    await expect(page).toHaveURL(/anmeldung\//);
    await expect(fehler(page, 'p1_vorname')).toHaveText('Bitte gib deinen Vornamen ein.');
    await expect(fehler(page, 'p1_nachname')).toHaveText('Bitte gib deinen Nachnamen ein.');
    await expect(fehler(page, 'p1_email')).toHaveText('Bitte gib eine gültige E-Mail-Adresse ein, z. B. name@beispiel.de.');
    await expect(fehler(page, 'strasse')).toHaveText('Bitte gib Straße und Hausnummer ein.');
    await expect(fehler(page, 'plz')).toHaveText('Bitte gib eine gültige Postleitzahl ein.');
    await expect(fehler(page, 'ort')).toHaveText('Bitte gib deinen Ort ein.');
    await expect(fehler(page, 'agb')).toHaveText('Bitte bestätige die Teilnahmebedingungen.');
    await expect(fehler(page, 'datenschutz')).toHaveText('Bitte bestätige, dass du Datenschutzerklärung und Widerrufsbelehrung gelesen hast.');
    await expect(fehler(page, 'firma')).toBeHidden();
    await expect(fehler(page, 'wertersatz')).toBeHidden(); // Start nach Ablauf der Frist → freiwillig
    await expect(feld(page, 'firma')).toBeHidden();
    // aria
    await expect(feld(page, 'p1_vorname')).toHaveAttribute('aria-invalid', 'true');
    await expect(feld(page, 'p1_vorname')).toHaveAttribute('aria-describedby', /anmeldung-p1_vorname-fehler/);
    await expect(feld(page, 'p1_vorname')).toBeFocused();
    const summary = page.locator('#anmeldung [data-fehler-summary]');
    await expect(summary).toBeVisible();
    await expect(summary).toHaveAttribute('role', 'alert');
    await expect(summary).toContainText('Bitte prüfe 8 Angaben');
    // Fehler verschwindet nach Korrektur
    await feld(page, 'p1_vorname').fill('Lena');
    await expect(fehler(page, 'p1_vorname')).toBeHidden();
    await expect(feld(page, 'p1_vorname')).not.toHaveAttribute('aria-invalid', 'true');
    // Inline: E-Mail beim Verlassen prüfen
    await feld(page, 'p1_email').fill('lena@');
    await feld(page, 'p1_email').blur();
    await expect(fehler(page, 'p1_email')).toBeVisible();
  });

  test('Pflichtfelder bei „Mein Betrieb zahlt“', async ({ page }) => {
    await page.goto(AP1);
    await person1(page);
    await page.locator('input[name="zahlweg"][value="betrieb"]').check();
    await expect(feld(page, 'strasse')).toBeHidden();
    await page.locator('#anmeldung [data-absenden]').click();
    await expect(fehler(page, 'firma')).toHaveText('Bitte gib den Namen deines Betriebs ein.');
    await expect(fehler(page, 'ansprechperson')).toHaveText('Bitte gib an, wer bei euch die Rechnung bearbeitet.');
    await expect(fehler(page, 'firma_strasse')).toHaveText('Bitte gib Straße und Hausnummer ein.');
    await expect(fehler(page, 'firma_plz')).toBeVisible();
    await expect(fehler(page, 'firma_ort')).toBeVisible();
    await expect(fehler(page, 'rechnung_email')).toHaveText('Bitte gib die E-Mail-Adresse für die Rechnung ein.');
    await expect(fehler(page, 'bestellnummer')).toBeHidden(); // freiwillig
    await expect(fehler(page, 'strasse')).toBeHidden();
    await expect(feld(page, 'firma')).toBeFocused();
  });

  test('ohne Zahlweg: Hinweis am Auswahlfeld', async ({ page }) => {
    await page.goto(AP1);
    await person1(page);
    await page.locator('#anmeldung [data-absenden]').click();
    await expect(fehler(page, 'zahlweg')).toHaveText('Bitte wähle aus, wer die Rechnung bekommt.');
    await expect(page.locator('input[name="zahlweg"]').first()).toHaveAttribute('aria-invalid', 'true');
  });

  test('1–5 Personen, Rabatt ab 3, Live-Preis', async ({ page }) => {
    await page.goto(AP1);
    const personen = feld(page, 'personen');
    expect(await personen.locator('option').count()).toBe(5);
    await expect(page.locator('[data-person="2"]')).toBeHidden();

    await personen.selectOption('2');
    await expect(page.locator('[data-person="2"]')).toBeVisible();
    await expect(page.locator('[data-person="3"]')).toBeHidden();
    await expect(page.locator('[data-preis-gesamt]')).toHaveText('698,00 €');
    await expect(page.locator('[data-preis-rabatt-zeile]')).toBeHidden();

    await personen.selectOption('3');
    await expect(page.locator('[data-preis-gesamt]')).toHaveText('942,30 €');
    await expect(page.locator('[data-preis-rabatt-zeile]')).toBeVisible();
    await expect(page.locator('[data-preis-rabatt]')).toHaveText('−104,70 €');
    await expect(page.locator('[data-auswahl-preis]')).toHaveText('942,30 €');

    await personen.selectOption('5');
    for (const n of [1, 2, 3, 4, 5]) await expect(page.locator(`[data-person="${n}"]`)).toBeVisible();
    await expect(page.locator('[data-preis-gesamt]')).toHaveText('1.570,50 €');

    // weitere Personen sind Pflicht, keine doppelten E-Mail-Adressen
    await personen.selectOption('2');
    await gueltigSelbst(page);
    await feld(page, 'p2_vorname').fill('Ali');
    await page.locator('#anmeldung [data-absenden]').click();
    await expect(fehler(page, 'p2_nachname')).toHaveText('Bitte ergänze Vorname, Nachname und E-Mail für Person 2.');
    await feld(page, 'p2_nachname').fill('Demir');
    await feld(page, 'p2_email').fill('LENA@beispiel.de');
    await page.locator('#anmeldung [data-absenden]').click();
    await expect(fehler(page, 'p2_email')).toHaveText('Diese E-Mail-Adresse ist schon eingetragen.');
  });

  test('Anmeldeschluss vorbei: Termin nicht wählbar', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2027-01-13T09:00:00+01:00'));
    await page.goto(AP1);
    await expect(feld(page, 'termin').locator('option[value="ap1-2027-fruehjahr"]')).toBeDisabled();
    await expect(feld(page, 'termin')).not.toHaveValue('ap1-2027-fruehjahr');
  });

  test('Demo-Modus: gültige Anmeldung führt ohne Versand zur Danke-Seite', async ({ page }) => {
    let gesendet = false;
    await page.route('**/api/**', (r) => {
      gesendet = true;
      return r.abort();
    });
    await page.goto(AP1);
    await gueltigSelbst(page);
    await expect(page.locator('[data-zusammenfassung]')).toContainText('Lena Muster');
    await page.locator('#anmeldung [data-absenden]').click();
    await expect(page).toHaveURL(/danke\/\?art=anmeldung&demo=1$/);
    await expect(page.locator('h1:visible')).toHaveText('Danke – deine Anmeldung ist angekommen');
    await expect(page.locator('[data-danke-demo]')).toBeVisible();
    await expect(page.locator('[data-danke-zeilen]')).toContainText('Lena Muster');
    await expect(page.locator('[data-danke-zeilen]')).toContainText('349,00 €, alles inklusive');
    await expect(page.locator('[data-danke-art="anmeldung"]').getByText('Du erhältst die Rechnung per E-Mail; eine Online-Zahlung ist nicht nötig.')).toBeVisible();
    expect(gesendet).toBe(false);
  });
});

test.describe('Wertersatz-Bestätigung', () => {
  test('Pflicht bei Kursstart innerhalb von 14 Tagen', async ({ page }) => {
    await page.clock.setFixedTime(IN_FRIST);
    await page.goto(AP1);
    await gueltigSelbst(page);
    await expect(feld(page, 'wertersatz')).toHaveAttribute('aria-required', 'true');
    await expect(page.locator('[data-feld-rahmen="wertersatz"] [data-haken-hinweis]')).toContainText('Pflicht: Dein Kurs startet in 11 Tagen');
    await page.locator('#anmeldung [data-absenden]').click();
    await expect(fehler(page, 'wertersatz')).toContainText('Dein Kurs startet innerhalb der 14-tägigen Widerrufsfrist.');
    await expect(feld(page, 'wertersatz')).toBeFocused();
    await feld(page, 'wertersatz').check();
    await page.locator('#anmeldung [data-absenden]').click();
    await expect(page).toHaveURL(/danke\/\?art=anmeldung&demo=1$/);
  });

  test('freiwillig bei späterem Kursstart', async ({ page }) => {
    await page.clock.setFixedTime(VOR_FRIST);
    await page.goto(AP1);
    await gueltigSelbst(page);
    await expect(feld(page, 'wertersatz')).toBeVisible();
    await expect(feld(page, 'wertersatz')).toHaveAttribute('aria-required', 'false');
    await page.locator('#anmeldung [data-absenden]').click();
    await expect(page).toHaveURL(/danke\/\?art=anmeldung&demo=1$/);
  });
});

test.describe('Coaching', () => {
  test('Paketwahl statt Termin, unverbindliche Anfrage', async ({ page }) => {
    await page.goto(`anmeldung/?kurs=pruefungscoaching&paket=${encodeURIComponent('Coaching-Paket')}`);
    await expect(feld(page, 'termin')).toBeHidden();
    await expect(feld(page, 'personen')).toBeHidden();
    await expect(feld(page, 'wertersatz')).toBeHidden();
    await expect(page.locator('input[name="paket"][value="coaching-paket"]')).toBeChecked();
    await expect(page.locator('[data-preis-gesamt]')).toHaveText('189,00 €');
    await expect(page.locator('#anmeldung [data-absenden]')).toHaveText('Paket anfragen');
    await page.locator('input[name="paket"][value="intensivbegleitung"]').check();
    await expect(page.locator('[data-preis-gesamt]')).toHaveText('299,00 €');
    await page.locator('#anmeldung [data-absenden]').click();
    await expect(fehler(page, 'anliegen')).toHaveText('Beschreib kurz, wobei wir dir helfen sollen.');
    await person1(page);
    await page.locator('input[name="zahlweg"][value="selbst"]').check();
    await feld(page, 'strasse').fill('Weg 2');
    await feld(page, 'plz').fill('22846');
    await feld(page, 'ort').fill('Norderstedt');
    await feld(page, 'anliegen').fill('Rückmeldung zu meinem Projektantrag');
    await feld(page, 'wunschzeiten').fill('ab März, abends');
    await feld(page, 'datenschutz').check();
    await page.locator('#anmeldung [data-absenden]').click();
    await expect(page).toHaveURL(/danke\/\?art=coaching&demo=1$/);
    await expect(page.locator('h1:visible')).toHaveText('Danke – deine Coaching-Anfrage ist angekommen');
  });

  test('unbekanntes Paket wird ignoriert, ohne Paket: Hinweis', async ({ page }) => {
    await page.goto('anmeldung/?kurs=pruefungscoaching&paket=Gibt%20es%20nicht');
    await expect(page.locator('input[name="paket"]:checked')).toHaveCount(0);
    await page.locator('#anmeldung [data-absenden]').click();
    await expect(fehler(page, 'paket')).toHaveText('Bitte wähle ein Paket aus.');
  });
});

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
    await expect(page).toHaveURL(/danke\/\?art=interesse&demo=1$/);
    await expect(page.getByText('Wir melden uns, sobald Termine feststehen.').first()).toBeVisible();
  });

  test('Kontakt: Themen, Telefon-Platzhalter, Pflichtfelder', async ({ page }) => {
    await page.goto('kontakt/');
    await expect(page.locator('[data-telefon-platzhalter]')).toContainText('[Telefon folgt]');
    await expect(page.getByRole('link', { name: 'info@waybuild-akademie.de' }).first()).toBeVisible();
    const themen = await feld(page, 'thema', 'kontakt').locator('option').allTextContents();
    expect(themen.slice(1)).toEqual(['Allgemeine Frage', 'Beratung zur Kurswahl', 'Anmeldung für meinen Betrieb', 'Prüfungscoaching']);
    await feld(page, 'nachricht', 'kontakt').fill('kurz');
    await page.locator('#kontakt [data-absenden]').click();
    await expect(fehler(page, 'thema', 'kontakt')).toHaveText('Bitte wähle ein Thema aus.');
    await expect(fehler(page, 'nachricht', 'kontakt')).toHaveText('Bitte schreib uns kurz, worum es geht.');
    await expect(feld(page, 'name', 'kontakt')).toBeFocused();
    await feld(page, 'name', 'kontakt').fill('Jan Peters');
    await feld(page, 'email', 'kontakt').fill('jan@beispiel.de');
    await feld(page, 'thema', 'kontakt').selectOption('beratung');
    await feld(page, 'nachricht', 'kontakt').fill('Welcher Kurs passt zu mir?');
    await feld(page, 'einwilligung', 'kontakt').check();
    await page.locator('#kontakt [data-absenden]').click();
    await expect(page).toHaveURL(/danke\/\?art=kontakt&demo=1$/);
    await expect(page.locator('h1:visible')).toHaveText('Danke – deine Nachricht ist angekommen');
  });
});

test.describe('Widerruf (§ 356a BGB)', () => {
  test('zweistufig: „Vertrag jetzt widerrufen“ → „Widerruf bestätigen“ → Eingang mit Datum und Uhrzeit', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-12-01T14:05:00+01:00'));
    await page.goto('widerruf/');
    test.skip((await page.locator('[data-widerruf-formular]').count()) === 0, 'Seite /widerruf/ bindet das Formular noch nicht ein');
    const w = page.locator('[data-widerruf-formular]');
    await w.getByRole('button', { name: 'Vertrag jetzt widerrufen' }).click();
    await expect(fehler(page, 'vertrag', 'widerruf')).toBeVisible();
    await feld(page, 'name', 'widerruf').fill('Lena Muster');
    await feld(page, 'email', 'widerruf').fill('lena@beispiel.de');
    await feld(page, 'vertrag', 'widerruf').fill('AP1, Start 19.01.2027');
    await w.getByRole('button', { name: 'Vertrag jetzt widerrufen' }).click();
    const bestaetigen = w.getByRole('button', { name: 'Widerruf bestätigen' });
    await expect(bestaetigen).toBeVisible();
    await expect(bestaetigen).toBeFocused();
    await expect(w.locator('[data-widerruf-zusammenfassung]')).toContainText('AP1, Start 19.01.2027');
    await bestaetigen.click();
    await expect(w.locator('[data-widerruf-erfolg]')).toBeVisible();
    await expect(w.locator('[data-widerruf-zeit]')).toHaveText('01.12.2026 um 14:05 Uhr');
  });
});

test.describe('ohne JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('Anmeldung sendet ein normales POST an /api/anmeldung.php', async ({ page }) => {
    await page.goto('anmeldung/');
    const form = page.locator('#anmeldung');
    await expect(form).toHaveAttribute('method', 'post');
    await expect(form).toHaveAttribute('action', '/waybuild_Akademie/api/anmeldung.php');
    // ohne JavaScript sind beide Zahlweg-Bereiche sichtbar
    await expect(feld(page, 'strasse')).toBeVisible();
    await expect(feld(page, 'firma')).toBeVisible();
    let anfrage: { methode: string; daten: string } | null = null;
    await page.route('**/api/anmeldung.php', async (r) => {
      anfrage = { methode: r.request().method(), daten: r.request().postData() ?? '' };
      await r.fulfill({ status: 200, contentType: 'text/html', body: '<p>ok</p>' });
    });
    await feld(page, 'kurs').selectOption('ap1-it-berufe');
    await feld(page, 'termin').selectOption('ap1-2027-fruehjahr');
    await gueltigSelbst(page);
    await page.locator('#anmeldung [data-absenden]').click();
    await expect.poll(() => anfrage?.methode).toBe('POST');
    const daten = new URLSearchParams(anfrage!.daten);
    expect(daten.get('kurs')).toBe('ap1-it-berufe');
    expect(daten.get('termin')).toBe('ap1-2027-fruehjahr');
    expect(daten.get('p1_email')).toBe('lena@beispiel.de');
    expect(daten.get('zahlweg')).toBe('selbst');
    expect(daten.get('website')).toBe('');
  });

  test('Interesse und Kontakt senden per POST an ihre PHP-Skripte', async ({ page }) => {
    for (const [seite, form] of [['interesse/', 'interesse'], ['kontakt/', 'kontakt']]) {
      await page.goto(seite);
      await expect(page.locator(`#${form}`)).toHaveAttribute('method', 'post');
      await expect(page.locator(`#${form}`)).toHaveAttribute('action', `/waybuild_Akademie/api/${form}.php`);
    }
  });
});

test.describe('320 px ohne horizontales Scrollen', () => {
  for (const seite of [AP1, 'anmeldung/?kurs=pruefungscoaching', 'interesse/', 'kontakt/', 'danke/?art=anmeldung', 'widerruf/']) {
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
