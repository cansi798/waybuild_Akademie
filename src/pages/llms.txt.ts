// llms.txt (https://llmstxt.org): kurze, maschinenlesbare Übersicht für KI-Suchen und -Assistenten.
// Wird bei jedem Build aus den Kursdaten erzeugt – nur freigegebene Kurse, Preise als Endpreise, keine Versprechen.
import type { APIRoute } from 'astro';
import { formatEuro, freigegebeneKurse, saeulenName, umfangText } from '../lib/kurse';
import { absolut } from '../lib/pfad';
import { AKADEMIE, IHK_HINWEIS, UNTERRICHT } from '../lib/site';
import { ZUSAGEN } from '../lib/zusagen';
import { berufUrl, sichtbareBerufe } from '../lib/berufe';

export const GET: APIRoute = async ({ site }) => {
  const url = (pfad: string) => absolut(pfad, site);
  const kurse = await freigegebeneKurse();
  const berufe = await sichtbareBerufe();

  const kursZeilen = kurse.map((k) => {
    const d = k.data;
    const coaching = d.art === 'coaching';
    const seite = coaching ? '/coaching/' : `/kurse/${k.id}/`;
    const fakten = [
      saeulenName(d.saeule),
      umfangText(k),
      coaching ? undefined : d.dauer,
      `${coaching ? 'ab ' : ''}${formatEuro(d.preis.betrag)} Endpreis`,
      coaching ? 'Termine nach Vereinbarung' : 'Start auf Anfrage',
    ].filter(Boolean);
    return `- [${d.titel}](${url(seite)}): ${d.kurzbeschreibung} (${fakten.join(' · ')})`;
  });

  const text = `# ${AKADEMIE.name}

> ${AKADEMIE.beschreibung}

Die ${AKADEMIE.name} bietet Live-Online-Kurse für ganz Deutschland in drei Bereichen: IHK-Prüfungsvorbereitung für Auszubildende (AP1/AP2), IHK-Weiterbildung (z. B. Fachwirt, Betriebswirt) und eigene Weiterbildung (KI, IT, Programmierung). ${UNTERRICHT.satz} Synchroner Unterricht in festen Gruppen – keine Aufzeichnungen, kein Selbstlernkurs. Zielgruppen sind Auszubildende und Umschüler vor der IHK-Abschlussprüfung sowie Berufstätige, die sich berufsbegleitend weiterbilden. Ansprache: Du.

- Preise sind Endpreise, alles inklusive. Die Prüfungsgebühr der IHK ist nicht enthalten.
- Bezahlung per Rechnung per E-Mail – an Teilnehmer oder ihren Betrieb. Keine Online-Zahlung.
- ${IHK_HINWEIS}
- Unterricht in der Prüfungsvorbereitung: Dozenten mit IHK-Prüfer-Erfahrung.
- Anfrage: Formular auf der Startseite (${url('/#anfrage')}). ${ZUSAGEN.anfrage}
- Ausführliche Fassung: ${url('/llms-full.txt')}

## Prüfungsvorbereitung nach Beruf

${berufe.map((b) => `- [${b.name}](${url(berufUrl(b))}): ${b.teile.map((t) => t.kurz).join(', ')}`).join('\n')}

## Bereiche

- [Prüfungsvorbereitung](${url('/pruefungsvorbereitung/')})
- [IHK-Weiterbildung](${url('/ihk-weiterbildung/')})
- [waybuild Weiterbildung](${url('/waybuild-weiterbildung/')})

## Kurse

${kursZeilen.join('\n')}

## Seiten

- [Prüfungsvorbereitung](${url('/pruefungsvorbereitung/')}): Überblick IHK-Prüfungsvorbereitung für IT-Berufe (AP1, AP2, Prüfungscoaching)
- [Alle Kurse](${url('/kurse/')}): Kurskatalog mit Umfang, Dauer und Preis – auf Anfrage
- [Häufige Fragen](${url('/faq/')}): Anmeldung, Rechnung, Live-Unterricht, Prüfung, Weiterbildung
- [Über uns](${url('/ueber-uns/')}): wer hinter der Akademie steht und wie wir unterrichten
- [Kontakt](${url('/kontakt/')}): einfach per E-Mail ${AKADEMIE.mailInfo}

## Rechtliches

- [Teilnahmebedingungen](${url('/teilnahmebedingungen/')})
- [Widerrufsbelehrung](${url('/widerruf/')})
- [Impressum](${url('/impressum/')})
- [Datenschutz](${url('/datenschutz/')})
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
