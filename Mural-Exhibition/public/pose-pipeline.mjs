import {INTERACTION_CONFIG} from './interaction-config.mjs';
const percentile=(v,p)=>v.length?[...v].sort((a,b)=>a-b)[Math.floor((v.length-1)*p)]:0;
export class PosePipeline {
 constructor({workerFactory=()=>new Worker(new URL('./pose-worker.js',import.meta.url)),bitmapFactory=image=>createImageBitmap(image),now=()=>performance.now(),config={}}={}) {
  Object.assign(this,{workerFactory,bitmapFactory,now});this.config={...INTERACTION_CONFIG,...config};
  this.worker=null;this.pending=null;this.ready=false;this.session=0;this.enabled=false;this.inFlight=false;this.job=null;
  this.latest={poses:[],at:-Infinity,capturedAt:-Infinity,receivedAt:-Infinity};this.lastSubmit=-Infinity;this.error=null;this.rejectInit=null;
  this.metrics={models:0,frames:0,submitted:0,inferenceTotalMs:0,inferenceMaxMs:0,staleResults:0};this.latencies=[];this.inferences=[];this.intervals=[];this.lastReceived=null;this.submitIntervals=[];
 }
 failure(error,worker=this.worker) {
  if(worker!==this.worker)return;this.error=error;this.ready=false;this.inFlight=false;this.job=null;worker?.terminate();this.worker=null;this.metrics.models=0;
  clearTimeout(this.initTimer);this.rejectInit?.(error);this.rejectInit=null;this.pending=null;
 }
 initialize() {
  if(this.inFlight&&this.job&&this.now()-this.job.at>5000)this.failure(Object.assign(new Error('Pose inference timeout'),{code:'POSE_RUNTIME_ERROR',source:'pose-inference'}));
  if(this.ready&&!this.error&&this.worker)return Promise.resolve();if(this.pending)return this.pending;
  this.error=null;this.latencies=[];this.inferences=[];this.intervals=[];this.lastReceived=null;
  const attempt=new Promise((resolve,reject)=>{
   this.rejectInit=reject;
   try {
    const worker=this.workerFactory();this.worker=worker;
    this.initTimer=setTimeout(()=>this.failure(Object.assign(new Error('Pose initialization timeout'),{code:'POSE_INIT_TIMEOUT',source:'pose-model'}),worker),15000);
    worker.onerror=event=>this.failure(Object.assign(new Error(event.message||'Pose worker failed'),{code:'POSE_WORKER_ERROR',source:'pose-worker'}),worker);
    worker.onmessage=({data})=>{
     if(this.worker!==worker)return;
     if(data.type==='ready'){clearTimeout(this.initTimer);this.ready=true;this.metrics.models=1;this.rejectInit=null;resolve();}
     else if(data.type==='error')this.failure(Object.assign(new Error(data.message),{code:data.code||'POSE_RUNTIME_ERROR',source:data.source||'pose-worker'}),worker);
     else if(data.type==='poses'){
      if(!this.job||data.session!==this.job.session||data.at!==this.job.at){this.metrics.staleResults++;return;}
      this.inFlight=false;this.job=null;const receivedAt=this.now();this.metrics.frames++;this.metrics.inferenceTotalMs+=data.inferenceMs;
      this.metrics.inferenceMaxMs=Math.max(this.metrics.inferenceMaxMs,data.inferenceMs);
      if(this.enabled&&data.session===this.session&&data.at>this.latest.at){
       this.latencies.push(Math.max(0,receivedAt-data.at));this.inferences.push(data.inferenceMs);if(this.lastReceived!==null)this.intervals.push(receivedAt-this.lastReceived);
       this.latencies=this.latencies.slice(-120);this.inferences=this.inferences.slice(-120);this.intervals=this.intervals.slice(-120);this.lastReceived=receivedAt;
       this.latest={poses:data.poses,at:data.at,capturedAt:data.at,receivedAt,inferenceMs:data.inferenceMs};
      }else this.metrics.staleResults++;
     }
    };worker.postMessage({type:'init',maxPeople:this.config.poseMaxPeople});
   }catch(error){this.failure(error);reject(error);}
  });
  this.pending=attempt;attempt.finally(()=>{if(this.pending===attempt)this.pending=null;}).catch(()=>{});return attempt;
 }
 start() {this.session++;this.enabled=true;this.latest={poses:[],at:-Infinity,capturedAt:-Infinity,receivedAt:-Infinity};this.lastSubmit=-Infinity;this.lastReceived=null;this.intervals=[];this.submitIntervals=[];}
 stop() {this.session++;this.enabled=false;this.latest={poses:[],at:-Infinity,capturedAt:-Infinity,receivedAt:-Infinity};}
 async submit(image,at) {
  if(this.enabled&&this.inFlight&&at-(this.job?.at??at)>5000){this.failure(Object.assign(new Error('Pose inference timeout'),{code:'POSE_RUNTIME_ERROR',source:'pose-inference'}));return;}
  if(!this.enabled||!this.ready||this.inFlight||at-this.lastSubmit<this.config.poseIntervalMs)return;
  const worker=this.worker,session=this.session,job={session,at};this.inFlight=true;this.job=job;if(Number.isFinite(this.lastSubmit))this.submitIntervals.push(at-this.lastSubmit);this.submitIntervals=this.submitIntervals.slice(-120);this.lastSubmit=at;
  try {
   const bitmap=await this.bitmapFactory(image);
   if(!this.enabled||session!==this.session||worker!==this.worker){bitmap.close();if(this.job===job){this.job=null;this.inFlight=false;}return;}
   this.metrics.submitted++;worker.postMessage({type:'frame',image:bitmap,at,session},[bitmap]);
  }catch(error){this.failure(Object.assign(new Error(error.message||String(error)),{code:'FRAME_CONVERSION_ERROR',source:'video-frame'}),worker);}
 }
 dispose() {this.stop();this.failure(Object.assign(new Error('Pose disposed'),{code:'SESSION_CANCELLED'}));this.error=null;}
 snapshot() {return {...this.metrics,active:Number(this.enabled),inFlight:Number(this.inFlight),ready:this.ready,error:this.error?.message,
  submitFps:this.enabled&&this.submitIntervals.length?1000/(this.submitIntervals.reduce((a,b)=>a+b,0)/this.submitIntervals.length):0,
  successFps:this.enabled&&this.now()-this.latest.receivedAt<1000&&this.intervals.length?1000/(this.intervals.reduce((a,b)=>a+b,0)/this.intervals.length):0,
  capturedAt:this.latest.capturedAt,receivedAt:this.latest.receivedAt,latencyP50Ms:percentile(this.latencies,.5),latencyP95Ms:percentile(this.latencies,.95),
  inferenceP50Ms:percentile(this.inferences,.5),inferenceP95Ms:percentile(this.inferences,.95),intervalP95Ms:percentile(this.intervals,.95),samples:this.latencies.length,
  averageInferenceMs:this.metrics.frames?this.metrics.inferenceTotalMs/this.metrics.frames:0};}
}
