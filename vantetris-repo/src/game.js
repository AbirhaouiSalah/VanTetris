const W=10,H=20,$=id=>document.getElementById(id);
const SH=[{m:[[1,1,1,1]],c:'#22e5ff'},{m:[[1,1],[1,1]],c:'#ffe14d'},{m:[[0,1,0],[1,1,1]],c:'#c77dff'},{m:[[1,0,0],[1,1,1]],c:'#4d8dff'},{m:[[0,0,1],[1,1,1]],c:'#ff9a3d'},{m:[[0,1,1],[1,1,0]],c:'#4dff9a'},{m:[[1,1,0],[0,1,1]],c:'#ff4d6d'}];
const rot=m=>m[0].map((_,i)=>m.map(r=>r[i]).reverse());
let board,cur,nxt,bag=[],score,lines,over,auto=false,hint=null,plan=null,acc=0,last=0,aiT=0,combo=0,mute=false,AC;
let stop=0,shake=0,fovK=0,mt=0,mutF=0,rt=0,evT=30,ev=null,evL=0,dist=40,fg=new Float32Array(W*H);
const level=()=>1+Math.floor(lines/8),MIV=()=>Math.max(1,3.4-(level()-1)*.25),RIV=()=>Math.max(12,34-(level()-1)*3),GRAV=()=>Math.max(70,750-(level()-1)*75);
const nctx=$('nx').getContext('2d');

// ---------- Son ----------
function tone(f,d,type='square',v=.12,to=0){if(mute||!AC)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d)}
function boom(p=1){if(mute||!AC)return;tone(150*p,.5,'sawtooth',.3,28);const b=AC.createBuffer(1,AC.sampleRate*.35,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const n=AC.createBufferSource(),g=AC.createGain();n.buffer=b;g.gain.value=.28*p;n.connect(g).connect(AC.destination);n.start()}
addEventListener('pointerdown',()=>{if(!AC)try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}if(AC&&AC.state==='suspended')AC.resume()},{passive:true});

// ---------- Scène 3D ----------
const R=new THREE.WebGLRenderer({canvas:$('gl'),antialias:true});R.setPixelRatio(Math.min(devicePixelRatio||1,2));R.setClearColor(0x0b0720);
const sc=new THREE.Scene();sc.fog=new THREE.FogExp2(0x0b0720,.012);
const cam=new THREE.PerspectiveCamera(48,1,.1,400);
sc.add(new THREE.AmbientLight(0x9988cc,.85));
const L1=new THREE.PointLight(0xffffff,1.2,90);L1.position.set(6,16,20);sc.add(L1);
const L2=new THREE.PointLight(0xff4d9d,1,70);L2.position.set(-10,4,12);sc.add(L2);
const L3=new THREE.PointLight(0x22e5ff,.8,70);L3.position.set(10,10,8);sc.add(L3);
const dummy=new THREE.Object3D(),col=new THREE.Color(),WHITE=new THREE.Color('#fff');
const boxG=new THREE.BoxGeometry(.92,.92,.92);
const inst=new THREE.InstancedMesh(boxG,new THREE.MeshPhongMaterial({shininess:90,specular:0x999999,emissive:0x1c1236}),260);
inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);inst.frustumCulled=false;inst.setColorAt(0,col.set('#fff'));sc.add(inst);
const gh=new THREE.InstancedMesh(boxG,new THREE.MeshBasicMaterial({transparent:true,opacity:.3,depthWrite:false}),8);gh.frustumCulled=false;gh.setColorAt(0,col);sc.add(gh);
const NDEB=520,deb=new THREE.InstancedMesh(new THREE.BoxGeometry(.3,.3,.3),new THREE.MeshBasicMaterial(),NDEB);deb.frustumCulled=false;deb.setColorAt(0,col);deb.count=0;sc.add(deb);
// cadre
const back=new THREE.Mesh(new THREE.PlaneGeometry(W+.4,H+.4),new THREE.MeshBasicMaterial({color:0x120a30,transparent:true,opacity:.75}));back.position.set(0,9.5,-.6);sc.add(back);
{const pts=[];for(let i=0;i<=W;i++)pts.push(i-5.5+.5-.5+.5,-.5,-.5,i-5.5+.5-.5+.5,H-.5,-.5);for(let j=0;j<=H;j++)pts.push(-5,j-.5,-.5,5,j-.5,-.5);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));sc.add(new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x7a5fe0,transparent:true,opacity:.3})))}
const railM=new THREE.MeshBasicMaterial({color:0xc9a0ff});
[[-5.2,9.5,.15,H+.5],[5.2,9.5,.15,H+.5]].forEach(([x,y,w,h])=>{const r=new THREE.Mesh(new THREE.BoxGeometry(w,h,1.1),railM);r.position.set(x,y,0);sc.add(r)});
const fl=new THREE.Mesh(new THREE.BoxGeometry(W+.6,.15,1.1),railM);fl.position.set(0,-.55,0);sc.add(fl);
const grid=new THREE.GridHelper(120,60,0xff4d9d,0x3a2a7a);grid.position.y=-.6;sc.add(grid);
// étoiles + formes flottantes
const sp=[];for(let i=0;i<700;i++){const r=60+Math.random()*120,a=Math.random()*6.283,b=Math.acos(2*Math.random()-1);sp.push(r*Math.sin(b)*Math.cos(a),r*Math.cos(b)*.7+20,r*Math.sin(b)*Math.sin(a)-30)}
const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));const stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:.7,fog:false}));sc.add(stars);
const floaters=[];for(let i=0;i<16;i++){const g=[new THREE.IcosahedronGeometry(1.6),new THREE.OctahedronGeometry(1.6),new THREE.TorusGeometry(1.4,.4,8,20)][i%3];
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xc77dff,wireframe:true}));const s=i%2?1:-1;m.position.set(s*(9+Math.random()*22),Math.random()*30,-8-Math.random()*40);m.userData={r:Math.random()*.8+.2,y0:m.position.y};floaters.push(m);sc.add(m)}

