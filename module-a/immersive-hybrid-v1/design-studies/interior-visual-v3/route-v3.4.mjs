import {createRearRail,REAR_DOCKS} from './route-v3.3.mjs';
import {smooth} from './route-v3.2.mjs';
export const FIFTH_DOCK={position:[.65,1.85,-11.75],target:[-4.515,1.85,-11.75],fov:48};
export const FIFTH_POINTS=[REAR_DOCKS[2],{position:[-1.5,1.85,-10.7],target:[-4,1.85,-13.7],fov:48},{position:[-.45,1.85,-11.25],target:[-4.515,1.85,-12.4],fov:48},FIFTH_DOCK];
export function createFifthRail(){const rail=createRearRail(2,FIFTH_POINTS),sample=rail.sample;return {...rail,sample(progress){return {...sample(progress),route33:1,route34:Math.max(0,Math.min(1,progress))};}};}
export const FIFTH_REFERENCES=[{name:'turn-fifth',progress:.50},{name:'fifth-dock',progress:1}];
export function fifthWeights(progress){const p=Math.max(0,Math.min(1,progress)),u=smooth(.5,1,p);return {weights:[1-u,u],gain:smooth(0,.4,p)};}
