import {deriveSharedWorldState} from '../../shuilong-temple/shared-world.mjs';
// Module A sample palette. Dark space carries warm exhibition information.
const smooth=n=>{const t=Math.min(1,Math.max(0,Number(n)||0));return t*t*(3-2*t);};
const luminance=color=>{const channels=[0,2,4].map(i=>parseInt(color.slice(i+1,i+3),16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return channels.reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);};
export const contrastRatio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const readable=(color,background)=>{if(contrastRatio(color,background)>=4.5)return color;const end=luminance(background)<.179?'ffffff':'000000';let low=0,high=1;for(let i=0;i<12;i++){const amount=(low+high)/2;if(contrastRatio(mixColor(color.slice(1),end,amount),background)>=4.5)high=amount;else low=amount;}return mixColor(color.slice(1),end,high);};
const mixColor=(a,b,t)=>'#'+[0,2,4].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
export function inkPalette(screens=0){
  screens=Math.max(0,Number(screens)||0);
  const weight=deriveSharedWorldState(screens).mountains;
  let paper=mixColor('141b20','171b1d',smooth((screens-6.2)/1));
  paper=mixColor(paper.slice(1),'101519',smooth((screens-10.2)/1));
  paper=mixColor(paper.slice(1),'1a2023',smooth((screens-12.3)/1.7));
  return {weight,paper,ink:readable('#d8d2c5',paper),secondary:readable('#a0a39c',paper)};
}
export function createInkScene(stage){
  const layer=document.createElement('div');layer.className='ink-landscape';layer.setAttribute('aria-hidden','true');
  const mountains=document.createElement('img');mountains.src=new URL('../../shuilong-temple/environment-assets/a01-v3/karst-valley.webp',import.meta.url).href;mountains.alt='';mountains.decoding='async';mountains.className='ink-valley';mountains.onerror=()=>mountains.hidden=true;layer.append(mountains);
  const sky=mountains.cloneNode();sky.className='ink-sky';sky.onerror=()=>sky.hidden=true;layer.prepend(sky);
  stage.prepend(layer);
  return (screens,reducedMotion=false)=>{const palette=inkPalette(screens),n=Math.min(1,Math.max(0,(screens/5-.70)/.12)),landscape=reducedMotion?1:n*n*(3-2*n);
    stage.style.setProperty('--a01-paper',palette.paper);stage.style.setProperty('--a01-ink',palette.ink);stage.style.setProperty('--a01-secondary',palette.secondary);stage.style.setProperty('--ink-weight',palette.weight);stage.style.setProperty('--ink-landscape',landscape);
    stage.style.setProperty('--ink-parallax',reducedMotion?0:1-smooth(Math.min(1,screens/3.4)));
    stage.style.setProperty('--ink-sky-reveal',reducedMotion?1:smooth((screens/5-.70)/.065));
    stage.style.setProperty('--ink-valley-reveal',reducedMotion?1:smooth((screens/5-.745)/.075));
    layer.hidden=palette.weight===0;
  };
}
