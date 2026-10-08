import {INTERACTION_CONFIG} from './interaction-config.mjs';

export class PosePipeline {
 constructor({workerFactory=()=>new Worker(new URL('./pose-worker.js',import.meta.url)),bitmapFactory=image=>createImageBitmap(image),config={}}={}) {
  this.config={...INTERACTION_CONFIG,...config};this.workerFactory=workerFactory;this.bitmapFactory=bitmapFactory;
  this.worker=null;this.pending=null;this.ready=false;this.session=0;this.enabled=false;this.inFlight=false;
  this.latest={poses:[],at:-Infinity};this.lastSubmit=-Infinity;this.error=null;
  this.metrics={models:0,frames:0,inferenceTotalMs:0,inferenceMaxMs:0,staleResults:0};
 }
 initialize() {
  if(this.ready)return Promise.resolve();if(this.pending)return this.pending;
  this.error=null;
  this.pending=new Promise((resolve,reject)=>{
   let worker;const timer=setTimeout(()=>fail(new Error('Pose initialization timeout')),15000);
   const fail=error=>{clearTimeout(timer);this.error=error;this.ready=false;this.inFlight=false;worker?.terminate();this.worker=null;this.metrics.models=0;this.pending=null;reject(error);};
   try {
    worker=this.workerFactory();this.worker=worker;
    worker.onerror=event=>{if(this.worker===worker)fail(new Error(event.message||'Pose worker failed'));};
    worker.onmessage=({data})=>{
     if(this.worker!==worker)return;
     if(data.type==='ready'){clearTimeout(timer);this.ready=true;this.metrics.models=1;resolve();}
     else if(data.type==='error')fail(new Error(data.message));
     else if(data.type==='poses'){
      this.inFlight=false;this.metrics.frames++;this.metrics.inferenceTotalMs+=data.inferenceMs;
      this.metrics.inferenceMaxMs=Math.max(this.metrics.inferenceMaxMs,data.inferenceMs);
      if(this.enabled&&data.session===this.session&&data.at>this.latest.at)this.latest={poses:data.poses,at:data.at};
      else this.metrics.staleResults++;
     }
    };
    worker.postMessage({type:'init',maxPeople:this.config.poseMaxPeople});
   }catch(error){fail(error);}
  });
  const attempt=this.pending;attempt.catch(()=>{if(this.pending===attempt)this.pending=null;});
  return attempt;
 }
 start() {this.session++;this.enabled=true;this.latest={poses:[],at:-Infinity};this.lastSubmit=-Infinity;}
 stop() {this.session++;this.enabled=false;this.latest={poses:[],at:-Infinity};}
 async submit(image,at) {
  if(!this.enabled||!this.ready||this.inFlight||at-this.lastSubmit<this.config.poseIntervalMs)return;
  const session=this.session;this.inFlight=true;this.lastSubmit=at;
  try {
   const bitmap=await this.bitmapFactory(image);
   if(!this.enabled||session!==this.session){bitmap.close();this.inFlight=false;return;}
   this.worker.postMessage({type:'frame',image:bitmap,at,session},[bitmap]);
  }catch(error){this.inFlight=false;this.error=error;}
 }
 dispose() {this.stop();this.worker?.terminate();this.worker=null;this.ready=false;this.pending=null;this.metrics.models=0;}
 snapshot() {return {...this.metrics,active:Number(this.enabled),inFlight:Number(this.inFlight),
  averageInferenceMs:this.metrics.frames?this.metrics.inferenceTotalMs/this.metrics.frames:0};}
}
