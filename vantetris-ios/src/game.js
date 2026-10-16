const W=10,H=20;
const SH=[{m:[[1,1,1,1]],c:'#00e5ff'},{m:[[1,1],[1,1]],c:'#ffd60a'},{m:[[0,1,0],[1,1,1]],c:'#bf5af2'},
{m:[[1,0,0],[1,1,1]],c:'#0a84ff'},{m:[[0,0,1],[1,1,1]],c:'#ff9f0a'},{m:[[0,1,1],[1,1,0]],c:'#30d158'},{m:[[1,1,0],[0,1,1]],c:'#ff453a'}];
const rot=m=>m[0].map((_,i)=>m.map(r=>r[i]).reverse());
let board,cur,nxt,bag=[],score,lines,over,auto=false,hint=null,plan=null,acc=0,last=0,aiT=0;
const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d'),nx=$('nx'),nctx=nx.getContext('2d');
let S=24;

function size(){
  const vh=(window.visualViewport?visualViewport.height:innerHeight),vw=innerWidth;
  S=Math.max(14,Math.min(Math.floor((vw-20)/W),Math.floor((vh-230)/H),34));
  const d=devicePixelRatio||1;
  cv.width=W*S*d;cv.height=H*S*d;cv.style.width=W*S+'px';cv.style.height=H*S+'px';
  ctx.setTransform(d,0,0,d,0,0);draw();
}
function draw1(g,x,y,c,s,a=1){g.globalAlpha=a;g.fillStyle=c;g.fillRect(x*s+1,y*s+1,s-2,s-2);g.globalAlpha=1}
function pick(){if(!bag.length){bag=SH.map((_,i)=>i);for(let i=bag.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[bag[i],bag[j]]=[bag[j],bag[i]]}}
  const s=SH[bag.pop()];return{m:s.m.map(r=>[...r]),c:s.c,x:0,y:0,r:0}}
function spawn(p){p.x=Math.floor(W/2)-Math.ceil(p.m[0].length/2);p.y=0;p.r=0;return p}
function hit(m,x,y,b=board){for(let i=0;i<m.length;i++)for(let j=0;j<m[i].length;j++)if(m[i][j]){
  const X=x+j,Y=y+i;if(X<0||X>=W||Y>=H||(Y>=0&&b[Y][X]))return true}return false}
function merge(b,m,x,y,c){for(let i=0;i<m.length;i++)for(let j=0;j<m[i].length;j++)if(m[i][j]&&y+i>=0)b[y+i][x+j]=c}
function sweep(b){const k=b.filter(r=>r.some(v=>!v));const n=H-k.length;return{b:[...Array.from({length:n},()=>Array(W).fill(null)),...k],n}}

// --- IA (port JS de l'heuristique : lignes, trous, hauteur, irrégularité) ---
function evalB(b,n){const h=Array(W).fill(0);let holes=0;
  for(let x=0;x<W;x++){let seen=false;for(let y=0;y<H;y++){if(b[y][x]){if(!seen){h[x]=H-y;seen=true}}else if(seen)holes++}}
  const agg=h.reduce((a,v)=>a+v,0);let bump=0;for(let x=0;x<W-1;x++)bump+=Math.abs(h[x]-h[x+1]);
  return -0.51*agg+0.76*n-0.36*holes-0.18*bump}
function best(p){let bs=-1e9,res=null,m=p.m;
  for(let r=0;r<4;r++,m=rot(m)){for(let x=0;x<=W-m[0].length;x++){
    if(hit(m,x,0))continue;let y=0;while(!hit(m,x,y+1))y++;
    const b=board.map(r=>[...r]);merge(b,m,x,y,'#fff');const s=sweep(b);const sc=evalB(s.b,s.n);
    if(sc>bs){bs=sc;res={r,x,y,m}}}}
  return res}

function lock(){merge(board,cur.m,cur.x,cur.y,cur.c);const s=sweep(board);board=s.b;
  if(s.n){lines+=s.n;score+=[0,100,300,500,800][s.n]*level()}
  score+=10;cur=spawn(nxt);nxt=pick();hint=null;plan=null;
  if(hit(cur.m,cur.x,cur.y)){over=true;$('msg').style.display='flex'}ui()}
