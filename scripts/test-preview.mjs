import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {chromium,devices} from 'playwright';
const root=new URL('../dist-preview/',import.meta.url);
const headers=await readFile(new URL('_headers',root),'utf8');
const csp=headers.match(/Content-Security-Policy: (.+)/)[1];
const files={'/engine/lifecycle.js':['engine/lifecycle.js','text/javascript'],'/':['index.html','text/html'],'/engine/eater.js':['engine/eater.js','text/javascript'],'/engine/eater.css':['engine/eater.css','text/css']};
// Test-only hooks are injected into the HTTP fixture, never the published build.
const hook=`window.fixture={state:()=>({x:player.x,y:player.y,word,score,lives,freeze,paused,sentence,transition,C,R,ghosts:ghosts.length}),collect:(correct)=>{blocked=0;collectionFreeze=0;invuln=0;const g=ghosts.find(g=>g.correct===correct);player.x=g.x;player.y=g.y;touch()},spacing:()=>{let distinct=true,readable=true;for(let tick=0;tick<400;tick++){for(const g of ghosts)stepGhost(g);if(new Set(ghosts.map(g=>key(g.x,g.y))).size!==ghosts.length)distinct=false;const boxes=[...ghostLabels().values()];if(boxes.length!==ghosts.length)readable=false;for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.x-3<b.x+b.w+3&&a.x+a.w+3>b.x-3&&a.y-3<b.y+35&&a.y+35>b.y-3)readable=false}}return {distinct,readable}},passages:()=>portraitMaze||[maze[9][9],maze[9][23]].every(c=>c!=='#'),safeRespawn:()=>{const g=ghosts.find(g=>g.correct);player.x=g.x;player.y=g.y;touch();const dir=adj(player)[0],n=wrapPosition(player.x+dir.x,player.y+dir.y);player.x=n.x;player.y=n.y;collectionFreeze=0;restoreGhost();const distance=playerDistances().get(key(g.x,g.y));const before=lives;hurt('test');return {distance,protected:lives===before,ghostCount:ghosts.length}},pellet:()=>{const [x,y]=[...pellets][0].split(',').map(Number);player.x=x;player.y=y;touch()},resumeGhost:()=>{collectionFreeze=0;blocked=0;restoreGhost()}};`;
const server=createServer(async(req,res)=>{let f=files[new URL(req.url,'http://localhost').pathname];if(!f)return res.writeHead(404).end();let body=await readFile(new URL(f[0],root),'utf8');if(f[0].endsWith('.js'))body=body.replace(/\}\)\(\);\s*$/,hook+'})();');res.writeHead(200,{'Content-Type':f[1],'Content-Security-Policy':csp});res.end(body)});
const browser=await chromium.launch({executablePath:process.env.CAT_CHROMIUM_PATH||undefined});
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 for(const [label,options] of [['desktop',{viewport:{width:1280,height:800}}],['portrait',devices['Pixel 7']],['landscape',{...devices['Pixel 7'],viewport:{width:844,height:390}}]]){
 const context=await browser.newContext(options);const errors=[],external=[];await context.route('**/*',r=>{if(new URL(r.request().url()).origin===origin)return r.continue();external.push(r.request().url());return r.abort()});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.spoken=[];window.speechSynthesis.speak=u=>{window.spoken.push([u.lang,u.text]);queueMicrotask(()=>u.onend?.())}});
 await page.goto(origin);assert.equal(await page.locator('#app').isVisible(),false);await page.getByRole('button',{name:'Play sample',exact:true}).click();
 assert.deepEqual(await page.locator('.controls button').allTextContents(),['PAUSE','RESTART','MAIN MENU','SOUND ON']);
 const fit=await page.evaluate(()=>({fits:document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth,buttons:[...document.querySelectorAll('.controls button')].map(x=>{const r=x.getBoundingClientRect();return [r.top,r.height,r.left,r.right]})}));assert.equal(fit.fits,true);assert.ok(fit.buttons.every(b=>b[0]===fit.buttons[0][0]&&b[1]>=44&&b[2]>=0&&b[3]<=options.viewport.width));
 await page.getByRole('button',{name:'PAUSE',exact:true}).click();const before=await page.evaluate(()=>fixture.state());assert.equal(before.paused,true);
 await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');assert.equal((await page.evaluate(()=>fixture.state())).x,before.x);
 await page.getByRole('button',{name:'RESUME',exact:true}).click();await page.keyboard.down('ArrowRight');await page.waitForTimeout(250);await page.keyboard.up('ArrowRight');assert.ok((await page.evaluate(()=>fixture.state())).x>before.x);
 if(label!=='desktop'){
 await page.getByRole('button',{name:'RESTART',exact:true}).click();
 assert.equal(await page.locator('#mobileDpad button').count(),0);assert.equal(await page.locator('#movementGuide').isVisible(),true);
 const gesture=async(dx,dy,type='pointerup')=>page.locator('#movementGuide').evaluate((canvas,[dx,dy,type])=>{
  canvas.dispatchEvent(new PointerEvent('pointerdown',{pointerId:71,pointerType:'touch',clientX:100,clientY:100,bubbles:true}));
  canvas.dispatchEvent(new PointerEvent(type,{pointerId:71,pointerType:'touch',clientX:100+dx,clientY:100+dy,bubbles:true}));
 },[dx,dy,type]);
 // Synthetic fixture pointers do not own native pointer capture.
 await page.evaluate(()=>{document.querySelector('#movementGuide').setPointerCapture=()=>{}});
 await gesture(55,0);await page.waitForTimeout(240);
 assert.ok((await page.evaluate(()=>fixture.state())).x>1);
 await gesture(0,0);const stopped=await page.evaluate(()=>fixture.state());
 await page.waitForTimeout(300);assert.equal((await page.evaluate(()=>fixture.state())).x,stopped.x);
 await gesture(55,0);await page.getByRole('button',{name:'PAUSE',exact:true}).click();await page.getByRole('button',{name:'RESUME',exact:true}).click();
 const resumed=await page.evaluate(()=>fixture.state());await page.waitForTimeout(240);assert.equal((await page.evaluate(()=>fixture.state())).x,resumed.x);
 await gesture(55,0);await gesture(0,0,'pointercancel');const cancelled=await page.evaluate(()=>fixture.state());await page.waitForTimeout(240);assert.equal((await page.evaluate(()=>fixture.state())).x,cancelled.x);
 }
 await page.getByRole('button',{name:'RESTART',exact:true}).click();await page.evaluate(()=>fixture.collect(false));assert.equal((await page.evaluate(()=>fixture.state())).lives,2);
 await page.getByRole('button',{name:'RESTART',exact:true}).click();assert.deepEqual(await page.evaluate(()=>fixture.spacing()),{distinct:true,readable:true});await page.getByRole('button',{name:'RESTART',exact:true}).click();assert.equal(await page.evaluate(()=>fixture.passages()),true);const safe=await page.evaluate(()=>fixture.safeRespawn());assert.ok(safe.distance>=7);assert.equal(safe.protected,true);assert.equal(safe.ghostCount,5);
 await page.getByRole('button',{name:'RESTART',exact:true}).click();await page.evaluate(()=>fixture.pellet());assert.ok((await page.evaluate(()=>fixture.state())).freeze>4);
 await page.getByRole('button',{name:'RESTART',exact:true}).click();await page.evaluate(()=>{window.spoken=[]});for(let i=0;i<4;i++){await page.evaluate(()=>{fixture.resumeGhost();fixture.collect(true)})}
 await page.waitForFunction(()=>fixture.state().transition<2);assert.deepEqual(await page.evaluate(()=>window.spoken),[['es-ES','Yo'],['es-ES','como'],['es-ES','una'],['es-ES','manzana'],['es-ES','Yo como una manzana']]);
 await page.waitForFunction(()=>fixture.state().sentence===1);await page.getByRole('button',{name:'RESTART',exact:true}).click();assert.equal((await page.evaluate(()=>fixture.state())).sentence,0);
 await page.getByRole('button',{name:'SOUND ON',exact:true}).click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
 await page.getByRole('button',{name:'MAIN MENU',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Play sample',exact:true}).isVisible(),true);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await context.close();console.log(label+' passed');
 }

 // Exercise the real iframe adapter with denied network and controlled shared speech.
 for(const [language,target] of [['es-ES','gato rojo'],['de-DE','rote Katze'],['da-DK','rød kat'],['fr-FR','chat rouge'],['it-IT','gatto rosso']]){
  const context=await browser.newContext();const page=await context.newPage();
  const shell='https://bt-vocabulary-platform-staging.pages.dev',engine='https://abcd1234.bt-sentence-eater-preview.pages.dev';
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.origin===shell)return route.fulfill({contentType:'text/html',body:'<iframe src="'+engine+'/"></iframe><script>window.events=[];addEventListener("message",e=>{events.push(e.data);if(e.data.type==="SPEAK")e.source.postMessage({...e.data,type:"SPOKEN"},e.origin)})</script>'});
   const path=u.pathname==='/'?'index.html':u.pathname.slice(1);
   if(u.origin!==engine||!['index.html','engine/eater.js','engine/eater.css','engine/build-id.mjs'].includes(path))return route.abort();
   let body=await readFile(new URL(path,root),'utf8');if(path==='engine/eater.js')body=body.replace(/\}\)\(\);\s*$/,hook+'})();');
   return route.fulfill({headers:{'Content-Type':path.endsWith('.html')?'text/html':path.endsWith('.css')?'text/css':'text/javascript','Content-Security-Policy':csp},body});
  });
  await page.goto(shell);await page.waitForFunction(()=>events.some(e=>e.type==='READY'));
  const manifest=JSON.parse(await readFile(new URL('version.json',root),'utf8'));
  assert.equal(await page.evaluate(()=>events.find(e=>e.type==='READY').buildId),manifest.buildId);
  await page.evaluate(([language,target,engine])=>document.querySelector('iframe').contentWindow.postMessage({protocol:'bt-sentence-eater/1',type:'INIT',sessionId:'integration-session-1234567890',soundOn:true,set:{title:'Fixture',language,pairs:[['The red cat.',target],['Another prompt.',target]]}},engine),[language,target,engine]);
  await page.waitForFunction(()=>events.some(e=>e.type==='STARTED'));
  const frame=page.frames().find(f=>f.url().startsWith(engine));
  assert.equal(await frame.locator('#prompt').textContent(),'The red cat.');
  await frame.evaluate(()=>fixture.collect(true));await frame.evaluate(()=>{fixture.resumeGhost();fixture.collect(true)});
  await page.waitForFunction(()=>events.filter(e=>e.type==='SPEAK').length===3);
  const spoken=await page.evaluate(()=>events.filter(e=>e.type==='SPEAK').map(e=>e.text));
  assert.deepEqual(spoken,[...target.split(' '),target]);
  await frame.getByRole('button',{name:'MAIN MENU',exact:true}).click();await page.waitForFunction(()=>events.some(e=>e.type==='MENU'));
  await context.close();console.log(language+' shared adapter passed');
 }
}finally{await browser.close();server.close()}
