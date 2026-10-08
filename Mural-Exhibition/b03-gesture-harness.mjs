// Synthetic owned body/hand fixtures only. Production V4 tests use b03-dwell-harness.mjs.
export function person({x=.5,width=.3,hands=[],y=.52,upper=false,missingWrists=[]}={}) {
 const lm=Array.from({length:33},()=>({x,y,z:0,visibility:0,presence:1}));
 for(const [i,px,py]of [[11,x+width/2,y-.17],[12,x-width/2,y-.17],[23,x+width*.35,y+.17],[24,x-width*.35,y+.17]])lm[i]={x:px,y:py,z:0,visibility:1,presence:1};
 // Fixture ownership is explicit: first hand = left, second = right.
 for(let i=0;i<2;i++){const w=hands[i]?.[0];lm[15+i]={x:w?.x??(x+(i===0?-.22:.22)),y:w?.y??.7,z:0,visibility:1,presence:1};}
 if(upper)for(const i of [23,24])lm[i].visibility=0;
 for(const side of missingWrists)lm[side==='left'?15:16].visibility=0;
 return lm;
}
export const hand=(x=.7,y=.5,open=true)=>{
 const rawX=1-x,lm=Array.from({length:21},()=>({x:rawX,y,z:0}));
 lm[0].y=y+.15;lm[5].x=rawX-.04;lm[17].x=rawX+.04;
 for(const i of [8,12,16,20])lm[i].y=y-(open?.25:.02);
 return lm;
};
