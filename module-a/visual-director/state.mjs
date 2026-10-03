// Visual weights only. Chapter lengths, tour keys and image travel remain owned by their existing controllers.
const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
export function directorState(screens=0,tour=null){
  const space=ease((screens-7)/.5),theme=ease((screens-10.2)/1),entry=tour?clamp(tour.entryProgress):0;
  return {space,theme:theme*(1-entry),exposure:1.18+space*(-.22-.15*theme*(1-entry)),fill:1.2-space*.92,
    sun:3.3-space*.7,fov:34-space*3.5*(1-theme)*(1-entry),architecture:1-.12*theme*(1-entry),
    transfer:ease((screens-16)/1.65)};
}
export function directorFrame(frame,width,height,screens,composition){
  const w=ease((screens-7)/.5)*(1-clamp(composition));
  const target={width:width*.94,height:height*(width<=1100||height<=800?.83:.84)};
  return {width:frame.width+(target.width-frame.width)*w,height:frame.height+(target.height-frame.height)*w};
}
export function markerReveal(visibility){return {anchor:ease(visibility/.28),line:ease((visibility-.18)/.52),label:ease((visibility-.65)/.35)};}
export const DIRECTOR_PALETTES=Object.freeze({warm:{accent:'#c9b69a',route:'#b9a98f'},'gray-green':{accent:'#a6b2a5',route:'#99a796'},'gray-brown':{accent:'#c1b8aa',route:'#b3aba0'}});
export const paletteFor=name=>DIRECTOR_PALETTES[name]||DIRECTOR_PALETTES.warm;
export function wallReveal(seconds){for(const [arrival,departure]of [[7.4,11],[22.4,26],[35.4,39]])if(seconds>=arrival&&seconds<departure+1.4)return ease((seconds-arrival)/.6)*(1-ease((seconds-departure)/1.4));return seconds>=45?1:0;}
export function routeStyle(growth,index,elapsed,completed=false){
  if(elapsed<46&&!completed)return {future:0,trace:0,current:false};
  const active=completed?-1:elapsed<48?0:elapsed<54?1:2;
  return {future:completed?0:.16,trace:completed?.68:index===active?1:.48,current:index===active};
}
