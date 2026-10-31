import {ROUTE_CASES,routeCase,applyRouteCase,reportRails,returnMarker,returnMatchesCase} from './route-cases-v3.5.mjs';
import {installPreparation} from './prepare-v3.5.mjs';
import {photoBridge} from './bridge-v3.5.mjs';
import {loadMuralImages} from './mural-image-load.mjs';
import * as visual35 from './visual-v3.5.mjs';
import {projectWallCue} from '../../src/mural-wall-cue.mjs';
import {FIRST_FRONT_DOCK} from '../../src/mural-front.mjs';
import {createRail,ease,smooth} from './route-v3.2.mjs';
import {installRouteSurfaces} from './route-surface-v3.2.mjs';
import {MURAL_INTRODUCTIONS} from './mural-introductions.mjs';
import {WAYPOINTS,segmentHits,lerpPose,routeSlice} from './route-data.mjs';
import {EXPLORATION_URL,explorationAvailable} from '../../../navigation/exploration.mjs';
import {installInteriorFinish} from './interior-finish.mjs';
import {OBSERVATIONS,fitImage,clampTransform,regionTransform,visibleRect,setImageSize} from './observations.mjs';
import {installStudyLayers} from './surface-layer.mjs';
const $=s=>document.querySelector(s),frame=$('#space'),body=document.body;
const variant35=body.dataset.variant==='v35';
const selectedCase=routeCase(variant35?new URLSearchParams(location.search).get('layout'):'model');body.dataset.routeCase=selectedCase.id;
body.dataset.dev=String(!variant35||new URLSearchParams(location.search).has('debug'));
const variant33=['v33','v34','v35'].includes(body.dataset.variant);let rearGallery=null;
let routeValidated=false;
let routeLayer,rail,routeProgress=0,secondReveal=0,secondStatus='idle',routeError=null;
let initializing=true,preparation=[];
let finish,activeMural=0,murals=[],T,wallPlane=null,wallLabel=null;
let h,w,layer,ready=false,busy=false,view='A',direction='B',compare=false,position='gate-interior',detail={zoom:1,x:0,y:0},drag=null,detailAnimation=null,activeObservation=null;
const spatialStops=['gate-interior','stage-turn','corridor-3d','corridor-hybrid','corridor-2_5d'];
const regionViewport=()=>$('#detail-viewport').getBoundingClientRect();
const motion=()=>$('#reduced').checked||matchMedia('(prefers-reduced-motion:reduce)').matches;
function message(text){$('#message').textContent=text;$('#message').hidden=!text;}
function setBusy(value){value=value||initializing;busy=value;$('#continue-tour').disabled=value||!ready;body.dataset.busy=String(value);body.dataset.ready=String(ready&&!initializing);if($('#audience-motion')){$('#audience-motion').disabled=value||!ready;$('#audience-motion').setAttribute('aria-pressed',String(motion()));}for(const button of document.querySelectorAll('.chapters button,#back,#forward,#direction,#compare,#replay-discovery,#motion-check,#route-layout,#detail-open,#wall-return,#stops button'))button.disabled=value||!ready||(activeMural>0&&(['replay-discovery','motion-check'].includes(button.id)||button.closest('#stops')));}
function paintView(next){delete body.dataset.readingExit;body.dataset.reducedMotion=String(motion());view=next;body.dataset.view=next;for(const b of document.querySelectorAll('.chapters button')){if(b.dataset.view===next)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}$('#spatial').hidden=!['A','B'].includes(next);$('#reading').hidden=next!=='C';$('#detail').hidden=next!=='D';$('#spatial-title').textContent=activeMural?murals[activeMural].title:(next==='B'?'第一铺壁画':'沿廊而行');$('#back').disabled=busy||!ready;$('#forward').textContent=next==='B'?'展开全幅 →':activeMural?'阅读本铺 →':position==='corridor-2_5d'?'走近壁画 →':'继续前行 →';$('#route-open').textContent=`0${activeMural+1} / 05 · 参观路线`;if(next==='D')requestAnimationFrame(()=>drawDetail(false));}
function paintPosition(){if(activeMural){$('#location-label').textContent=`0${activeMural+1} / 05 · ${murals[activeMural].title}`;$('.rail i').style.width=`${(activeMural+1)*20}%`;return;}const stops=h?.stops??[],i=stops.findIndex(s=>s.id===h?.state);if(i>=0){position=h.state;$('#location-label').textContent=`${stops[i].label} · 01 / 05`;$('.rail i').style.width=`${(i+1)/stops.length*100}%`;}for(const b of document.querySelectorAll('#stops button'))b.setAttribute('aria-pressed',String(h?.state===b.dataset.stop));$('#diagnostics').textContent=JSON.stringify({state:h?.state,view,direction,layerError:studyApi?.layerError??null,layer:layer?.state,brightness:h?.model?.mural.state().brightness},null,2);}
async function goSpace(stop){if(!h)return false;if(h.state===stop){paintPosition();return true;}const result=await h.go(stop);if(!result)throw Error(`无法到达 ${stop}`);paintPosition();return result;}
async function syncReading(enter){if(rearGallery?.isRear(activeMural))return rearGallery.readingBridge(enter);if(activeMural===1)return secondReadingBridge(enter);if(activeMural)return;
 const image=$('#reading-image');await image.decode();const q=h.model.mural.state().readingCorners,rect=image.getBoundingClientRect(),fit=fitImage(rect.width,rect.height),target={left:rect.left+(rect.width-fit.width)/2,top:rect.top+(rect.height-fit.height)/2,width:fit.width,height:fit.height};
 const source={left:q[0].x*innerWidth,top:q[0].y*innerHeight,width:(q[1].x-q[0].x)*innerWidth,height:(q[3].y-q[0].y)*innerHeight};
 const tx=source.left+source.width/2-(target.left+target.width/2),ty=source.top+source.height/2-(target.top+target.height/2),scale=source.width/target.width;
 if(motion())return;
 const transform=`translate(${tx}px,${ty}px) scale(${scale})`,frames=enter?[{transform},{transform:'none'}]:[{transform:'none'},{transform}];
 const info=[$('.reading-head'),$('.reading-foot'),$('.full-mural figcaption'),$('.quiet-return')];for(const item of info)item.animate(enter?[{opacity:0},{opacity:1}]:[{opacity:1},{opacity:0}],{duration:enter?600:250,fill:'none'});
 await image.animate(frames,{duration:650,easing:'cubic-bezier(.25,.1,.2,1)',fill:'none'}).finished;
}
async function reading(){if(activeMural){paintView('C');if(activeMural===1||rearGallery?.isRear(activeMural))await syncReading(true);return;}if(h.state!=='mural-reading'){if(h.state!=='mural-look'){await goSpace('corridor-2_5d');paintView('B');await goSpace('mural-look');}if(h.state!=='mural-reading')await goSpace('mural-reading');}paintView('C');await syncReading(true);}
async function navigate(next,{replay=false}={}){if(!ready||busy)return false;setBusy(true);message('');try{
 if(next==='D'){if(activeMural){paintView('D');detail={zoom:rearGallery?.initialZoom(activeMural)??1,x:0,y:0};updateObservation(null);drawDetail(false);return true;}if(h.state!=='mural-reading')await reading();paintView('D');detail={zoom:1,x:0,y:0};activeObservation=null;updateObservation(null);drawDetail(false);}
 else if(next==='C'){if(view==='D'){paintView('C');}else await reading();}
 else if(next==='B'){
  if(activeMural){if((activeMural===1||rearGallery?.isRear(activeMural))&&view==='C'){body.dataset.readingExit='true';await syncReading(false);}paintView('B');return true;}
  if(view==='C'){body.dataset.readingExit='true';await syncReading(false);}
  paintView('B');if(replay){await goSpace('corridor-2_5d');await goSpace('mural-look');paintView('C');await syncReading(true);}
  else{if(h.state!=='mural-reading'&&h.state!=='mural-look'){await goSpace('corridor-2_5d');await goSpace('mural-look');}if(h.state==='mural-reading')await goSpace('mural-look');if(h.state==='mural-reading')await goSpace('mural-look');paintView('B');}
 }else{
  if(activeMural){if((activeMural===1||rearGallery?.isRear(activeMural))&&view==='C'){body.dataset.readingExit='true';await syncReading(false);}paintView('A');return true;}
  if(view==='C'){body.dataset.readingExit='true';await syncReading(false);}paintView('A');await goSpace(position);
 }paintPosition();if(next==='D')$('#detail-viewport').focus({preventScroll:true});else if(next==='C'&&view==='C')$('#detail-open').focus({preventScroll:true});return true;
 }catch(e){message(`预览未能完成：${e.message}。可打开预览选项切换原始模型。`);return false;}finally{setBusy(false);}}
