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
  integrations: [
    sitemap({
      // Nicht in die Sitemap: Danke-Seite und 404 (noindex), Interesse-Formular (noindex, nur mit ?kurs= sinnvoll)
      // und /kurse/pruefungscoaching/ (noindex, Doppel von /coaching/ – SEO-Audit 13.11.2026).
      filter: (page) => !/\/(danke|404|interesse|kurse\/pruefungscoaching)\/?$/.test(page),
    }),
  ],
  vite: { plugins: [tailwindcss()] },
  build: { inlineStylesheets: 'auto' },
});
