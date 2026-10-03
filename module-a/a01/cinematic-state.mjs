// Container framing is independent of camera travel and the material reveal.
const clamp=n=>Math.max(0,Math.min(1,Number(n)||0));
const ease=n=>{const t=clamp(n);return t*t*(3-2*t);};
export function cinematicState(progress=0,screens=0,reduced=false){
  const hero=reduced?1:ease((progress-.48)/.10);
  const center=ease((screens-6.4)/.6);
  return {hero,cinematic:1-hero,center,environment:1-ease((screens-6.2)/.35)};
}
export function canvasFrame(width,height,state,composition=0){
  const narrow=width<=760,baseWidth=narrow?width*.92:width<=1100?width*.78:Math.min(width*.72,1000);
  const heroWidth=narrow?width*.92:width<=1100?width*.78:Math.min(width*.84,1500);
  const baseHeight=narrow?height*.66:Math.min(height*.84,820),heroHeight=narrow?height*.66:Math.min(height*.84,960);
  const scale=.83-(narrow?.35:.17)*composition;
  const framedWidth=(heroWidth+(baseWidth-heroWidth)*state.center)*scale;
  const framedHeight=(heroHeight+(baseHeight-heroHeight)*state.center)*scale;
  return {width:width+(framedWidth-width)*state.hero,height:height+(framedHeight-height)*state.hero};
}