async function nextSpace(dir){if(!ready||busy)return;if(activeMural){if(dir<0)return travelTo(activeMural-1);return navigate(view==='B'?'C':'B');}if(view==='B')return navigate(dir<0?'A':'C');if(dir>0&&position==='corridor-2_5d')return navigate('B',{replay:true});const stops=h.stops.map(s=>s.id),i=stops.indexOf(position),next=stops[Math.max(0,Math.min(stops.length-1,i+dir))];setBusy(true);try{await goSpace(next);paintView('A');}catch(e){message(e.message);}finally{setBusy(false);}}
async function chooseDirection(value,{initial=false}={}){if(!ready||busy&&!initial)return;
 if(variant35&&layer&&['A','B'].includes(value)&&value===direction&&!compare){layer.setMode(activeMural?'original':'hybrid');w.v24a.layer?.setMode('original');finish?.setEnabled(true);routeLayer?.setEnabled(true);rearGallery?.setEnabled(true);return;}setBusy(true);try{
 direction=value;compare=false;$('#compare').setAttribute('aria-pressed','false');$('#direction').value=value;
 if(['current','original'].includes(value)){layer?.setMode('original');w.v24a.layer?.setMode(value==='current'?'hybrid':'original');}
 else{const T=await w.document.querySelector('#temple').contentWindow.eval("import('/module-a/immersive-hybrid-v1/vendor/three.module.js')");layer?.dispose();layer=null;layer=await installStudyLayers(h.model,T,{direction:value});w.v24a.layer?.setMode('original');h.model.setCamera(h.model.pose,{immediate:true});}
 routeLayer?.setEnabled(['A','B'].includes(value));rearGallery?.setEnabled(['A','B'].includes(value));studyApi.layerError=null;if(activeMural)layer?.setMode('original');finish?.setEnabled(value==='A'||value==='B');message('');paintPosition();
 }catch(e){studyApi.layerError=e.message;finish?.setEnabled(false);layer?.setMode('original');w.v24a.layer?.setMode('hybrid');message('新候选素材暂不可用，已回退到当前正式融合；可以重选方向重试。');}finally{setBusy(false);}}