// ---------- FX ----------
const parts=[],fx=[],ringG=new THREE.RingGeometry(.8,1,48),beamG=new THREE.PlaneGeometry(W+1,1.2);
const add=(c)=>new THREE.MeshBasicMaterial({color:c,transparent:true,blending:THREE.AdditiveBlending,side:2,depthWrite:false});
function ring3(x,y,c,max,z=1){const m=new THREE.Mesh(ringG,add(c));m.position.set(x,y,z);sc.add(m);fx.push({m,l:1,max,k:'r'})}
function beam3(Y,c){const m=new THREE.Mesh(beamG,add(c));m.position.set(0,Y,1.3);sc.add(m);fx.push({m,l:1,k:'b'})}
function D(x,y,n,c,spd,life,s=1){for(let i=0;i<n&&parts.length<NDEB;i++){const a=Math.random()*6.283;parts.push({p:new THREE.Vector3(x,y,0),v:new THREE.Vector3(Math.cos(a)*spd*Math.random(),Math.abs(Math.sin(a))*spd*.7+spd*.2*Math.random(),(Math.random()*.9+.1)*spd*.9),l:life*(.6+Math.random()*.6),m:life,c:new THREE.Color(c),s:s*(.5+Math.random()),r:Math.random()*6})}}
const wp=(x,y)=>({x:x-4.5,y:H-1-y});
function pop(t,k,c){const d=document.createElement('div');d.className='pop';d.style.setProperty('--c',c);d.innerHTML=`<i>${k}</i><b>${t}</b>`;$('lay').appendChild(d);setTimeout(()=>d.remove(),1200)}
function flashO(v){$('flash').style.opacity=Math.min(.85,v)}

