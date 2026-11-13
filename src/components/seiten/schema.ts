// Strukturierte Daten (schema.org, NFA-15) für Kursseiten und FAQ – eine Datenquelle mit Karte und Kursseite.
// Entwürfe bekommen keine strukturierten Daten (US-22 AK3); im Live-Build gibt es ohnehin keine Entwurfsseiten.
import { absolut } from '../../lib/pfad';
import { AKADEMIE } from '../../lib/site';
import { anmeldeUrl, isoDatum, type Kurs, type Termin } from '../../lib/kurse';

type Json = Record<string, unknown>;

export interface FaqEintrag {
  frage: string;
  antwort: string;
}

/** FAQPage aus Frage/Antwort-Paaren. */
export function faqSchema(eintraege: FaqEintrag[]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: eintraege.map((f) => ({
      '@type': 'Question',
      name: f.frage,
      acceptedAnswer: { '@type': 'Answer', text: f.antwort },
    })),
  };
}

function organisation(site: URL | undefined): Json {
  return { '@type': 'EducationalOrganization', '@id': `${absolut('/', site)}#organisation`, name: AKADEMIE.name, url: absolut('/', site) };
}

function angebot(kurs: Kurs, site: URL | undefined, termin?: Termin): Json {
  return {
    '@type': 'Offer',
    price: kurs.data.preis.betrag,
    priceCurrency: 'EUR',
    category: 'Teilnahmegebühr',
    availability: 'https://schema.org/InStock',
    url: absolut(termin ? anmeldeUrl(kurs, termin) : `/kurse/${kurs.id}/`, site),
    ...(termin ? { validThrough: isoDatum(termin.anmeldeschluss) } : {}),
  };
}

/** Course mit CourseInstance je buchbarem Termin + Event je Termin (Teilnahme online). */
export function kursSchema(kurs: Kurs, termine: Termin[], site: URL | undefined): Json[] {
  if (kurs.data.status !== 'freigegeben') return [];
  const d = kurs.data;
  const url = absolut(`/kurse/${kurs.id}/`, site);
  const anbieter = organisation(site);
  const ort = { '@type': 'VirtualLocation', url };

  const course: Json = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${url}#kurs`,
    name: d.titel,
    description: d.kurzbeschreibung,
    url,
    inLanguage: 'de',
    provider: anbieter,
    educationalCredentialAwarded: d.abschluss,
    ...(d.ue ? { timeRequired: `PT${Math.round((d.ue * 45) / 60)}H` } : {}),
    offers: angebot(kurs, site),
    hasCourseInstance:
      termine.length > 0
        ? termine.map((t) => ({
            '@type': 'CourseInstance',
            courseMode: 'online',
            location: ort,
            startDate: isoDatum(t.start),
            endDate: isoDatum(t.ende),
            courseSchedule: { '@type': 'Schedule', description: d.zeiten, startDate: isoDatum(t.start), endDate: isoDatum(t.ende) },
            offers: angebot(kurs, site, t),
          }))
        : [{ '@type': 'CourseInstance', courseMode: 'online', location: ort, courseWorkload: d.dauer }],
  };

  const events: Json[] = termine.map((t) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${d.titel} – ${d.untertitel}`,
    description: d.kurzbeschreibung,
    startDate: isoDatum(t.start),
    endDate: isoDatum(t.ende),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: ort,
    organizer: anbieter,
    offers: angebot(kurs, site, t),
    url,
  }));

  return [course, ...events];
}