function updateObservation(region){
 activeObservation=region;
 for(const b of document.querySelectorAll('[data-observation]'))b.setAttribute('aria-pressed',String(b.dataset.observation===region?.id));
 const mural=murals[activeMural];
 $('#observation-number').textContent='整铺简介';
 $('#observation-title').textContent=mural?.title??'壁画简介';
 $('#observation-copy').textContent=MURAL_INTRODUCTIONS[mural?.id]??'';
 $('#region-position').textContent=region?region.title:'全幅';
}
function drawDetail(animate=true){const vp=regionViewport();if(!vp.width||!vp.height)return;detail=clampTransform(detail,vp);const fit=fitImage(vp.width,vp.height),img=$('#detail-image');img.style.width=`${fit.width}px`;img.style.height=`${fit.height}px`;const transform=`translate(calc(-50% + ${detail.x}px),calc(-50% + ${detail.y}px)) scale(${detail.zoom})`;
 if(animate&&!motion()){const old=getComputedStyle(img).transform;detailAnimation?.cancel();img.style.transform=transform;detailAnimation=img.animate([{transform:old},{transform}],{duration:650,easing:'cubic-bezier(.2,.6,.2,1)'});}else{detailAnimation?.cancel();img.style.transform=transform;}
 $('#zoom-value').value=`${Math.round(detail.zoom*100)}%`;$('#zoom-out').disabled=detail.zoom<=1;$('#zoom-in').disabled=detail.zoom>=4;const rect=visibleRect(detail,vp);for(const [k,v] of Object.entries(rect))$('#mini-window').setAttribute(k,v);}