// ---------- Logique ----------
function pick(){if(!bag.length){bag=SH.map((_,i)=>i);for(let i=bag.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[bag[i],bag[j]]=[bag[j],bag[i]]}}const t=bag.pop(),s=SH[t];return{m:s.m.map(r=>[...r]),c:s.c,t,x:0,y:0,r:0}}
function spawn(p){p.x=Math.floor(W/2)-Math.ceil(p.m[0].length/2);p.y=0;p.r=0;mt=-MIV()*.4;return p}
function hit(m,x,y,b=board){for(let i=0;i<m.length;i++)for(let j=0;j<m[i].length;j++)if(m[i][j]){const X=x+j,Y=y+i;if(X<0||X>=W||Y>=H||(Y>=0&&b[Y][X]))return true}return false}
function merge(b,m,x,y,c){for(let i=0;i<m.length;i++)for(let j=0;j<m[i].length;j++)if(m[i][j]&&y+i>=0)b[y+i][x+j]=c}
function sweep(b){const k=b.filter(r=>r.some(v=>!v));const n=H-k.length;return{b:[...Array.from({length:n},()=>Array(W).fill(null)),...k],n}}
function evalB(b,n){const h=Array(W).fill(0);let holes=0;for(let x=0;x<W;x++){let s=false;for(let y=0;y<H;y++){if(b[y][x]){if(!s){h[x]=H-y;s=true}}else if(s)holes++}}
  const agg=h.reduce((a,v)=>a+v,0);let bump=0;for(let x=0;x<W-1;x++)bump+=Math.abs(h[x]-h[x+1]);return -0.51*agg+0.76*n-0.36*holes-0.18*bump}
function best(p){let bs=-1e9,res=null,m=p.m;for(let r=0;r<4;r++,m=rot(m)){for(let x=0;x<=W-m[0].length;x++){if(hit(m,x,0))continue;let y=0;while(!hit(m,x,y+1))y++;
  const b=board.map(r=>[...r]);merge(b,m,x,y,'#fff');const s=sweep(b);const sc2=evalB(s.b,s.n);if(sc2>bs){bs=sc2;res={r,x,y,m}}}}return res}

// Mutation : la pièce en chute se transforme en une autre forme
function mutate(){if(over||!cur)return;let t;do t=Math.random()*7|0;while(t===cur.t);const s=SH[t],m=s.m.map(r=>[...r]);const ox=cur.x+Math.floor((cur.m[0].length-m[0].length)/2);
  for(const[dx,dy]of[[0,0],[-1,0],[1,0],[0,-1],[-2,0],[2,0],[0,-2]])if(!hit(m,ox+dx,cur.y+dy)){
    cur.m.forEach((r,i)=>r.forEach((v,j)=>{if(v){const w=wp(cur.x+j,cur.y+i);D(w.x,w.y,3,cur.c,7,.6,.8);D(w.x,w.y,2,s.c,7,.6,.8)}}));
    cur={m,c:s.c,t,x:ox+dx,y:cur.y+dy,r:0};mutF=1;plan=null;hint=null;mt=0;tone(900,.25,'triangle',.12,200);
    const w=wp(cur.x+m[0].length/2-.5,cur.y);ring3(w.x,w.y,s.c,3.5);return}
  mt=0}
function rise(){if(board[0].some(Boolean)){over=true;explodeAll();return}board.shift();const h=Math.random()*W|0;board.push(Array.from({length:W},(_,x)=>x===h?null:'#6b6b8a'));
  while(hit(cur.m,cur.x,cur.y)&&cur.y>-2)cur.y--;if(hit(cur.m,cur.x,cur.y)){over=true;explodeAll();return}plan=null;hint=null;
  shake=Math.max(shake,.9);boom(1);tone(110,.4,'sawtooth',.2,40);pop('上昇!','RISING','#ff4d6d');for(let x=0;x<W;x++)D(x-4.5,0,2,'#ff4d6d',8,.6,.8)}

