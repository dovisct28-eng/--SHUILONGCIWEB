import {INTERACTION_CONFIG as c} from './interaction-config.mjs';

// DOM only; shares the existing stage scheduler, with no independent timer/RAF.
export class DwellFeedback {
 constructor(root) {
  this.root=root;this.cursor=root.querySelector('.dwell-pointer');this.buttons=[...root.querySelectorAll('[data-dwell-target]')];this.targets=[];this.region=null;this.width=0;this.height=0;
 }
 layout(width,height,reading,panel) {
  this.width=width;this.height=height;
  for(const el of this.buttons){const next=el.dataset.dwellTarget==='next';el.hidden=reading&&next;el.style.left=`${width*(next?c.targetRight:c.targetLeft)-c.targetWidth/2}px`;el.style.top=`${height*c.targetY-c.targetHeight/2}px`;if(!next){const label=reading?'返回人物':'查看人物';el.querySelector('span').textContent=label;el.setAttribute('aria-label',label);}}
  this.measure(reading,panel);
 }
 measure(reading,panel) {
  this.targets=this.buttons.map(el=>{const r=el.getBoundingClientRect();return {id:el.dataset.dwellTarget,x:r.x,y:r.y,width:r.width,height:r.height,disabled:el.hidden||el.disabled,dwellMs:c.dwellMs};});
  const r=panel?.getBoundingClientRect();this.region=reading&&panel.scrollHeight>panel.clientHeight+1?{id:'reading',x:r.x,y:r.y,width:r.width,height:r.height}:null;
  const zone=this.root.querySelector('.dwell-reading-zone');zone.hidden=!this.region;
  if(this.region){Object.assign(zone.style,{left:`${r.x+r.width+5}px`,top:`${r.y}px`,width:'20px',height:`${r.height}px`});}
  return {targets:this.targets,controlRegions:this.region?[this.region]:[]};
 }
 render(snapshot,pointer,enabled,now) {
  this.root.hidden=!enabled;this.root.dataset.state=snapshot.state;
  for(const el of this.buttons){const active=el.dataset.dwellTarget===snapshot.target,confirm=snapshot.lastAction&&now-snapshot.lastAction.at<450&&el.dataset.dwellTarget===(snapshot.lastAction.action==='NEXT'?'next':'view');el.dataset.active=String(active);el.dataset.confirm=String(!!confirm);el.style.setProperty('--dwell-progress',confirm?1:active?snapshot.progress:0);el.setAttribute('aria-busy',String(active&&snapshot.state==='DWELLING'));}
  const stale=pointer?.gapMs>c.trackingPauseMs||pointer?.at&&now-pointer.at>c.trackingPauseMs;
  this.cursor.hidden=!pointer?.visible||stale;this.cursor.dataset.paused=String(!pointer?.valid||!pointer?.stable);
  if(pointer?.point)this.cursor.style.transform=`translate(${pointer.point.x}px,${pointer.point.y}px)`;
 }
}
