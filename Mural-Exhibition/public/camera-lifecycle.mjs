// A single owner for permission, capture, model preparation and teardown.
export const cameraError=(code,source,message)=>Object.assign(new Error(message),{code,source});
export class CameraLifecycle {
 constructor({prepare,createCamera,video,cleanup,onState=()=>{},onError=()=>{},canStart=()=>true,now=()=>performance.now(),timeoutMs=15000}={}) {
  Object.assign(this,{prepare,createCamera,video,cleanup,onState,onError,canStart,now,timeoutMs});
  this.version=0;this.state='IDLE';this.session=null;this.pending=null;this.error=null;this.events=[];this.changedAt=now();this.waitingForPrevious=false;
 }
 setState(state) {this.state=state;this.changedAt=this.now();this.events.push({at:this.changedAt,state,version:this.version});this.events=this.events.slice(-80);this.onState(state);}
 async bounded(promise,session,code,source) {
  let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(cameraError(code,source,code)),this.timeoutMs);session.timers.add(timer);}),session.cancelled]);}
  finally {clearTimeout(timer);session.timers.delete(timer);}
 }
 start() {
  if(!this.canStart())return Promise.resolve();
  if(this.stopping)return this.stopping.then(()=>this.start());
  if(this.cleanupFailed){this.onError(this.error);return Promise.resolve();}
  if(this.session?.live)return this.pending||Promise.resolve();
  if(this.pending){this.waitingForPrevious=true;this.setState('STOPPING');return this.pending.then(()=>this.start());}
  const s={version:++this.version,live:true,camera:null,timers:new Set(),lastFrame:null,streamSince:null};
  s.cancelled=new Promise((_,reject)=>s.cancel=()=>reject(cameraError('SESSION_CANCELLED','lifecycle','Session cancelled')));s.cancelled.catch(()=>{});
  this.session=s;this.error=null;this.waitingForPrevious=false;this.setState('INITIALIZING_MODELS');
  const run=(async()=>{
   try {
    await this.prepare(s,(p,code,source)=>this.bounded(p,s,code,source));
    if(!s.live)return;
    s.camera=this.createCamera(s);this.setState('REQUESTING_PERMISSION');
    // Permission prompts have no deadline. Camera.start owns the native request.
    // Keep its settlement as a barrier, so late permission cannot affect a new session.
    await s.camera.start();
    if(!s.live)return;
    if(s.lastFrame===null){s.streamSince??=this.now();this.setState('STARTING_VIDEO');}
   }catch(error){if(s.live){this.error={code:typeof error.code==='string'?error.code:error.name,source:error.source||'camera',message:error.message};this.setState('ERROR');this.onError(this.error);}}
   finally {if(!s.live||this.state==='ERROR')await this.release(s);}
  })();
  this.pending=run.finally(()=>{if(this.pending===pending)this.pending=null;});const pending=this.pending;return pending;
 }
 frame(s) {
  if(!s.live||s!==this.session)return false;s.lastFrame=this.now();
  if(['REQUESTING_PERMISSION','STARTING_VIDEO'].includes(this.state))this.setState('WARMING_UP');return true;
 }
 result(s) {if(s.live&&s===this.session&&this.state!=='RUNNING')this.setState('RUNNING');}
 fail(error,s=this.session) {if(!s?.live||s!==this.session)return;this.error={code:typeof error.code==='string'?error.code:error.name,source:error.source||'inference',message:error.message};this.setState('DEGRADED');this.onError(this.error);void this.stop(true);}
 tick() {
  const s=this.session;if(!s?.live)return;
  if(this.video.srcObject?.active===false){this.fail(cameraError('CAMERA_STREAM_ENDED','camera','Camera stream ended'),s);return;}
  if(this.video.srcObject&&s.streamSince===null){s.streamSince=this.now();if(this.state==='REQUESTING_PERMISSION')this.setState('STARTING_VIDEO');}
  if(!s.inFlight&&s.streamSince!==null&&this.now()-(s.lastFrame??s.streamSince)>this.timeoutMs)this.fail(cameraError(this.video.readyState<2?'VIDEO_START_TIMEOUT':'VIDEO_NO_FRAMES','video','Video stream has no frames'),s);
 }
 async release(s) {
  s.live=false;for(const timer of s.timers)clearTimeout(timer);s.cancel();let cameraStop;try{cameraStop=Promise.resolve(s.camera?.stop());}catch(error){cameraStop=Promise.reject(error);}
  const stream=this.video.srcObject;stream?.getTracks().forEach(t=>t.stop());this.video.srcObject=null;
  if(!s.cleanupPromise){let timer;const timeout=new Promise((_,reject)=>timer=setTimeout(()=>reject(new Error('Model cleanup timeout')),5000));s.cleanupPromise=Promise.race([Promise.all([cameraStop,Promise.resolve().then(()=>this.cleanup(s))]),timeout]).finally(()=>clearTimeout(timer)).catch(error=>{this.cleanupFailed=true;this.error={code:'MODEL_CLEANUP_ERROR',source:'cleanup',message:error.message};this.onError(this.error);});}else cameraStop.catch(error=>{this.cleanupFailed=true;this.error={code:'MODEL_CLEANUP_ERROR',source:'cleanup',message:error.message};this.onError(this.error);});await s.cleanupPromise;
 }
 stop(failed=false) {
  if(this.stopping)return this.stopping;
  const s=this.session;if(!s){if(!failed)this.setState('IDLE');return Promise.resolve();}
  this.waitingForPrevious=false;this.setState('STOPPING');
  const operation=this.release(s).then(()=>{if(this.session===s)this.setState(failed||this.cleanupFailed?'ERROR':'IDLE');});
  this.stopping=operation.finally(()=>{if(this.stopping===pending)this.stopping=null;});const pending=this.stopping;return pending;
 }
 snapshot(){return {state:this.state,version:this.version,error:this.error,events:this.events,pending:!!this.pending,waitingForPrevious:this.waitingForPrevious,active:Number(!!this.session?.live)};}
}
