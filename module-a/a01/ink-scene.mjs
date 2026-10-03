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
// Designed ink ridges, never a map or a reconstruction of the actual valley.
export function inkRidge(layer){
  const points=[];for(let i=0;i<=140;i++){
    const x=i*10,peaks=Math.abs(Math.sin(i*.11+layer))*70+Math.abs(Math.sin(i*.39+layer*.7))*26+Math.abs(Math.sin(i*1.23))*10;
    const cliff=130*Math.exp(-(((x-260)/180)**2))+70*Math.exp(-(((x-1330)/160)**2));
    points.push(`${x},${(250+layer*72-peaks-cliff).toFixed(1)}`);
  }return `M${points.join(' L')} L1400,900 L0,900 Z`;
}
export function createInkScene(stage){
  const layer=document.createElement('div');layer.className='ink-landscape';layer.setAttribute('aria-hidden','true');
  const colors=['#67747c','#4c5a64','#34434b','#233138'];
  layer.innerHTML=`<svg class="ink-ridges" viewBox="0 0 1400 900" preserveAspectRatio="none"><defs><linearGradient id="ink-ridge-fade" x2="0" y2="1"><stop stop-color="white"/><stop offset=".75" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="ink-ridge-mask"><rect width="1400" height="900" fill="url(#ink-ridge-fade)"/></mask></defs><g mask="url(#ink-ridge-mask)">${colors.map((color,i)=>`<path d="${inkRidge(i)}" fill="${color}" opacity="${.38+i*.09}"/>`).join('')}</g></svg>`;
  const mountains=document.createElement('img');mountains.src=new URL('../../shuilong-temple/environment-assets/distant-landscape.webp',import.meta.url).href;mountains.alt='';mountains.decoding='async';mountains.className='ink-watercolor';mountains.onerror=()=>mountains.hidden=true;layer.append(mountains);
  const source=new URL('../../shuilong-temple/environment-assets/watercolor-tree.webp',import.meta.url).href;
  for(const place of ['left','low','right']){const tree=document.createElement('img');tree.src=source;tree.alt='';tree.decoding='async';tree.className=`ink-tree ink-tree-${place}`;tree.onerror=()=>tree.hidden=true;layer.append(tree);}
  stage.prepend(layer);
  return (screens,reducedMotion=false)=>{stage.style.setProperty('--ink-near',reducedMotion?0:1-smooth(screens));const palette=inkPalette(screens),n=Math.min(1,Math.max(0,(screens/5-.2)/.45)),landscape=n*n*(3-2*n);
    stage.style.setProperty('--a01-paper',palette.paper);stage.style.setProperty('--a01-ink',palette.ink);stage.style.setProperty('--a01-secondary',palette.secondary);stage.style.setProperty('--ink-weight',palette.weight);stage.style.setProperty('--ink-landscape',landscape);
    layer.hidden=palette.weight===0;
  };
}
