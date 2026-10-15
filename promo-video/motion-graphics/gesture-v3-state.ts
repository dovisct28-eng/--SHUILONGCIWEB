// Editorial simulation only. Does not run or replace the website recognizer.
export const clamp=(x:number)=>Math.min(1,Math.max(0,x));
export const smooth=(x:number)=>{const v=clamp(x);return v*v*(3-2*v);};
export const events=[{action:'NEXT',at:390,release:450},{action:'OPEN',at:750,release:810},{action:'CLOSE',at:1020,release:1060}];
export function gestureState(f:number){
 const next=events[0].at,open=events[1].at,close=events[2].at;
 const expand=Math.min(smooth((f-open)/24),1-smooth((f-close)/24));
 const event=events.find(e=>f>=e.at-60&&f<e.release+12);
 const arrival=event?smooth((f-(event.at-60))/30):0;
 const release=event?smooth((f-event.release)/12):1;
 const lock=arrival*(1-release),target=event?.action==='NEXT'?'next':'view';
 const x=1450+((target==='next'?1165:755)-1450)*lock,y=675+230*lock;
 return {next,expand,switched:f>=next,reading:f>=open&&f<close+24,active:target,event,arrival,release,lock,x,y,progress:event?clamp((f-(event.at-30))/30)*(1-release):0,confirmed:!!event&&f>=event.at&&f<event.at+24,figureLeft:540-360*expand,figureWidth:680-120*expand,handX:(1420-90*lock)*(1-expand)+1640*expand,handY:380+35*lock+220*expand};
}
