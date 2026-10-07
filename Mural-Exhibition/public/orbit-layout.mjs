import { cyberConfig } from './figure-stage.mjs';

export const LAYOUT_VERSION='b03-hf-02-v1';
export function seededRandom(key) {
 let state=2166136261;
 for(const c of String(key)){state^=c.charCodeAt(0);state=Math.imul(state,16777619);}
 return ()=>{state=(state+0x6D2B79F5)|0;let t=Math.imul(state^(state>>>15),1|state);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};
}
const rectOK=r=>r&&[r.x,r.y,r.width,r.height].every(Number.isFinite)&&r.width>0&&r.height>0;
export const intersects=(a,b,gap=0)=>a.x<b.x+b.width+gap&&a.x+a.width+gap>b.x&&a.y<b.y+b.height+gap&&a.y+a.height+gap>b.y;
export function panelBounds(p,padding=4) {
 const a=Math.abs(p.angle||0)*Math.PI/180,w=Math.abs(p.width*Math.cos(a))+Math.abs(p.height*Math.sin(a)),h=Math.abs(p.height*Math.cos(a))+Math.abs(p.width*Math.sin(a));
 return {x:p.x+(p.width-w)/2-padding,y:p.y+(p.height-h)/2-padding,width:w+padding*2,height:h+padding*2};
}
export function projectOccupancy(geometry,projection,effective) {
 const grid=geometry?.grid;
 if(!grid||!rectOK(projection)||!Number.isInteger(grid.size)||grid.size<1||grid.size>64||grid.counts?.length!==grid.size**2)return [effective];
 const cells=[],n=grid.size;
 // Merge adjacent occupied cells per row. Any faint pixel reserves its cell.
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(grid.counts[y*n+x]>0){const start=x;while(x+1<n&&grid.counts[y*n+x+1]>0)x++;cells.push({x:projection.x+start/n*projection.width,y:projection.y+y/n*projection.height,width:(x-start+1)/n*projection.width,height:projection.height/n});}
 return cells.length?cells:[effective];
}
export function chooseTemplate(geometry,effective,id='',override='auto') {
 if(['vertical','horizontal','asymmetric'].includes(override))return override;
 const raw=geometry?.raw,centroid=geometry?.centroid;
 const dx=rectOK(raw)&&Number.isFinite(centroid?.x)?Math.min(.5,Math.abs((centroid.x-raw.x)/raw.width-.5)):0;
 const aspect=Number.isFinite(geometry?.aspect)&&geometry.aspect>0?geometry.aspect:effective.width/effective.height;
 const scores=[['vertical',Math.max(0,1.12-aspect)],['horizontal',Math.max(0,aspect-.82)],['asymmetric',dx>.14?1.3+dx*2:0]];
 const best=Math.max(...scores.map(x=>x[1]));const ties=scores.filter(x=>best-x[1]<.08);
 return ties[Math.floor(seededRandom(id+'|template|'+LAYOUT_VERSION)()*ties.length)][0];
}

// Crops use the cached grid's real pixel counts. No semantic/registration claims.
export function cropWindows(geometry,width,height,bounds) {
 if(!geometry?.grid||!rectOK(bounds))return [];
 const {size,counts}=geometry.grid,bw=bounds.width*width,bh=bounds.height*height;
 const edge=Math.min(Math.max(Math.min(bw,bh)*.62,Math.sqrt(bw*bh)*.23),Math.min(bw,bh));
 const rw=edge/width,rh=edge/height,candidates=[];
 for(let yi=0;yi<=8;yi++)for(let xi=0;xi<=8;xi++){
  const r={x:bounds.x+(bounds.width-rw)*xi/8,y:bounds.y+(bounds.height-rh)*yi/8,width:rw,height:rh};
  let pixels=0;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const ox=Math.max(0,Math.min(r.x+rw,(x+1)/size)-Math.max(r.x,x/size));
   const oy=Math.max(0,Math.min(r.y+rh,(y+1)/size)-Math.max(r.y,y/size));
   pixels+=counts[y*size+x]*ox*oy*size*size;
  }
  const coverage=pixels/(rw*rh*width*height);
  if(coverage>=.08&&Math.min(edge,width,height)>=24)candidates.push({...r,score:coverage,sourceEdge:edge});
 }
 const selected=[];
 for(let i=0;i<4;i++){
  const target=i/3;
  const ranked=candidates.map(r=>({r,score:r.score-.3*Math.abs((r.y+rh/2-bounds.y)/bounds.height-target)-selected.reduce((s,p)=>s+(intersects(r,p)?Math.max(0,.28-Math.hypot(r.x-p.x,r.y-p.y)):0),0)})).sort((a,b)=>b.score-a.score);
  const best=ranked.find(({r})=>!selected.some(p=>Math.hypot((r.x-p.x)/rw,(r.y-p.y)/rh)<.35));
  if(best)selected.push(best.r);
 }
 return selected;
}

