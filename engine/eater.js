
(()=>{'use strict';
const base=[
'#################################',
'#...............#...............#',
'#.###.#####.###.#.###.#####.###.#',
'#o..#.....#.....#.....#.....#..o#',
'###.#.###.#.###...###.#.###.#.###',
'#...#...#...#.......#...#...#...#',
'#.#####.###.#.#####.#.###.#####.#',
'#.......#...#...#...#...#.......#',
'#.#####.#.#####.#.#####.#.#####.#',
'.........#.............#.........',
'#.#####.#.#####.#.#####.#.#####.#',
'#.......#...#...#...#...#.......#',
'#.#####.###.#.#####.#.###.#####.#',
'#...#...#...#.......#...#...#...#',
'###.#.###.#.###...###.#.###.#.###',
'#o..#.....#.....#.....#.....#..o#',
'#.###.#####.###.#.###.#####.###.#',
'#...............#...............#',
'#################################'];
const LIB={};
let sentences=[['I eat an apple.','Yo como una manzana'],['She drinks water.','Ella bebe agua'],['We live in Denmark.','Nosotros vivimos en Dinamarca'],['They study Spanish.','Ellos estudian español'],['He has a dog.','Él tiene un perro'],['I read a book.','Yo leo un libro'],['We go to school.','Nosotros vamos a la escuela'],['My sister sings well.','Mi hermana canta bien'],['I want some coffee.','Yo quiero un café'],['The cat sleeps here.','El gato duerme aquí']];
const portraitMaze=matchMedia('(max-width:760px) and (orientation:portrait)').matches;const C=portraitMaze?15:33,R=portraitMaze?25:19,S=32,cv=document.querySelector('#game'),ctx=cv.getContext('2d');cv.width=C*S;cv.height=R*S;let maze=[],dots=new Set(),pellets=new Set(),player,ghosts=[],sentence=0,word=0,score=0,lives=3,mazeNum=1,freeze=0,invuln=0,paused=true,over=false,sound=true,last=0,acc=0,ghostAcc=0,messageTimer=0,transition=0,blocked=0,collectionFreeze=0,wordFlash='',wordFlashTimer=0,respawnGhost=null,mazeFade=0,flashAge=0,flashDuration=0;let started=false,rafId=0,disposed=false;let keys={};let heldDirections=[];let currentLanguage='es-ES';let boostHeld=false;let completionToken=0,completionFallback=null;const $=id=>document.getElementById(id),dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}],pick=a=>a[Math.random()*a.length|0],words=()=>sentences[sentence%sentences.length][1].split(/\s+/),valid=(x,y)=>y>=0&&y<R&&x>=0&&x<C&&maze[y][x]!=='#',key=(x,y)=>x+','+y;
function layout(){let offset=(mazeNum-1)%4;maze=portraitMaze?Array.from({length:R},(_,y)=>Array.from({length:C},(_,x)=>x===0||x===C-1||y===0||y===R-1?'#':' ')):base.map(r=>r.split(''));if(portraitMaze){for(let y=4;y<R-3;y+=4)for(let x=3;x<C-2;x+=4)for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)maze[y+dy][x+dx]='#';for(let y=1;y<R-1;y++)for(let x=1;x<C-1;x++)if(maze[y][x]===' '&&!(x===1&&y===1))maze[y][x]='.';for(const [x,y] of [[1,3],[13,3],[1,21],[13,21]])maze[y][x]='o';}if(offset&&!portraitMaze){for(let y=2;y<R-2;y++)for(let x=2;x<C-2;x++){if((x+y+offset*3)%17===0&&maze[y][x]==='#'&&validBase(x-1,y)&&validBase(x+1,y))maze[y][x]='.'}}// The central sentence chamber is solid and never contains dots, ghosts or the player.
// Solid central island: collision geometry and drawn chamber share exactly these tiles.
for(let y=chamberY;y<chamberY+5;y++)for(let x=chamberX;x<chamberX+chamberW;x++)maze[y][x]='#';
// Walkable ring on all four sides, with accessible connections to the maze.
for(let x=chamberX-1;x<=chamberX+chamberW;x++){maze[chamberY-1][x]=' ';maze[chamberY+5][x]=' '}
for(let y=chamberY-1;y<=chamberY+5;y++){maze[y][chamberX-1]=' ';maze[y][chamberX+chamberW]=' '}
// Do not let later maze variants reopen the island.
dots.clear();pellets.clear();for(let y=0;y<R;y++)for(let x=0;x<C;x++){if(maze[y][x]==='.'||maze[y][x]==='o'){(maze[y][x]==='o'?pellets:dots).add(key(x,y));maze[y][x]=' '}}wallArt=null;}
function validBase(x,y){return portraitMaze?(x>0&&x<C-1&&y>0&&y<R-1):(base[y]&&base[y][x]&&base[y][x]!=='#')}
function freeTiles(){let a=[];for(let y=1;y<R-1;y++)for(let x=1;x<C-1;x++)if(valid(x,y))a.push({x,y});return a}
function spawn(){let tiles=freeTiles();player={x:1,y:1,dir:{x:1,y:0},want:{x:1,y:0}};if(!valid(player.x,player.y))player={...tiles[0],dir:dirs[0],want:dirs[0]};ghosts=[];for(let i=0;i<5;i++){let t=pick(tiles.filter(p=>Math.abs(p.x-player.x)+Math.abs(p.y-player.y)>12&&!ghosts.some(g=>g.x===p.x&&g.y===p.y)));ghosts.push({...t,dir:pick(dirs),label:'',correct:false,chase:i%2===1,color:['#ff7e91','#6fe3ca','#c8a4ff','#ffb45d','#71b8ff'][i]})}labels()}
function labels(){let target=words()[word],distractors=[...new Set([...(Object.values(LIB[currentLanguage]||{}).flat().flatMap(pair=>pair[1].split(/\s+/))),...sentences.flatMap(pair=>pair[1].split(/\s+/))])].filter(Boolean);let current=words();let pool=[...new Set([...current.filter((w,i)=>i!==word),...distractors])].filter(w=>w.toLocaleLowerCase()!==target.toLocaleLowerCase());ghosts.forEach((g,i)=>{g.correct=i===0;g.label=g.correct?target:pool.splice(Math.random()*pool.length|0,1)[0]||'otra'});ghosts.sort(()=>Math.random()-.5);renderHud()}
function renderHud(){$('score').textContent='SCORE '+String(score).padStart(4,'0');$('lives').textContent='♥ '.repeat(lives).trim();$('prompt').textContent=sentences[sentence%sentences.length][0];$('progress').textContent='MAZE '+mazeNum+' · SENTENCE '+(sentence+1);$('slots').replaceChildren(...words().map((w,i)=>{let d=document.createElement('span');d.className='slot'+(i<word?' done':'');d.textContent=i<word?w:'?';return d}))}
function say(t,after){if(!sound||!('speechSynthesis'in window))return;try{speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(t);u.lang=currentLanguage;u.rate=.9;if(after)u.onend=()=>{if(sound){let full=new SpeechSynthesisUtterance(after);full.lang=currentLanguage;full.rate=.9;speechSynthesis.speak(full)}};speechSynthesis.speak(u)}catch(e){}}
function finishSentenceSpeech(token){
 if(token!==completionToken||transition<=0)return;
 if(completionFallback!==null){clearTimeout(completionFallback);completionFallback=null}
 // Give students a moment to finish reading before the next maze fades in.
 transition=.85;wordFlashTimer=Math.max(wordFlashTimer,.85);flashDuration=Math.max(flashDuration,.85);
}
function sayCompletedSentence(lastWord,fullSentence){
 const token=++completionToken;
 // The fallback handles muted sound, missing voices and browsers that never fire onend.
 if(completionFallback!==null)clearTimeout(completionFallback);
 if(!sound||!('speechSynthesis' in window)){
   completionFallback=setTimeout(()=>finishSentenceSpeech(token),3000);return;
 }
 try{
  speechSynthesis.cancel();
  const last=new SpeechSynthesisUtterance(lastWord);
  last.lang=currentLanguage;last.rate=.9;
  const full=new SpeechSynthesisUtterance(fullSentence);
  full.lang=currentLanguage;full.rate=.9;
  last.onend=()=>{if(token===completionToken){speechSynthesis.speak(full)}};
  last.onerror=()=>{if(token===completionToken){speechSynthesis.speak(full)}};
  full.onend=()=>finishSentenceSpeech(token);
  full.onerror=()=>finishSentenceSpeech(token);
  speechSynthesis.speak(last);
  completionFallback=setTimeout(()=>finishSentenceSpeech(token),16000);
 }catch(e){completionFallback=setTimeout(()=>finishSentenceSpeech(token),3000)}
}
function notice(t,seconds=1.3){$('msg').textContent=t;messageTimer=seconds}
function restart(){completionToken++;if(completionFallback!==null){clearTimeout(completionFallback);completionFallback=null}if('speechSynthesis' in window)speechSynthesis.cancel();sentence=0;word=0;score=0;lives=3;mazeNum=1;freeze=0;invuln=0;paused=false;over=false;transition=0;blocked=0;collectionFreeze=0;wordFlash='';wordFlashTimer=0;respawnGhost=null;mazeFade=0;flashAge=0;flashDuration=0;last=0;acc=0;ghostAcc=0;keys={};heldDirections=[];boostHeld=false;layout();spawn();$('overlay').classList.remove('on');$('pause').textContent='PAUSE';notice(portraitMaze?'USE THE ARROWS TO MOVE':'HOLD ARROWS / WASD TO MOVE',3)}
function end(){over=true;$('overlay').classList.add('on');$('overlayTitle').textContent='GAME OVER';$('overlayText').textContent='SCORE '+score+' · '+sentence+' SENTENCES COMPLETED'}
function hurt(label){if(invuln>0||transition>0)return;lives--;invuln=2.3;notice('NOPE! '+label+' · −1 LIFE',1.5);if(lives<=0)end();renderHud()}
function touch(){let k=key(player.x,player.y);if(dots.delete(k))score+=1;if(pellets.delete(k)){score+=5;freeze=5;notice('POWER PELLET · GHOSTS FROZEN!',1.5)}if(blocked>0||collectionFreeze>0)return;for(let g of ghosts){if(g.x!==player.x||g.y!==player.y)continue;if(g.correct){let collectedWord=words()[word];score+=20;word++;blocked=.2;collectionFreeze=1.05;wordFlash=collectedWord;wordFlashTimer=.95;flashAge=0;flashDuration=.95;ghosts=ghosts.filter(other=>other!==g);respawnGhost=g;if(word>=words().length){let spoken=sentences[sentence%sentences.length][1];notice('✓ '+spoken,2.1);wordFlash=spoken;wordFlashTimer=9999;flashAge=0;flashDuration=9999;transition=9999;sayCompletedSentence(collectedWord,spoken);score+=50}else{say(collectedWord);notice('✓ '+collectedWord,.7)}renderHud();return}else{hurt(g.label);return}}}
function restoreGhost(){if(!respawnGhost)return;let g=respawnGhost;respawnGhost=null;let occupied=ghosts.some(h=>h.x===g.x&&h.y===g.y)||(player.x===g.x&&player.y===g.y);if(occupied){let tiles=freeTiles().filter(t=>Math.abs(t.x-player.x)+Math.abs(t.y-player.y)>6&&!ghosts.some(h=>h.x===t.x&&h.y===t.y));if(tiles.length){let t=pick(tiles);g.x=t.x;g.y=t.y}}ghosts.push(g);labels()}
function nextSentence(){mazeFade=.28;respawnGhost=null;collectionFreeze=0;wordFlash='';wordFlashTimer=0;sentence++;word=0;transition=0;mazeNum++;layout();spawn();notice('NEW MAZE!',1.5);renderHud()}
function wrapPosition(x,y){if(y===Math.floor(R/2)&&x<0)return {x:C-1,y};if(y===Math.floor(R/2)&&x>=C)return {x:0,y};return {x,y}}
function adj(p){return dirs.filter(d=>{let n=wrapPosition(p.x+d.x,p.y+d.y);return valid(n.x,n.y)})}
function activeDirection(){for(let i=heldDirections.length-1;i>=0;i--){let d=heldDirections[i];if(keys[d])return keyDirections[d]}return null}

