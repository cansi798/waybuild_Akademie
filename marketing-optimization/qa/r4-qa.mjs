import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const B='http://127.0.0.1:4399/waybuild_Akademie';
const srv=spawn('node',['tests/server.mjs','4399'],{env:{...process.env,BASE:'/waybuild_Akademie'},stdio:'inherit'});
await new Promise(r=>setTimeout(r,1500));
const axe=readFileSync('marketing-optimization/node_modules/axe-core/axe.min.js','utf8');
const br=await chromium.launch();
const out=[];
for (const w of []) for (const p of ['/kurse/ap1-it-berufe/','/404.html','/ueber-uns/']) {
  const pg=await br.newPage({viewport:{width:w,height:900}});
  await pg.goto(B+p,{waitUntil:'networkidle',timeout:60000});
  await pg.addScriptTag({content:axe});
  const r=await pg.evaluate(async()=>{const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']}});return r.violations.map(v=>v.id+':'+v.nodes.length+' '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' | '))});
  const small=await pg.evaluate(()=>{const sel='[data-kurs-berufe] a, main ul a.btn, #cta-titel ~ div a';return [...document.querySelectorAll(sel)].map(a=>{const b=a.getBoundingClientRect();return [a.textContent.trim().slice(0,30),Math.round(b.width),Math.round(b.height)]}).filter(x=>x[1]<44||x[2]<44)});
  const hscroll=await pg.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  out.push({w,p,axe:r,small,hscroll});
  await pg.close();
}
console.log(JSON.stringify(out,null,1));
// Journey 390px
const pg=await br.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const log=(...a)=>console.log('J',...a);
await pg.goto(B+'/',{waitUntil:'networkidle'});
const formSichtbar=async()=>pg.evaluate(()=>{const f=document.querySelector('#anfrage form, form#anfrage, [id=anfrage] form')||document.querySelector('form');if(!f)return 'kein form';const r=f.getBoundingClientRect();return location.pathname+location.hash+' formTop='+Math.round(r.top)});
log('start h1', await pg.locator('h1').first().innerText());
log('kacheln', await pg.locator('a[href*="/pruefungsvorbereitung/"]').count());
const fisi=pg.locator('a[href$="/pruefungsvorbereitung/fachinformatiker-systemintegration/"]').first();
log('fisi kachel sichtbar', await fisi.isVisible().catch(()=>false));
await fisi.scrollIntoViewIfNeeded(); await Promise.all([pg.waitForURL(/systemintegration/),fisi.tap()]); await pg.waitForLoadState("networkidle");
log('nach tap1', pg.url());
const ctas=await pg.locator('a,button').filter({hasText:/anfragen|Anfrage/i}).evaluateAll(es=>es.map(e=>[e.textContent.trim().slice(0,40),e.getAttribute('href'),e.getBoundingClientRect().top|0]));
log('ctas beruf', JSON.stringify(ctas.slice(0,6)));
// search
await pg.goto(B+'/',{waitUntil:'networkidle'});
const such=pg.locator('input[type=search], input[role=combobox], input[placeholder*="uch"]').first();
log('suche vorhanden', await such.count());
if (await such.count()) { await such.scrollIntoViewIfNeeded(); await such.tap(); await such.fill('FISI'); await pg.waitForTimeout(800);
  const tr=await pg.locator('[role=option], [data-treffer] a, [role=listbox] a').evaluateAll(es=>es.map(e=>[e.textContent.trim().slice(0,50),e.getAttribute('href')]));
  log('treffer FISI', JSON.stringify(tr.slice(0,5)));
}
for (const p of ['/kurse/ap2-fachinformatiker-systemintegration/','/pruefungsvorbereitung/']) {
  await pg.goto(B+p,{waitUntil:'networkidle'});
  const c=await pg.locator('a,button').filter({hasText:/anfragen|anmelden/i}).evaluateAll(es=>es.map(e=>[e.textContent.trim().slice(0,40),e.getAttribute('href'),e.getBoundingClientRect().top|0]));
  log(p, JSON.stringify(c.slice(0,6)));
}
// texts
for (const p of ['/','/pruefungsvorbereitung/fachinformatiker-systemintegration/','/kurse/ap2-fachinformatiker-systemintegration/','/anmeldung/','/danke/']) {
  await pg.goto(B+p,{waitUntil:'networkidle'});
  const t=await pg.evaluate(()=>document.body.innerText);
  const s=t.split(/\n+/).filter(l=>/verbindlich|Bestätigung|Zusage|Angebot|Uhr|abends/i.test(l)).map(l=>l.slice(0,160));
  log('TEXT',p, JSON.stringify([...new Set(s)].slice(0,14)));
}
await br.close(); srv.kill();