const level=()=>1+Math.floor(lines/10);
function move(d){if(over)return;if(!hit(cur.m,cur.x+d,cur.y))cur.x+=d}
function down(){if(over)return false;if(!hit(cur.m,cur.x,cur.y+1)){cur.y++;return true}lock();return false}
function drop(){if(over)return;while(!hit(cur.m,cur.x,cur.y+1))cur.y++,score+=1;lock()}
function turn(){if(over)return false;const m=rot(cur.m);for(const k of[0,-1,1,-2,2])if(!hit(m,cur.x+k,cur.y)){cur.m=m;cur.x+=k;cur.r=(cur.r+1)%4;return true}return false}
function ui(){$('sc').textContent=score;$('ln').textContent=lines;$('lv').textContent=level();
  nctx.clearRect(0,0,64,40);const o=nxt.m,s=12;o.forEach((r,i)=>r.forEach((v,j)=>v&&draw1(nctx,j+(64/s-o[0].length)/2,i+(40/s-o.length)/2,nxt.c,s)))}

function draw(){
  const g=ctx;g.clearRect(0,0,W*S,H*S);
  board.forEach((r,y)=>r.forEach((c,x)=>c&&draw1(g,x,y,c,S)));
  if(hint){hint.m.forEach((r,i)=>r.forEach((v,j)=>v&&draw1(g,hint.x+j,hint.y+i,'#fff',S,.45)))}
  if(cur&&!over){let gy=cur.y;while(!hit(cur.m,cur.x,gy+1))gy++;
    cur.m.forEach((r,i)=>r.forEach((v,j)=>v&&draw1(g,cur.x+j,gy+i,cur.c,S,.18)));
    cur.m.forEach((r,i)=>r.forEach((v,j)=>v&&draw1(g,cur.x+j,cur.y+i,cur.c,S)))}
}

function aiStep(){ if(!auto||over)return;
  if(!plan){plan=best(cur);if(!plan)return}
  if(cur.r!==plan.r){if(!turn()){plan.r=cur.r}return}
  if(cur.x<plan.x)move(1);else if(cur.x>plan.x)move(-1);else drop()}

function loop(t){
  const dt=t-last;last=t;
  if(!over){acc+=dt;const sp=Math.max(90,800-(level()-1)*70);
    if(acc>=sp){acc=0;down()}
    if(auto){aiT+=dt;if(aiT>70){aiT=0;aiStep()}}}
  draw();requestAnimationFrame(loop)}

function start(){board=Array.from({length:H},()=>Array(W).fill(null));bag=[];score=0;lines=0;over=false;hint=null;plan=null;
  cur=spawn(pick());nxt=pick();$('msg').style.display='none';ui()}

// --- Contrôles : boutons (avec répétition), gestes, clavier ---
function hold(id,fn){const b=$(id);let t,i;
  const stop=()=>{clearTimeout(t);clearInterval(i)};
  b.addEventListener('pointerdown',e=>{e.preventDefault();fn();if(id==='bh'||id==='brot')return;t=setTimeout(()=>i=setInterval(fn,60),180)});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,stop))}
hold('bl',()=>move(-1));hold('br',()=>move(1));hold('bd',()=>{if(down())score++});hold('brot',turn);hold('bh',drop);
$('hint').onclick=()=>{if(!over)hint=best(cur)};
$('auto').onclick=e=>{auto=!auto;plan=null;e.currentTarget.classList.toggle('on',auto)};
$('rs').onclick=$('again').onclick=start;

let sx,sy,sT,lx,moved;
cv.addEventListener('pointerdown',e=>{sx=lx=e.clientX;sy=e.clientY;sT=performance.now();moved=false;cv.setPointerCapture(e.pointerId)});
cv.addEventListener('pointermove',e=>{if(sx==null)return;const dx=e.clientX-lx;
  if(Math.abs(dx)>=S){const n=Math.trunc(dx/S);for(let i=0;i<Math.abs(n);i++)move(Math.sign(n));lx+=n*S;moved=true}});
cv.addEventListener('pointerup',e=>{if(sx==null)return;const dy=e.clientY-sy,dt=performance.now()-sT;
  if(!moved){if(dy>S*3&&dt<350)drop();else if(Math.abs(dy)<10&&Math.abs(e.clientX-sx)<10)turn();else if(dy>S)down()}
  sx=null});
addEventListener('keydown',e=>{const k=e.key;
  if(k==='ArrowLeft')move(-1);else if(k==='ArrowRight')move(1);else if(k==='ArrowDown')down();
  else if(k==='ArrowUp')turn();else if(k===' '){e.preventDefault();hint=best(cur)}else return;e.preventDefault()});
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
addEventListener('resize',size);if(window.visualViewport)visualViewport.addEventListener('resize',size);

start();size();requestAnimationFrame(t=>{last=t;loop(t)});
