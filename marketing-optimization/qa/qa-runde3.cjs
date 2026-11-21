const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('/app/node_modules/playwright');
const root='/app/dist',B='/waybuild_Akademie';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.woff2':'font/woff2','.webp':'image/webp'};
const srv=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.startsWith(B))p=p.slice(B.length);let f=path.join(root,p);if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){r.writeHead(404);return r.end();}r.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);}).listen(4999);
(async()=>{const b=await chromium.launch();const out='/app/marketing-optimization/qa/';
for(const w of [320,390]){const p=await b.newPage({viewport:{width:w,height:844}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text()));
await p.goto(`http://localhost:4999${B}/kurse/ap1-it-berufe/`);await p.screenshot({path:out+`kurs-kopf-${w}.png`});
await p.mouse.wheel(0,1400);await p.waitForTimeout(900);
const l=p.locator('[data-cta-leiste]');const info=await l.evaluate(e=>{const a=e.querySelector('a');const r=e.getBoundingClientRect(),ra=a.getBoundingClientRect();return {leiste:[r.left,r.right,r.height],knopf:[ra.left,ra.right,ra.height],sw:a.scrollWidth,cw:a.clientWidth,text:e.innerText.replace(/\s+/g,' '),docw:document.documentElement.scrollWidth}});
await p.screenshot({path:out+`kurs-leiste-${w}.png`});console.log(w,JSON.stringify(info));
await p.locator('[data-hauptaktion]').first().click();await p.waitForLoadState('load');await p.waitForTimeout(500);
const f=await p.evaluate(()=>{const t=document.querySelector('select[name=termin]');const k=document.querySelector('select[name=kurs]');return {url:location.search,kurs:k&&k.value,termin:t&&t.value,optionen:t?[...t.options].map(o=>o.text+(o.disabled?' (x)':'')):[],fehler:[...document.querySelectorAll('[role=alert],.fehler,[data-fehler]')].filter(e=>e.offsetParent&&e.textContent.trim()).map(e=>e.textContent.trim()).slice(0,3)}});
console.log(w,JSON.stringify(f),'errors',JSON.stringify(errs));await p.screenshot({path:out+`anmeldung-ohne-termin-${w}.png`,fullPage:false});await p.close();}
await b.close();srv.close();})();
