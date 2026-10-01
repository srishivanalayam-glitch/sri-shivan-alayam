import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TempleNavigation } from './navigation.js';
const $=id=>document.getElementById(id);
const stops=[
 ['TEMPLE_ENTRANCE','Entrance','The gopuram','A threshold between the everyday and the sacred.',[0,6,13]],
 ['COURTYARD','Courtyard','Under the evening sky','Stone corridors, coconut palms and the glow of deepam.',[0,3,-3]],
 ['MANDAPAM','Mandapam','The pillared hall','Pause among the stone pillars of the prayer hall.',[0,2.3,-9]],
 ['NANDI','Nandi','The devoted guardian','Nandi faces Lord Shiva, keeping a quiet vigil.',[0,1.9,-5.8]],
 ['SANCTUM_ENTRANCE','Sanctum','At the sanctum door','Warm brass and dark stone frame the sacred entrance.',[0,1.9,-13]],
 ['SHIVA_LINGAM','Shiva Lingam','Om Namah Shivaya','The Shiva Lingam rests upon the Avudaiyar, surrounded by offerings.',[0,1.85,-13]]
];
let renderer,scene,camera,model,draco,envMap,raf,navigation,active=0,yaw=0,pitch=0,started=false,disposed=false,low=matchMedia('(max-width:700px)').matches,forced=false;
let reduceMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
let guided=false,dwell=0,diagnosticElapsed=0,ambientLight,moonLight,fillLight,failed=false;
const downloadAbort=new AbortController();
let drag=null,dust=null,lastFrame=0,slowFrames=0,visible=true;
const v=new THREE.Vector3(),target=new THREE.Vector3();
function fail(error){if(disposed||failed)return;failed=true;console.error('Temple experience:',error);stopGuide();$('loading').hidden=true;$('welcome').hidden=true;$('tour-ui').hidden=true;$('fallback').hidden=false;$('fallback').querySelector('a').focus({preventScroll:true});cancelAnimationFrame(raf);downloadAbort.abort();draco?.dispose();if(renderer)renderer.dispose();}
function syncAngles(){camera.rotation.order='YXZ';pitch=camera.rotation.x;yaw=-camera.rotation.y;}
function stopGuide(){guided=false;$('guided').textContent='Guided tour';$('guided').setAttribute('aria-pressed','false');}
function setLook(point){const d=point.clone().sub(camera.position).normalize();yaw=Math.atan2(d.x,-d.z);pitch=Math.asin(d.y);look();}
function look(){camera.rotation.order='YXZ';camera.rotation.set(pitch,-yaw,0);}
function choose(i,instant=false,automatic=false){
 if(!navigation)return;if(!automatic)stopGuide();
 active=THREE.MathUtils.clamp(i,0,stops.length-1);const s=stops[active];
 $('step').textContent=`0${active+1} / 06`;$('place').textContent=s[2];$('description').textContent=s[3];
 document.querySelectorAll('#locations button').forEach((b,j)=>{if(j===active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
 $('previous').disabled=active===0;$('next').disabled=active===stops.length-1;
 navigation.choose(active,instant);dwell=0;
}
function quality(){if(!renderer||failed)return;renderer.setPixelRatio(Math.min(devicePixelRatio,low?1:1.6));renderer.shadowMap.enabled=!low;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;if(dust)dust.visible=!low;renderer.setSize($('canvas').clientWidth,$('canvas').clientHeight);$('quality').textContent=low?'Quality: light':'Quality: full';}
function resize(){if(!renderer||failed)return;const {clientWidth:w,clientHeight:h}=$('canvas');camera.aspect=w/h;camera.fov=w<600?74:62;camera.updateProjectionMatrix();renderer.setSize(w,h);}
function addLighting(){ambientLight=new THREE.HemisphereLight(0x91a5c4,0x302419,.65);scene.add(ambientLight);const moon=moonLight=new THREE.DirectionalLight(0xb9caff,1.6);moon.position.set(-12,24,8);moon.castShadow=true;moon.shadow.mapSize.set(1024,1024);Object.assign(moon.shadow.camera,{left:-22,right:22,top:24,bottom:-24,near:1,far:75});moon.shadow.bias=-.0004;scene.add(moon);const fill=fillLight=new THREE.DirectionalLight(0xffc17a,.9);fill.position.set(2,12,25);scene.add(fill);
 for(const [p,power,range] of [[[0,3,-12],18,9],[[0,3,-5],25,10],[[-3,3,7],30,14]]){const l=new THREE.PointLight(0xffae51,power,range,2);l.position.set(...p);scene.add(l);}
}
// Convert shared exported geometry to GPU instances; material groups remain intact.
function instanceRepeated(root){root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const key=o.geometry.uuid+':'+(Array.isArray(o.material)?o.material.map(m=>m.uuid).join(','):o.material.uuid);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);}});for(const meshes of groups.values()){if(meshes.length<3)continue;const first=meshes[0],inst=new THREE.InstancedMesh(first.geometry,first.material,meshes.length);inst.name=first.name+'_Instances';meshes.forEach((m,i)=>{inst.setMatrixAt(i,m.matrixWorld);m.removeFromParent();});inst.castShadow=true;inst.receiveShadow=true;scene.add(inst);}}
async function start(){if(started)return;started=true;$('welcome').hidden=true;$('loading').hidden=false;
 try{
 renderer=new THREE.WebGLRenderer({antialias:!low,powerPreference:'low-power'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 $('canvas').appendChild(renderer.domElement);renderer.domElement.setAttribute('tabindex','0');renderer.domElement.setAttribute('aria-label','Temple view. Drag to look. Use navigation buttons to move.');renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(new Error('Graphics context lost'));});
 scene=new THREE.Scene();scene.background=new THREE.Color(0x0d1420);scene.fog=new THREE.FogExp2(0x101824,.009);camera=new THREE.PerspectiveCamera(62,1,.07,160);addLighting();
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(250,250),new THREE.MeshStandardMaterial({color:0x151b22,roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.54;ground.receiveShadow=true;scene.add(ground);
 const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();envMap=pmrem.fromScene(room,.02);scene.environment=envMap.texture;scene.environmentIntensity=.3;room.dispose();pmrem.dispose();
 draco=new DRACOLoader();draco.setDecoderPath('./vendor/draco/');draco.setWorkerLimit(2);const loader=new GLTFLoader();loader.setDRACOLoader(draco);
 const modelUrl=low?'./models/sri-shivan-alayam-mobile.glb':'./models/sri-shivan-alayam.glb';
 const gltf=await loadModel(loader,modelUrl);
 if(disposed||failed)return;model=gltf.scene;scene.add(model);for(const s of stops)if(!model.getObjectByName(s[0]))throw Error('Missing navigation marker '+s[0]);instanceRepeated(model);
 const a=new Float32Array(80*3);for(let i=0;i<a.length;i+=3){a[i]=(Math.random()-.5)*14;a[i+1]=Math.random()*5;a[i+2]=(Math.random()-.5)*28;}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(a,3));dust=new THREE.Points(geo,new THREE.PointsMaterial({color:0xd4b477,size:.025,transparent:true,opacity:.28,depthWrite:false}));scene.add(dust);
 navigation=new TempleNavigation(camera,model,stops,{onStatus:message=>$('journey-status').textContent=message,onMovement:moving=>{$('skip-movement').hidden=!moving;if(!moving)renderer.domElement.style.opacity='1';},onArrival:()=>{syncAngles();dwell=0;},reducedMotion:()=>reduceMotion});
 $('loading').hidden=true;$('tour-ui').hidden=false;quality();resize();choose(0,true);lastFrame=performance.now();animate(lastFrame);renderer.domElement.focus({preventScroll:true});
 renderer.domElement.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;pause();drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);});
 renderer.domElement.addEventListener('pointermove',e=>{if(!drag||!e.isPrimary)return;yaw+=(e.clientX-drag.x)*.004;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.003,-1.15,1.15);drag={x:e.clientX,y:e.clientY};look();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(type,()=>drag=null);
 renderer.domElement.addEventListener('keydown',e=>{if(e.key==='ArrowUp'||e.key==='w'){e.preventDefault();choose(active+1);}if(e.key==='ArrowDown'||e.key==='s'){e.preventDefault();choose(active-1);}if(['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();pause();yaw+=e.key==='ArrowLeft'||e.key==='a'?-.12:.12;look();}if(e.key==='Escape')pause();});
 renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();camera.fov=THREE.MathUtils.clamp(camera.fov+e.deltaY*.025,38,80);camera.updateProjectionMatrix();},{passive:false});
 }catch(e){fail(e);}
}
function animate(t){if(disposed||failed)return;raf=requestAnimationFrame(animate);if(!visible||document.hidden){lastFrame=t;return;}const dt=t-lastFrame;lastFrame=t;
 if(!low&&!forced&&dt>26&&dt<200){if(++slowFrames>100){low=true;quality();}}else slowFrames=Math.max(0,slowFrames-1);
 const seconds=Math.min(dt/1000,.1);renderer.domElement.style.opacity=String(navigation.update(seconds));
 if(guided&&!navigation.moving&&!navigation.returning){dwell+=seconds;if(dwell>=6){if(active<stops.length-1)choose(active+1,false,true);else{stopGuide();$('journey-status').textContent='Your journey is complete. Om Namah Shivaya.';}}}
 if(dust&&!reduceMotion)dust.rotation.y=Math.sin(t*.00008)*.04;
 // Gradually reduce exterior fill inside the sanctum; the warm oil-lamp lighting
 // stays present even on mobile devices without dynamic shadows.
 const interior=THREE.MathUtils.smoothstep(-camera.position.z,8,10.3);
 ambientLight.intensity=THREE.MathUtils.lerp(.65,.16,interior);
 moonLight.intensity=THREE.MathUtils.lerp(1.6,.25,interior);
 fillLight.intensity=THREE.MathUtils.lerp(.9,.12,interior);
 scene.environmentIntensity=THREE.MathUtils.lerp(.3,.16,interior);
 renderer.render(scene,camera);
 // Expose lightweight diagnostics for verification, without changing the experience.
 diagnosticElapsed+=seconds;if(!$('canvas').dataset.loaded||diagnosticElapsed>.1){diagnosticElapsed=0;const data=$('canvas').dataset;data.triangles=String(renderer.info.render.triangles);data.drawCalls=String(renderer.info.render.calls);data.position=camera.position.toArray().map(n=>n.toFixed(3)).join(',');data.rotation=camera.quaternion.toArray().map(n=>n.toFixed(4)).join(',');data.moving=String(!!navigation.moving||!!navigation.returning);data.location=stops[active][0];data.loaded='true';}
}
function pause(){stopGuide();navigation.pause();syncAngles();}
async function loadModel(loader,url){
 const timeout=setTimeout(()=>{downloadAbort.abort();fail(new Error('The temple took too long to load. Please retry.'));},45000);
 try{const response=await fetch(url,{signal:downloadAbort.signal});if(!response.ok)throw Error(`Model download failed (${response.status})`);const total=Number(response.headers.get('content-length'));const reader=response.body?.getReader();let data;
 if(!reader)data=await response.arrayBuffer();else{const chunks=[];let loaded=0,last=-1;for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);loaded+=value.byteLength;const percent=total?Math.min(100,Math.floor(loaded/total*100)):0;if(percent!==last){$('progress').value=percent;$('percentage').textContent=total?`${percent}%`:`${Math.round(loaded/1024)} KB`;last=percent;}}const bytes=new Uint8Array(loaded);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}data=bytes.buffer;}
 $('progress').value=100;$('percentage').textContent='100% · Preparing the temple…';return await loader.parseAsync(data,new URL('./models/',location.href).href);
 }finally{clearTimeout(timeout);}
}
stops.forEach((s,i)=>{const b=document.createElement('button');b.textContent=s[1];b.onclick=()=>choose(i);$('locations').appendChild(b);});
$('enter').onclick=start;$('next').onclick=()=>choose(active+1);$('previous').onclick=()=>choose(active-1);$('quality').onclick=()=>{forced=true;low=!low;quality();};$('overview').onclick=()=>{pause();navigation.overview=true;camera.position.set(24,22,36);setLook(new THREE.Vector3(0,3,-1));$('place').textContent='The temple grounds';$('description').textContent='Choose any location to return to your journey.';$('journey-status').textContent='Overview';};
$('skip-movement').onclick=()=>navigation.finish();
$('guided').onclick=()=>{if(guided){pause();return;}guided=true;$('guided').textContent='Pause tour';$('guided').setAttribute('aria-pressed','true');choose(active===stops.length-1?0:active+1,false,true);};
function motionLabel(){$('motion').setAttribute('aria-pressed',String(reduceMotion));$('motion').textContent=reduceMotion?'Motion: reduced':'Motion: smooth';}
$('motion').onclick=()=>{reduceMotion=!reduceMotion;motionLabel();if(reduceMotion&&(navigation.moving||navigation.returning))navigation.finish();};motionLabel();
window.addEventListener('resize',resize);const observer=new IntersectionObserver(entries=>visible=entries[0].isIntersecting);observer.observe($('experience'));
window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(raf);downloadAbort.abort();observer.disconnect();draco?.dispose();envMap?.dispose();const geometries=new Set(),materials=new Set(),textures=new Set();scene?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>{Object.values(m).forEach(value=>{if(value?.isTexture)textures.add(value);});m.dispose();});textures.forEach(texture=>texture.dispose());renderer?.dispose();});
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
$('enter').disabled=false;
