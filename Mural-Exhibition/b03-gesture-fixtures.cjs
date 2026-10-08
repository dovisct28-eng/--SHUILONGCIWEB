function person({x=.5,width=.3,hands=[],y=.52,upper=false,missingWrists=[]}={}) {
 const lm=Array.from({length:33},()=>({x,y,z:0,visibility:0,presence:1}));
 for(const [i,px,py]of [[11,x+width/2,y-.17],[12,x-width/2,y-.17],[23,x+width*.35,y+.17],[24,x-width*.35,y+.17]])lm[i]={x:px,y:py,z:0,visibility:1,presence:1};
 for(let i=0;i<2;i++){const w=hands[i]?.[0];lm[15+i]={x:w?.x??(x+(i===0?-.22:.22)),y:w?.y??.7,z:0,visibility:1,presence:1};}
 if(upper)for(const i of [23,24])lm[i].visibility=0;
 for(const side of missingWrists)lm[side==='left'?15:16].visibility=0;
 return lm;
}
const fixtureInstrument=`function fixtureGesture(hands){posePipeline.latest={poses:[(${person.toString()})({hands})],at:performance.now()};handleGestureLogic(hands);}`;
async function stubPose(page){
 await page.addInitScript(({source})=>{
  const body=Function('return ('+source+')')();
  const NativeWorker=window.Worker;
  window.Worker=class{
   constructor(url,options){if(!String(url).includes('pose-worker.js'))return new NativeWorker(url,options);this.isPose=true;window.__poseTest||={active:0,max:0,created:0};__poseTest.active++;__poseTest.created++;__poseTest.max=Math.max(__poseTest.max,__poseTest.active);}
   postMessage(data){if(data.type==='init'){if(window.__camera?.failPoseInit){__camera.failPoseInit=false;setTimeout(()=>this.onmessage?.({data:{type:'error',code:'POSE_WORKER_ERROR',source:'pose-worker',message:'Synthetic init fault'}}),0);}else setTimeout(()=>this.onmessage?.({data:{type:'ready'}}),0);return;}
    if(data.type==='frame'){if(window.__camera?.failPoseRuntime){__camera.failPoseRuntime=false;data.image.close();setTimeout(()=>this.onmessage?.({data:{type:'error',code:'POSE_RUNTIME_ERROR',source:'pose-inference',message:'Synthetic runtime fault'}}),0);return;}const poses=window.__camera?.current?.poses??[body()];data.image.close();setTimeout(()=>this.onmessage?.({data:{type:'poses',at:data.at,session:data.session,poses,inferenceMs:window.__camera?.poseDelayMs||0}}),window.__camera?.poseDelayMs||0);}}
   terminate(){if(!this.closed){this.closed=true;__poseTest.active--;}}
  };
 },{source:person.toString()});
}
async function syntheticCamera(page,{realPose=false,realHands=false,realDrawing=false}={}){
 if(!realPose)await stubPose(page);
 await page.addInitScript(({source,realHands,realDrawing})=>{
  const body=Function('return ('+source+')')(),image=document.createElement('canvas');image.width=320;image.height=240;
  const ctx=image.getContext('2d');ctx.fillStyle='#242822';ctx.fillRect(0,0,320,240);ctx.fillStyle='#a4a99f';ctx.font='12px monospace';ctx.fillText('SYNTHETIC INPUT',90,125);
  const draw=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(input,...args){return draw.call(this,input instanceof HTMLVideoElement?image:input,...args);};
  window.__camera={starts:0,stops:0,models:0,active:0,max:0,options:null,latest:{hands:[],poses:[body()]},current:null,callback:null,
   deliver(value){this.latest=value;},resolve:null};
  if(!realHands)window.Hands=class{constructor(){__camera.models++;}setOptions(o){__camera.options=o;}onResults(cb){this.callback=cb;__camera.callback=cb;}
   async initialize(){if(__camera.failHandsInit){__camera.failHandsInit=false;throw Error('Synthetic Hands model init fault');}}async close(){if(!this.closed){this.closed=true;__camera.models--;}}
   async send(){const hands=__camera.current.hands;await new Promise(r=>setTimeout(r,__camera.handsDelayMs||0));this.callback({image,multiHandLandmarks:hands});__camera.resolve?.();__camera.resolve=null;}};
  window.Camera=class{constructor(video,options){this.video=video;this.options=options;this.busy=false;}
   async start(){if(__camera.waitPermission)await new Promise(r=>__camera.permissionResolve=r);this.video.srcObject=image.captureStream(30);if(__camera.cameraFailure)throw new DOMException('Synthetic device failure',__camera.cameraFailure);this.running=true;__camera.starts++;__camera.active++;__camera.max=Math.max(__camera.max,__camera.active);
    this.timer=setInterval(async()=>{if(!this.running||this.busy)return;this.busy=true;__camera.current=__camera.latest;try{await this.options.onFrame();}finally{this.busy=false;}},33);}
   stop(){clearInterval(this.timer);if(this.running){this.running=false;__camera.stops++;__camera.active--;}}
  };
  if(realDrawing){
   // Synthetic input uses the standard 21-point topology, with the real drawing helper.
   window.HAND_CONNECTIONS=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]];
  }else{window.HAND_CONNECTIONS=[];window.drawConnectors=()=>{};window.drawLandmarks=()=>{};}
 },{source:person.toString(),realHands,realDrawing});
}
module.exports={person,fixtureInstrument,stubPose,syntheticCamera};