function zoom(delta,anchor){const vp=regionViewport(),old=detail.zoom,next=Math.max(1,Math.min(4,old+delta));if(anchor){const x=anchor[0]-vp.left-vp.width/2,y=anchor[1]-vp.top-vp.height/2;detail.x=x-(x-detail.x)*next/old;detail.y=y-(y-detail.y)*next/old;}else{detail.x*=next/old;detail.y*=next/old;}detail.zoom=next;drawDetail(!anchor);}
function reset(){updateObservation(null);detail={zoom:1,x:0,y:0};drawDetail();}
function selectRegion(region){updateObservation(region);detail=regionTransform(region,regionViewport());drawDetail();}
for(const region of OBSERVATIONS){const b=document.createElement('button');b.dataset.observation=region.id;b.innerHTML=`<span>${region.number}</span>${region.title}`;b.setAttribute('aria-pressed','false');b.onclick=()=>selectRegion(region);$('#observations').append(b);}
$('#zoom-in').onclick=()=>zoom(.25);$('#zoom-out').onclick=()=>zoom(-.25);$('#reset').onclick=$('#whole-image').onclick=reset;
const viewport=$('#detail-viewport');viewport.addEventListener('pointerdown',e=>{if(e.button!==0)return;detailAnimation?.cancel();drawDetail(false);drag={x:e.clientX,y:e.clientY,initial:{...detail}};viewport.setPointerCapture(e.pointerId);});viewport.addEventListener('pointermove',e=>{if(!drag)return;detail.x=drag.initial.x+e.clientX-drag.x;detail.y=drag.initial.y+e.clientY-drag.y;drawDetail(false);});for(const event of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(event,()=>drag=null);
viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?.12:-.12,[e.clientX,e.clientY]);},{passive:false});viewport.addEventListener('keydown',e=>{if(e.key==='0')reset();else if(['+','='].includes(e.key))zoom(.25);else if(e.key==='-')zoom(-.25);else if(e.key.startsWith('Arrow')){detail.x+=e.key==='ArrowLeft'?45:e.key==='ArrowRight'?-45:0;detail.y+=e.key==='ArrowUp'?45:e.key==='ArrowDown'?-45:0;drawDetail(false);}else return;e.preventDefault();});
function mapTo(fx,fy){const vp=regionViewport(),fit=fitImage(vp.width,vp.height);detail.x=(.5-fx)*fit.width*detail.zoom;detail.y=(.5-fy)*fit.height*detail.zoom;drawDetail();}
$('#minimap').onclick=e=>{const r=$('#minimap').getBoundingClientRect();mapTo((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height);};$('#minimap').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();reset();}};
for(const b of document.querySelectorAll('.chapters button'))b.onclick=()=>navigate(b.dataset.view);$('#detail-open').onclick=()=>navigate('D');$('#detail-return').onclick=()=>navigate('C');$('#wall-return').onclick=()=>navigate('B');$('#back').onclick=()=>nextSpace(-1);$('#forward').onclick=()=>nextSpace(1);$('#replay-discovery').onclick=()=>navigate('B',{replay:true});$('#direction').onchange=e=>chooseDirection(e.target.value);
$('#compare').onclick=()=>{if(busy)return;finish?.setEnabled(compare);compare=!compare;layer?.setMode(compare?'original':'hybrid');w.v24a.layer?.setMode(compare||direction==='current'?'hybrid':'original');if(direction==='original')w.v24a.layer?.setMode(compare?'hybrid':'original');$('#compare').setAttribute('aria-pressed',String(compare));routeLayer?.setEnabled(!compare);rearGallery?.setEnabled(!compare);$('#compare').textContent=compare?'当前正式融合 · 点击返回候选':'按此切换当前版本对照';paintPosition();};
function options(open){$('#options').hidden=!open;$('#options-open').setAttribute('aria-expanded',String(open));if(open)$('#options-close').focus();else $('#options-open').focus();}$('#options-open').onclick=()=>options($('#options').hidden);$('#options-close').onclick=()=>options(false);addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#options').hidden)options(false);else if(view==='D')navigate('C');}if(e.target.closest('button,input,select,summary,a,#detail-viewport,#minimap'))return;if(['ArrowDown','ArrowRight'].includes(e.key)&&['A','B'].includes(view)){e.preventDefault();nextSpace(1);}if(['ArrowUp','ArrowLeft'].includes(e.key)&&['A','B'].includes(view)){e.preventDefault();nextSpace(-1);}});
$('#audience-motion')?.addEventListener('click',()=>{if(busy||!ready)return;$('#reduced').checked=!motion();$('#reduced').dispatchEvent(new Event('change'));$('#audience-motion').setAttribute('aria-pressed',String(motion()));});
$('#reduced').checked=matchMedia('(prefers-reduced-motion:reduce)').matches;$('#reduced').onchange=()=>{body.dataset.reducedMotion=String(motion());$('#audience-motion')?.setAttribute('aria-pressed',String(motion()));const button=w.document.querySelector('#motion');if((button.getAttribute('aria-pressed')==='true')!==motion())button.click();};
$('#motion-check').onclick=async()=>{if(busy)return;setBusy(true);try{paintView('A');await goSpace('gate-interior');for(const stop of spatialStops.slice(1))await goSpace(stop);paintPosition();}catch(e){message(e.message);}finally{setBusy(false);}};
addEventListener('resize',()=>{if(view==='D')drawDetail(false);});
let wheel=0,wheelAt=0,wheelQuiet=0;addEventListener('wheel',e=>{if(!['A','B'].includes(view)||e.target.closest('button,aside,a,input,select')||busy)return;const now=performance.now();if(now<wheelQuiet)return;if(now-wheelAt>180)wheel=0;wheelAt=now;wheel+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);if(Math.abs(wheel)>=75){const dir=Math.sign(wheel);wheel=0;wheelQuiet=now+650;nextSpace(dir).finally(()=>{wheelQuiet=performance.now()+400;});}},{passive:true});
const studyApi={setRouteHybrid:v=>{routeLayer?.setEnabled(v);rearGallery?.setEnabled(v);h.model.renderFrame();},get routeCase(){return selectedCase;},get preparation(){return preparation;},get route32(){return {progress:routeProgress,reveal:secondReveal,status:secondStatus,error:routeError,projection:routeLayer?.state,wall:wallPlane?{opacity:wallPlane.material.opacity,color:wallPlane.material.color?.toArray(),corners:secondCorners()}:null};},seekRoute:seekRoute32,setSecondReveal,travelTo,probeRoute,get rear(){return rearGallery?.api;},get activeMural(){return activeMural;},get murals(){return murals;},get finish(){return finish;},navigate,chooseDirection,selectRegion:id=>selectRegion(OBSERVATIONS.find(r=>r.id===id)),get ready(){return ready&&!initializing;},get busy(){return busy;},get view(){return view;},get runtime(){return h;},get layer(){return layer;},get detail(){return {...detail};},get direction(){return direction;},layerError:null,observations:OBSERVATIONS};
if(body.dataset.audience!=='true'||body.dataset.dev==='true')window.study=studyApi;
async function initialize(){murals=await (await fetch('./murals.json')).json();if(variant33)murals=murals.map(m=>m.approvedDisplay?{...m,image:m.approvedDisplay.image}:m);if(variant35)murals=applyRouteCase(murals,selectedCase.id);const started=performance.now();while(!frame.contentWindow?.v24a?.ready){if(frame.contentWindow?.hybrid?.failed||performance.now()-started>65000)throw Error('建筑加载失败，请检查 localhost 服务后刷新');await new Promise(r=>setTimeout(r,100));}w=frame.contentWindow;h=w.hybrid;const style=w.document.createElement('style');style.textContent=`.entry-header,.entry-footer,#mural-copy,#debug,#mural-debug,.v24a-label{display:none!important}#mural-cue{font-size:${variant35?44:76}px;font-weight:600;letter-spacing:.035em;color:rgba(193,195,186,.58)}#status{top:90px}#gallery{background:#141b1e}`;w.document.head.append(style);
 // Instance-only light curve; original source, timing and state transitions remain intact.
 const setBrightness=h.model.mural.setBrightness.bind(h.model.mural);h.model.mural.setBrightness=(v,notify)=>{const t=Math.max(0,Math.min(1,(v-.14)/.86)),u=t*t*t*(10+t*(-15+6*t));return setBrightness(.14+.86*u,notify);};
 for(const stop of h.stops){const b=document.createElement('button');b.textContent=stop.label;b.dataset.stop=stop.id;b.onclick=async()=>{if(busy)return;setBusy(true);try{paintView('A');await goSpace(stop.id);}catch(e){message(e.message);}finally{setBusy(false);}};$('#stops').append(b);}
 T=await w.document.querySelector('#temple').contentWindow.eval("import('/module-a/immersive-hybrid-v1/vendor/three.module.js')");if(variant35)preparation=installPreparation(h.model,w.document.querySelector('#temple').contentWindow.shuilongTemple.getSharedWorldIdentity().renderer);finish=installInteriorFinish(h.model,T);if(variant33)await initializeRear33();await goSpace('overview');ready=true;await chooseDirection(direction,{initial:true});await updateMuralUI();paintView('A');paintPosition();if(variant35&&!returnMatchesCase(sessionStorage.getItem('shuilongci-v3-return'),selectedCase.id))sessionStorage.removeItem('shuilongci-v3-return');if(sessionStorage.getItem('shuilongci-v3-return')){if(variant35){setBusy(true);try{await rearGallery.restoreDock(4);await reading();sessionStorage.removeItem('shuilongci-v3-return');message('已恢复第五铺阅读。');}catch(e){message('第五铺恢复未完成，可刷新重试：'+e.message);}finally{setBusy(false);}}else{initializing=false;setBusy(false);const reduced=$('#reduced').checked;$('#reduced').checked=true;for(let i=1;i<=4;i++)if(!await travelTo(i))break;if(activeMural===4)await navigate('C');$('#reduced').checked=reduced;sessionStorage.removeItem('shuilongci-v3-return');if(activeMural===4)message('已恢复第五铺阅读。');}}initializing=false;$('#loading').hidden=true;setBusy(false);}
