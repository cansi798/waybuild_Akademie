// Gemeinsame FAQ-Quelle (Conversion-Konzept D): /faq/, /pruefungsvorbereitung/ und /coaching/ wählen Fragen per ID.
// Antworten nur gemäß Teilnahmebedingungen (Entwurf) und Rulings: nur Live-Unterricht, keine Förderung, keine Zahlen
// zu Gruppengröße oder Mindestteilnehmerzahl, Endpreise „alles inklusive“, Du-Ansprache, keine Erfolgsversprechen.
// Storno/Ersatz/Absage folgen lib/zusagen.ts – bei einer Änderung dort auch hier prüfen.
import type { FaqEintrag } from '../components/seiten/schema';

export const FAQ = {
  // Allgemein
  'ihk-veranstaltung': {
    frage: 'Ist der Kurs eine offizielle IHK-Veranstaltung?',
    antwort: 'Nein. Die waybuild Akademie ist ein unabhängiger Anbieter. Die Prüfung legst du bei deiner zuständigen IHK ab; verbindlich sind deren Termine.',
  },
  dozenten: {
    frage: 'Wer unterrichtet bei euch?',
    antwort: 'In der IHK-Prüfungsvorbereitung und im Prüfungscoaching unterrichten Dozenten mit IHK-Prüfer-Erfahrung. Sie kennen die Prüfung von der anderen Seite.',
  },
  'vor-ort': {
    frage: 'Finden die Kurse vor Ort statt?',
    antwort: 'Nein. Alle Kurse finden ausschließlich live online statt – per Videokonferenz, in Echtzeit und gemeinsam mit der Gruppe.',
  },
  anbieter: {
    frage: 'Wer steht hinter der waybuild Akademie?',
    antwort: 'Die waybuild Akademie gehört zur Waybuild UG (haftungsbeschränkt) mit Sitz in Norderstedt.',
  },

  // Anmeldung & Bezahlung
  anmelden: {
    frage: 'Wie melde ich mich an?',
    antwort: 'Wähle auf der Kursseite oder in der Terminübersicht einen Termin und fülle das kurze Formular aus – ein Kundenkonto brauchst du nicht. Danach bekommst du eine Eingangsbestätigung per E-Mail.',
  },
  anmeldeschluss: {
    frage: 'Bis wann kann ich mich anmelden?',
    antwort: 'Bis 7 Tage vor Kursstart. Den Anmeldeschluss findest du bei jedem Termin.',
  },
  bezahlen: {
    frage: 'Wie bezahle ich?',
    antwort: 'Nach der Anmeldung bekommst du die Rechnung per E-Mail und überweist den Betrag – innerhalb von 14 Tagen, spätestens vor Kursbeginn. Eine Online-Zahlung gibt es nicht.',
  },
  raten: {
    frage: 'Kann ich in Raten zahlen?',
    antwort: 'Bei langen Weiterbildungen ja, ohne Aufpreis – die Kursseite zeigt, wo das möglich ist. Gib es bei der Anmeldung im Feld „Nachricht an uns“ an; den Ratenplan findest du in deiner Rechnung. Die Prüfungsvorbereitungen zahlst du in einem Betrag.',
  },
  betrieb: {
    frage: 'Kann mein Betrieb die Rechnung bekommen?',
    antwort: 'Ja. Wähle im Formular „Mein Betrieb zahlt“ und gib die Rechnungsangaben der Firma an. Die Rechnung geht dann per E-Mail an den Betrieb; eine Bestellnummer kannst du freiwillig ergänzen.',
  },
  mehrere: {
    frage: 'Kann ich mehrere Personen anmelden?',
    antwort: 'Ja, bis zu 5 Personen in einer Anmeldung. Ab 3 Personen gibt es 10 % Rabatt auf die gesamte Teilnahmegebühr.',
  },
  endpreis: {
    frage: 'Ist der Preis ein Endpreis?',
    antwort: 'Ja. Alle Preise sind Endpreise, alles inklusive. Die Prüfungsgebühr deiner IHK ist nicht enthalten.',
  },

  // Storno, Ersatz, Absage
  storno: {
    frage: 'Kann ich stornieren?',
    antwort: 'Ja. Bis 14 Tage vor Kursstart kostenlos, danach 50 % der Teilnahmegebühr, ab Kursbeginn die volle Gebühr. Statt zu stornieren, kann jederzeit kostenlos eine Ersatzperson teilnehmen. Bei Weiterbildungen mit mehr als 6 Monaten Laufzeit gilt ab Kursbeginn stattdessen eine Kündigungsfrist von 4 Wochen zum Monatsende. Dein gesetzliches Widerrufsrecht bleibt unberührt. Die Einzelheiten stehen in den Teilnahmebedingungen.',
  },
  ersatz: {
    frage: 'Kann jemand anderes meinen Platz übernehmen?',
    antwort: 'Ja, jederzeit kostenlos – vor Kursbeginn und bei laufenden Kursen auch später. Schick uns dazu Name und E-Mail-Adresse der Ersatzperson per E-Mail.',
  },
  absage: {
    frage: 'Was passiert, wenn ein Kurs nicht stattfindet?',
    antwort: 'Dann sagen wir spätestens 10 Tage vor Kursstart ab und informieren dich per E-Mail. Bereits gezahlte Beträge bekommst du vollständig zurück – oder du wechselst kostenlos in einen anderen Termin.',
  },

  // Live-Unterricht
  kursabend: {
    frage: 'Wie läuft ein Kurstermin ab?',
    antwort: 'Jeder Termin hat ein Schwerpunktthema. Die Lehrkraft führt kurz ein, danach besprechen wir prüfungsnahe Aufgaben gemeinsam live.',
  },
  technik: {
    frage: 'Was brauche ich für den Live-Unterricht?',
    antwort: 'Einen Computer, Laptop oder ein Tablet mit aktuellem Browser, eine stabile Internetverbindung und ein Headset oder Kopfhörer mit Mikrofon. Eine Kamera ist empfehlenswert.',
  },
  zugang: {
    frage: 'Wie bekomme ich den Zugang?',
    antwort: 'Vor Kursbeginn schicken wir dir den Link zum Live-Raum per E-Mail. Auf der Website steht er nicht.',
  },
  fragen: {
    frage: 'Kann ich Fragen stellen?',
    antwort: 'Ja, jederzeit – per Mikrofon oder im Chat. Genau dafür ist der Live-Unterricht da.',
  },
  verpasst: {
    frage: 'Was ist, wenn ich einen Termin verpasse?',
    antwort: 'Sag uns Bescheid. Du kannst den Termin in einem späteren Live-Termin mit demselben Inhalt nachholen, zum Beispiel in einer anderen Gruppe – soweit dort Platz ist.',
  },
  gruppe: {
    frage: 'Lerne ich allein oder in einer Gruppe?',
    antwort: 'In einer festen Gruppe: Ihr startet gemeinsam und bleibt bis zum letzten Termin zusammen. Fragen klärst du direkt im Live-Unterricht. Wer lieber 1:1 lernt, findet das im Prüfungscoaching.',
  },
  unterlagen: {
    frage: 'Bekomme ich Unterlagen?',
    antwort: 'Ja. Skripte und Übungsaufgaben bekommst du ergänzend zur freiwilligen Vor- und Nachbereitung – sie sind im Endpreis enthalten. Die Aufgaben besprechen wir gemeinsam im Live-Unterricht.',
  },

  // Prüfung
  'welcher-kurs': {
    frage: 'Welcher Kurs passt zu mir – AP1 oder AP2?',
    antwort: 'Die AP1 schreibst du etwa zur Mitte der Ausbildung; sie ist für alle sieben IT-Berufe gleich. Die AP2 kommt am Ende der Ausbildung. Unseren AP2-Kurs gibt es zuerst für die Fachrichtung Systemintegration.',
  },
  'pruefung-wann': {
    frage: 'Wann ist meine Prüfung?',
    antwort: 'Bei jedem Termin steht der bundesweite schriftliche Prüfungstag. Verbindlich ist die Einladung deiner IHK.',
  },
  'pruefung-anmeldung': {
    frage: 'Melde ich mich bei euch auch zur Prüfung an?',
    antwort: 'Nein. Die Anmeldung zur Prüfung läuft über deine zuständige IHK – in der Ausbildung meist über deinen Ausbildungsbetrieb. Die Prüfung legst du bei deiner IHK ab.',
  },
  fachwissen: {
    frage: 'Muss ich Fachwissen mitbringen?',
    antwort: 'Ja. Die Prüfungsvorbereitung wiederholt und vertieft, was du in der Ausbildung gelernt hast. Sie ersetzt keine Ausbildung.',
  },
  umschueler: {
    frage: 'Ist der Kurs auch für Umschüler geeignet?',
    antwort: 'Ja. Die Prüfungsvorbereitung richtet sich an Auszubildende und Umschüler, die dieselbe IHK-Abschlussprüfung ablegen.',
  },
  projektantrag: {
    frage: 'Schreibt ihr beim Coaching meinen Projektantrag?',
    antwort: 'Nein. Projektantrag, Dokumentation und alle Prüfungsleistungen erstellst du selbst. Im Coaching bekommst du Beratung, Rückmeldung und Training.',
  },

  // Prüfungscoaching
  'coaching-verbindlich': {
    frage: 'Ist die Anfrage verbindlich?',
    antwort: 'Nein. Die Anfrage ist unverbindlich. Der Vertrag kommt erst zustande, wenn wir die Termine gemeinsam abgestimmt haben und dir das per E-Mail bestätigen.',
  },
  'coaching-verschieben': {
    frage: 'Kann ich einen Coaching-Termin verschieben?',
    antwort: 'Ja. Bis 24 Stunden vorher kannst du einen vereinbarten Termin kostenlos absagen oder verschieben. Bei späterer Absage gilt der Termin als wahrgenommen.',
  },
  'coaching-betrieb': {
    frage: 'Wie bezahle ich das Coaching – und kann mein Betrieb zahlen?',
    antwort: 'Die Rechnung kommt per E-Mail, eine Online-Zahlung gibt es nicht. Wählst du im Anfrageformular „Mein Betrieb zahlt“, geht die Rechnung an die Firma.',
  },
  'coaching-wer': {
    frage: 'Wer coacht mich?',
    antwort: 'Dozenten mit IHK-Prüfer-Erfahrung – 1:1 und live per Videokonferenz.',
  },
  'coaching-paket': {
    frage: 'Welches Paket passt zu mir?',
    antwort: 'Für eine einzelne Frage gibt es das Einzelcoaching mit einem Termin. Für Projekt und Fachgespräch ist das Coaching-Paket mit 3 Terminen gedacht, für eine längere Begleitung die Intensivbegleitung mit 5 Terminen. Das Paket wählst du in der Anfrage.',
  },
  'coaching-technik': {
    frage: 'Was brauche ich für das Coaching?',
    antwort: 'Einen Computer mit stabiler Internetverbindung und ein Headset mit Mikrofon, eine Kamera ist empfehlenswert. Dazu deine eigenen Unterlagen, zum Beispiel Projektidee, Antrag oder Gliederung.',
  },
  'coaching-ihk': {
    frage: 'Ist das Coaching eine Veranstaltung der IHK?',
    antwort: 'Nein. Das Coaching ist ein unabhängiges Angebot der waybuild Akademie. Eine Einflussnahme auf die Prüfung oder deren Bewertung erfolgt nicht.',
  },

  // Weiterbildung
  'wb-angebot': {
    frage: 'Welche Weiterbildungen bietet ihr an?',
    antwort: 'Berufsbegleitende IHK-Weiterbildungen wie Fachwirt oder Betriebswirt und eigene Kurse in KI, Programmierung und IT bereiten wir gerade vor. Du kannst dein Interesse unverbindlich vormerken.',
  },
  'wb-zulassung': {
    frage: 'Wer entscheidet über die Zulassung zur Fortbildungsprüfung?',
    antwort: 'Deine IHK. Kläre die Zulassung am besten vor Kursbeginn.',
  },
  'wb-abschluss': {
    frage: 'Welchen Abschluss bekomme ich bei einer eigenen Weiterbildung?',
    antwort: 'Ein Teilnahmezertifikat der waybuild Akademie. Das ist kein öffentlich-rechtlicher Abschluss.',
  },
} as const satisfies Record<string, FaqEintrag>;

