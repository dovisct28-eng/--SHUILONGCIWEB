import { orbitLayout, cropWindows, LAYOUT_VERSION } from './orbit-layout.mjs';
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
export class OrbitStage {
 constructor(root,tween,reduced) {
  this.root=root;this.tween=tween;this.reduced=reduced;this.panels=[];this.cache=new Map();this.sourceVersion=0;
  this.svg=svgEl('svg',{'class':'orbit-lines',preserveAspectRatio:'none'});root.append(this.svg);
  const defs=svgEl('defs');this.mask=svgEl('mask',{id:'b03-orbit-safe-mask',maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse'});this.maskSafe=svgEl('rect',{fill:'white'});this.mask.append(this.maskSafe);defs.append(this.mask);this.svg.append(defs);
  this.maskBlocks=Array.from({length:12},()=>{const el=svgEl('rect',{fill:'black'});this.mask.append(el);return el;});
  this.rings=svgEl('g',{'class':'orbit-rings'});this.svg.append(this.rings);
  this.main=svgEl('ellipse',{'class':'orbit-main'});this.aux=svgEl('ellipse',{'class':'orbit-aux'});this.floor=svgEl('ellipse',{'class':'orbit-floor'});
  this.rings.append(this.main,this.aux,this.floor);this.links=svgEl('g',{'class':'orbit-links'});this.svg.append(this.links);
  this.rings.setAttribute('mask','url(#b03-orbit-safe-mask)');this.links.setAttribute('mask','url(#b03-orbit-safe-mask)');
  // Reuse a fixed pool; no DOM churn, GL textures or extra animation loop.
  for(let i=0;i<5;i++) {
   const el=document.createElement('div');el.className=`orbit-panel orbit-${['detail-a','fragment','detail-b','contour','detail-a'][i]}`;el.dataset.panel=String(i);
   const canvas=document.createElement('canvas');el.append(canvas);root.append(el);
   const line=svgEl('path'),node=svgEl('circle',{r:3});this.links.append(line,node);
   this.panels.push({el,canvas,line,node,entry:{panel:1,link:1,node:1},position:{x:0,y:0,width:1,height:1,angle:0,opacity:0}});
  }
  this.geometry={cx:0,cy:0,rx:1,ry:1,fx:0,fy:0,frx:1,fry:1};this.presentation={arc:1};this.reset();
 }
 reset() {
  this.sourceVersion++;this.active=false;this.root.hidden=true;this.contents=[];this.cache.clear();this.layouts={};this.currentLayout=null;
  this.tween.killTweensOf(this.geometry);
  this.tween.killTweensOf(this.presentation);this.presentation.arc=1;
  for(const p of this.panels){this.tween.killTweensOf(p.position);this.tween.killTweensOf(p.entry);Object.assign(p.entry,{panel:1,link:1,node:1});p.raw=null;p.position.opacity=0;p.canvas.width=p.canvas.height=0;p.el.style.opacity='0';p.line.style.opacity=p.node.style.opacity='0';delete p.el.dataset.content;delete p.el.dataset.character;}
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
   this.active=true;this.root.hidden=false;
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
  const duration=immediate||this.reduced.matches?0:.65;
  this.root.dataset.revealed=String(input.revealed);this.root.dataset.template=layout.template;this.svg.setAttribute('viewBox',`0 0 ${input.width} ${input.height}`);
  for(const [k,v]of Object.entries({x:0,y:0,width:input.width,height:input.height}))this.mask.setAttribute(k,v);
  for(const [k,v]of Object.entries(layout.safe||{x:0,y:0,width:0,height:0}))this.maskSafe.setAttribute(k,v);
  this.maskBlocks.forEach((el,i)=>{const r=input.forbidden?.[i];for(const [k,v]of Object.entries(r?{x:r.x-12,y:r.y-12,width:r.width+24,height:r.height+24}:{x:0,y:0,width:0,height:0}))el.setAttribute(k,v);});
  this.rings.style.opacity=String(layout.intensity);
  const g=this.geometry;
  this.tween.to(g,{cx:layout.center.x,cy:layout.center.y,rx:layout.radius.x,ry:layout.radius.y,fx:layout.floor.x,fy:layout.floor.y,frx:layout.floor.rx,fry:layout.floor.ry,duration,ease:'power2.inOut',overwrite:true,onUpdate:()=>this.drawRings()});
  for(let i=0;i<this.panels.length;i++){
   const node=this.panels[i],p=layout.panels.find(p=>p.content===this.contents[i]?.id);
   this.tween.killTweensOf(node.position);
   // Fade in at safe endpoints after the figure move. No visible crossing paths.
   node.position.opacity=0;
   if(p){Object.assign(node.position,p,{opacity:duration?0:p.opacity});this.drawPanel(node);if(duration)this.tween.to(node.position,{opacity:p.opacity,delay:duration,duration:.15,overwrite:true,onUpdate:()=>this.drawPanel(node)});}
   else this.drawPanel(node);
  }
  return layout;
 }
 drawRings() {
  const g=this.geometry;
  const progress=this.presentation.arc,layout=this.currentLayout;
  if(layout){this.main.style.strokeDasharray=`${Math.max(8,layout.arcSpan*progress)} ${layout.arcStart+74} ${118*progress} ${134+(1-progress)*400}`;this.aux.style.opacity=String(.16*progress);this.floor.style.opacity=String(.35*progress);}
  for(const [el,rx,ry] of [[this.main,g.rx,g.ry],[this.aux,g.rx*1.09,g.ry*.87]])for(const [k,v] of Object.entries({cx:g.cx,cy:g.cy,rx,ry}))el.setAttribute(k,v);
  this.aux.setAttribute('transform',`rotate(-18 ${g.cx} ${g.cy})`);
  for(const [k,v] of Object.entries({cx:g.fx,cy:g.fy,rx:g.frx,ry:g.fry}))this.floor.setAttribute(k,v);
  for(const p of this.panels)this.drawPanel(p);
 }
 drawPanel({el,position:p,line,node,entry}) {
  el.style.cssText=`width:${p.width}px;height:${p.height}px;transform:translate(${p.x}px,${p.y}px) rotate(${p.angle}deg);opacity:${p.opacity*entry.panel}`;
  const g=this.geometry,left=p.x+p.width/2<g.cx,x=left?p.x+p.width:p.x,y=p.y+p.height*.52;
  const endX=g.cx+(left?-1:1)*g.rx*.68,endY=g.cy+(y-g.cy)*.62;
  line.setAttribute('d',`M ${x} ${y} L ${(x+endX)/2} ${y} L ${endX} ${endY}`);
  node.setAttribute('cx',x);node.setAttribute('cy',y);line.style.opacity=String(p.opacity*entry.link*.58);node.style.opacity=String(p.opacity*entry.node*.58);
 }
 setSurface(value) {
  this.surface=surfaceConfig(value);
  for(const p of this.panels)if(p.raw){const ctx=p.canvas.getContext('2d'),rgba=treatPanel(p.raw.data,p.canvas.width,p.canvas.height,this.surface);ctx.putImageData(new ImageData(rgba,p.canvas.width,p.canvas.height),0,0);}
 }
 enter(duration) {
  if(!this.active)return;
  const d=this.reduced.matches||this.degraded?0:duration;
  this.tween.killTweensOf(this.presentation);this.presentation.arc=d?0:1;
  if(d)this.tween.to(this.presentation,{arc:1,delay:d*.25,duration:d*.7,overwrite:true,onUpdate:()=>this.drawRings()});
  this.panels.forEach((p,i)=>{
   this.tween.killTweensOf(p.entry);Object.assign(p.entry,{panel:d?0:1,link:d?0:1,node:d?0:1});
   if(d){this.tween.to(p.entry,{node:1,delay:d*.36+i*.025,duration:d*.16,onUpdate:()=>this.drawPanel(p)});this.tween.to(p.entry,{panel:1,delay:d*.48+i*.025,duration:d*.22,onUpdate:()=>this.drawPanel(p)});this.tween.to(p.entry,{link:1,delay:d*.7+i*.025,duration:d*.18,onUpdate:()=>this.drawPanel(p)});}
  });this.drawRings();
 }
 settle() {
  this.tween.killTweensOf(this.presentation);this.presentation.arc=1;
  for(const p of this.panels){this.tween.killTweensOf(p.entry);Object.assign(p.entry,{panel:1,link:1,node:1});}this.drawRings();
 }
 setDegraded(value) {this.degraded=value;this.root.dataset.degraded=String(value);if(value)this.settle();}
}
