import {smooth,mixVector} from './path.mjs';
// Display windows in the existing model, never surveyed openings.
const fifth={center:[-1.4,-11.75],half:[4.3,4.1]},first={center:[3.6,4.8],half:[2.2,3.1]},second={center:[1.4,-11.75],half:[4.3,4.1]};
export function cutawayState(tour){
  if(!tour)return {active:false,weight:0,center:[0,0],half:[0,0],summary:0};
  const t=tour.storyTime??tour.elapsed??0,entry=tour.entryProgress??1;
  let region=fifth,name='fifth',summary=0;
  // Summary closes every opening; scrolling toward the fifth mural reopens
  // only that local window. The same progress restores it on reverse scroll.
  if(tour.guideStartProgress>0){name='handoff';region=fifth;summary=1-smooth(tour.guideStartProgress/.35);}
  else if(tour.routeComplete){name='summary';summary=1;}
  else if(t>=36){name='withdraw';summary=smooth((t-36)/5);region=second;}
  else if(t>=22&&t<32){
    name='returnToSecond';const p=smooth((t-22)/10),center=mixVector(first.center,second.center,p);
    // Reveal the destination before its roof crosses the moving view. Keep the
    // opening on the return side rather than removing the entire main roof.
    const look=smooth((t-23)/3),depart=smooth((t-22)/2);
    region={center,half:[2.2+.6*depart+1.5*p,3.1+.4*depart+Math.abs(center[1]-second.center[1])*look+.6*p]};
  }
  else if(t>=32){name='second';region=second;}
  else if(t>=18){name='first';region=first;}
  else if(t>=8){name='travelToFirst';const p=smooth((t-8)/10),depart=smooth((t-8)/2),arrive=smooth((t-16)/2);region={center:[-1.4-1.3*depart+6.3*smooth((p-.75)/.25),-11.75+16.55*p],half:[4.3-1.4*depart-.7*arrive,4.1-.6*depart-.4*arrive]};}
  const wallWeight=tour.guideStartProgress>0?1-smooth(tour.guideStartProgress/.35):tour.routeComplete?1:1-smooth(t/4);
  return {active:true,name,weight:smooth(entry),center:region.center,half:region.half,summary,wallWeight};
}
