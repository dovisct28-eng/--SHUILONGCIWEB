import { orbitLayout, cropWindows, LAYOUT_VERSION, seededRandom, panelBounds, projectOccupancy, intersects } from './orbit-layout.mjs';
import { surfaceConfig, treatPanel } from './mural-surface.mjs';
export { orbitLayout } from './orbit-layout.mjs';

// Compatibility helper for existing test/tool callers; runtime uses the shared scan.
export function detailWindows(pixels,width,height,bounds) {
 const n=24,counts=Array(n*n).fill(0);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[(y*width+x)*4+3]>=1)counts[Math.min(n-1,Math.floor(y/height*n))*n+Math.min(n-1,Math.floor(x/width*n))]++;
 return cropWindows({grid:{size:n,counts}},width,height,bounds).slice(0,3);
}
const ns='http://www.w3.org/2000/svg';
const svgEl=(tag,attrs={})=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;};
// Presentation uses the HF-02 result as a reservation, never changes its search.
export function panelPresentation(layout,input) {
 const random=seededRandom(input.id+'|hf04'),ranked=layout.panels.filter(p=>p.content!=='contour').map(p=>({id:p.content,rank:random()})).sort((a,b)=>a.rank-b.rank);
 const occupied=projectOccupancy(input.geometry,input.projection,input.effective);
 occupied.push({x:input.effective.x+input.effective.width*.3,y:input.effective.y+input.effective.height*.28,width:input.effective.width*.4,height:input.effective.height*.44});
 const safe=layout.safe;
 return layout.panels.map(p=>{
  const index=ranked.findIndex(r=>r.id===p.content),tier=p.content==='contour'?'contour':index===0?'primary':index<3?'secondary':'tertiary';
  const scale=(tier==='primary'?1.12:tier==='secondary'?.96:.86)*(1+(random()-.5)*.08),angle=(random()-.5)*2.4;
  const amplitude=tier==='primary'?12+random()*12:tier==='secondary'?8+random()*10:5+random()*7;
  const driftX=amplitude*(random()>.5?1:-1),driftY=amplitude*.8*(random()>.5?1:-1);
  const rotation=tier==='primary'?.7:tier==='secondary'?.5:.3,depth=tier==='primary'?.015:tier==='secondary'?.01:.005;
  let result;
  // Reserve the complete focus + drift envelope, rotated corners and connectors.
  // In tight space reduce decoration first; never shrink the main figure.
  for(const fit of [1,.96,.92,.88,.82,.76,.68,.60]){
   const width=p.width*scale*fit,height=p.height*scale*fit;
   const candidate={...p,width,height,x:p.x+(p.width-width)/2,y:p.y+(p.height-height)/2,angle};
   const expansion=(1+depth)*1.065;
   const envelope=panelBounds({...candidate,width:width*expansion,height:height*expansion,x:candidate.x-width*(expansion-1)/2,y:candidate.y-height*(expansion-1)/2,angle:Math.abs(angle)+rotation},7);
   envelope.x-=Math.abs(driftX);envelope.y-=Math.abs(driftY);envelope.width+=Math.abs(driftX)*2;envelope.height+=Math.abs(driftY)*2;
   if(safe&&envelope.x>=safe.x&&envelope.y>=safe.y&&envelope.x+envelope.width<=safe.x+safe.width&&envelope.y+envelope.height<=safe.y+safe.height&&!occupied.some(r=>intersects(envelope,r,10))&&!input.forbidden?.some(r=>intersects(envelope,r,12))&&!layout.panels.some(q=>q!==p&&intersects(envelope,panelBounds(q),16))){result={...candidate,envelope,driftX,driftY};break;}
  }
  // Original reservation is proven safe; fit within it when no extra margin exists.
  result ||= {...p,width:p.width*.86,height:p.height*.86,x:p.x+p.width*.07,y:p.y+p.height*.07,angle:0,driftX:0,driftY:0,envelope:panelBounds(p)};
  return {...result,tier,rotation:result.driftX?rotation:0,depth:result.driftX?depth:0,opacity:tier==='primary'?.94:tier==='secondary'?.73:tier==='tertiary'?.49:.40,period:tier==='primary'?7+random()*4:tier==='secondary'?9+random()*5:12+random()*4,phase:-random()*14,focusRank:random()};
 });
}
export class OrbitStage {
 constructor(root,tween,reduced) {
  this.root=root;this.tween=tween;this.reduced=reduced;this.panels=[];this.cache=new Map();this.sourceVersion=0;
  this.svg=svgEl('svg',{'class':'orbit-lines',preserveAspectRatio:'none'});root.append(this.svg);
  const defs=svgEl('defs');this.mask=svgEl('mask',{id:'b03-orbit-safe-mask',maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse'});this.maskSafe=svgEl('rect',{fill:'white'});this.mask.append(this.maskSafe);defs.append(this.mask);this.svg.append(defs);
  this.maskBlocks=Array.from({length:12},()=>{const el=svgEl('rect',{fill:'black'});this.mask.append(el);return el;});
  this.rings=svgEl('g',{'class':'orbit-rings'});this.svg.append(this.rings);
  this.main=svgEl('ellipse',{'class':'orbit-main'});this.aux=svgEl('ellipse',{'class':'orbit-aux'});this.floor=svgEl('ellipse',{'class':'orbit-floor'});
  this.energy=svgEl('ellipse',{'class':'orbit-energy',pathLength:1});
  this.rings.append(this.main,this.aux,this.floor,this.energy);this.links=svgEl('g',{'class':'orbit-links'});this.svg.append(this.links);
  this.travel=svgEl('path',{'class':'orbit-travel',pathLength:1});this.links.append(this.travel);
  this.swipe=svgEl('path',{'class':'orbit-swipe',pathLength:1});this.rings.append(this.swipe);
  this.rings.setAttribute('mask','url(#b03-orbit-safe-mask)');this.links.setAttribute('mask','url(#b03-orbit-safe-mask)');
  // Reuse a fixed pool; no DOM churn, GL textures or extra animation loop.
  for(let i=0;i<5;i++) {
   const el=document.createElement('div');el.className=`orbit-panel orbit-${['detail-a','fragment','detail-b','contour','detail-a'][i]}`;el.dataset.panel=String(i);
   const motion=document.createElement('div');motion.className='orbit-panel-motion';
   const focus=document.createElement('div');focus.className='orbit-panel-focus';
   const canvas=document.createElement('canvas');focus.append(canvas);motion.append(focus);el.append(motion);root.append(el);
   const line=svgEl('path'),node=svgEl('circle',{r:3});this.links.append(line,node);
   this.panels.push({el,motion,focus,canvas,line,node,emphasis:{value:0,signal:0},entry:{panel:1,link:1,node:1,retreat:0},position:{x:0,y:0,width:1,height:1,angle:0,opacity:0}});
  }
  this.geometry={cx:0,cy:0,rx:1,ry:1,fx:0,fy:0,frx:1,fry:1};this.presentation={arc:1};this.reset();
  this.onVisibility=()=>{if(document.hidden)this.settle();else this.resumeMotion();};document.addEventListener('visibilitychange',this.onVisibility);
  reduced.addEventListener('change',()=>{if(reduced.matches)this.settle();else this.resumeMotion();});
 }
 stopMotion(preserveAck=false) {
  this.focusCall?.kill();this.focusCall=null;this.focusTween?.kill();this.focusTween=null;this.readyCall?.kill();this.readyCall=null;
  if(!preserveAck){this.ackTween?.kill();this.ackTween=null;this.swipe.style.opacity='0';this.tween.set(this.rings,{scale:1});}
  this.root.dataset.motion='paused';delete this.root.dataset.focus;this.travel.style.opacity='0';
  for(const p of this.panels){p.emphasis.value=p.emphasis.signal=0;p.focus.style.transform='';p.focus.style.filter='';this.drawPanel(p);}
  this.drawRings();
 }
 resumeMotion() {
  if(!this.active||!this.currentLayout||this.phase!=='stable'||this.reduced.matches||this.degraded||document.hidden)return;
  this.root.dataset.motion='stable';
  if(this.root.dataset.revealed==='true')return;
  if(this.focusCall||this.focusTween)return;
  const random=seededRandom(this.characterId+'|cadence|'+this.focusIndex);
  this.focusCall=this.tween.delayedCall(3.5+random()*2-(this.focusIndex?1.6:0),()=>{this.focusCall=null;this.focusNext();});
 }
 focusNext() {
  if(this.root.dataset.motion!=='stable')return;
  const available=this.panels.filter(p=>p.position.opacity>0&&['primary','secondary'].includes(p.el.dataset.tier)).sort((a,b)=>a.position.focusRank-b.position.focusRank);
  if(!available.length)return;
  const p=available[this.focusIndex++%available.length];this.root.dataset.focus=p.el.dataset.panel;
  // One owned event combines focus and connector travel; never two strong events.
  this.travel.setAttribute('d',p.line.getAttribute('d'));this.travel.style.strokeDashoffset='0';
  this.focusTween=this.tween.timeline({onComplete:()=>{this.focusTween=null;delete this.root.dataset.focus;this.travel.style.opacity='0';this.resumeMotion();}})
   .to(p.emphasis,{signal:1,duration:.15,onUpdate:()=>this.drawRings()},0)
   .to(this.travel,{opacity:.95,duration:.10},.15)
   .to(this.travel,{strokeDashoffset:-.93,duration:.25,ease:'power2.inOut'},.15)
   .to(this.travel,{opacity:0,duration:.2},.4)
   .to(p.emphasis,{value:1,duration:.45,ease:'sine.inOut',onUpdate:()=>this.drawRings()},.4)
   .to(p.emphasis,{value:0,signal:0,duration:.5,ease:'sine.inOut',onUpdate:()=>this.drawRings()},1.1);
 }
 acknowledge(revealed) {
  this.stopMotion();if(!this.active||this.reduced.matches||this.degraded)return;
  this.rings.style.transformOrigin=`${this.geometry.cx}px ${this.geometry.cy}px`;
  this.ackTween=this.tween.timeline({onComplete:()=>{this.ackTween=null;this.rings.style.transform='';}})
   .to(this.rings,{scale:revealed?1.03:.98,duration:.22,ease:'power2.out'})
   .to(this.rings,{scale:1,duration:.24,ease:'power2.inOut',onComplete:()=>this.resumeMotion()});
 }
 acknowledgeSwipe() {
  this.stopMotion();if(!this.active||this.reduced.matches||this.degraded)return;
  const g=this.geometry;
  this.swipe.setAttribute('d',`M ${g.cx+g.rx} ${g.cy} A ${g.rx} ${g.ry} 0 1 1 ${g.cx-g.rx} ${g.cy} A ${g.rx} ${g.ry} 0 1 1 ${g.cx+g.rx} ${g.cy}`);
  this.swipe.style.strokeDashoffset='0';
  this.ackTween=this.tween.timeline({onComplete:()=>{this.ackTween=null;this.swipe.style.opacity='0';}}).to(this.swipe,{opacity:1,duration:.06}).to(this.swipe,{strokeDashoffset:-1,duration:.28,ease:'power2.out'},0).to(this.swipe,{opacity:0,duration:.1},.22);
 }
 leave() {
  if(!this.active)return;
  // Preserve an already acknowledged swipe during the short old-figure exit.
  this.stopMotion(true);
  this.phase='leaving';this.tween.killTweensOf(this.presentation);
  this.tween.to(this.presentation,{arc:.82,delay:.1,duration:.22,onUpdate:()=>this.drawRings()});
  for(const p of this.panels){this.tween.killTweensOf(p.entry);this.tween.to(p.entry,{panel:0,link:0,node:0,retreat:1,delay:.1,duration:.22,ease:'power2.in',onUpdate:()=>this.drawPanel(p)});}
 }
 reset() {
  this.stopMotion();this.phase='idle';this.focusIndex=0;
  this.sourceVersion++;this.active=false;this.root.hidden=true;this.contents=[];this.cache.clear();this.layouts={};this.currentLayout=null;
  this.tween.killTweensOf(this.geometry);
  this.tween.killTweensOf(this.presentation);this.presentation.arc=1;
  for(const p of this.panels){this.tween.killTweensOf(p.position);this.tween.killTweensOf(p.entry);Object.assign(p.entry,{panel:1,link:1,node:1});p.raw=null;p.position.opacity=0;p.canvas.width=p.canvas.height=0;p.el.style.opacity='0';p.line.style.opacity=p.node.style.opacity='0';p.motion.style.cssText='';delete p.el.dataset.content;delete p.el.dataset.character;}
 }
 setSource(image,bounds,measurement,item={}) {
  this.reset();this.characterId=item.id||'';
  try {
   const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
   const windows=cropWindows(measurement?.geometry,iw,ih,bounds);
   this.contourGeometry=measurement?.geometry;
   for(const r of windows) {
    const i=this.contents.length,c=this.panels[i].canvas;
    // Do not magnify low-resolution source snippets into large panel bitmaps.
    c.width=c.height=Math.max(1,Math.floor(Math.min(380,r.sourceEdge)));
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,r.x*iw,r.y*ih,r.width*iw,r.height*ih,0,0,c.width,c.height);
    const rgba=ctx.getImageData(0,0,c.width,c.height).data;let occupied=0;for(let j=3;j<rgba.length;j+=4)if(rgba[j]>=1)occupied++;
    const actualCoverage=occupied/(c.width*c.height);
    if(actualCoverage<.04){c.width=c.height=0;continue;}
    this.panels[i].raw=ctx.getImageData(0,0,c.width,c.height);
    this.contents.push({id:'crop-'+i,aspect:1,maxEdge:c.width,coverage:r.score,actualCoverage,window:r});
   }
   // Unregistered line/color sources never inherit figure crop coordinates.
   // The abstract contour is traced from this same figure's existing alpha.
   const i=this.contents.length,c=this.panels[i].canvas,ratio=bounds.width*iw/(bounds.height*ih);
   const contourScale=Math.min(1,320/(bounds.width*iw),320/(bounds.height*ih));
   c.width=Math.max(1,Math.round(bounds.width*iw*contourScale));c.height=Math.max(1,Math.round(bounds.height*ih*contourScale));
   const cc=c.getContext('2d',{willReadFrequently:true});cc.drawImage(image,bounds.x*iw,bounds.y*ih,bounds.width*iw,bounds.height*ih,0,0,c.width,c.height);
   const src=cc.getImageData(0,0,c.width,c.height),dst=cc.createImageData(c.width,c.height);
   const alpha=(x,y)=>x<0||y<0||x>=c.width||y>=c.height?0:src.data[(y*c.width+x)*4+3];
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(alpha(x,y)>=1&&[alpha(x-1,y),alpha(x+1,y),alpha(x,y-1),alpha(x,y+1)].some(a=>a<1)) {
    const j=(y*c.width+x)*4;dst.data.set([198,164,111,210],j);
   }
   cc.putImageData(dst,0,0);
   this.contents.push({id:'contour',aspect:ratio,maxEdge:Math.max(c.width,c.height),registration:'same-source-alpha'});
   this.contents.forEach((content,i)=>{this.panels[i].el.dataset.content=content.id;this.panels[i].el.dataset.character=this.characterId;this.panels[i].el.classList.toggle('orbit-contour',content.id==='contour');});
   this.active=true;this.phase='ready';this.root.hidden=false;
   this.root.style.setProperty('--orbit-direction','normal');this.root.style.setProperty('--aux-direction','reverse');
  } catch { this.reset(); } // Decorations cannot interrupt the main figure.
 }
 layout(input,immediate=false) {
  if(!this.active)return;
  const start=performance.now();
  const args={...input,id:this.characterId,geometry:this.contourGeometry,contents:this.contents};
  const key=JSON.stringify([LAYOUT_VERSION,this.sourceVersion,args.width,args.height,args.effective,args.projection,args.revealed,args.panelLeft,args.forbidden,args.orbit]);
  let layout=this.cache.get(key);
  if(!layout){layout=orbitLayout(args);this.cache.set(key,layout);if(this.cache.size>16)this.cache.delete(this.cache.keys().next().value);}
  this.layoutMs=performance.now()-start;this.currentLayout=layout;this.layouts[input.revealed?'revealedLayout':'defaultLayout']=layout;
  const wasStable=this.phase==='stable',enteringCall=this.phase==='entering'?this.readyCall:null;
  if(enteringCall)this.readyCall=null;
  this.stopMotion();if(enteringCall)this.readyCall=enteringCall;
  const presentation=panelPresentation(layout,args);
  const duration=immediate||this.reduced.matches?0:.65;
  this.root.dataset.revealed=String(input.revealed);this.root.dataset.template=layout.template;this.svg.setAttribute('viewBox',`0 0 ${input.width} ${input.height}`);
  for(const [k,v]of Object.entries({x:0,y:0,width:input.width,height:input.height}))this.mask.setAttribute(k,v);
  for(const [k,v]of Object.entries(layout.safe||{x:0,y:0,width:0,height:0}))this.maskSafe.setAttribute(k,v);
  this.maskBlocks.forEach((el,i)=>{const r=input.forbidden?.[i];for(const [k,v]of Object.entries(r?{x:r.x-12,y:r.y-12,width:r.width+24,height:r.height+24}:{x:0,y:0,width:0,height:0}))el.setAttribute(k,v);});
  this.rings.style.opacity=String(layout.intensity);
  const g=this.geometry;
  this.tween.to(g,{cx:layout.center.x,cy:layout.center.y,rx:layout.radius.x,ry:layout.radius.y,fx:layout.floor.x,fy:layout.floor.y,frx:layout.floor.rx,fry:layout.floor.ry,duration,ease:'power2.inOut',overwrite:true,onUpdate:()=>this.drawRings()});
  for(let i=0;i<this.panels.length;i++){
   const node=this.panels[i],p=presentation.find(p=>p.content===this.contents[i]?.id);
   this.tween.killTweensOf(node.position);
   // Fade in at safe endpoints after the figure move. No visible crossing paths.
   node.position.opacity=0;
   if(p){Object.assign(node.position,p,{opacity:duration?0:p.opacity});node.el.dataset.tier=p.tier;node.motion.style.cssText=`--drift-x:${p.driftX}px;--drift-y:${p.driftY}px;--drift-rotation:${p.rotation}deg;--depth-low:${1-p.depth};--depth-high:${1+p.depth};--drift-period:${p.period}s;--reading-period:${p.period/.7}s;--drift-phase:${p.phase}s;`;this.drawPanel(node);if(duration)this.tween.to(node.position,{opacity:p.opacity,delay:duration,duration:.15,overwrite:true,onUpdate:()=>this.drawPanel(node)});}
   else this.drawPanel(node);
  }
  if(wasStable){if(duration)this.readyCall=this.tween.delayedCall(duration+.15,()=>{this.readyCall=null;this.resumeMotion();});else this.resumeMotion();}
  return layout;
 }
 drawRings() {
  const g=this.geometry;
  const progress=this.presentation.arc,layout=this.currentLayout;
  if(layout){const signal=Math.max(0,...this.panels.map(p=>p.emphasis.signal));const pattern=[Math.max(8,layout.arcSpan*progress),layout.arcStart+74,118*progress,134+(1-progress)*400];this.main.style.strokeDasharray=pattern.join(' ');this.main.style.setProperty('--main-flow-length',-pattern.reduce((a,b)=>a+b,0)+'px');this.main.style.opacity=String((.58+signal*.06)*progress);this.aux.style.opacity=String(.26*progress);this.floor.style.opacity=String(.24*progress);}
  for(const [el,rx,ry] of [[this.main,g.rx,g.ry],[this.energy,g.rx,g.ry],[this.aux,g.rx*1.09,g.ry*.87]])for(const [k,v] of Object.entries({cx:g.cx,cy:g.cy,rx,ry}))el.setAttribute(k,v);
  this.aux.setAttribute('transform',`rotate(-18 ${g.cx} ${g.cy})`);
  for(const [k,v] of Object.entries({cx:g.fx,cy:g.fy,rx:g.frx,ry:g.fry}))this.floor.setAttribute(k,v);
  for(const p of this.panels)this.drawPanel(p);
 }
 drawPanel({el,focus,emphasis,position:p,line,node,entry}) {
  const active=emphasis.value,signal=emphasis.signal,quiet=(this.root.dataset.focus&&this.root.dataset.focus!==el.dataset.panel) ? .94 : 1;
  const g=this.geometry,theta=Math.atan2(p.y+p.height/2-g.cy,p.x+p.width/2-g.cx),retreat=entry.retreat||0;
  // Clockwise tangential retirement stays inside the already reserved drift space.
  el.style.cssText=`width:${p.width}px;height:${p.height}px;transform:translate(${p.x-Math.sin(theta)*Math.min(8,Math.abs(p.driftX||0))*retreat}px,${p.y+Math.cos(theta)*Math.min(8,Math.abs(p.driftY||0))*retreat}px) rotate(${p.angle}deg) scale(${1-retreat*.06});opacity:${Math.min(1,p.opacity*(1+active*.12))*entry.panel*quiet}`;
  focus.style.transform=`scale(${1+active*.065})`;focus.style.filter=`brightness(${1+active*.20})`;focus.style.setProperty('--scan',active);
  const left=p.x+p.width/2<g.cx,x=left?p.x+p.width:p.x,y=p.y+p.height*.52;
  const endX=g.cx+(left?-1:1)*g.rx*.68,endY=g.cy+(y-g.cy)*.62;
  line.setAttribute('d',`M ${endX} ${endY} L ${(x+endX)/2} ${y} L ${x} ${y}`);
  node.setAttribute('cx',endX);node.setAttribute('cy',endY);line.style.opacity=String(entry.link*(p.opacity*.36+signal*.5));node.style.opacity=String(entry.node*Math.min(1,p.opacity*.45+signal*.65));node.setAttribute('r',3+signal*1.5);
 }
 setSurface(value) {
  this.surface=surfaceConfig(value);
  for(const p of this.panels)if(p.raw){const ctx=p.canvas.getContext('2d'),rgba=treatPanel(p.raw.data,p.canvas.width,p.canvas.height,this.surface);ctx.putImageData(new ImageData(rgba,p.canvas.width,p.canvas.height),0,0);}
 }
 enter(duration) {
  if(!this.active)return;
  const d=this.reduced.matches||this.degraded?0:duration;
  this.stopMotion();this.phase=d?'entering':'stable';
  this.tween.killTweensOf(this.presentation);this.presentation.arc=d?0:1;
  if(d)this.tween.to(this.presentation,{arc:1,delay:d*.25,duration:d*.7,overwrite:true,onUpdate:()=>this.drawRings()});
  const ordered=[...this.panels].sort((a,b)=>Math.atan2(a.position.y-this.geometry.cy,a.position.x-this.geometry.cx)-Math.atan2(b.position.y-this.geometry.cy,b.position.x-this.geometry.cx));
  ordered.forEach((p,i)=>{
   this.tween.killTweensOf(p.entry);Object.assign(p.entry,{panel:d?0:1,link:d?0:1,node:d?0:1,retreat:0});
   if(d){this.tween.to(p.entry,{node:1,delay:d*.36+i*.025,duration:d*.16,onUpdate:()=>this.drawPanel(p)});this.tween.to(p.entry,{panel:1,delay:d*.48+i*.025,duration:d*.22,onUpdate:()=>this.drawPanel(p)});this.tween.to(p.entry,{link:1,delay:d*.7+i*.025,duration:d*.18,onUpdate:()=>this.drawPanel(p)});}
  });this.drawRings();
  const completeAt=Math.max(d,d*.88+Math.max(0,ordered.length-1)*.025);
  if(d)this.readyCall=this.tween.delayedCall(completeAt,()=>{this.readyCall=null;this.phase='stable';this.resumeMotion();});else this.resumeMotion();
 }
 settle() {
  this.stopMotion();this.phase=this.active?'stable':'idle';
  this.tween.killTweensOf(this.presentation);this.presentation.arc=1;
  for(const p of this.panels){this.tween.killTweensOf(p.entry);Object.assign(p.entry,{panel:1,link:1,node:1,retreat:0});}this.drawRings();this.resumeMotion();
 }
 setDegraded(value) {this.degraded=value;this.root.dataset.degraded=String(value);if(value)this.settle();}
}
