// Interne Adressen immer über href() bauen, damit der Basis-Pfad der Vorschau (/waybuild_Akademie) stimmt.
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** "/kurse/" → "/waybuild_Akademie/kurse/" (Vorschau) bzw. "/kurse/" (live). Anker und Parameter bleiben erhalten. */
export function href(pfad: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(pfad)) return pfad;
  const p = pfad.startsWith('/') ? pfad : `/${pfad}`;
  return `${BASE}${p}`;
}

/** Absolute Adresse (für canonical, OG, strukturierte Daten). */
export function absolut(pfad: string, site: URL | undefined): string {
  return new URL(href(pfad), site ?? 'https://waybuild-akademie.de').href;
}
