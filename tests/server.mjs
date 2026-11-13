// Kleiner statischer Server für die Tests: liefert dist/ unter dem Basis-Pfad aus (wie GitHub Pages bzw. ALL-INKL).
// Aufruf: node tests/server.mjs [port]  –  ENV BASE (z. B. /waybuild_Akademie), Standard "/".
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = Number(process.argv[2] ?? 4321);
const base = (process.env.BASE ?? '/').replace(/\/+$/, '');
const root = new URL('../dist/', import.meta.url).pathname;
const typen = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
};

async function datei(pfad) {
  const voll = join(root, normalize(pfad).replace(/^(\.\.[/\\])+/, ''));
  try {
    const s = await stat(voll);
    if (s.isDirectory()) return datei(join(pfad, 'index.html'));
    return { inhalt: await readFile(voll), typ: typen[extname(voll)] ?? 'application/octet-stream' };
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  let pfad = decodeURIComponent(url.pathname);
  if (base && !pfad.startsWith(`${base}/`) && pfad !== base) {
    res.writeHead(404).end('ausserhalb BASE');
    return;
  }
  pfad = pfad.slice(base.length) || '/';
  const f = await datei(pfad);
  if (f) {
    res.writeHead(200, { 'Content-Type': f.typ }).end(f.inhalt);
  } else {
    const nf = await datei('/404.html');
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(nf?.inhalt ?? 'Not found');
  }
}).listen(port, () => console.log(`dist/ unter http://localhost:${port}${base}/`));
