// Content Collection „kurse“: eine Markdown-Datei je Kurs in src/content/kurse/ (Slug = Dateiname).
// Das Schema prüft beim Bauen alle Pflichtfelder – ein fehlerhafter Eintrag stoppt die Veröffentlichung (NFA-17).
// Neue Kurse starten IMMER mit status: entwurf (US-22); sichtbar nur in der Vorschau (PUBLIC_PREVIEW=true).
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const kurse = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/kurse' }),
  schema: z.object({
    /** ihk-pruefung = IHK-Prüfungsvorbereitung | ihk-weiterbildung = IHK-Weiterbildung | akademie = waybuild Weiterbildung */
    saeule: z.enum(['ihk-pruefung', 'ihk-weiterbildung', 'akademie']),
    /** z. B. "IT-Berufe", "Kaufmännisch", "Fachwirte", "Betriebswirte", "Ausbilder", "KI", "Programmierung", "IT" */
    kategorie: z.string(),
    titel: z.string(),
    untertitel: z.string(),
    kurzbeschreibung: z.string().max(220),
    status: z.enum(['freigegeben', 'entwurf']),
    art: z.enum(['kurs', 'coaching']),
    /** Unterrichtseinheiten à 45 Minuten */
    ue: z.number().int().positive().optional(),
    /** "ca. 5 Wochen", "ca. 14 Monate" */
    dauer: z.string(),
    /** "Di + Do, 18:00–20:45 Uhr" */
    zeiten: z.string(),
    preis: z.object({ betrag: z.number(), hinweis: z.string().optional(), raten: z.boolean().default(false) }),
    /** nur Coaching */
    pakete: z.array(z.object({ name: z.string(), betrag: z.number(), beschreibung: z.string() })).optional(),
    zielgruppe: z.array(z.string()),
    voraussetzungen: z.array(z.string()),
    inhalte: z.array(z.object({ titel: z.string(), punkte: z.array(z.string()) })),
    /** "Teilnahmebescheinigung; Prüfung bei deiner IHK" */
    abschluss: z.string(),
    termine: z
      .array(
        z.object({
          /** "ap1-2027-fruehjahr" */
          id: z.string(),
          start: z.coerce.date(),
          ende: z.coerce.date(),
          /** IHK-Prüfungstag */
          pruefung: z.coerce.date().optional(),
          pruefungHinweis: z.string().optional(),
          /** Start − 7 Tage */
          anmeldeschluss: z.coerce.date(),
          ausfall: z.array(z.coerce.date()).default([]),
        }),
      )
      .default([]),
    faq: z.array(z.object({ frage: z.string(), antwort: z.string() })).default([]),
    reihenfolge: z.number().default(100),
  }),
});

export const collections = { kurse };
