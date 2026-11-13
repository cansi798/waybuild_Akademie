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

/** Brotkrumen (BreadcrumbList) aus Name/Pfad-Paaren – Pfade ohne Basis, z. B. ['Kurse', '/kurse/']. */
export function brotkrumenSchema(stufen: [name: string, pfad: string][], site: URL | undefined): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: stufen.map(([name, pfad], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absolut(pfad, site) })),
  };
}

/** WebSite (Name der Website in den Suchergebnissen) – nur auf der Startseite. */
export function websiteSchema(site: URL | undefined): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${absolut('/', site)}#website`,
    name: AKADEMIE.name,
    url: absolut('/', site),
    inLanguage: 'de',
    publisher: { '@id': `${absolut('/', site)}#organisation` },
  };
}

/** Gesamtaufwand als ISO-8601-Dauer: 35 UE à 45 Min. → "PT26H15M". */
function aufwand(ue: number): string {
  const minuten = ue * 45;
  const h = Math.floor(minuten / 60);
  const m = minuten % 60;
  return `PT${h}H${m ? `${m}M` : ''}`;
}

function angebot(kurs: Kurs, site: URL | undefined, termin?: Termin, seite?: string): Json {
  return {
    '@type': 'Offer',
    price: kurs.data.preis.betrag,
    priceCurrency: 'EUR',
    // Google-Kursdaten erwarten Free | Partially Free | Subscription | Paid
    category: 'Paid',
    availability: 'https://schema.org/InStock',
    url: absolut(termin ? anmeldeUrl(kurs, termin) : (seite ?? `/kurse/${kurs.id}/`), site),
    ...(termin ? { validThrough: isoDatum(termin.anmeldeschluss) } : {}),
  };
}

/**
 * Course mit CourseInstance je buchbarem Termin + Event je Termin (Teilnahme online).
 * `seite` = Pfad der maßgeblichen Seite (Standard /kurse/<id>/; beim Coaching /coaching/).
 */
export function kursSchema(kurs: Kurs, termine: Termin[], site: URL | undefined, seite?: string): Json[] {
  if (kurs.data.status !== 'freigegeben') return [];
  const d = kurs.data;
  const url = absolut(seite ?? `/kurse/${kurs.id}/`, site);
  const anbieter = organisation(site);
  const ort = { '@type': 'VirtualLocation', url };
  const bild = absolut('/og-bild.png', site);
  // Coaching: Aufwand je gebuchter Einheit (60 Minuten)
  const workload = d.ue ? aufwand(d.ue) : d.art === 'coaching' ? 'PT1H' : undefined;

  const course: Json = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${url}#kurs`,
    name: d.titel,
    description: d.kurzbeschreibung,
    url,
    inLanguage: 'de',
    image: bild,
    provider: anbieter,
    educationalCredentialAwarded: d.abschluss,
    coursePrerequisites: d.voraussetzungen,
    teaches: d.inhalte.map((m) => m.titel),
    ...(workload ? { timeRequired: workload } : {}),
    offers: angebot(kurs, site, undefined, seite),
    hasCourseInstance:
      termine.length > 0
        ? termine.map((t) => ({
            '@type': 'CourseInstance',
            courseMode: 'online',
            location: ort,
            startDate: isoDatum(t.start),
            endDate: isoDatum(t.ende),
            ...(workload ? { courseWorkload: workload } : {}),
            courseSchedule: { '@type': 'Schedule', description: d.zeiten, startDate: isoDatum(t.start), endDate: isoDatum(t.ende) },
            offers: angebot(kurs, site, t),
          }))
        : [{ '@type': 'CourseInstance', courseMode: 'online', location: ort, ...(workload ? { courseWorkload: workload } : {}), courseSchedule: { '@type': 'Schedule', description: d.zeiten } }],
  };

  const events: Json[] = termine.map((t) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: `${d.titel} – ${d.untertitel}`,
    description: d.kurzbeschreibung,
    image: bild,
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