export function orbitLayout(input={}) {
 if(!input||typeof input!=='object'||Array.isArray(input))input={};
 const {width,height,effective:e,revealed=false,panelLeft=width,id='',geometry,projection,forbidden=[],contents,version=LAYOUT_VERSION}=input;
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||!rectOK(e))return {version,template:'fallback',panels:[],center:{x:0,y:0},radius:{x:0,y:0},floor:{x:0,y:0,rx:0,ry:0},score:0,degraded:'invalid-input',attempts:0};
 const config=cyberConfig({orbit:input.orbit}).orbit;
 const template=chooseTemplate(geometry,e,id,config.template),mode=revealed?'revealed':'default';
 const random=seededRandom(id+'|'+version+'|'+mode);
 const margin=Math.min(36,width*.05),readingLeft=Number.isFinite(panelLeft)?panelLeft:width;
 const safe={x:margin,y:110,width:Math.max(0,(revealed?Math.min(readingLeft-18,width-margin):width-margin)-margin),height:Math.max(0,height-290)};
 const protectedRects=(Array.isArray(forbidden)?forbidden:[]).filter(rectOK),occupied=projectOccupancy(geometry,projection,e);
 // Preserve the figure's visual centre even where a coarse silhouette has holes.
 occupied.push({x:e.x+e.width*.3,y:e.y+e.height*.28,width:e.width*.4,height:e.height*.44});
 const available=Array.isArray(contents)?contents.filter(c=>c&&typeof c.id==='string').slice(0,5):[0,1,2,3,4].map(i=>({id:'source-'+i,aspect:i===3?.7:i===2?1.4:1,maxEdge:380}));
 const desired=Math.min(config.maxPanels,available.length,revealed?3:template==='horizontal'?3:4+(random()>.55?1:0));
 const cx=e.x+e.width/2,cy=e.y+e.height/2,unit=Math.min(1.25,width/1440,height/900);
 const bias=config.bias||(rectOK(geometry?.raw)&&Number.isFinite(geometry?.centroid?.x)?Math.max(-1,Math.min(1,((geometry.centroid.x-geometry.raw.x)/geometry.raw.width-.5)*-2)):0);
 const candidates=[];
 const valid=p=>{
  const r=panelBounds(p);
  return r.x>=safe.x&&r.y>=safe.y&&r.x+r.width<=safe.x+safe.width&&r.y+r.height<=safe.y+safe.height&&!protectedRects.some(f=>intersects(r,f,12))&&!occupied.some(f=>intersects(r,f,10));
 };
 // Finite candidates on a contour ellipse plus measured viewport negative space.
 // Searching two sizes completes before reducing count; the figure never shrinks.
 const anchors=[];
 for(let i=0;i<16;i++){
  const a=i*Math.PI/8;
  anchors.push({x:cx+Math.cos(a)*(e.width/2+145*unit),y:cy+Math.sin(a)*(e.height/2+110*unit)});
 }
 for(const x of [safe.x+100*unit,e.x-105*unit,e.x+e.width+105*unit,safe.x+safe.width-100*unit])for(const y of [safe.y+86*unit,cy-135*unit,cy+135*unit,safe.y+safe.height-90*unit])anchors.push({x,y});
 for(const content of available)for(const shrink of [1,.76])for(const anchor of anchors){
  const aspect=Number.isFinite(content.aspect)&&content.aspect>0?Math.max(.45,Math.min(1.9,content.aspect)):1;
  const maxEdge=Number.isFinite(content.maxEdge)&&content.maxEdge>0?content.maxEdge:380;
  const edge=Math.min((155+random()*42)*unit*shrink,maxEdge*1.25);
  const w=edge*Math.min(1,aspect),h=edge*Math.min(1,1/aspect),angle=(random()-.5)*12;
  const p={id:content.id,content:content.id,x:anchor.x-w/2+(random()-.5)*28*unit+config.offsetX*width,y:anchor.y-h/2+(random()-.5)*26*unit+config.offsetY*height,width:w,height:h,angle,opacity:.66+random()*.22};
  if(Math.min(w,h)<54||!valid(p))continue;
  const side=p.x+w/2<cx?-1:1,top=Math.abs((p.y+h/2-cy)/Math.max(1,e.height));
  p.preference=(template==='horizontal'?top*1.5:1-top*.5)+bias*side*.9+(shrink===1?.18:0)+random()*.12;
  candidates.push(p);
 }
 // Eight bounded greedy sets approximate a scored search without retry loops.
 let best=[],bestScore=-Infinity;
 for(let attempt=0;attempt<8;attempt++){
  const selected=[],ranked=candidates.map(p=>({p,rank:p.preference+random()*.5})).sort((a,b)=>b.rank-a.rank);
  while(selected.length<desired){
   const choice=ranked.filter(({p})=>!selected.some(q=>q.content===p.content||intersects(panelBounds(p),panelBounds(q),16))).map(({p,rank})=>{
    const left=selected.filter(q=>q.x+q.width/2<cx).length,right=selected.length-left,side=p.x+p.width/2<cx?-1:1;
    const balance=template==='asymmetric'?0:(side<0?right-left:left-right)*.7;
    const spacing=selected.length?Math.min(...selected.map(q=>Math.hypot(p.x-q.x,p.y-q.y)))/Math.max(width,height):.1;
    return {p,rank:rank+balance+spacing};
   }).sort((a,b)=>b.rank-a.rank)[0];
   if(!choice)break;selected.push(choice.p);
  }
  const left=selected.filter(p=>p.x+p.width/2<cx).length;
  const area=selected.reduce((sum,p)=>sum+p.width*p.height,0)/Math.max(1,safe.width*safe.height);
  const minGap=selected.length>1?Math.min(...selected.flatMap((p,i)=>selected.slice(i+1).map(q=>Math.hypot(p.x-q.x,p.y-q.y))))/Math.max(width,height):.15;
  const score=selected.reduce((sum,p)=>sum+p.preference,0)+selected.length*.6+minGap*2+area*2-(template==='asymmetric'?0:Math.abs(left*2-selected.length)*.5);
  if(score>bestScore){best=selected;bestScore=score;}
 }
 const panels=best.map(({preference,...p})=>p),rx=Math.min(safe.width*.47,e.width*(template==='horizontal'?.67:.58)+85),ry=Math.min(safe.height*.47,e.height*(template==='horizontal'?.38:.52));
 return {version,seed:id+'|'+version+'|'+mode,template,panels,center:{x:cx,y:cy},radius:{x:Math.max(0,rx),y:Math.max(0,ry)},floor:{x:cx,y:e.y+e.height-2,rx:Math.max(0,Math.min(140,e.width*.42)),ry:10*unit},score:Math.max(0,bestScore),degraded:panels.length<desired?'reduced-panels':panels.some(p=>Math.max(p.width,p.height)<140*unit)?'smaller-panels':'none',intensity:config.intensity*(panels.length<2?.45:1),arcStart:Math.round(random()*100),arcSpan:Math.round(160+random()*120),attempts:8,candidateCount:candidates.length,safe};
}
