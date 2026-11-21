// llms-full.txt: ausführliche, maschinenlesbare Fassung für KI-Suchen (GEO/AEO) – zitierfähige Fakten, Berufe,
// alle sichtbaren Kurse mit Umfang, Zeiten, Endpreis und nächsten Terminen, kurze FAQ. Erzeugt beim Build aus den Kursdaten;
// nur belegbare Angaben, keine Versprechen. Live nur freigegebene Kurse (wie die Website).
import type { APIRoute } from 'astro';
import { berufUrl, sichtbareBerufe } from '../lib/berufe';
import { buchbareTermine, formatDatum, formatEuro, freigegebeneKurse, saeulenName, umfangText } from '../lib/kurse';
import { absolut } from '../lib/pfad';
import { AKADEMIE, IHK_HINWEIS, UNTERRICHT } from '../lib/site';
import { ZUSAGEN } from '../lib/zusagen';

export const GET: APIRoute = async ({ site }) => {
  const url = (pfad: string) => absolut(pfad, site);
  const kurse = await freigegebeneKurse();
  const berufe = await sichtbareBerufe();

  const kursBloecke = kurse.map((k) => {
    const d = k.data;
    const coaching = d.art === 'coaching';
    const termine = buchbareTermine(k).slice(0, 4);
    return [
      `### ${d.titel}`,
      '',
      d.kurzbeschreibung,
      '',
      `- Bereich: ${saeulenName(d.saeule)}`,
      `- Seite: ${url(coaching ? '/coaching/' : `/kurse/${k.id}/`)}`,
      umfangText(k) ? `- Umfang: ${umfangText(k)}${coaching ? '' : ` (${d.dauer})`}` : undefined,
      `- Zeiten: ${d.zeiten}`,
      `- Preis: ${coaching ? 'ab ' : ''}${formatEuro(d.preis.betrag)} Endpreis`,
      `- Abschluss: ${d.abschluss}`,
      termine.length
        ? `- Nächste Termine: ${termine.map((t) => `${formatDatum(t.start)}–${formatDatum(t.ende)}${t.pruefung ? ` (Prüfung ${formatDatum(t.pruefung)})` : ''}`).join('; ')}`
        : coaching
          ? '- Termine: nach Vereinbarung'
          : '- Termine: in Planung',
    ]
      .filter((x) => x !== undefined)
      .join('\n');
  });

  const text = `# ${AKADEMIE.name} – ausführliche Informationen

> ${AKADEMIE.beschreibung}

## Fakten

- Die ${AKADEMIE.name} gehört zur Waybuild UG (haftungsbeschränkt) mit Sitz in Norderstedt.
- ${UNTERRICHT.satz} Es gibt keine Aufzeichnungen und keinen Selbstlernkurs.
- Drei Bereiche: IHK-Prüfungsvorbereitung für Auszubildende (AP1/AP2), IHK-Weiterbildung (berufsbegleitend, z. B. Fachwirt, Betriebswirt), eigene Weiterbildung der Akademie (KI, IT, Programmierung).
- ${IHK_HINWEIS}
- Preise sind Endpreise, alles inklusive. Die Prüfungsgebühr der IHK ist nicht enthalten.
- Bezahlung per Rechnung per E-Mail – an Teilnehmer oder ihren Betrieb. Keine Online-Zahlung.
- Anfrage: kostenlos über das Formular ${url('/#anfrage')}. ${ZUSAGEN.anfrage}
- Kontakt: ${AKADEMIE.mailInfo}

## Prüfungsvorbereitung nach Beruf

${berufe.map((b) => `- ${b.name}: ${b.teile.map((t) => t.kurz).join(', ')} – ${url(berufUrl(b))}`).join('\n')}

## Bereiche

- [Prüfungsvorbereitung](${url('/pruefungsvorbereitung/')})
- [IHK-Weiterbildung](${url('/ihk-weiterbildung/')})
- [waybuild Weiterbildung](${url('/waybuild-weiterbildung/')})

## Kurse

${kursBloecke.join('\n\n')}

## Häufige Fragen

- Wann ist Unterricht? ${UNTERRICHT.satz}
- Ist der Unterricht live? Ja, live in Echtzeit mit Dozent und Gruppe; keine Aufzeichnungen.
- Ist die Anfrage verbindlich? ${ZUSAGEN.anfrage}
- Ist das eine IHK-Veranstaltung? Nein, die ${AKADEMIE.name} ist ein unabhängiger Anbieter; die Prüfung findet bei der zuständigen IHK statt.
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