function stepPlayer(){if(transition>0)return;let d=activeDirection();if(!d)return;let options=adj(player);if(!options.some(v=>v.x===d.x&&v.y===d.y))return;let n=wrapPosition(player.x+d.x,player.y+d.y);player.x=n.x;player.y=n.y;player.dir=d;touch()}
function stepGhost(g){let opts=adj(g);if(!opts.length)return;let back=opts.filter(d=>d.x!==-g.dir.x||d.y!==-g.dir.y);if(back.length)opts=back;let choice;if(g.chase&&Math.random()<.48){let best=Math.min(...opts.map(d=>Math.abs(g.x+d.x-player.x)+Math.abs(g.y+d.y-player.y)));choice=pick(opts.filter(d=>Math.abs(g.x+d.x-player.x)+Math.abs(g.y+d.y-player.y)===best))}else choice=opts.find(d=>d.x===g.dir.x&&d.y===g.dir.y&&Math.random()<.55)||pick(opts);let n=wrapPosition(g.x+choice.x,g.y+choice.y);g.x=n.x;g.y=n.y;g.dir=choice}
// Render only exposed maze boundaries: the collision grid is unchanged.
// Connected outlines are cached per maze, so the walls do not flicker or shift.
const chamberX=portraitMaze?3:11,chamberY=portraitMaze?10:7,chamberW=portraitMaze?9:11;let wallArt=null;
function buildWallArt(){
 const art=document.createElement('canvas');art.width=cv.width;art.height=cv.height;
 const g=art.getContext('2d');
 const isWall=(x,y)=>x>=0&&y>=0&&x<C&&y<R&&maze[y][x]==='#';
 // For each exposed edge, trace a pair of parallel contours inside the wall.
 // Drawing all segments in one path prevents visible tile-by-tile rectangles.
 for(const inset of [5,11]){
  g.beginPath();
  for(let y=0;y<R;y++)for(let x=0;x<C;x++)if(isWall(x,y)){
   const l=x*S,r=(x+1)*S,t=y*S,b=(y+1)*S;
   if(!isWall(x,y-1)){g.moveTo(l,t+inset);g.lineTo(r,t+inset)}
   if(!isWall(x,y+1)){g.moveTo(l,b-inset);g.lineTo(r,b-inset)}
   if(!isWall(x-1,y)){g.moveTo(l+inset,t);g.lineTo(l+inset,b)}
   if(!isWall(x+1,y)){g.moveTo(r-inset,t);g.lineTo(r-inset,b)}
  }
  g.lineCap='round';g.lineJoin='round';
  g.shadowColor='#009dff';g.shadowBlur=inset===5?11:6;
  g.strokeStyle=inset===5?'#159eff':'#71ddff';g.lineWidth=inset===5?3:1.7;g.stroke();
  g.shadowBlur=0;
 }
 return art;
}
function draw(){ctx.fillStyle='#050b1b';ctx.fillRect(0,0,cv.width,cv.height);if(!wallArt)wallArt=buildWallArt();ctx.drawImage(wallArt,0,0);for(let k of dots){let [x,y]=k.split(',').map(Number);ctx.fillStyle='#9aafc9';ctx.fillRect(x*S+15,y*S+15,3,3)}for(let k of pellets){let [x,y]=k.split(',').map(Number);ctx.fillStyle='#ffe26e';ctx.beginPath();ctx.arc(x*S+16,y*S+16,6,0,7);ctx.fill()}for(let g of ghosts){let x=g.x*S+16,y=g.y*S+16;ctx.save();ctx.globalAlpha=collectionFreeze>0?.3:(freeze>0?.6:1);ctx.fillStyle=g.color;ctx.beginPath();ctx.arc(x,y-4,15,Math.PI,0);ctx.lineTo(x+15,y+12);for(let i=0;i<4;i++)ctx.lineTo(x+15-i*10,y+8+(i%2)*6);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x-9,y-7,7,8);ctx.fillRect(x+4,y-7,7,8);ctx.fillStyle='#11223c';ctx.fillRect(x-6,y-4,3,4);ctx.fillRect(x+6,y-4,3,4);ctx.restore();ctx.save();ctx.globalAlpha=collectionFreeze>0?.3:1;ctx.font='bold 20px Courier New';let w=Math.max(110,Math.min(205,ctx.measureText(g.label).width+28)),lx=Math.max(4,Math.min(cv.width-w-4,x-w/2)),ly=0;
// Prefer a word tag ABOVE its ghost. Keep the central sentence chamber clear.
// The label is a visual overlay; it never changes the maze collision grid.
const chamber={left:chamberX*S-7,right:(chamberX+chamberW)*S+7,top:chamberY*S-7,bottom:(chamberY+5)*S+7};
const candidates=[
 {x:lx,y:y-60}, // directly above the ghost
 {x:Math.max(4,Math.min(cv.width-w-4,x+24)),y:y-55},
 {x:Math.max(4,Math.min(cv.width-w-4,x-w-24)),y:y-55},
 {x:Math.max(4,Math.min(cv.width-w-4,x-w/2)),y:y+21}
];
function overlap(a){return Math.max(0,Math.min(a.x+w+4,chamber.right)-Math.max(a.x-4,chamber.left))*Math.max(0,Math.min(a.y+38,chamber.bottom)-Math.max(a.y-4,chamber.top))}
let best=null,bestScore=Infinity;
for(let i=0;i<candidates.length;i++){
 const a=candidates[i],clampedY=Math.max(4,Math.min(cv.height-40,a.y));
 const outside=Math.abs(clampedY-a.y)*150;
 const score=overlap({x:a.x,y:clampedY})*100+outside+i*25;
 if(score<bestScore){bestScore=score;best={x:a.x,y:clampedY}}
}
lx=best.x;ly=best.y;ctx.fillStyle='#101b30';ctx.fillRect(lx-3,ly-3,w+6,38);ctx.fillStyle='#263a55';ctx.fillRect(lx,ly,w,32);ctx.strokeStyle=g.color;ctx.lineWidth=2.5;ctx.strokeRect(lx+1,ly+1,w-2,30);ctx.fillStyle='#f5f8ff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(g.label,lx+w/2,ly+16,w-12);ctx.restore()}if(player){let x=player.x*S+16,y=player.y*S+16;ctx.save();if(invuln>0&&Math.floor(invuln*9)%2===0)ctx.globalAlpha=.3;let ang=player.dir.x===1?0:player.dir.x===-1?Math.PI:player.dir.y===-1?-Math.PI/2:Math.PI/2;ctx.fillStyle='#ffe24c';ctx.beginPath();ctx.moveTo(x,y);ctx.arc(x,y,15,ang+.38,ang+Math.PI*2-.38);ctx.closePath();ctx.fill();ctx.restore()}// Sentence chamber: drawn exactly over the solid island, never a walkable tile.
{const cx=chamberX*S,cy=chamberY*S,cw=chamberW*S,ch=5*S;
ctx.save();ctx.fillStyle='#0c1b31';ctx.fillRect(cx+2,cy+2,cw-4,ch-4);
function roundedOutline(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.stroke()}
ctx.shadowColor='#009dff';ctx.shadowBlur=12;ctx.strokeStyle='#159eff';ctx.lineWidth=3;roundedOutline(cx+4,cy+4,cw-8,ch-8,13);
ctx.shadowBlur=5;ctx.strokeStyle='#71ddff';ctx.lineWidth=1.7;roundedOutline(cx+11,cy+11,cw-22,ch-22,9);ctx.shadowBlur=0;
ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#a4c5e2';ctx.font='bold 13px Courier New';
ctx.fillText('BUILD YOUR SENTENCE',cx+cw/2,cy+22);
// Arrange words in one or two lines. Adjust type size for longer phrases.
let tokens=words().map((w,i)=>({label:i<word?w:'?',done:i<word}));
let font=19,lines=[];
function wrapTokens(){ctx.font='bold '+font+'px Courier New';lines=[];let line=[],used=0;
for(let token of tokens){let tw=Math.max(30,ctx.measureText(token.label).width+18);if(line.length&&used+tw+5>cw-32){lines.push(line);line=[];used=0}line.push({...token,w:tw});used+=tw+5}if(line.length)lines.push(line)}
wrapTokens();while(lines.length>2&&font>12){font--;wrapTokens()}
let y0=cy+43;for(let row=0;row<Math.min(2,lines.length);row++){
let items=lines[row],total=items.reduce((a,t)=>a+t.w+5,0)-5,x=cx+(cw-total)/2,y=y0+row*29;
for(let item of items){ctx.fillStyle=item.done?'#194643':'#1d304c';ctx.fillRect(x,y,item.w,25);
ctx.strokeStyle=item.done?'#6ce4bd':'#5a7496';ctx.strokeRect(x+.5,y+.5,item.w-1,24);
ctx.fillStyle=item.done?'#e5fff4':'#b2c7de';ctx.font='bold '+font+'px Courier New';ctx.fillText(item.label,x+item.w/2,y+13,item.w-9);x+=item.w+5}}
// English prompt lives directly underneath the word slots inside the chamber.
let prompt=sentences[sentence%sentences.length][0];let promptY=cy+ch-37;
ctx.fillStyle='#1e3450';ctx.fillRect(cx+17,promptY-16,cw-34,35);
ctx.strokeStyle='#4c6b90';ctx.strokeRect(cx+17.5,promptY-15.5,cw-35,34);
let pfont=21;ctx.font='bold '+pfont+'px Courier New';while(ctx.measureText(prompt).width>cw-57&&pfont>13){pfont--;ctx.font='bold '+pfont+'px Courier New'}
ctx.fillStyle='#f1f7ff';ctx.fillText(prompt,cx+cw/2,promptY+2,cw-54);ctx.restore()}

if(wordFlashTimer>0&&wordFlash){ctx.save();ctx.font='bold 44px Courier New';ctx.textAlign='center';ctx.textBaseline='middle';let w=Math.min(cv.width-40,Math.max(160,ctx.measureText(wordFlash).width+62));let x=cv.width/2,y=cv.height/2;let pop=1+0.12*Math.max(0,1-flashAge/.16);let alpha=transition>10?Math.min(1,flashAge/.08):Math.min(1,flashAge/.08,wordFlashTimer/.18);ctx.globalAlpha=Math.max(0,alpha);ctx.translate(x,y);ctx.scale(pop,pop);ctx.fillStyle='#162b46';ctx.fillRect(-w/2,-36,w,72);ctx.strokeStyle='#6ce4c9';ctx.lineWidth=3;ctx.strokeRect(-w/2,-36,w,72);ctx.fillStyle='#f6fbff';ctx.fillText(wordFlash,0,0,w-28);ctx.restore()}if(mazeFade>0){ctx.save();ctx.fillStyle='rgba(5,11,27,'+(mazeFade/.28*.75)+')';ctx.fillRect(0,0,cv.width,cv.height);ctx.restore()}if(paused){ctx.fillStyle='#071123c9';ctx.fillRect(0,0,cv.width,cv.height);ctx.font='bold 46px Courier New';ctx.fillStyle='#a8f0ff';ctx.textAlign='center';ctx.fillText('PAUSED',cv.width/2,cv.height/2)}}
function frame(t){if(disposed)return;rafId=requestAnimationFrame(frame);if(!started)return;if(!last)last=t;let dt=Math.min(.05,(t-last)/1000);last=t;if(!paused&&!over){freeze=Math.max(0,freeze-dt);invuln=Math.max(0,invuln-dt);blocked=Math.max(0,blocked-dt);wordFlashTimer=Math.max(0,wordFlashTimer-dt);if(wordFlashTimer>0)flashAge+=dt;mazeFade=Math.max(0,mazeFade-dt);if(collectionFreeze>0){collectionFreeze=Math.max(0,collectionFreeze-dt);if(collectionFreeze===0&&transition<=0)restoreGhost()}if(messageTimer>0){messageTimer-=dt;if(messageTimer<=0)notice(portraitMaze?'USE THE ARROWS TO MOVE':'HOLD ARROWS / WASD TO MOVE',100)}if(transition>0){transition-=dt;if(transition<=0)nextSentence()}else{acc+=dt;ghostAcc+=dt;const playerInterval=.105,ghostInterval=.58;while(acc>=playerInterval){acc-=playerInterval;stepPlayer();if(over||transition>0)break}if(!over&&transition<=0&&freeze<=0&&collectionFreeze<=0){while(ghostAcc>=ghostInterval){ghostAcc-=ghostInterval;for(let g of ghosts)stepGhost(g);touch();if(over||transition>0)break}}else if(freeze>0||collectionFreeze>0){ghostAcc=0}}}draw()}
const keyDirections={ArrowUp:dirs[3],ArrowDown:dirs[2],ArrowLeft:dirs[1],ArrowRight:dirs[0],KeyW:dirs[3],KeyS:dirs[2],KeyA:dirs[1],KeyD:dirs[0]};
window.addEventListener('keydown',e=>{if(!started)return;if(keyDirections[e.code]){e.preventDefault();if(!keys[e.code])heldDirections.push(e.code);keys[e.code]=true;}if(e.code==='Space'){e.preventDefault();}if(e.code==='KeyP'&&!e.repeat){e.preventDefault();toggle();}});
window.addEventListener('keyup',e=>{if(!started)return;if(keyDirections[e.code]){e.preventDefault();keys[e.code]=false;heldDirections=heldDirections.filter(k=>k!==e.code);}if(e.code==='Space'){e.preventDefault();}});
window.addEventListener('blur',()=>{keys={};heldDirections=[];boostHeld=false;});
function toggle(){if(over)return;paused=!paused;$('pause').textContent=paused?'RESUME':'PAUSE'}$('pause').onclick=toggle;$('restart').onclick=restart;$('again').onclick=restart;$('sound').onclick=()=>{sound=!sound;$('sound').textContent=sound?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-pressed',String(sound));if(!sound&&'speechSynthesis'in window){speechSynthesis.cancel();if(transition>10)finishSentenceSpeech(completionToken)}};rafId=requestAnimationFrame(frame);
// Hold-to-move touch controls; the original keyboard movement engine is unchanged.
const mobileDirections={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};
for(const button of document.querySelectorAll('#mobileDpad button')){
 const code=mobileDirections[button.dataset.dir];
 const release=()=>{delete keys[code];heldDirections=heldDirections.filter(k=>k!==code)};
 button.addEventListener('pointerdown',e=>{e.preventDefault();if(!started)return;button.setPointerCapture(e.pointerId);release();keys[code]=true;heldDirections.push(code)},{passive:false});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,release);
}
let swipeStart=null;
cv.addEventListener('pointerdown',e=>{if(!portraitMaze)return;swipeStart={x:e.clientX,y:e.clientY}});
cv.addEventListener('pointerup',e=>{if(!portraitMaze||!swipeStart)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;swipeStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;const code=Math.abs(dx)>Math.abs(dy)?(dx>0?'ArrowRight':'ArrowLeft'):(dy>0?'ArrowDown':'ArrowUp');keys={};heldDirections=[code];keys[code]=true;});

function stop(){completionToken++;clearTimeout(completionFallback);completionFallback=null;if('speechSynthesis'in window)speechSynthesis.cancel();paused=true;keys={};heldDirections=[];boostHeld=false;}
$('play').onclick=()=>{started=true;$('preview').hidden=true;$('app').hidden=false;restart();$('pause').focus()};
$('menuReturn').onclick=()=>{stop();started=false;$('app').hidden=true;$('preview').hidden=false;$('play').focus()};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!paused){toggle();keys={};heldDirections=[]}});
window.addEventListener('pagehide',()=>{stop();disposed=true;cancelAnimationFrame(rafId)},{once:true});
})();