const NAMES=['','SINGLE','DOUBLE','TRIPLE','TETRIS'],KJ=['','斬','双斬','三連斬','必殺!!'],COL=['','#7df9ff','#ffe14d','#ff9a3d','#ff4d9d'];
function lock(hard){const{m,x,y,c}=cur;merge(board,m,x,y,c);
  m.forEach((r,i)=>r.forEach((v,j)=>{if(!v)return;if(y+i>=0)fg[(y+i)*W+x+j]=1;if(!(m[i+1]&&m[i+1][j])){const w=wp(x+j,y+i);D(w.x,w.y-.5,hard?10:2,c,hard?9:4,.6,.9);if(hard)ring3(w.x,w.y-.5,c,2.6)}}));
  shake=Math.max(shake,hard?.55:.12);fovK=Math.max(fovK,hard?.35:0);boom(hard?.5:.2);
  const full=[];board.forEach((r,yy)=>r.every(Boolean)&&full.push(yy));const n=full.length;
  if(n){full.forEach(yy=>{const Y=H-1-yy;beam3(Y,COL[n]);board[yy].forEach((cc,xx)=>D(xx-4.5,Y,n==4?10:5,cc,12+n*3,1.1,1.5));ring3(0,Y,'#fff',7+n*2,1.2)});
    combo++;const k=1+(combo-1)*.5;score+=Math.round([0,100,300,500,800][n]*level()*k);
    shake=Math.max(shake,.9+n*.5);fovK=Math.max(fovK,.6+n*.2);flashO(.25+n*.18);stop=.07+n*.045;boom(.8+n*.25);
    for(let i=0;i<n;i++)setTimeout(()=>tone(500+i*160,.18,'triangle',.15),i*70);
    pop(NAMES[n],KJ[n],COL[n]);if(combo>1)setTimeout(()=>pop('x'+combo+' COMBO','連鎖','#7df9ff'),260);
    if(n==4){flashO(1);stop=.3;shake=3;fovK=1.3;for(let i=0;i<3;i++)setTimeout(()=>ring3(0,9.5,['#ffe14d','#ff4d9d','#7df9ff'][i],20,2),i*110);boom(1.8)}
    const pl=level();lines+=n;if(level()>pl)setTimeout(()=>{pop('LEVEL UP','覚醒','#ffd60a');ring3(0,9.5,'#ffd60a',24,2);tone(300,.5,'sawtooth',.15,900);R.setClearColor(new THREE.Color().setHSL(((255+level()*16)%360)/360,.6,.05));floaters.forEach(f=>f.material.color.setHSL(((290+level()*20)%360)/360,.8,.6))},500);
    board=sweep(board).b}else combo=0;
  score+=10;cur=spawn(nxt);nxt=pick();hint=null;plan=null;
  if(hit(cur.m,cur.x,cur.y)){over=true;explodeAll()}ui()}
function explodeAll(){board.forEach((r,yy)=>r.forEach((c,xx)=>{if(c){const w=wp(xx,yy);D(w.x,w.y,3,c,16,1.4,1.5)}}));board=Array.from({length:H},()=>Array(W).fill(null));shake=3;fovK=1.5;flashO(.9);boom(2);stop=.2;setTimeout(()=>{$('msg').style.display='flex'},900)}
const mv=()=>ev==='mirror'?-1:1;
function move(d){if(over)return;if(!hit(cur.m,cur.x+d,cur.y)){cur.x+=d;tone(260,.04,'square',.05)}}
function inp(d){move(d*mv())}
function down(){if(over)return false;if(!hit(cur.m,cur.x,cur.y+1)){cur.y++;return true}lock(false);return false}
function drop(){if(over)return;while(!hit(cur.m,cur.x,cur.y+1))cur.y++,score++;lock(true)}
function turn(){if(over)return false;const m=rot(cur.m);for(const k of[0,-1,1,-2,2])if(!hit(m,cur.x+k,cur.y)){cur.m=m;cur.x+=k;cur.r=(cur.r+1)%4;tone(520,.05,'square',.06);return true}return false}
function ui(){$('sc').textContent=score;$('ln').textContent=lines;$('lv').textContent=level();$('cb').textContent=combo;
  nctx.clearRect(0,0,64,40);const o=nxt.m,s=12;o.forEach((r,i)=>r.forEach((v,j)=>{if(v){nctx.fillStyle=nxt.c;nctx.fillRect((j+(64/s-o[0].length)/2)*s+1,(i+(40/s-o.length)/2)*s+1,s-2,s-2)}}))}
function aiStep(){if(!auto||over)return;if(!plan){plan=best(cur);if(!plan)return}
  if(cur.r!==plan.r){if(!turn())plan.r=cur.r;return}if(cur.x<plan.x)move(1);else if(cur.x>plan.x)move(-1);else drop()}

// ---------- Rendu ----------
function size(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();
  const f=Math.tan(48*Math.PI/360),av=Math.max(.5,(h-270)/h);dist=Math.max(22.5/(2*f*av),13.5/(2*f*cam.aspect))}
