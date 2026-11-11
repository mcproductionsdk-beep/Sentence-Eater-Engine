import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {chromium,devices} from 'playwright';
const root=new URL('../dist-preview/',import.meta.url);
const headers=await readFile(new URL('_headers',root),'utf8');
const csp=headers.match(/Content-Security-Policy: (.+)/)[1];
const files={'/':['index.html','text/html'],'/engine/eater.js':['engine/eater.js','text/javascript'],'/engine/eater.css':['engine/eater.css','text/css']};
// Test-only hooks are injected into the HTTP fixture, never the published build.
const hook=`window.fixture={state:()=>({x:player.x,y:player.y,word,score,lives,freeze,paused,sentence,transition,C,R,ghosts:ghosts.length}),collect:(correct)=>{blocked=0;collectionFreeze=0;invuln=0;const g=ghosts.find(g=>g.correct===correct);player.x=g.x;player.y=g.y;touch()},passages:()=>portraitMaze||[maze[9][9],maze[9][23]].every(c=>c!=='#'),safeRespawn:()=>{const g=ghosts.find(g=>g.correct);player.x=g.x;player.y=g.y;touch();const dir=adj(player)[0],n=wrapPosition(player.x+dir.x,player.y+dir.y);player.x=n.x;player.y=n.y;collectionFreeze=0;restoreGhost();const distance=playerDistances().get(key(g.x,g.y));const before=lives;hurt('test');return {distance,protected:lives===before,ghostCount:ghosts.length}},pellet:()=>{const [x,y]=[...pellets][0].split(',').map(Number);player.x=x;player.y=y;touch()},resumeGhost:()=>{collectionFreeze=0;blocked=0;restoreGhost()}};`;
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
 await page.getByRole('button',{name:'RESTART',exact:true}).click();await page.evaluate(()=>fixture.collect(false));assert.equal((await page.evaluate(()=>fixture.state())).lives,2);
 await page.getByRole('button',{name:'RESTART',exact:true}).click();assert.equal(await page.evaluate(()=>fixture.passages()),true);const safe=await page.evaluate(()=>fixture.safeRespawn());assert.ok(safe.distance>=7);assert.equal(safe.protected,true);assert.equal(safe.ghostCount,5);
 await page.getByRole('button',{name:'RESTART',exact:true}).click();await page.evaluate(()=>fixture.pellet());assert.ok((await page.evaluate(()=>fixture.state())).freeze>4);
 await page.getByRole('button',{name:'RESTART',exact:true}).click();await page.evaluate(()=>{window.spoken=[]});for(let i=0;i<4;i++){await page.evaluate(()=>{fixture.resumeGhost();fixture.collect(true)})}
 await page.waitForFunction(()=>fixture.state().transition<2);assert.deepEqual(await page.evaluate(()=>window.spoken),[['es-ES','Yo'],['es-ES','como'],['es-ES','una'],['es-ES','manzana'],['es-ES','Yo como una manzana']]);
 await page.waitForFunction(()=>fixture.state().sentence===1);await page.getByRole('button',{name:'RESTART',exact:true}).click();assert.equal((await page.evaluate(()=>fixture.state())).sentence,0);
 await page.getByRole('button',{name:'SOUND ON',exact:true}).click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
 await page.getByRole('button',{name:'MAIN MENU',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Play sample',exact:true}).isVisible(),true);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await context.close();console.log(label+' passed');
 }
}finally{await browser.close();server.close()}
