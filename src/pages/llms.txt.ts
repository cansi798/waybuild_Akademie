// llms.txt (https://llmstxt.org): kurze, maschinenlesbare Übersicht für KI-Suchen und -Assistenten.
// Wird bei jedem Build aus den Kursdaten erzeugt – nur freigegebene Kurse, Preise als Endpreise, keine Versprechen.
import type { APIRoute } from 'astro';
import { formatDatum, formatEuro, freigegebeneKurse, naechsterTermin, saeulenName, umfangText } from '../lib/kurse';
import { absolut } from '../lib/pfad';
import { AKADEMIE, IHK_HINWEIS } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const url = (pfad: string) => absolut(pfad, site);
  const kurse = await freigegebeneKurse();

  const kursZeilen = kurse.map((k) => {
    const d = k.data;
    const coaching = d.art === 'coaching';
    const seite = coaching ? '/coaching/' : `/kurse/${k.id}/`;
    const start = naechsterTermin(k);
    const fakten = [
      saeulenName(d.saeule),
      umfangText(k),
      coaching ? undefined : d.dauer,
      `${coaching ? 'ab ' : ''}${formatEuro(d.preis.betrag)} Endpreis`,
      coaching ? 'Termine nach Vereinbarung' : start ? `nächster Start ${formatDatum(start.start)}` : 'Termin in Planung',
    ].filter(Boolean);
    return `- [${d.titel}](${url(seite)}): ${d.kurzbeschreibung} (${fakten.join(' · ')})`;
  });

  const text = `# ${AKADEMIE.name}

> ${AKADEMIE.beschreibung}

Die ${AKADEMIE.name} bietet Live-Online-Kurse für ganz Deutschland: synchroner Unterricht in festen Gruppen, abends per Videokonferenz – keine Aufzeichnungen, kein Selbstlernkurs. Zielgruppen sind Auszubildende und Umschüler vor der IHK-Abschlussprüfung sowie Berufstätige, die sich berufsbegleitend weiterbilden. Ansprache: Du.

- Preise sind Endpreise, alles inklusive. Die Prüfungsgebühr der IHK ist nicht enthalten.
- Bezahlung per Rechnung per E-Mail – an Teilnehmende oder ihren Betrieb. Keine Online-Zahlung.
- ${IHK_HINWEIS}
- Lehrende: Dozenten mit IHK-Prüfer-Erfahrung.

## Kurse

${kursZeilen.join('\n')}

## Seiten

- [Prüfungsvorbereitung](${url('/pruefungsvorbereitung/')}): Überblick IHK-Prüfungsvorbereitung für IT-Berufe (AP1, AP2, Prüfungscoaching) mit Prüfungsterminen
- [Alle Kurse](${url('/kurse/')}): Kurskatalog mit Umfang, Dauer, Preis und nächstem Start
- [Termine](${url('/termine/')}): alle Starttermine chronologisch mit Anmeldeschluss
- [Häufige Fragen](${url('/faq/')}): Anmeldung, Rechnung, Live-Unterricht, Prüfung, Weiterbildung
- [Über uns](${url('/ueber-uns/')}): wer hinter der Akademie steht und wie wir unterrichten
- [Kontakt](${url('/kontakt/')}): Kontaktformular und E-Mail ${AKADEMIE.mailInfo}

## Rechtliches

- [Teilnahmebedingungen](${url('/teilnahmebedingungen/')})
- [Widerrufsbelehrung](${url('/widerruf/')})
- [Impressum](${url('/impressum/')})
- [Datenschutz](${url('/datenschutz/')})
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
