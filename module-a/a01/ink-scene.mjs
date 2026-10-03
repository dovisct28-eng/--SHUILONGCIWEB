// A01 display palette only. This restores the shared paper before A02 markers.
const smooth=n=>{const t=Math.min(1,Math.max(0,Number(n)||0));return t*t*(3-2*t);};
const luminance=color=>{const channels=[0,2,4].map(i=>parseInt(color.slice(i+1,i+3),16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return channels.reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);};
export const contrastRatio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const readable=(color,background)=>{if(contrastRatio(color,background)>=4.5)return color;const end=luminance(background)<.179?'ffffff':'000000';let low=0,high=1;for(let i=0;i<12;i++){const amount=(low+high)/2;if(contrastRatio(mixColor(color.slice(1),end,amount),background)>=4.5)high=amount;else low=amount;}return mixColor(color.slice(1),end,high);};
const mixColor=(a,b,t)=>'#'+[0,2,4].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
export function inkPalette(screens=0){
  const weight=1-smooth((screens-6.2)/1);
  const paper=mixColor('f2eee4','141b20',weight);return {weight,paper,ink:readable(mixColor('343833','ecdfcd',weight),paper),secondary:readable(mixColor('62675f','bcc1bc',weight),paper)};
}
export function createInkScene(stage){
  const layer=document.createElement('div');layer.className='ink-landscape';layer.setAttribute('aria-hidden','true');
  const mountains=document.createElement('img');mountains.src=new URL('../../shuilong-temple/environment-assets/a01-v2/karst-valley.webp',import.meta.url).href;mountains.alt='';mountains.decoding='async';mountains.className='ink-valley';mountains.onerror=()=>mountains.hidden=true;layer.append(mountains);
  const sky=mountains.cloneNode();sky.className='ink-sky';sky.onerror=()=>sky.hidden=true;layer.prepend(sky);
  stage.prepend(layer);
  return (screens,reducedMotion=false)=>{stage.style.setProperty('--ink-near',reducedMotion?0:1-smooth(screens));const palette=inkPalette(screens),n=Math.min(1,Math.max(0,(screens/5-.12)/.56)),landscape=n*n*(3-2*n);
    stage.style.setProperty('--a01-paper',palette.paper);stage.style.setProperty('--a01-ink',palette.ink);stage.style.setProperty('--a01-secondary',palette.secondary);stage.style.setProperty('--ink-weight',palette.weight);stage.style.setProperty('--ink-landscape',landscape);
    stage.style.setProperty('--ink-parallax',reducedMotion?0:1-smooth(Math.min(1,screens/3.4)));
    layer.hidden=palette.weight===0;
  };
}
