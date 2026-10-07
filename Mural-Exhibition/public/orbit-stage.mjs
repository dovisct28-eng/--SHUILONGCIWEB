// HF-01: deterministic negative-space template. No semantic image recognition.
// This pure interface is the extension point for later contour occupancy layouts.
export function orbitLayout({width,height,effective,revealed=false,panelLeft=width}) {
 const e=effective, edge=36, gap=38, bottom=height-188;
 const leftRoom=Math.max(0,e.x-edge-gap),rightStart=e.x+e.width+gap;
 const rightRoom=Math.max(0,(revealed?panelLeft-32:width-edge)-rightStart);
 const panel=(id,side,y,w,h,angle,opacity)=>{
  const room=side==='left'?leftRoom:rightRoom;
  const pw=Math.min(w,room*.86),ph=h*pw/w;
  return {id,x:side==='left'?edge+(room-pw)*.42:rightStart+(room-pw)*.34,
   y:Math.max(122,Math.min(bottom-ph,y)),width:Math.max(1,pw),height:Math.max(1,ph),angle,
   opacity:room<76 || (revealed&&side==='right')?0:opacity};
 };
 const k=Math.min(1.25,width/1440),cy=e.y+e.height*.5;
 return {center:{x:e.x+e.width/2,y:cy},radius:{x:Math.min(width*.32,e.width*.64+85),y:Math.min((height-280)/2,e.height*.51)},
  floor:{x:e.x+e.width/2,y:e.y+e.height-2,rx:Math.max(90,e.width*.42),ry:10*k},
  panels:[panel('detail-a','left',cy-205*k,176*k,156*k,-5,.86),
   panel('fragment','left',cy+66*k,139*k,174*k,6,.68),
   panel('detail-b','right',cy-235*k,196*k,128*k,5,.78),
   panel('contour','right',cy+8*k,146*k,204*k,-6,.62)]};
}

// Pick occupied geometric windows only. Labels never infer face/clothing/objects.
export function detailWindows(pixels,width,height,bounds) {
 const result=[];
 for(const [lo,hi] of [[0,.28],[.32,.72],[.62,1]]) {
  let best=null;
  for(const size of [.34,.48])for(let y=Math.min(lo,1-size);y<=Math.min(1-size,hi-size*.45);y+=.1)for(let x=0;x<=1-size;x+=.12) {
   const r={x:bounds.x+x*bounds.width,y:bounds.y+y*bounds.height,width:bounds.width*size,height:bounds.height*size};
   let occupied=0,total=0;
   for(let iy=0;iy<14;iy++)for(let ix=0;ix<14;ix++){
    const px=Math.min(width-1,Math.floor((r.x+r.width*(ix+.5)/14)*width));
    const py=Math.min(height-1,Math.floor((r.y+r.height*(iy+.5)/14)*height));
    occupied+=pixels[(py*width+px)*4+3]>8?1:0;total++;
   }
   const score=occupied/total;
   if(!best||score>best.score)best={...r,score};
  }
  result.push(best);
 }
 return result;
}

