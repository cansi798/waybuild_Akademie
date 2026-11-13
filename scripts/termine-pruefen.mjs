// Prüft die Kurstermine in src/content/kurse/*.md:
//  - Kurstage (Wochentage aus `zeiten`) von start bis ende, ohne Feiertage HH/SH und ohne `ausfall`
//  - Anzahl Abende gegen `dauer` ("(N Abende)") bzw. ue / UE je Abend (nur Kurzkurse)
//  - Feiertage/Gründonnerstag 2027 auf Kurstagen müssen in `ausfall` stehen
//  - start/ende sind Kurstage, ende liegt mind. 3 Tage vor `pruefung`, anmeldeschluss = start - 7 Tage
// Start: docker run --rm -v "$PWD":/app -w /app node:22 node scripts/termine-pruefen.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'yaml';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/content/kurse');
const DAY = 86400000;
const iso = (d) => d.toISOString().slice(0, 10);
const toDate = (v) => (v instanceof Date ? v : new Date(`${v}T00:00:00Z`));
const add = (d, n) => new Date(d.getTime() + n * DAY);

function ostern(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, month - 1, day));
}

// gesetzliche Feiertage Hamburg / Schleswig-Holstein (inkl. Reformationstag) + unterrichtsfreier Gründonnerstag 2027
const feiertage = new Map();
for (let y = 2026; y <= 2029; y++) {
  const o = ostern(y);
  const fix = (m, d, n) => feiertage.set(iso(new Date(Date.UTC(y, m - 1, d))), n);
  fix(1, 1, 'Neujahr'); fix(5, 1, 'Tag der Arbeit'); fix(10, 3, 'Tag der Deutschen Einheit');
  fix(10, 31, 'Reformationstag'); fix(12, 25, '1. Weihnachtstag'); fix(12, 26, '2. Weihnachtstag');
  feiertage.set(iso(add(o, -2)), 'Karfreitag');
  feiertage.set(iso(add(o, 1)), 'Ostermontag');
  feiertage.set(iso(add(o, 39)), 'Christi Himmelfahrt');
  feiertage.set(iso(add(o, 50)), 'Pfingstmontag');
}
feiertage.set('2027-03-25', 'Gründonnerstag (unterrichtsfrei)');

const WT = { So: 0, Mo: 1, Di: 2, Mi: 3, Do: 4, Fr: 5, Sa: 6 };
let fehler = 0, geprueft = 0;
const err = (f, id, msg) => { fehler++; console.log(`FEHLER ${f} [${id}]: ${msg}`); };

for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.md')).sort()) {
  const m = fs.readFileSync(path.join(dir, f), 'utf8').match(/^---\n([\s\S]*?)\n---/);
  const y = yaml.parse(m[1]);
  if (!y.termine?.length || !y.zeiten) continue;
  const tage = [...String(y.zeiten).matchAll(/\b(Mo|Di|Mi|Do|Fr|Sa|So)\b/g)].map((x) => WT[x[1]]);
  if (!tage.length) continue;
  const stunden = /21:15|21:30/.test(y.zeiten) ? 4 : 3;
  const abendeText = /\((\d+) Abende\)/.exec(`${y.dauer} ${y.zeiten}`) || /^(\d+) Abende/.exec(y.zeiten);
  let erwartet = abendeText ? Number(abendeText[1]) : (y.ue && y.ue <= 100 && y.ue % stunden === 0 ? y.ue / stunden : null);

  for (const t of y.termine) {
    if (!t.ende) continue;
    geprueft++;
    const id = t.id, start = toDate(t.start), ende = toDate(t.ende);
    const ausfall = (t.ausfall || []).map((a) => iso(toDate(a)));
    const kurstag = (d) => tage.includes(d.getUTCDay());
    let n = 0; const tageListe = [];
    for (let d = start; d <= ende; d = add(d, 1)) {
      if (!kurstag(d) || feiertage.has(iso(d)) || ausfall.includes(iso(d))) continue;
      n++; tageListe.push(iso(d));
    }
    // Feiertage auf Kurstagen müssen in ausfall stehen
    for (let d = start; d <= ende; d = add(d, 1))
      if (kurstag(d) && feiertage.has(iso(d)) && !ausfall.includes(iso(d)))
        err(f, id, `${iso(d)} (${feiertage.get(iso(d))}) ist Kurstag, steht aber nicht in ausfall`);
    for (const a of ausfall) {
      const d = toDate(a);
      if (d < start || d > ende) err(f, id, `ausfall ${a} liegt außerhalb start–ende`);
      else if (!kurstag(d)) err(f, id, `ausfall ${a} ist kein Kurstag (${y.zeiten})`);
    }
    if (!kurstag(start) || ausfall.includes(iso(start)) || feiertage.has(iso(start))) err(f, id, `start ${iso(start)} ist kein Unterrichtstag`);
    if (!kurstag(ende) || ausfall.includes(iso(ende)) || feiertage.has(iso(ende))) err(f, id, `ende ${iso(ende)} ist kein Unterrichtstag`);
    if (erwartet != null && n !== erwartet) err(f, id, `${n} Abende berechnet, erwartet ${erwartet} (ende ${iso(ende)})`);
    if (t.pruefung && ende > add(toDate(t.pruefung), -3)) err(f, id, `ende ${iso(ende)} weniger als 3 Tage vor Prüfung ${iso(toDate(t.pruefung))}`);
    if (t.anmeldeschluss && iso(toDate(t.anmeldeschluss)) !== iso(add(start, -7))) err(f, id, `anmeldeschluss ${iso(toDate(t.anmeldeschluss))} != start-7 (${iso(add(start, -7))})`);
    // Texte: 01.04.2027 darf nicht mit Ostern/Gründonnerstag zusammen stehen
    if (process.env.VERBOSE) console.log(`${f} [${id}] ${n} Abende: ${tageListe.join(' ')}`);
  }
  const text = m[1] + fs.readFileSync(path.join(dir, f), 'utf8').slice(m[0].length);
  for (const zeile of text.split('\n'))
    if (/01\.04\.2027|2027-04-01/.test(zeile) && /Ostern|Gründonnerstag|ausfall/i.test(zeile)) err(f, '-', `veraltete Angabe: ${zeile.trim()}`);
}
console.log(`${geprueft} Termine geprüft, ${fehler} Fehler`);
process.exit(fehler ? 1 : 0);
