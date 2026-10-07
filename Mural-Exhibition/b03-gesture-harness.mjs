import fs from 'node:fs';
import vm from 'node:vm';
import {GestureController} from './public/next-gesture.mjs';
import {OperatorTracker} from './public/operator-tracker.mjs';
import {InteractionController} from './public/interaction-controller.mjs';

// Explicit synthetic bodies: only shoulders, hips and wrists are visible.
export function person({x=.5,width=.3,hands=[],y=.52}={}) {
 const lm=Array.from({length:33},()=>({x,y,z:0,visibility:0,presence:1}));
 for(const [i,px,py]of [[11,x-width/2,y-.17],[12,x+width/2,y-.17],[23,x-width*.35,y+.17],[24,x+width*.35,y+.17]])lm[i]={x:px,y:py,z:0,visibility:1,presence:1};
 // Fixture ownership is explicit: first hand = left, second = right.
 for(let i=0;i<2;i++){const w=hands[i]?.[0];lm[15+i]={x:w?.x??(x+(i===0?-.22:.22)),y:w?.y??.7,z:0,visibility:1,presence:1};}
 return lm;
}
export function cameraHarness(index=2,{acquire=true}={}) {
 const html=fs.readFileSync(new URL('public/index.html',import.meta.url),'utf8');
 const init=html.slice(html.indexOf('function initMediaPipe'),html.indexOf('let cameraStart'));
 const handler=html.slice(html.indexOf('function isHandOpen'),html.indexOf('\n    </script>',html.indexOf('function isHandOpen')));
 const context=vm.createContext({GestureController,OperatorTracker,InteractionController,Math,URLSearchParams,time:0,location:{search:''},performance:{now:()=>context.time}});
 vm.runInContext(`let currentTrack='cyber',entryBusy=false,currentSeriesIndex=${index},isRevealed=false,gestureNeutralY=.5;
 const nextGesture=new GestureController(),operatorTracker=new OperatorTracker(),interactionController=new InteractionController(nextGesture);
 const posePipeline={latest:{poses:[],at:-Infinity},start(){},stop(){},dispose(){}};
 let ownership={operatorState:'SEARCHING',assignedHands:[],diagnostics:{}},cameraVersion=1,handsFrameVersion=1,handsFrameAt=0;
 const gesturePerformance={callbacks:0,firstAt:null,lastAt:null};
 const shaderMaterial={uniforms:{uMouse:{value:{x:-10,y:-10}}}};
 let lineMesh={},orbitStage={active:false,acknowledgeSwipe(){}},handsModel=null;
 const webglContainer={dataset:{phase:'stable'},hasAttribute:()=>false};
 const info={scrollHeight:1000,clientHeight:100,scrollTop:0};
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{dataset:{},style:{setProperty(){}},textContent:''});return nodes.get(id);};
 const document={hidden:false,getElementById:id=>id==='info-text'?info:node(id),querySelector:()=>node('hint'),addEventListener(){}};
 const window={addEventListener(){}};
 const canvasElement={width:320,height:240},canvasCtx={save(){},clearRect(){},drawImage(){},restore(){}},cameraStatus={};
 const HAND_CONNECTIONS=[],drawConnectors=()=>{},drawLandmarks=()=>{},gsap={to(){}};
 let callback,calls=0,reveals=0,closes=0;
 class Hands {setOptions(o){this.options=o;}onResults(cb){callback=cb;}}
 function loadSeriesData(i){currentSeriesIndex=(i+8)%8;calls++;}
 function setRevealed(v){if(v!==isRevealed){if(v)reveals++;else closes++;}isRevealed=v;}
 ${init}
 ${handler}
 initMediaPipe();
 this.deliver=(hands,poses,at,poseAt=at)=>{time=at;handsFrameAt=at;posePipeline.latest={poses,at:poseAt};callback(hands===undefined?{image:{}}:{image:{},multiHandLandmarks:hands});};
 this.snapshot=()=>({index:currentSeriesIndex,calls,reading:isRevealed,reveals,closes,scrollTop:info.scrollTop,...nextGesture.snapshot(time),
  ...interactionController.snapshot(time),person:ownership.operatorState,operator:ownership.activeOperator?.id,assigned:ownership.assignedHands.length,diagnostics:ownership.diagnostics});
 this.busy=v=>entryBusy=v;
 this.tick=at=>{time=at;interactionController.tick(time,gestureContext());};
 this.manual=value=>requestReading(value);
 this.staleResult=(hands,at)=>{time=at;handsFrameAt=at;handsFrameVersion=cameraVersion-1;callback({image:{},multiHandLandmarks:hands});handsFrameVersion=cameraVersion;};
 `,context);
 context.result=(hands,at,options={})=>context.deliver(hands,options.poses??[person({hands:hands??[]})],at,options.poseAt??at);
 if(acquire)for(let at=0;at<=900;at+=100)context.result([],at);
 return context;
}
export const hand=(x=.7,y=.5,open=true)=>{
 const rawX=1-x,lm=Array.from({length:21},()=>({x:rawX,y,z:0}));
 lm[0].y=y+.15;lm[5].x=rawX-.04;lm[17].x=rawX+.04;
 for(const i of [8,12,16,20])lm[i].y=y-(open?.25:.02);
 return lm;
};
export function hold(h,ms=700,x=.7,y=.5,step=20) {
 if(h.snapshot().releaseRequired)for(let i=0;i<3;i++)h.result([hand(.55)],h.time+step);
 for(let t=0;t<=ms;t+=step)h.result([hand(x,y)],h.time+step);
}
export function swipe(h,dx=.04,dy=0,step=40,frames=8) {
 for(let i=1;i<=frames;i++)h.result([hand(.7+i*dx,.5+i*dy)],h.time+step);
}
export function pair(h,d,y=.5,ms=0,step=40) {
 for(let t=0;t<=ms;t+=step)h.result([hand(.5-d/2,y),hand(.5+d/2,y)],h.time+step);
}
export function openReading(h) {pair(h,.20,.5,160);for(const d of [.24,.30,.36,.42,.48])pair(h,d);pair(h,.48,.5,440);}
export function closeReading(h) {pair(h,.48,.5,160);for(const d of [.38,.28,.18,.12])pair(h,d);pair(h,.12,.5,340);}
export function releaseReading(h) {for(let t=0;t<=700;t+=40)h.result([],h.time+40);}
export function idle(h,ms=1100) {for(let t=0;t<=ms;t+=40)h.result([],h.time+40);}
