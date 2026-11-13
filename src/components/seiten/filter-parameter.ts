// Adress-Parameter der Filter (Katalog, Termine) – reines TypeScript, läuft im Build und im Browser.
// ?saeule= nimmt die Säulen-IDs und sprechende Kurzformen an (US-02 AK2: /kurse/?saeule=pruefungsvorbereitung).
export type SaeuleId = 'ihk-pruefung' | 'ihk-weiterbildung' | 'akademie';

const ALIAS: Record<string, SaeuleId> = {
  'ihk-pruefung': 'ihk-pruefung',
  pruefung: 'ihk-pruefung',
  pruefungsvorbereitung: 'ihk-pruefung',
  'ihk-pruefungsvorbereitung': 'ihk-pruefung',
  'ihk-weiterbildung': 'ihk-weiterbildung',
  weiterbildung: 'ihk-weiterbildung',
  akademie: 'akademie',
  'waybuild-weiterbildung': 'akademie',
};

export function saeuleAusParameter(wert: string | null | undefined): SaeuleId | undefined {
  if (!wert) return undefined;
  return ALIAS[wert.trim().toLowerCase()];
}
