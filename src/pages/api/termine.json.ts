// S-06: Terminliste für den PHP-Endpunkt – entsteht beim Bauen als dist/api/termine.json.
// public/api/anmeldung.php liest die Datei per Dateipfad und prüft damit Kurs, Termin, Anmeldeschluss und Preis;
// Preise aus dem Formular werden nie übernommen. Live enthält sie nur freigegebene Kurse (PHP lehnt Entwürfe zusätzlich ab).
import type { APIRoute } from 'astro';
import { formularDaten } from '../../components/formulare/daten';

export const GET: APIRoute = async () => {
  const daten = await formularDaten();
  const kurse = Object.fromEntries(
    daten.kurse.map((k) => [
      k.id,
      {
        titel: k.titel,
        art: k.art,
        status: k.status,
        ue: k.ue ?? null,
        dauer: k.dauer,
        zeiten: k.zeiten,
        preis: k.preis,
        raten: k.raten,
        pakete: k.pakete.map(({ id, name, betrag, beschreibung }) => ({ id, name, betrag, beschreibung })),
        termine: k.termine.map(({ id, start, ende, anmeldeschluss, pruefung }) => ({ id, start, ende, anmeldeschluss, pruefung: pruefung ?? null })),
      },
    ]),
  );
  return new Response(JSON.stringify({ version: daten.version, erzeugt: daten.erzeugt, kurse }, null, 1), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
