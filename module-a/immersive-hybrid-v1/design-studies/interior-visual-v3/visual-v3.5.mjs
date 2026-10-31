import {ease,smooth} from './route-v3.2.mjs';

// Presentation only. Source pixels and model geometry remain unchanged.
export function wallColor(index,reveal){
 const end=[1,.58,.63,.57,.58][index],u=ease(smooth(.33,1,reveal));
 return [.12+(end-.12)*u,.115+(end-.125)*u,.105+(end-.14)*u];
}
export const titleOpacity=reveal=>smooth(.17,.38,reveal)*(1-.84*smooth(.72,1,reveal));
export function titlePlacement(corners,width,height){
 const left=Math.min(...corners.map(p=>p.x)),right=Math.max(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y));
 return {x:Math.max(32,Math.min(width-270,left+(right-left)*.035)),y:Math.max(height<=800?118:135,top-38)};
}