const ns='http://www.w3.org/2000/svg';
const svgEl=(tag,attrs={})=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;};
export class OrbitStage {
 constructor(root,tween,reduced) {
  this.root=root;this.tween=tween;this.reduced=reduced;this.panels=[];
  this.svg=svgEl('svg',{'class':'orbit-lines',preserveAspectRatio:'none'});root.append(this.svg);
  this.rings=svgEl('g',{'class':'orbit-rings'});this.svg.append(this.rings);
  this.main=svgEl('ellipse',{'class':'orbit-main'});this.aux=svgEl('ellipse',{'class':'orbit-aux'});this.floor=svgEl('ellipse',{'class':'orbit-floor'});
  this.rings.append(this.main,this.aux,this.floor);this.links=svgEl('g',{'class':'orbit-links'});this.svg.append(this.links);
  for(const id of ['detail-a','fragment','detail-b','contour']) {
   const el=document.createElement('div');el.className=`orbit-panel orbit-${id}`;el.dataset.panel=id;
   const canvas=document.createElement('canvas');el.append(canvas);root.append(el);
   const line=svgEl('path'),node=svgEl('circle',{r:3});this.links.append(line,node);
   this.panels.push({el,canvas,line,node,position:{x:0,y:0,width:1,height:1,angle:0,opacity:0}});
  }
  this.geometry={cx:0,cy:0,rx:1,ry:1,fx:0,fy:0,frx:1,fry:1};this.reset();
 }
 reset() {
  this.active=false;this.root.hidden=true;
  this.tween.killTweensOf(this.geometry);
  for(const p of this.panels){this.tween.killTweensOf(p.position);p.canvas.width=p.canvas.height=0;}
 }
 setSource(image,bounds) {
  this.reset();
  try {
   const sample=document.createElement('canvas');sample.width=192;sample.height=192;
   const ctx=sample.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,192,192);
   const windows=detailWindows(ctx.getImageData(0,0,192,192).data,192,192,bounds);
   const iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;
   for(let i=0;i<3;i++) {
    const r=windows[i],c=this.panels[[0,2,1][i]].canvas;
    c.width=Math.round(380*Math.min(1,r.width*iw/(r.height*ih)));c.height=Math.round(380*Math.min(1,r.height*ih/(r.width*iw)));
    c.getContext('2d').drawImage(image,r.x*iw,r.y*ih,r.width*iw,r.height*ih,0,0,c.width,c.height);
   }
   // Abstract alpha boundary: trace only existing occupied pixels; no invented detail.
   const c=this.panels[3].canvas,ratio=bounds.width*iw/(bounds.height*ih);c.width=Math.max(1,Math.round(320*Math.min(1,ratio)));c.height=Math.max(1,Math.round(320*Math.min(1,1/ratio)));
   const cc=c.getContext('2d',{willReadFrequently:true});cc.drawImage(image,bounds.x*iw,bounds.y*ih,bounds.width*iw,bounds.height*ih,0,0,c.width,c.height);
   const src=cc.getImageData(0,0,c.width,c.height),dst=cc.createImageData(c.width,c.height);
   const alpha=(x,y)=>x<0||y<0||x>=c.width||y>=c.height?0:src.data[(y*c.width+x)*4+3];
   for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(alpha(x,y)>8&&[alpha(x-1,y),alpha(x+1,y),alpha(x,y-1),alpha(x,y+1)].some(a=>a<=8)) {
    const j=(y*c.width+x)*4;dst.data.set([198,164,111,210],j);
   }
   cc.putImageData(dst,0,0);sample.width=sample.height=0;
   this.active=true;this.root.hidden=false;
  } catch { this.reset(); } // Decorative decoding never interrupts the main figure.
 }
 layout(input,immediate=false) {
  if(!this.active)return;
  const layout=orbitLayout(input),duration=immediate||this.reduced.matches?0:.75;
  this.root.dataset.revealed=String(input.revealed);this.svg.setAttribute('viewBox',`0 0 ${input.width} ${input.height}`);
  const g=this.geometry;
  this.tween.to(g,{cx:layout.center.x,cy:layout.center.y,rx:layout.radius.x,ry:layout.radius.y,fx:layout.floor.x,fy:layout.floor.y,frx:layout.floor.rx,fry:layout.floor.ry,duration,ease:'power2.inOut',overwrite:true,onUpdate:()=>this.drawRings()});
  layout.panels.forEach((p,i)=>{
   const node=this.panels[i];
   const {id,...target}=p;
   this.tween.to(node.position,{...target,duration:p.opacity===0?Math.min(.18,duration):duration,ease:'power2.inOut',overwrite:true,onUpdate:()=>this.drawPanel(node)});
  });
  return layout;
 }
 drawRings() {
  const g=this.geometry;
  for(const [el,rx,ry] of [[this.main,g.rx,g.ry],[this.aux,g.rx*1.09,g.ry*.87]])for(const [k,v] of Object.entries({cx:g.cx,cy:g.cy,rx,ry}))el.setAttribute(k,v);
  this.aux.setAttribute('transform',`rotate(-18 ${g.cx} ${g.cy})`);
  for(const [k,v] of Object.entries({cx:g.fx,cy:g.fy,rx:g.frx,ry:g.fry}))this.floor.setAttribute(k,v);
  for(const p of this.panels)this.drawPanel(p);
 }
 drawPanel({el,position:p,line,node}) {
  el.style.cssText=`width:${p.width}px;height:${p.height}px;transform:translate(${p.x}px,${p.y}px) rotate(${p.angle}deg);opacity:${p.opacity}`;
  const g=this.geometry,left=p.x+p.width/2<g.cx,x=left?p.x+p.width:p.x,y=p.y+p.height*.52;
  const endX=g.cx+(left?-1:1)*g.rx*.68,endY=g.cy+(y-g.cy)*.62;
  line.setAttribute('d',`M ${x} ${y} L ${(x+endX)/2} ${y} L ${endX} ${endY}`);
  node.setAttribute('cx',x);node.setAttribute('cy',y);line.style.opacity=node.style.opacity=p.opacity*.58;
 }
}
