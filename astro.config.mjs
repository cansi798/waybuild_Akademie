// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Standard = Live-Version (ALL-INKL, waybuild-akademie.de, Pfad "/").
// Die GitHub-Pages-VORSCHAU setzt SITE, BASE und PUBLIC_PREVIEW=true (siehe .github/workflows/deploy.yml).
const site = process.env.SITE ?? 'https://waybuild-akademie.de';
const base = process.env.BASE ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  // Can #7206/#7207 (24.11.): Kurse laufen „auf Anfrage“, feste Termine und die Buchungsanfrage sind ausgeblendet.
  // Alte Links/Lesezeichen auf /termine/ und /anmeldung/ landen ohne 404 bei den Kursen bzw. der Kurzanfrage.
  redirects: {
    '/termine/': '/kurse/',
    '/anmeldung/': '/#anfrage',
  },
  integrations: [
    sitemap({
      // Nicht in die Sitemap: Danke-Seite und 404 (noindex), Interesse-Formular (noindex, nur mit ?kurs= sinnvoll),
      // /kurse/pruefungscoaching/ (noindex, Doppel von /coaching/ – SEO-Audit 13.11.2026) und die Redirects /termine, /anmeldung.
      filter: (page) => !/\/(danke|404|interesse|termine|anmeldung|kurse\/pruefungscoaching)\/?$/.test(page),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
  // CSS-Hauptdatei (~16 KB gzip) bleibt eine eigene, dauerhaft gecachte Datei; nur Kleinstdateien landen im HTML.
  // Gemessen 23.11.2026 (Lighthouse mobil, 6 Läufe je Seite, abwechselnd): 'always' brachte kein schnelleres FCP/LCP
  // (Start 1,13 → 1,15 s FCP, Anmeldung 1,04 → 1,17 s) und macht jede Seite ~16 KB größer → bewusst 'auto'.
  build: { inlineStylesheets: 'auto' },
});
