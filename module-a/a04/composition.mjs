export function a04Labels(points,width,height,current=null){
  const offsets={'mural-05':[-.055,.07],'mural-01':[.055,-.025],'mural-02':[-.045,-.06]};
  const result=points.filter(p=>p.z>-1&&p.z<1&&p.x>-20&&p.x<width+20&&p.y>-20&&p.y<height+20).map(p=>{
    const [dx,dy]=offsets[p.id];return {...p,current:p.id===current,lx:Math.max(64,Math.min(width-64,p.x+width*dx)),ly:Math.max(105,Math.min(height-115,p.y+height*(p.id===current?-.18:dy)))};
  }).sort((a,b)=>a.ly-b.ly);
  for(let i=1;i<result.length;i++)if(Math.abs(result[i].lx-result[i-1].lx)<130)result[i].ly=Math.min(height-115,Math.max(result[i].ly,result[i-1].ly+70));
  return result;
}
