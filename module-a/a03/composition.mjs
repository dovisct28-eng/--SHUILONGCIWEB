import { A03_START, deriveA03State } from './progress.mjs';
import {deriveSharedWorldState} from '../../shuilong-temple/shared-world.mjs';

const ease = n => { const t=Math.max(0,Math.min(1,n)); return t*t*(3-2*t); };
// Display targets only: no geometry, wall coordinates or shared defaults change.
export const A03_TARGETS = Object.freeze({
  reading: Object.freeze({ width:1, height:1, x:0, y:-.035, fov:31.5, radius:45 }),
});
export function a03Visual(screens) {
  const state=deriveA03State(screens*1000,1000);
  return { weight:state.composition, arrival:ease(screens-A03_START),
    field:ease((screens-A03_START)/.75)*(1-ease((screens-13.05)/.15)),
    cutaway:state.cutaway, roofOpacity:state.roofOpacity,
    markerFocus:state.markerFocus,
    labels:Math.max(state.composition,state.fifthFocus)*(1-ease((screens-12.85)/.35)),
    fifth:state.fifthFocus*(1-ease((screens-13.2)/.002)),
    environment:deriveSharedWorldState(screens).environment };
}
export function a03Frame(frame,width,height,screens) {
  const {weight}=a03Visual(screens),target=A03_TARGETS.reading;
  const reading={width:frame.width+(width*target.width-frame.width)*weight,
    height:frame.height+(height*target.height-frame.height)*weight};
  // Match the existing A04 controller's entry canvas exactly, before it takes over.
  if(screens<A03_START+2.65||screens>A03_START+3.002)return reading;
  const handoff=ease((screens-A03_START-2.65)/.35);
  const entry={width:(width<=1100?width*.78:Math.min(width*.72,1000))*.83,height:Math.min(height*.84,820)*.83};
  return {width:reading.width+(entry.width-reading.width)*handoff,height:reading.height+(entry.height-reading.height)*handoff};
}
// Label positions may move; x/y remain the renderer's unchanged wall projections.
export function a03Labels(points,width,height) {
  const offsets={'mural-01':[.29,-.06],'mural-02':[-.16,.065],'mural-05':[.085,.09]};
  const labels=points.map(p=>{const [dx,dy]=offsets[p.id]||[0,0];return {...p,
    lx:Math.max(66,Math.min(width-66,p.x+width*dx)),
    ly:Math.max(70,Math.min(height-65,p.y+height*dy))};}).sort((a,b)=>a.ly-b.ly);
  for(let i=1;i<labels.length;i++)labels[i].ly=Math.max(labels[i].ly,labels[i-1].ly+46);
  const excess=Math.max(0,(labels.at(-1)?.ly||0)-(height-65));
  if(excess)for(const label of labels)label.ly-=excess;
  return labels;
}
