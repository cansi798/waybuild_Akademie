import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const B='http://127.0.0.1:4409/waybuild_Akademie';
const D='marketing-optimization/qa/r9/';
const srv=spawn('node',['tests/server.mjs','4409'],{env:{...process.env,BASE:'/waybuild_Akademie'},stdio:'ignore'});
await new Promise(r=>setTimeout(r,1200));
const br=await chromium.launch();
const log=(...a)=>console.log(...a);
const fold=async(pg)=>pg.evaluate(()=>{const H=innerHeight;const els=[...document.querySelectorAll('h1,h2,h3,p,li,a.btn,button,label,input,select,video,summary')].filter(e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.top<H&&r.bottom>0&&r.height>0&&s.visibility!=='hidden'&&!e.closest('[hidden]')});
 const words=document.body.innerText.split(/\s+/).length;
 return {words, fold: els.map(e=>e.tagName+': '+(e.innerText||e.getAttribute('aria-label')||e.name||'').trim().replace(/\s+/g,' ').slice(0,70)).filter((v,i,a)=>a.indexOf(v)===i).slice(0,30)}});
for (const [tag,vp,mob] of [['m',{width:390,height:844},true],['d',{width:1280,height:800},false]]) {
 const ctx=await br.newContext({viewport:vp,isMobile:mob,hasTouch:mob});
 const pg=await ctx.newPage();
 const reqs=[];pg.on('request',r=>{if(/\.mp4|\.jpg/.test(r.url()))reqs.push(r.url().split('/').pop())});
 for (const p of ['/','/pruefungsvorbereitung/fachinformatiker-systemintegration/','/kurse/ap2-fachinformatiker-systemintegration/','/anmeldung/?kurs=ap2-fachinformatiker-systemintegration']) {
  reqs.length=0;
  await pg.goto(B+p,{waitUntil:'networkidle',timeout:60000});
  const n=p.replace(/[^a-z0-9]+/g,'_')||'start';
  await pg.screenshot({path:D+`${tag}${n}.png`});
  const f=await fold(pg);
  const ctas=await pg.locator('a,button').filter({hasText:/anfrag|anmeld|buchen/i}).evaluateAll(es=>es.filter(e=>e.offsetParent||getComputedStyle(e).position==='fixed').map(e=>[e.textContent.trim().replace(/\s+/g,' ').slice(0,45),(e.getAttribute('href')||'').replace(/.*Akademie/,''),e.getBoundingClientRect().top|0]));
  log(`\n### ${tag} ${p} words=${f.words} mediaReqOnLoad=${JSON.stringify(reqs)}`);
  log('FOLD', JSON.stringify(f.fold));
  log('CTAS', JSON.stringify(ctas.slice(0,10)));
 }
 // Journey start -> Beruf -> Form
 await pg.goto(B+'/',{waitUntil:'networkidle'});
 const k=pg.locator('a[href$="/pruefungsvorbereitung/fachinformatiker-systemintegration/"]').first();
 log('\nJ kachel top', await k.evaluate(e=>e.getBoundingClientRect().top|0));
 await k.scrollIntoViewIfNeeded(); await Promise.all([pg.waitForURL(/systemintegration/),k.click()]);
 await pg.waitForLoadState('networkidle');
 const c=pg.locator('a').filter({hasText:/anfrag/i}).first();
 log('J beruf cta1', await c.innerText(), await c.getAttribute('href'));
 await c.click(); await pg.waitForTimeout(800);
 log('J nach tap2 url', pg.url().replace(/.*Akademie/,''), 'focus', await pg.evaluate(()=>document.activeElement?.id));
 const form=pg.locator('form[data-anfrage-formular]').first();
 log('J vorauswahl', await form.evaluate(f=>[...f.querySelectorAll('select')].map(s=>s.name+'='+s.value).join(' ')));
 await form.locator('button[type=submit]').click(); await pg.waitForTimeout(500);
 log('J fehler leer', JSON.stringify(await form.evaluate(f=>[...f.querySelectorAll('[id$=-fehler]')].filter(e=>e.textContent.trim()&&e.offsetParent).map(e=>e.textContent.trim()))));
 await form.locator('[name=name]').fill('Max'); await form.locator('[name=email]').fill('max@web'); await form.locator('[name=email]').blur();
 await form.locator('button[type=submit]').click(); await pg.waitForTimeout(500);
 log('J fehler email', JSON.stringify(await form.evaluate(f=>[...f.querySelectorAll('[id$=-fehler]')].filter(e=>e.textContent.trim()&&e.offsetParent).map(e=>e.textContent.trim()))));
 await form.scrollIntoViewIfNeeded(); await pg.screenshot({path:D+`${tag}_beruf_formular_fehler.png`});
 // Anmeldung form inspection
 await pg.goto(B+'/kurse/ap2-fachinformatiker-systemintegration/',{waitUntil:'networkidle'});
 const a=pg.locator('a[href*="/anmeldung/"]').first();
 log('\nK anmeldung-link', await a.count()? (await a.innerText()).trim()+' '+(await a.getAttribute('href')).replace(/.*Akademie/,'')+' top '+(await a.evaluate(e=>e.getBoundingClientRect().top|0)) : 'KEIN');
 if (await a.count()) { await a.scrollIntoViewIfNeeded(); await Promise.all([pg.waitForURL(/anmeldung/),a.click()]); await pg.waitForLoadState('networkidle');
  await pg.screenshot({path:D+`${tag}_anmeldung_von_kurs.png`});
  log('K url', pg.url().replace(/.*Akademie/,''));
  log('K felder', JSON.stringify(await pg.evaluate(()=>[...document.querySelectorAll('form [data-feld], form input[type=checkbox]')].filter((e,i,a)=>e.type!=='radio'||a.findIndex(x=>x.name===e.name)===[...a].indexOf(e)).map(e=>`${e.name}|${e.type}|im=${e.inputMode||''}|ac=${e.autocomplete||''}|req=${e.required||e.hasAttribute('data-pflicht')}|vis=${!!e.offsetParent}`))));
  log('K sel', JSON.stringify(await pg.evaluate(()=>[...document.querySelectorAll('form select')].map(s=>s.name+'='+s.value))));
 }
 await ctx.close();
}
await br.close(); srv.kill();
