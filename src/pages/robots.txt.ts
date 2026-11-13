// robots.txt: Vorschau sperrt alles (Disallow: /), live mit Sitemap.
import type { APIRoute } from 'astro';
import { IS_PREVIEW } from '../lib/env';

export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL(`${import.meta.env.BASE_URL.replace(/\/+$/, '')}/sitemap-index.xml`, site).href;
  const text = IS_PREVIEW
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
