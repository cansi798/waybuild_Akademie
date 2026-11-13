// Schnellsuche der Kursübersicht – reines TypeScript, läuft im Build (Suchtext je Kurs) und im Browser (Eingabe).
// Klein-, Umlaut- und Leerzeichen-unabhängig: „Büro“ findet „Bueromanagement“, „ap 1“ findet „AP1“.
export function suchNormal(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '');
}
