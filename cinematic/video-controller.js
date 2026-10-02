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
