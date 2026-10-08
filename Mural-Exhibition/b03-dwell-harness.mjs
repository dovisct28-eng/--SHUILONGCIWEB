import fs from 'node:fs';
import vm from 'node:vm';
import {OperatorTracker} from './public/operator-tracker.mjs';
import {GesturePointer} from './public/gesture-pointer.mjs';
import {DwellController,readingVelocity} from './public/dwell-controller.mjs';
import {INTERACTION_CONFIG} from './public/interaction-config.mjs';
import {person,hand} from './b03-gesture-harness.mjs';
export {person,hand};
export function cameraHarness(index=0) {
 const html=fs.readFileSync(new URL('public/index.html',import.meta.url),'utf8');
 const init=html.slice(html.indexOf('function initMediaPipe'),html.indexOf('let cameraStart'));
 const handler=html.slice(html.indexOf('// Page locks are shared'),html.indexOf('\n    </script>',html.indexOf('// Page locks are shared')));
 const targets=[{id:'view',x:100,y:400,width:140,height:120},{id:'next',x:1040,y:400,width:140,height:120}];
 const ctx=vm.createContext({OperatorTracker,GesturePointer,DwellController,readingVelocity,INTERACTION_CONFIG,Math,URLSearchParams,time:0,location:{search:''},performance:{now:()=>ctx.time}});
 vm.runInContext(`let currentTrack='cyber',entryBusy=false,currentSeriesIndex=${index},isRevealed=false;
 const operatorTracker=new OperatorTracker(),gesturePointer=new GesturePointer(),dwellController=new DwellController();
 let controlPointer={valid:false,visible:false},readingScrollAt=null;
 const posePipeline={latest:{poses:[],at:-Infinity},start(){},stop(){},dispose(){},snapshot(){return {frames:0};}};
 let ownership={operatorState:'SEARCHING',assignedHands:[],diagnostics:{}},cameraVersion=1,handsFrameVersion=1,handsFrameAt=0;
 const gesturePerformance={callbacks:0,firstAt:null,lastAt:null,activeCameras:1,stalePoseFrames:0};
 const shaderMaterial={uniforms:{uMouse:{value:{x:-10,y:-10}}}};
 let lineMesh={},orbitStage={active:false,acknowledgeSwipe(){}},handsModel=null;
 const webglContainer={dataset:{phase:'stable'},hasAttribute:()=>false,clientWidth:1280,clientHeight:800};
 const info={scrollHeight:1000,clientHeight:300,scrollTop:0};
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{dataset:{},style:{setProperty(){}},textContent:''});return nodes.get(id);};
 const handlers={};const document={hidden:false,getElementById:id=>id==='info-text'?info:node(id),querySelector:()=>node('hint'),addEventListener(k,h){handlers[k]=h;}};
 const window={addEventListener(){}};
 let previewLines=0,previewPoints=0,previewClears=0;
 const canvasElement={width:320,height:240},canvasCtx={save(){},clearRect(){previewClears++;},drawImage(){},restore(){}},cameraStatus={};
 const HAND_CONNECTIONS=[],drawConnectors=()=>{previewLines++;},drawLandmarks=()=>{previewPoints++;};
 let callback,calls=0,reveals=0,closes=0;
 class Hands {setOptions(o){this.options=o;}onResults(cb){callback=cb;}}
 class DwellFeedback {constructor(){this.width=1280;this.height=800;this.targets=${JSON.stringify(targets)};this.region={x:800,y:150,width:400,height:400};}render(){}layout(){}measure(){return {targets:this.targets.map(t=>({...t,disabled:isRevealed&&t.id==='next'})),controlRegions:isRevealed?[this.region]:[]};}}
 function loadSeriesData(i){currentSeriesIndex=(i+8)%8;calls++;dwellController.lock();}
 function setRevealed(v){if(v!==isRevealed){if(v)reveals++;else closes++;}isRevealed=v;}
 function stopMediaPipe(){}
 ${init}
 ${handler}
 initMediaPipe();
 this.deliver=(hands,poses,at,poseAt=at)=>{time=at;handsFrameAt=at;posePipeline.latest={poses,at:poseAt};callback(hands===undefined?{image:{}}:{image:{},multiHandLandmarks:hands});};
 this.snapshot=()=>({index:currentSeriesIndex,calls,reading:isRevealed,reveals,closes,scrollTop:info.scrollTop,...dwellController.snapshot(),person:ownership.operatorState,operator:ownership.activeOperator?.id,assigned:ownership.assignedHands.length,diagnostics:ownership.diagnostics,pointer:controlPointer,previewLines,previewPoints,previewClears});
 this.busy=v=>entryBusy=v;
 this.manual=value=>requestReading(value);
 this.hidden=v=>{document.hidden=v;handlers.visibilitychange();};
 this.staleResult=(hands,at)=>{time=at;handsFrameAt=at;handsFrameVersion=cameraVersion-1;callback({image:{},multiHandLandmarks:hands});handsFrameVersion=cameraVersion;};
 `,ctx);
 ctx.result=(hands,at,opts={})=>ctx.deliver(hands,opts.poses??[person({hands:hands??[],upper:true,missingWrists:['right']})],at,opts.poseAt??at);
 for(let at=0;at<=900;at+=40)ctx.result([],at);
 return ctx;
}
export function sustain(h,x=.28,y=.545,ms=1400,opts={}) {let actions=[];const before=h.snapshot();for(let t=0;t<ms;t+=40)h.result(x===null?[]:[hand(x,y)],h.time+40,opts);const s=h.snapshot();return {before,after:s};}
export const release=h=>sustain(h,.5,.55,800);