function setC(m,i,c,k=0){col.set(c);if(k)col.lerp(WHITE,k);m.setColorAt(i,col)}
function put(m,i,x,y,s=1,z=0){dummy.position.set(x-4.5,H-1-y,z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(s);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)}
function render(t,fd){let n=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const c=board[y][x];if(!c)continue;const f=fg[y*W+x];if(f>0)fg[y*W+x]=Math.max(0,f-fd*5);put(inst,n,x,y,1+f*.3,f*.5);setC(inst,n,c,f);n++}
  let g=0;gh.count=0;
  if(cur&&!over){const warn=mt>MIV()-.7,blink=warn&&Math.floor(t/90)%2===0;const k=blink?.85:mutF*.8,sc2=1+mutF*.3+(warn?Math.sin(t/40)*.06:0);
    let gy=cur.y;while(!hit(cur.m,cur.x,gy+1))gy++;
    cur.m.forEach((r,i)=>r.forEach((v,j)=>{if(!v)return;put(inst,n,cur.x+j,cur.y+i,sc2,.3);setC(inst,n,cur.c,k);n++;
      if(ev!=='eclipse'){put(gh,g,cur.x+j,gy+i);setC(gh,g,cur.c);g++}}));
    if(hint&&ev!=='eclipse')hint.m.forEach((r,i)=>r.forEach((v,j)=>{if(v&&g<8){put(gh,g,hint.x+j,hint.y+i,.8);setC(gh,g,'#fff');g++}}))}
  mutF=Math.max(0,mutF-fd*3);inst.count=n;gh.count=g;inst.instanceMatrix.needsUpdate=true;inst.instanceColor.needsUpdate=true;gh.instanceMatrix.needsUpdate=true;gh.instanceColor.needsUpdate=true;
  // débris
  for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.l-=fd;if(q.l<=0)parts.splice(i,1)}
  deb.count=parts.length;parts.forEach((q,i)=>{q.v.y-=26*fd;q.p.addScaledVector(q.v,fd);if(q.p.y<-.4){q.p.y=-.4;q.v.y*=-.35;q.v.x*=.7;q.v.z*=.7}q.r+=fd*6;
    dummy.position.copy(q.p);dummy.rotation.set(q.r,q.r*.7,0);dummy.scale.setScalar(q.s*Math.min(1,q.l/q.m*2.2));dummy.updateMatrix();deb.setMatrixAt(i,dummy.matrix);deb.setColorAt(i,q.c)});
  if(parts.length){deb.instanceMatrix.needsUpdate=true;deb.instanceColor.needsUpdate=true}
  for(let i=fx.length-1;i>=0;i--){const o=fx[i];o.l-=fd*(o.k==='r'?2:3);if(o.l<=0){sc.remove(o.m);o.m.material.dispose();fx.splice(i,1);continue}
    o.m.material.opacity=o.l;if(o.k==='r'){const s=.5+o.max*Math.pow(1-o.l,.6);o.m.scale.set(s,s,1)}else o.m.scale.set(1,o.l*1.6,1)}
  stars.rotation.y+=fd*.01;floaters.forEach((f,i)=>{f.rotation.x+=fd*f.userData.r;f.rotation.y+=fd*f.userData.r*.8;f.position.y=f.userData.y0+Math.sin(t/1500+i)*2});
  const dim=ev==='eclipse';sc.fog.density+=((dim?.07:.012)-sc.fog.density)*Math.min(1,fd*4);L1.intensity+=((dim?.25:1.2)-L1.intensity)*Math.min(1,fd*4);
  const sh=shake*.5,cx=cur?(cur.x-4.5)*.35:0;
  cam.position.set(cx+Math.sin(t/2200)*1.2+(Math.random()-.5)*sh,14+Math.cos(t/2700)*.8+(Math.random()-.5)*sh,dist);cam.lookAt(0,9.5,0);
  cam.fov=48+fovK*9;cam.updateProjectionMatrix();fovK*=Math.exp(-6*fd);shake*=Math.exp(-7*fd);
  const f=+$('flash').style.opacity||0;if(f>0)$('flash').style.opacity=Math.max(0,f-fd*2.4);
  R.render(sc,cam)}

