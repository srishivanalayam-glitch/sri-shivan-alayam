'use strict';
document.documentElement.classList.add('enhanced');
const paths={temple:'M4 36h32M8 36V28h24v8M10 28v-6h20v6M12 22v-6h16v6M15 16v-6h10v6M18 10V5h4v5M20 2v3M16 36v-7h8v7M14 25h2m8 0h2M16 19h2m4 0h2M19 13h2',lotus:'M20 32C9 24 15 12 20 5c5 7 11 19 0 27ZM20 32C7 33 3 22 4 15c8 1 12 5 16 17Zm0 0c13 1 17-10 16-17-8 1-12 5-16 17ZM20 32C8 38 2 29 2 25m18 7c12 6 18-3 18-7',calendar:'M6 9h28v26H6ZM6 17h28M13 5v8m14-8v8M12 23h3m4 0h3m4 0h3m-17 6h3m4 0h3m4 0h3',gallery:'M5 7h30v27H5Zm1 23 9-9 6 6 5-8 9 11M14 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6',heart:'M20 35 6 21C-4 8 13 0 20 12 27 0 44 8 34 21Z',live:'M20 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6m0 8-5 12h10Zm-8-12a12 12 0 0 1 0-15m16 0a12 12 0 0 1 0 15M7 7a19 19 0 0 0 0 25M33 7a19 19 0 0 1 0 25',pin:'M20 37S7 23 7 15a13 13 0 1 1 26 0c0 8-13 22-13 22ZM20 11a4 4 0 1 0 0 8 4 4 0 0 0 0-8'};
function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 40 40');svg.setAttribute('aria-hidden','true');const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',paths[name]);svg.append(p);return svg;}
document.querySelectorAll('[data-icon]').forEach(a=>a.prepend(icon(a.dataset.icon)));document.querySelector('.brand span').replaceWith(icon('temple'));
const menu=document.querySelector('#menu'),nav=document.querySelector('#nav');menu.onclick=()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open);};nav.onclick=e=>{if(e.target.closest('a')){menu.setAttribute('aria-expanded','false');nav.classList.remove('open');}};
const dialog=document.querySelector('dialog');
for(const [name,title]of Object.entries({earth:'From the universe',clouds:'A higher call',temple:'Golden light',doors:'The doors open',sanctum:'The sacred sanctum',nandi:'A place for every soul'})){const f=document.createElement('figure'),img=document.createElement('img'),c=document.createElement('figcaption');img.src=`cinematic/new-assets/${name}.webp`;img.alt=title;img.loading='lazy';c.textContent=title;f.append(img,c);document.querySelector('.gallery-grid').append(f);}
document.querySelectorAll('[data-info]').forEach(a=>a.onclick=e=>{e.preventDefault();stop();const content=document.querySelector(a.hash).cloneNode(true);content.removeAttribute('id');content.querySelector('h2').id='dialog-title';dialog.querySelector('.dialog-body').replaceChildren(content);dialog.showModal();});
dialog.querySelector('.close').onclick=()=>dialog.close();dialog.onclick=e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();};
const mediaRoot=i=>'cinematic/video-vidu';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const scenes=[...document.querySelectorAll('.scene')];
const ids=['space','clouds','temple','enter','sanctum','explore'];
const files=['earth','clouds','temple','doors','sanctum','nandi'];
const titles=['Beyond the horizon','Through the clouds','The sacred approach','At the threshold','In the presence of Shiva','A place for every soul'];
const play=document.querySelector('#play'),bar=document.querySelector('.scene-progress span');
let current=0,playing=false,motion=!reduced.matches,wheelUntil=0,fallbackTimer;const fallback=new Set();
const videos=scenes.map((scene,i)=>{
 const video=document.createElement('video');video.className='scene-video';video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload=i===0?'auto':'none';video.poster=`${mediaRoot(i)}/${files[i]}-poster.jpg`;let failedSources=0;for(const [extension,type] of [['webm','video/webm'],['mp4','video/mp4']]){const source=document.createElement('source');source.src=`${mediaRoot(i)}/${files[i]}.${extension}`;source.type=type;source.addEventListener('error',()=>{if(++failedSources===2){scene.classList.remove('video-ready');fallback.add(i);if(i===current)resumeFallback();}});video.append(source);}video.setAttribute('aria-hidden','true');video.playbackRate=.75;
 function revealFrame(){if(video.readyState>=2&&video.videoWidth>0)scene.classList.add('video-ready');}
 video.addEventListener('playing',()=>{if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(revealFrame);else revealFrame();});
 video.addEventListener('emptied',()=>scene.classList.remove('video-ready'));
 video.addEventListener('error',()=>{scene.classList.remove('video-ready');fallback.add(i);if(i===current)resumeFallback();});
 video.addEventListener('ended',()=>{if(i!==current)return;if(playing&&current<5)show(current+1);else if(current===5)stop();});
 video.addEventListener('timeupdate',()=>{if(i===current)bar.style.width=`${(current+(video.duration?video.currentTime/video.duration:0))/6*100}%`;});
 scene.prepend(video);return video;
});
function resumeFallback(){clearTimeout(fallbackTimer);if(!motion||document.hidden||dialog.open)return;const img=scenes[current].querySelector(':scope > img');img.src=`${mediaRoot(current)}/${files[current]}.webp`;if(playing)fallbackTimer=setTimeout(()=>{if(current<5)show(current+1);else stop();},5444);}
function stop(){clearTimeout(fallbackTimer);if(fallback.has(current))scenes[current].querySelector(':scope > img').src=`${mediaRoot(current)}/${files[current]}-poster.jpg`;playing=false;motion=false;videos.forEach(v=>v.pause());play.textContent='Play';play.setAttribute('aria-label','Play journey');}
function resumeVideo(){if(document.hidden||dialog.open||!motion)return;if(fallback.has(current)){resumeFallback();return;}const v=videos[current];if(v.ended)v.currentTime=0;v.play().catch(error=>{if(v!==videos[current])return;scenes[current].classList.remove('video-ready');if(error.name==='NotSupportedError'||v.error){fallback.add(current);resumeFallback();return;}playing=false;play.textContent='Play';play.setAttribute('aria-label','Play journey');});}
function show(n){
 clearTimeout(fallbackTimer);videos.forEach(v=>v.pause());current=Math.max(0,Math.min(5,n));
 scenes.forEach((s,i)=>{s.classList.toggle('active',i===current);s.inert=i!==current;s.setAttribute('aria-hidden',String(i!==current));});
 document.body.dataset.scene=ids[current];document.body.classList.toggle('at-end',current===5);document.querySelector('.explore').inert=current!==5;
 document.querySelector('#scene-label').textContent=`0${current+1} / 06 — ${titles[current]}`;
 document.querySelector('#previous').disabled=current===0;document.querySelector('#next').disabled=current===5;
 document.querySelectorAll('.stages a').forEach((a,i)=>{if(i===current)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current');});
 history.replaceState(null,'',`#${ids[current]}`);videos[current].currentTime=0;bar.style.width=`${current/6*100}%`;resumeVideo();
}
function start(){playing=true;motion=true;if(current===5)show(0);play.textContent='Pause';play.setAttribute('aria-label','Pause journey');resumeVideo();}
play.onclick=()=>{if(playing||(!fallback.has(current)&&!videos[current].paused))stop();else start();};
function manual(n){playing=false;motion=!reduced.matches;show(n);play.textContent='Play';play.setAttribute('aria-label','Play journey');}
document.querySelector('#next').onclick=()=>manual(current+1);document.querySelector('#previous').onclick=()=>manual(current-1);
document.querySelectorAll('a[href^="#"]:not([data-info]):not(.skip)').forEach(a=>a.addEventListener('click',e=>{const i=ids.indexOf(a.hash.slice(1));if(i<0)return;e.preventDefault();if(a.closest('.hero-copy')){show(0);start();}else manual(i);}));
document.querySelector('.skip').onclick=e=>{e.preventDefault();manual(5);document.querySelector('.explore a').focus();};
document.querySelector('#restart').onclick=()=>{show(0);start();};
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(fallbackTimer);videos.forEach(v=>v.pause());}else resumeVideo();});
document.addEventListener('keydown',e=>{if(dialog.open||e.target.closest('button,a'))return;if(['ArrowDown','ArrowRight','PageDown','ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();manual(current+(['ArrowUp','ArrowLeft','PageUp'].includes(e.key)?-1:1));}});
addEventListener('wheel',e=>{if(dialog.open||Math.abs(e.deltaY)<30||performance.now()<wheelUntil||e.target.closest('nav'))return;wheelUntil=performance.now()+1000;manual(current+(e.deltaY>0?1:-1));},{passive:true});
let touchY=null;addEventListener('touchstart',e=>{touchY=e.target.closest('button,a,dialog,nav')?null:e.touches[0].clientY;},{passive:true});addEventListener('touchend',e=>{if(touchY===null||dialog.open)return;const delta=touchY-e.changedTouches[0].clientY;touchY=null;if(Math.abs(delta)>55)manual(current+(delta>0?1:-1));},{passive:true});
reduced.onchange=()=>{if(reduced.matches)stop();};
const initial=ids.indexOf(location.hash.slice(1));show(initial<0?0:initial);
