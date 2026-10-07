import fs from 'node:fs';
import vm from 'node:vm';
import {GestureController} from './public/next-gesture.mjs';

// Capture the real production MediaPipe registration and deliver every result,
// including empty/omitted landmarks, through that registered callback.
export function cameraHarness(index=2) {
 const html=fs.readFileSync(new URL('public/index.html',import.meta.url),'utf8');
 const init=html.slice(html.indexOf('function initMediaPipe'),html.indexOf('let cameraStart'));
 const handler=html.slice(html.indexOf('function isHandOpen'),html.indexOf('\n    </script>',html.indexOf('function isHandOpen')));
 const context=vm.createContext({GestureController,Math,URLSearchParams,time:0,location:{search:''},performance:{now:()=>context.time}});
 vm.runInContext(`let currentTrack='cyber',entryBusy=false,currentSeriesIndex=${index},isRevealed=false,gestureNeutralY=.5;
 const nextGesture=new GestureController(),shaderMaterial={uniforms:{uMouse:{value:{x:-10,y:-10}}}};
 let lineMesh={},orbitStage={active:false,acknowledgeSwipe(){}},handsModel=null;
 const webglContainer={dataset:{phase:'stable'},hasAttribute:()=>false};
 const info={scrollHeight:1000,clientHeight:100,scrollTop:0};
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{dataset:{},style:{setProperty(){}},textContent:''});return nodes.get(id);};
 const document={hidden:false,getElementById:id=>id==='info-text'?info:node(id),querySelector:()=>node('hint'),addEventListener(){}};
 const canvasElement={width:320,height:240},canvasCtx={save(){},clearRect(){},drawImage(){},restore(){}},cameraStatus={};
 const HAND_CONNECTIONS=[],drawConnectors=()=>{},drawLandmarks=()=>{},gsap={to(){}};
 let callback,calls=0;
 class Hands {setOptions(o){this.options=o;}onResults(cb){callback=cb;}}
 function loadSeriesData(i){currentSeriesIndex=(i+8)%8;calls++;}
 function setRevealed(v){nextGesture.resetGestureState();isRevealed=v;}
 ${init}
 ${handler}
 initMediaPipe();
 this.result=(hands,at)=>{time=at;callback(hands===undefined?{image:{}}:{image:{},multiHandLandmarks:hands});};
 this.snapshot=()=>({index:currentSeriesIndex,calls,reading:isRevealed,scrollTop:info.scrollTop,...nextGesture.snapshot(time)});
 this.busy=v=>entryBusy=v;
 this.tick=at=>{time=at;nextGesture.tick(time,gestureContext());};
 `,context);
 return context;
}
export const hand=(x=.7,y=.5,open=true)=>{
 const rawX=1-x,lm=Array.from({length:21},()=>({x:rawX,y,z:0}));
 lm[0].y=y+.15;lm[5].x=rawX-.04;lm[17].x=rawX+.04;
 for(const i of [8,12,16,20])lm[i].y=y-(open?.25:.02);
 return lm;
};
export function hold(h,ms=700,x=.7,y=.5,step=20) {
 if(h.snapshot().releaseRequired)h.result([hand(.3)],h.time+step);
 for(let t=0;t<=ms;t+=step)h.result([hand(x,y)],h.time+step);
}
export function swipe(h,dx=.04,dy=0,step=40,frames=8) {
 for(let i=1;i<=frames;i++)h.result([hand(.7+i*dx,.5+i*dy)],h.time+step);
}