function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;const fd=stop>0?dt*.25:dt;
  if(stop>0)stop-=dt;else if(!over){
    acc+=dt*1000;if(acc>=GRAV()){acc=0;down()}
    mt+=dt;if(mt>=MIV())mutate();
    rt+=dt;if(rt>=RIV()){rt=0;rise()}
    if(auto){aiT+=dt*1000;if(aiT>70){aiT=0;aiStep()}}
    if(ev){evL-=dt;if(evL<=0){ev=null;$('ev').textContent=''}}else{evT-=dt;if(evT<=0){ev=Math.random()<.5?'mirror':'eclipse';evL=9;evT=26+Math.random()*14;hint=null;
      pop(ev==='mirror'?'MIRROR':'ECLIPSE',ev==='mirror'?'鏡':'蝕','#7df9ff');tone(400,.4,'sine',.15,100)}}
    if(ev)$('ev').textContent=(ev==='mirror'?'鏡 CONTRÔLES INVERSÉS ':'蝕 ÉCLIPSE ')+Math.ceil(evL)+'s'}
  $('mu').style.width=Math.max(0,Math.min(100,(mt+MIV()*.4)/(MIV()*1.4)*100))+'%';$('ri').style.width=Math.min(100,rt/RIV()*100)+'%';
  $('nx').style.opacity=ev==='eclipse'?.08:1;
  render(t,fd);requestAnimationFrame(loop)}
function start(){board=Array.from({length:H},()=>Array(W).fill(null));bag=[];score=0;lines=0;combo=0;over=false;hint=null;plan=null;rt=0;ev=null;evT=26;$('ev').textContent='';fg.fill(0);
  cur=spawn(pick());nxt=pick();$('msg').style.display='none';ui()}

// ---------- Contrôles ----------
function hold(id,fn){const b=$(id);let t,i;const st=()=>{clearTimeout(t);clearInterval(i)};
  b.addEventListener('pointerdown',e=>{e.preventDefault();fn();if(id==='bh'||id==='brot')return;t=setTimeout(()=>i=setInterval(fn,60),180)});
  ['pointerup','pointerleave','pointercancel'].forEach(ev2=>b.addEventListener(ev2,st))}
hold('bl',()=>inp(-1));hold('br',()=>inp(1));hold('bd',()=>{if(down())score++});hold('brot',turn);hold('bh',drop);
$('hint').onclick=()=>{if(!over&&ev!=='eclipse')hint=best(cur)};
$('auto').onclick=e=>{auto=!auto;plan=null;e.currentTarget.classList.toggle('on',auto)};
$('rs').onclick=$('again').onclick=start;
$('snd').onclick=e=>{mute=!mute;e.currentTarget.textContent=mute?'🔇':'🔊'};
const gl=$('gl');let sx,sy,sT,lx,moved;const PX=32;
gl.addEventListener('pointerdown',e=>{sx=lx=e.clientX;sy=e.clientY;sT=performance.now();moved=false;gl.setPointerCapture(e.pointerId)});
gl.addEventListener('pointermove',e=>{if(sx==null)return;const dx=e.clientX-lx;if(Math.abs(dx)>=PX){const n=Math.trunc(dx/PX);for(let i=0;i<Math.abs(n);i++)inp(Math.sign(n));lx+=n*PX;moved=true}});
gl.addEventListener('pointerup',e=>{if(sx==null)return;const dy=e.clientY-sy,dt=performance.now()-sT;
  if(!moved){if(dy>PX*3&&dt<350)drop();else if(Math.abs(dy)<10&&Math.abs(e.clientX-sx)<10)turn();else if(dy>PX)down()}sx=null});
addEventListener('keydown',e=>{const k=e.key;if(k==='ArrowLeft')inp(-1);else if(k==='ArrowRight')inp(1);else if(k==='ArrowDown')down();else if(k==='ArrowUp')turn();else if(k===' ')hint=best(cur);else if(k==='Enter')drop();else return;e.preventDefault()});
document.addEventListener('gesturestart',e=>e.preventDefault());document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
addEventListener('resize',size);if(window.visualViewport)visualViewport.addEventListener('resize',size);
start();size();requestAnimationFrame(t=>{last=t;loop(t)});
