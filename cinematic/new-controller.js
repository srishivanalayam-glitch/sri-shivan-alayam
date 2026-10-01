const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const scenes=[...document.querySelectorAll('.scene')],ids=['space','clouds','temple','enter','sanctum','explore'],titles=['Beyond the horizon','Through the clouds','The sacred approach','At the threshold','In the presence of Shiva','A place for every soul'];
let current=0,playing=false,elapsed=0,last=performance.now(),lock=0,opening=false,doorElapsed=0;
let flight=null,cameraTime=0,motionPaused=false;
const veil=document.createElement("div");veil.className="flight-veil";veil.setAttribute("aria-hidden","true");veil.innerHTML="<div class=cloud-bank></div><div class=cloud-bank></div><div class=cloud-bank></div>";document.querySelector("main").append(veil);
const play=document.querySelector('#play'),progress=document.querySelector('.scene-progress span'),doorScene=document.querySelector('#enter');
const doorStage=document.createElement('div');doorStage.className='door-stage';doorStage.setAttribute('aria-hidden','true');
doorStage.innerHTML='<img class="door-reveal" src="cinematic/new-assets/sanctum.webp" alt=""><div class="door-leaf left"><img src="cinematic/new-assets/doors.webp" alt=""></div><div class="door-leaf right"><img src="cinematic/new-assets/doors.webp" alt=""></div><div class="threshold-light"></div>';
doorScene.prepend(doorStage);
function stop(){playing=false;play.textContent='Play';play.setAttribute('aria-label','Play journey');}
function setScene(n){cameraTime=0;current=Math.max(0,Math.min(5,n));elapsed=0;opening=false;doorElapsed=0;doorScene.style.setProperty('--door',0);doorScene.classList.remove('opening');document.body.dataset.scene=ids[current];scenes.forEach((s,i)=>{s.classList.toggle('active',i===current);s.inert=i!==current;s.setAttribute('aria-hidden',String(i!==current));});document.body.classList.toggle('at-end',current===5);document.querySelector('.explore').inert=current!==5;document.querySelector('#scene-label').textContent=`0${current+1} / 06 — ${titles[current]}`;document.querySelector('#previous').disabled=current===0;document.querySelector('#next').disabled=current===5;document.querySelectorAll('.stages a').forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});history.replaceState(null,'',`#${ids[current]}`);if(current===5)stop();}
function show(n){
 n=Math.max(0,Math.min(5,n));
 if(n===current||reduced.matches){flight=null;document.body.classList.remove('in-flight');setScene(n);return;}
 if(flight)return;
 motionPaused=false;document.documentElement.classList.remove('paused');
 const atmospheric=current<2&&n<3;
 flight={from:current,to:n,time:0,duration:atmospheric?3800:2600,switched:false,atmospheric};
 veil.classList.toggle('cloud-flight',atmospheric);document.body.classList.add('in-flight');
}
function start(){motionPaused=false;if(current===5)show(0);playing=true;document.documentElement.classList.remove('paused');play.textContent='Pause';play.setAttribute('aria-label','Pause journey');}
function openDoors(){if(reduced.matches){show(4);return;}opening=true;doorElapsed=0;doorScene.classList.add('opening');start();}
function next(){if(current===3)openDoors();else show(current+1);}
play.onclick=()=>{if(playing){stop();motionPaused=true;document.documentElement.classList.add('paused');}else start();};
document.querySelector('#next').onclick=()=>{stop();next();};document.querySelector('#previous').onclick=()=>{stop();show(current-1);};
document.querySelectorAll('a[href^="#"]:not([data-info]):not(.skip)').forEach(a=>a.addEventListener('click',e=>{const i=ids.indexOf(a.hash.slice(1));if(i<0)return;e.preventDefault();if(current===3&&i===4){openDoors();return;}show(i);if(a.closest('.hero-copy')&&!reduced.matches)start();}));
document.querySelector('.skip').onclick=e=>{e.preventDefault();stop();show(5);document.querySelector('.explore a').focus();};
document.addEventListener('keydown',e=>{if(dialog.open||e.target.closest('button,a'))return;if(['ArrowDown','ArrowRight','PageDown','ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();stop();if(['ArrowUp','ArrowLeft','PageUp'].includes(e.key))show(current-1);else next();}});
addEventListener('wheel',e=>{if(dialog.open||opening||flight||Math.abs(e.deltaY)<25||performance.now()<lock||e.target.closest('nav'))return;lock=performance.now()+1800;stop();if(e.deltaY>0)next();else show(current-1);},{passive:true});
let touchY=null;addEventListener('touchstart',e=>{touchY=e.target.closest('button,a,dialog,nav')?null:e.touches[0].clientY;},{passive:true});addEventListener('touchend',e=>{if(touchY===null||dialog.open||opening||flight)return;const delta=touchY-e.changedTouches[0].clientY;touchY=null;if(Math.abs(delta)>55){stop();if(delta>0)next();else show(current-1);}},{passive:true});
for(const [index,s]of scenes.entries()){const layer=document.createElement('div');layer.className='atmosphere';layer.setAttribute('aria-hidden','true');for(let i=0;i<(index===0?10:22);i++){const p=document.createElement('span');p.className='mote';p.style.cssText=`--x:${(i*37)%100}%;--duration:${12+(i%8)}s;--delay:-${i*.91}s`;layer.append(p);}s.append(layer);}
function camera(dt){
 if(reduced.matches||motionPaused||dialog.open||document.hidden)return;
 cameraTime+=dt;
 const t=Math.min(cameraTime/16000,1),ease=t*t*(3-2*t);
 const img=scenes[current].querySelector(':scope > img');
 let scale=1.04,x=0,y=0;
 if(current===0){scale=1.04+ease*.28;y= ease*4;x=-ease*2;}
 if(current===1){scale=1.1+ease*.4;y=-5+ease*10;}
 if(current===2){scale=1.03+ease*.38;y= ease*3;}
 if(current===4){scale=1.08+ease*.2;x=-2+ease*2;y= ease*1.5;}
 if(current===5){scale=1.12+ease*.08;x=3-ease*6;}
 if(flight&&!flight.switched){const f=flight.time/flight.duration;scale+=f*(flight.atmospheric?1.1:.5);y+=f*(flight.atmospheric?10:2);}
 img.style.transform=`translate3d(${x}%,${y}%,0) scale(${scale})`;
 scenes[current].style.setProperty('--camera',ease);
}
function tick(now){
 const dt=Math.min(now-last,100);last=now;camera(dt);
 if(!document.hidden&&!dialog.open&&!motionPaused){
  if(flight){
   flight.time+=dt;const t=Math.min(flight.time/flight.duration,1);
   veil.style.setProperty('--pass',t);veil.style.opacity=String(Math.pow(Math.sin(Math.PI*t),.65));
   if(t>=.5&&!flight.switched){flight.switched=true;setScene(flight.to);}
   if(t>=1){flight=null;veil.style.opacity=0;document.body.classList.remove('in-flight');}
  }else if(playing){
   if(opening){doorElapsed+=dt;const t=Math.min(doorElapsed/4200,1),eased=t*t*(3-2*t);doorScene.style.setProperty('--door',eased);if(t>=1)setScene(4);}
   else{elapsed+=dt;if(current===3&&elapsed>=6500)openDoors();else if(elapsed>=10000)show(current+1);}
  }
 }
 progress.style.width=`${Math.min(100,(current+(opening?doorElapsed/4200:elapsed/10000))/6*100)}%`;
 requestAnimationFrame(tick);
}requestAnimationFrame(tick);
reduced.onchange=()=>{if(reduced.matches){stop();if(flight){const target=flight.to;flight=null;setScene(target);veil.style.opacity=0;document.body.classList.remove('in-flight');}if(opening)setScene(4);scenes.forEach(s=>s.querySelector(':scope > img').style.transform='');}};
const initial=ids.indexOf(location.hash.slice(1));setScene(initial<0?0:initial);
document.querySelector('#restart').onclick=()=>{show(0);start();};
