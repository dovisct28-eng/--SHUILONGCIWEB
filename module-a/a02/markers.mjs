// Labels are display annotations, not wall coordinates or a walking route.
export function roomLabels(points,width,height) {
  const configurations={
    'mural-01':{side:1,y:-75},'mural-02':{side:-1,y:-92},
    'mural-03':{side:-1,y:-5},'mural-04':{side:-1,y:70},'mural-05':{side:1,y:82},
  };
  const result=points.map(p=>{const c=configurations[p.id],right=c.side>0;
    const lx=p.id==='mural-05'?Math.min(width-76,p.x+170):right?Math.min(width-76,p.x+Math.min(360,width*.23)):Math.max(76,p.x-150);
    return {...p,lx,ly:Math.max(95,Math.min(height-65,p.y+c.y)),side:c.side};});
  for(const side of [-1,1]){const rail=result.filter(p=>p.side===side).sort((a,b)=>a.ly-b.ly);for(let i=1;i<rail.length;i++)rail[i].ly=Math.max(rail[i].ly,rail[i-1].ly+48);
    const overflow=rail.length?Math.max(0,rail.at(-1).ly-(height-65)):0;for(const p of rail)p.ly-=overflow;
  }return result;
}
export const circled={'mural-01':'①','mural-02':'②','mural-03':'③','mural-04':'④','mural-05':'⑤'};
