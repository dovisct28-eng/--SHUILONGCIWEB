import {FIRST_MURAL} from './corridor-path.mjs';
export const MURAL_SOURCE=Object.freeze({url:new URL('../assets/murals/mural-01-display.webp',import.meta.url).href,width:2880,height:990,label:'第一幅壁画',location:'右侧廊内墙 · 越过戏台，朝向主殿',basis:'shuilong-temple/mural-locations.json; docs/CONTENT_MAP.md A06; model coordinates, not a site survey'});
// Local plane +X is world +Z. Ordered TL, TR, BR, BL: never mirror the image.
export function muralCorners(){const {position:[x,y,z],width:w,height:h}=FIRST_MURAL;return [[x,y+h/2,z-w/2],[x,y+h/2,z+w/2],[x,y-h/2,z+w/2],[x,y-h/2,z-w/2]];}
export function projectedCorners(T,camera){camera.updateMatrixWorld();return muralCorners().map(p=>{const v=new T.Vector3(...p).project(camera);return {x:(v.x+1)/2,y:(1-v.y)/2,depth:v.z};});}
export function readingDistance(aspect,fov=48){return Math.max(FIRST_MURAL.width/(2*Math.tan(fov*Math.PI/360)*aspect*.82),FIRST_MURAL.height/(2*Math.tan(fov*Math.PI/360)*.52));}
