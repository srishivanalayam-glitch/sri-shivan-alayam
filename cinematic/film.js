const filmDialog=document.querySelector('#film-dialog');
const filmVideo=filmDialog.querySelector('video');
const filmSound=filmDialog.querySelector('#film-sound');
const filmStatus=filmDialog.querySelector('#film-status');
const filmRetry=filmDialog.querySelector('#film-retry');
const filmChapter=filmDialog.querySelector('#film-chapter');
const filmProgress=filmDialog.querySelector('#film-progress');
const filmChapters=['From the universe','Through the divine clouds','Revealed in golden light','The doors open','In the presence of Shiva','A place for every soul'];
let filmReturnFocus=null;
function finishFilm(){if(filmDialog.open)filmDialog.close();}
window.openTempleFilm=()=>{
 filmReturnFocus=document.activeElement;stop();document.body.classList.add('watching-film');filmDialog.showModal();
 const path=matchMedia('(max-width:800px), (pointer:coarse)').matches?'temple-journey-mobile.mp4':'temple-journey.mp4';
 if(!filmVideo.src.endsWith(path))filmVideo.src=`cinematic/film/${path}`;
 filmVideo.currentTime=0;filmVideo.muted=false;filmVideo.volume=.65;filmSound.textContent='Mute sound';filmSound.setAttribute('aria-pressed','false');filmRetry.hidden=true;filmStatus.textContent='Preparing your journey…';
 filmVideo.play().catch(()=>{filmStatus.textContent='Tap to start your journey';filmRetry.hidden=false;});
};
filmRetry.onclick=()=>{filmVideo.play().then(()=>{filmRetry.hidden=true;}).catch(()=>{filmStatus.textContent='The film could not play. You can still explore the temple below.';});};
filmSound.onclick=()=>{filmVideo.muted=!filmVideo.muted;filmSound.textContent=filmVideo.muted?'Enable sound':'Mute sound';filmSound.setAttribute('aria-pressed',String(filmVideo.muted));};
filmDialog.querySelector('#film-skip').onclick=finishFilm;
filmVideo.addEventListener('playing',()=>{filmStatus.textContent='';filmRetry.hidden=true;});
filmVideo.addEventListener('waiting',()=>{filmStatus.textContent='Loading the next moment…';});
filmVideo.addEventListener('error',()=>{filmStatus.textContent='The film could not load. Select Skip intro to explore the temple.';});
filmVideo.addEventListener('timeupdate',()=>{const t=filmVideo.currentTime;const chapter=Math.min(5,Math.floor(t/6));filmChapter.textContent=filmChapters[chapter];filmProgress.value=filmVideo.duration?t/filmVideo.duration:0;});
filmVideo.addEventListener('ended',finishFilm);
filmDialog.addEventListener('close',()=>{filmVideo.pause();document.body.classList.remove('watching-film');manual(5);document.querySelector('.explore a').focus();filmReturnFocus=null;});
document.addEventListener('visibilitychange',()=>{if(filmDialog.open){if(document.hidden)filmVideo.pause();else filmVideo.play().catch(()=>{filmRetry.hidden=false;filmStatus.textContent='Tap to continue your journey';});}});