export type FaqId = keyof typeof FAQ;

/** Fragen in der gewünschten Reihenfolge. */
export function fragen(...ids: FaqId[]): FaqEintrag[] {
  return ids.map((id) => FAQ[id]);
}

/** Zwei Listen zusammenführen, doppelte Fragen (gleicher Fragetext) nur einmal. */
export function ohneDoppelte(...listen: FaqEintrag[][]): FaqEintrag[] {
  const gesehen = new Set<string>();
  return listen.flat().filter((f) => {
    const k = f.frage.trim().toLowerCase();
    if (gesehen.has(k)) return false;
    gesehen.add(k);
    return true;
  });
}

/** Gruppen der zentralen FAQ-Seite (/faq/). */
export const FAQ_GRUPPEN: { id: string; titel: string; ids: FaqId[] }[] = [
  { id: 'allgemein', titel: 'Allgemein', ids: ['ihk-veranstaltung', 'dozenten', 'vor-ort', 'anbieter'] },
  { id: 'anmeldung', titel: 'Anmeldung & Bezahlung', ids: ['anmelden', 'anmeldeschluss', 'bezahlen', 'raten', 'betrieb', 'mehrere', 'endpreis'] },
  { id: 'storno', titel: 'Storno & Absage', ids: ['storno', 'ersatz', 'absage', 'coaching-verschieben'] },
  { id: 'live-unterricht', titel: 'Live-Unterricht', ids: ['kursabend', 'gruppe', 'technik', 'zugang', 'fragen', 'verpasst', 'unterlagen'] },
  { id: 'pruefung', titel: 'Prüfung', ids: ['welcher-kurs', 'pruefung-wann', 'pruefung-anmeldung', 'fachwissen', 'umschueler', 'projektantrag'] },
  { id: 'weiterbildung', titel: 'Weiterbildung', ids: ['wb-angebot', 'wb-zulassung', 'wb-abschluss'] },
];