setBusy(true);
initialize().catch(e=>{$('#loading p').textContent=`${e.message}。刷新可重试。`;const a=document.createElement('a');a.href='../../v24.html';a.textContent='打开原展厅 →';$('#loading').append(a);});
addEventListener('pagehide',e=>{if(!e.persisted){layer?.dispose();finish?.dispose();detailAnimation?.cancel();if(wallPlane){wallPlane.removeFromParent();wallPlane.geometry.dispose();wallPlane.material.map?.dispose();wallPlane.material.dispose();wallPlane=null;}} });

async function updateMuralUI(){
 const m=murals[activeMural];body.dataset.muralIndex=String(activeMural);
 await loadMuralImages([$('#reading-image'),$('#detail-image'),$('#minimap img')],m.image,m.title);const img=$('#reading-image');setImageSize(img.naturalWidth,img.naturalHeight);
 $('#minimap svg').setAttribute('viewBox',`0 0 ${img.naturalWidth} ${img.naturalHeight}`);$('#minimap').style.aspectRatio=`${img.naturalWidth}/${img.naturalHeight}`;if(variant35)$('#minimap').style.width=Math.min(220,80*img.naturalWidth/img.naturalHeight)+'px';
 if(variant33){$('#detail .detail-head .eyebrow').textContent=`图像 0${activeMural+1} / 局部观察`;$('#reading-image').alt=m.title+'完整真实图像';$('#detail-image').alt=m.title+'，可缩放和平移查看真实细节';}
 $('#reading h1').textContent=m.title;$('#reading .eyebrow').textContent=`图像 0${activeMural+1} / ${m.wall}`;
 $('#reading dd').textContent=m.wall;
 $('#reading figcaption span:first-child').textContent=m.title+' / 全幅';$('#reading figcaption span:last-child').textContent='水龙祠';
 $('#reading .reading-lead').textContent=activeMural===2?'留存的色线，与墙面痕迹。':activeMural===3?'沿轮廓，观察图像。':'从完整图像，走近细节。';
 // m.note, registration and source remain internal; never bind them to audience copy.
 $('#spatial-kicker').textContent=`0${activeMural+1} / 05 · ${m.wall}`;$('#spatial-note').textContent='循着墙面，走近壁画。';
 $('#observations').hidden=activeMural!==0;$('.observation>.eyebrow').textContent=activeMural===0?'图像观察 / 三处线索':'图像观察 / 自由查看';
 $('#detail').setAttribute('aria-label',m.title+'图像细读');$('#reading').setAttribute('aria-label',m.title+'完整阅读');
 $('#continue-tour').textContent=activeMural===4?'继续探索入将图 ↗':`继续前往${murals[activeMural+1].title.replace('《入将图》','')} →`;
 updateObservation(null);detail={zoom:1,x:0,y:0};
}
async function probeRoute(){
 const poses=[{id:'actual-first-return',...h.sample(2)},...WAYPOINTS];
 return poses.slice(1).map((b,i)=>({from:poses[i].id,to:b.id,hits:segmentHits(h.model,poses[i].position,b.position)}));
}
async function movePose(end){
 const start=h.model.pose,hits=segmentHits(h.model,start.position,end.position);
 if(hits.length)throw Error('相机候选段存在建筑遮挡，已停止前行');
 if(start.route12!=null)routeLayer?.setEnabled(false);
 const duration=motion()?120:Math.max(650,Math.hypot(...start.position.map((x,i)=>x-end.position[i]))*240);
 await new Promise(resolve=>{let began;function tick(now){began??=now;const u=Math.min(1,(now-began)/duration),t=u*u*(3-2*u);h.model.setCamera(lerpPose(start,end,t),{immediate:true});if(u<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
}
async function placeCandidate(){
 wallPlane?.removeFromParent();wallPlane?.geometry.dispose();wallPlane?.material.map?.dispose();wallPlane?.material.dispose();wallPlane=null;
 if(!activeMural)return;
 const m=murals[activeMural];
 if(activeMural===1){await createSecondWall();await revealSecond();return;}
 $('#second-wall-label').hidden=true;
 // Unrectified site photos are read as photos, never pasted as reconstructed wall murals.
 if(m.registration==='photo-unrectified')return;
 const tex=await new T.TextureLoader().loadAsync(m.image);tex.colorSpace=T.SRGBColorSpace;
 const ratio=tex.image.width/tex.image.height,height=Math.min(m.height,m.width/ratio);
 wallPlane=new T.Mesh(new T.PlaneGeometry(height*ratio,height),new T.MeshBasicMaterial({map:tex,transparent:true,opacity:.12,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2}));
 wallPlane.position.fromArray(m.position);wallPlane.rotation.y=m.rotation;
 let scene=h.model.root;while(scene.parent)scene=scene.parent;scene.add(wallPlane);
 if(motion()){wallPlane.material.opacity=1;h.model.renderFrame();return;}
 await new Promise(resolve=>{let began;function tick(now){began??=now;const u=Math.min(1,(now-began)/1100);wallPlane.material.opacity=.12+.88*u*u*(3-2*u);h.model.renderFrame();if(u<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
}
async function travelTo(index){
 if(!ready||busy||index<0||index>4||Math.abs(index-activeMural)!==1)return false;
 setBusy(true);message('');const prior=activeMural,priorView=view,savedPose=h.model.pose;
 try{
  if(rearGallery?.handles(prior,index))return await rearGallery.travelTo(index);
  // Exit original first-mural state through its existing reverse path before taking the new rail.
  if(prior===0&&index===1)return await travelFirstSecond(false);
  if(prior===1&&index===0)return await travelFirstSecond(true);
  if(activeMural===1){$('#second-wall-label').hidden=true;await movePose(WAYPOINTS[6]);}
  if(activeMural===0){await goSpace('corridor-2_5d');await movePose(WAYPOINTS[0]);}
  paintView('A');wallPlane&&(wallPlane.visible=false);layer?.setMode('original');finish?.setEnabled(true);
  for(const p of routeSlice(activeMural,index))await movePose(p);
  if(index===0){await movePose({...h.sample(2),time:3});activeMural=0;await updateMuralUI();await placeCandidate();await chooseDirection(direction);paintView('A');await goSpace('mural-look');if(h.state==='mural-reading')await goSpace('mural-look');paintView('B');}
  else{activeMural=index;if(index===1){await ensureRoute32();await movePose(rail.sample(1));routeLayer?.update(rail.sample(1));routeLayer?.setEnabled(true);}await updateMuralUI();await placeCandidate();paintView('B');}
  paintPosition();return true;
 }catch(e){message(e.name==='MuralImageError'?e.message+'。已保留上一铺，可再次点击继续。':e.message+'。该段尚未打通，可返回上一空间。');activeMural=prior;h.model.setCamera(savedPose,{immediate:true});let restored=false;try{await updateMuralUI();if(rearGallery?.isRear(prior))await rearGallery.restore(prior);else await placeCandidate();restored=true;}catch{}wallPlane&&(wallPlane.visible=true);paintView(e.name==='MuralImageError'&&priorView==='C'&&restored?'C':'B');return false;}finally{delete body.dataset.routeTravel;setBusy(false);}
}
$('#continue-tour').onclick=async()=>{
 if(activeMural<4)return travelTo(activeMural+1);
 if(busy)return;setBusy(true);
 try{if(await explorationAvailable()){sessionStorage.setItem('shuilongci-v3-return',variant35?returnMarker(selectedCase.id):'mural-05');location.assign(EXPLORATION_URL);}else message('入将图探索服务暂不可达。请启动模块 B 后重试。');}finally{setBusy(false);}
};
$('#route-open').onclick=()=>{
 const list=$('#route-list');list.replaceChildren();for(const m of murals){const li=document.createElement('li');li.textContent=`${m.title} · ${m.wall}`;list.append(li);}if(variant35)$('#route-case-note').textContent=selectedCase.label+'：'+selectedCase.summary+'。两套空间方案待核对；切换后从入口重新参观。';$('#route-dialog').showModal();
};
$('#route-close').onclick=()=>$('#route-dialog').close();
addEventListener('pageshow',e=>{if(e.persisted&&sessionStorage.getItem('shuilongci-v3-return')){sessionStorage.removeItem('shuilongci-v3-return');message('已返回第五铺，可继续查看或返回墙面。');}});

async function ensureRoute32(){
 rail??=createRail(h.sample(2));
 if(!variant35||!routeValidated){const hits=rail.validate(h.model);if(hits.length)throw Error('V3.2 曲线路径存在遮挡');routeValidated=true;}
 if(!routeLayer)try{routeLayer=await installRouteSurfaces(h.model,T);routeError=null;}catch(e){routeError=e.message;message('沿途 AI 素材加载失败，保留建筑原材质。可返回重试。');}
}
function sceneRoot(){let s=h.model.root;while(s.parent)s=s.parent;return s;}
async function createSecondWall(){
 const m=murals[1],texture=await new T.TextureLoader().loadAsync($('#reading-image').currentSrc||m.image);texture.colorSpace=T.SRGBColorSpace;
 const height=Math.min(m.height,m.width/(texture.image.width/texture.image.height));
 wallPlane=new T.Mesh(new T.PlaneGeometry(height*texture.image.width/texture.image.height,height),new T.MeshBasicMaterial({map:texture,color:new T.Color(.12,.115,.105),transparent:true,opacity:1,toneMapped:false,fog:true,depthTest:true,polygonOffset:true,polygonOffsetFactor:-2}));
 wallPlane.name='V32-real-second-mural-candidate';wallPlane.position.fromArray(m.position);wallPlane.rotation.y=m.rotation;sceneRoot().add(wallPlane);wallPlane.updateMatrixWorld(true);setSecondReveal(0,false);await h.model.prepareAssets?.(wallPlane,[texture]);
}
function secondCorners(){if(!wallPlane||!T||activeMural>1)return null;wallPlane.updateMatrixWorld(true);h.model.camera.updateMatrixWorld();const g=wallPlane.geometry.parameters,w=g.width/2,hg=g.height/2;return [[-w,hg],[w,hg],[w,-hg],[-w,-hg]].map(([x,y])=>{const v=new T.Vector3(x,y,0).applyMatrix4(wallPlane.matrixWorld).project(h.model.camera);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2,depth:v.z};});}
function positionSecondLabel(){
 const label=$('#second-wall-label');if(!wallPlane||!T)return;
 // Match the first cue's displayed type scale, including its wall projection.
 const first=w.getComputedStyle(w.document.querySelector('#mural-cue')),pose=FIRST_FRONT_DOCK.discoveryCamera;
 const reference=new T.PerspectiveCamera(pose.fov,innerWidth/innerHeight,.045,180);reference.position.fromArray(pose.position);reference.lookAt(...pose.target);reference.updateProjectionMatrix();
 const {points}=projectWallCue(reference,{left:0,top:0,width:innerWidth,height:innerHeight},{left:0,top:0});
 const scale=(Math.hypot(points[3][0]-points[0][0],points[3][1]-points[0][1])+Math.hypot(points[2][0]-points[1][0],points[2][1]-points[1][1]))/220;
 label.style.fontFamily=first.fontFamily;label.style.fontWeight=first.fontWeight;label.style.fontSize=String(parseFloat(first.fontSize)*scale)+'px';label.style.lineHeight=first.lineHeight==='normal'?'normal':String(parseFloat(first.lineHeight)/parseFloat(first.fontSize));label.style.letterSpacing=String(parseFloat(first.letterSpacing)*scale)+'px';
 const anchor=new T.Vector3(murals[1].position[0],2.88,murals[1].position[2]).project(h.model.camera);label.style.left=String((anchor.x+1)*innerWidth/2)+'px';label.style.top=String((1-anchor.y)*innerHeight/2)+'px';
 if(variant35&&activeMural===1){const p=visual35.titlePlacement(secondCorners(),innerWidth,innerHeight);label.style.left=p.x+'px';label.style.top=p.y+'px';}
}
function setSecondReveal(value,render=true){secondReveal=Math.max(0,Math.min(1,value));if(!wallPlane)return;const u=ease(secondReveal);wallPlane.material.color.setRGB(.12+.51*u,.115+.505*u,.105+.49*u);if(variant35)wallPlane.material.color.setRGB(...visual35.wallColor(1,secondReveal));wallPlane.material.opacity=1;const label=$('#second-wall-label');label.hidden=secondReveal<.17;label.style.opacity=String(variant35?visual35.titleOpacity(secondReveal):smooth(.17,.38,secondReveal));positionSecondLabel();secondStatus=secondReveal===0?'dark':secondReveal<.42?'title':secondReveal<1?'revealing':'lit';if(render)h.model.renderFrame();}
async function animate32(duration,apply,spatial=false){if(motion()&&!spatial){apply(1);return;}await new Promise(resolve=>{let began;function tick(now){began??=now;const t=Math.min(1,(now-began)/duration);apply(t);if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});}
async function revealSecond(){secondStatus='dark';await animate32(2400,t=>setSecondReveal(t));}
function applyRail(progress){routeProgress=progress;const pose=rail.sample(progress);routeLayer?.update(pose);h.model.setCamera(pose,{immediate:true});if(wallPlane)positionSecondLabel();$('#location-label').textContent=progress<.12?'离开第一铺':progress<.57?'沿东廊前行':progress<.8?'经过主殿转角':'走近第二铺';$('.rail i').style.width=`${20+progress*20}%`;}
async function seekRoute32(progress,{reveal=0}={}){if(busy)return false;await goSpace('corridor-2_5d');await ensureRoute32();layer?.setMode('original');finish?.setEnabled(true);routeLayer?.setEnabled(true);activeMural=1;await updateMuralUI();if(!wallPlane)await createSecondWall();paintView('A');applyRail(progress);setSecondReveal(reveal);return true;}
async function travelFirstSecond(reverse){
 await ensureRoute32();
 if(!reverse){
  if(view==='D')paintView('C');
  if(view==='C'){body.dataset.readingExit='true';await syncReading(false);}
  paintView('B');await goSpace('corridor-2_5d');
  paintView('A');body.dataset.routeTravel='true';layer?.setMode('original');finish?.setEnabled(true);routeLayer?.setEnabled(true);
  activeMural=1;await updateMuralUI();await createSecondWall();
  await animate32(rail.length/1.45*1000,t=>applyRail(ease(t)),true);
  paintView('B');await revealSecond();
 }else{
  if(view==='D')paintView('C');if(view==='C'){body.dataset.readingExit='true';await secondReadingBridge(false);}
  paintView('B');await animate32(700,t=>setSecondReveal(1-t));$('#second-wall-label').hidden=true;
  paintView('A');body.dataset.routeTravel='true';routeLayer?.setEnabled(true);
  await animate32(rail.length/1.45*1000,t=>applyRail(1-ease(t)),true);
  wallPlane?.removeFromParent();wallPlane?.geometry.dispose();wallPlane?.material.map.dispose();wallPlane?.material.dispose();wallPlane=null;
  routeLayer?.setEnabled(false);activeMural=0;await updateMuralUI();if(variant35){layer?.setMode(['A','B'].includes(direction)?'hybrid':'original');w.v24a.layer?.setMode(direction==='current'?'hybrid':'original');finish?.setEnabled(['A','B'].includes(direction));}else await chooseDirection(direction);await goSpace('mural-look');paintView('B');
 }
 delete body.dataset.routeTravel;paintPosition();return true;
}
// Compute the current wall rectangle from the SECOND mural mesh and live camera.
// At the face-on dock it is a rectangle; oblique/clipped views use a documented
// reversible image bridge instead of inventing first-mural corner coordinates.
async function secondReadingBridge(enter){
 if(motion())return;const image=$('#reading-image');if(variant35)return photoBridge(image,secondCorners(),enter);await image.decode();const r=image.getBoundingClientRect(),ratio=image.naturalWidth/image.naturalHeight,w=Math.min(r.width,r.height*ratio),height=w/ratio;
 const target={x:r.left+(r.width-w)/2,y:r.top+(r.height-height)/2,w,h:height},q=secondCorners();if(!q)return;
 const left=Math.min(...q.map(p=>p.x)),right=Math.max(...q.map(p=>p.x)),top=Math.min(...q.map(p=>p.y)),bottom=Math.max(...q.map(p=>p.y));
 const source={x:left,y:top,w:right-left,h:bottom-top},aligned=Math.abs(q[0].y-q[1].y)<2&&Math.abs(q[1].x-q[2].x)<2&&left>=0&&right<=innerWidth;
 const bridge=image.cloneNode();bridge.removeAttribute('id');bridge.className='second-reading-bridge';bridge.style.cssText+=`left:0;top:0;width:${w}px;height:${height}px;`;document.body.append(bridge);image.style.visibility='hidden';body.dataset.bridge=aligned?'projected-second-dock':'soft-reversible-fallback';
 const transform=p=>`translate(${p.x}px,${p.y}px) scale(${p.w/w},${p.h/height})`,a={transform:transform(source),filter:'brightness(.78)'},b={transform:transform(target),filter:'brightness(1)'};
 try{await bridge.animate(enter?[a,b]:[b,a],{duration:aligned?760:380,easing:'cubic-bezier(.25,.1,.2,1)',fill:'both'}).finished;}finally{bridge.remove();image.style.visibility='';}
}
addEventListener('resize',()=>{if(activeMural===1)positionSecondLabel();});
addEventListener('pagehide',e=>{if(!e.persisted){routeLayer?.dispose();rearGallery?.dispose();}});

// V3.3 is an optional, lazily loaded extension. V3.2 keeps its original data and UI.
if(variant35){const select=$('#route-layout');select.value=selectedCase.id;select.addEventListener('change',()=>{if(busy||!ready)return;const next=routeCase(select.value),url=new URL(location.href);url.searchParams.set('layout',next.id);sessionStorage.removeItem('shuilongci-v3-return');location.assign(url.href);});$('#route-case-note').textContent='两套空间方案待核对；切换后从入口重新参观。';const brand=$('.brand');const home=new URL(brand.href);home.searchParams.set('layout',selectedCase.id);brand.href=home.href;}
async function initializeRear33(){
 const {createRearGallery}=await import('./gallery-v3.3.mjs');
 const fifth=['v34','v35'].includes(body.dataset.variant)?(await import('./fifth-v3.4.mjs')).fifth:null;
 rearGallery=createRearGallery({runtime:h.model,T,murals,motion,fifth,routeCase:selectedCase,rails:variant35&&selectedCase.id==='report'?reportRails():null,visual:variant35?visual35:null,
  active:()=>activeMural,view:()=>view,setView:paintView,
  async activate(index){activeMural=index;await updateMuralUI();},
  async exitReading(){if(view==='D')paintView('C');if(view==='C'){body.dataset.readingExit='true';await syncReading(false);}},
  prepare(){layer?.setMode('original');finish?.setEnabled(true);routeLayer?.setEnabled(false);if(variant35&&wallPlane)setSecondReveal(0,false);$('#second-wall-label').hidden=true;},
  async showBase(index){if(index===1){await ensureRoute32();routeLayer?.update(rail.sample(1));routeLayer?.setEnabled(true);if(wallPlane?.name==='V32-real-second-mural-candidate'){wallPlane.visible=true;setSecondReveal(1);return;}}await placeCandidate();},
  labelStyle(){const el=$('#second-wall-label');positionSecondLabel();return {fontFamily:el.style.fontFamily,fontWeight:el.style.fontWeight,fontSize:el.style.fontSize,lineHeight:el.style.lineHeight,letterSpacing:el.style.letterSpacing};},
  paintPosition,message,
 });
}
