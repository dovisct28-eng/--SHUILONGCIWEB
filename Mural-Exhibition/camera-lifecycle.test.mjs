import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CameraLifecycle,cameraError} from './public/camera-lifecycle.mjs';
const flush=async()=>{for(let n=0;n<12;n++)await Promise.resolve();};
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
function rig(options={}) {
 let time=0,created=0,active=0,max=0,cleaned=0,tracksStopped=0;const errors=[],video={srcObject:null,readyState:4};
 const m=new CameraLifecycle({video,now:()=>time,prepare:async()=>{},createCamera:s=>{created++;return {async start(){active++;max=Math.max(max,active);video.srcObject={getTracks:()=>[{stop(){tracksStopped++;}}]};},stop(){if(active)active--;}};},cleanup:async()=>{cleaned++;},onError:e=>errors.push(e),...options});
 return {m,video,errors,time:v=>time=v,counts:()=>({created,active,max,cleaned,tracksStopped})};
}
test('first entry, ten exit/reentry cycles, duplicate starts and idempotent cleanup use one capture',async()=>{
 const r=rig();for(let n=0;n<10;n++){await Promise.all([r.m.start(),r.m.start()]);const s=r.m.session;r.m.frame(s);r.m.result(s);assert.equal(r.m.state,'RUNNING');await Promise.all([r.m.stop(),r.m.stop()]);assert.equal(r.m.state,'IDLE');}
 assert.equal(r.counts().created,10);assert.equal(r.counts().cleaned,10);assert.equal(r.counts().max,1);assert.equal(r.counts().active,0);assert.equal(r.video.srcObject,null);
});
for(const name of ['NotAllowedError','NotFoundError','NotReadableError','SecurityError'])test(`${name}: failure classified, tracks removed, retry succeeds`,async()=>{
 const r=rig();let fail=true;const create=r.m.createCamera;r.m.createCamera=s=>{if(fail)return {async start(){r.video.srcObject={getTracks:()=>[{stop(){}}]};throw new DOMException(name,name);},stop(){}};return create(s);};
 await r.m.start();assert.equal(r.m.state,'ERROR');assert.equal(r.m.error.code,name);assert.equal(r.video.srcObject,null);fail=false;await r.m.start();assert.equal(r.m.error,null);await r.m.stop();
});
test('pending permission has no model/video timeout; late stream cleaned before queued reentry',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});const permission=deferred(),r=rig();let starts=0;
 r.m.createCamera=s=>({async start(){starts++;if(starts===1)await permission.promise;r.video.srcObject={getTracks:()=>[{stop(){}}]};},stop(){}});
 const old=r.m.start();await flush();assert.equal(r.m.state,'REQUESTING_PERMISSION');t.mock.timers.tick(60000);assert.equal(r.m.state,'REQUESTING_PERMISSION');
 await r.m.stop();const next=r.m.start();await flush();assert.equal(starts,1);assert.equal(r.m.snapshot().waitingForPrevious,true);assert.equal(r.m.state,'STOPPING');permission.resolve();await old;await next;assert.equal(starts,2);assert.equal(r.counts().cleaned,1);assert.equal(r.m.session.live,true);await r.m.stop();
});
test('initialization timeout cancels timer, stops resources and permits fresh preparation',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});const never=deferred(),r=rig({prepare:async(s,wait)=>wait(never.promise,'POSE_INIT_TIMEOUT','pose-model')});
 const run=r.m.start();await flush();t.mock.timers.tick(15000);await run;assert.equal(r.m.error.code,'POSE_INIT_TIMEOUT');assert.equal(r.counts().created,0);assert.equal(r.counts().cleaned,1);
 r.m.prepare=async()=>{};await r.m.start();await r.m.stop();never.resolve();assert.equal(r.m.state,'IDLE');
});
test('worker startup and runtime errors retain source; late callbacks cannot revive stopped session',async()=>{
 const r=rig({prepare:async()=>{throw cameraError('POSE_WORKER_ERROR','pose-worker','Failed');}});await r.m.start();assert.equal(r.m.error.source,'pose-worker');
 r.m.prepare=async()=>{};await r.m.start();const old=r.m.session;r.m.fail(cameraError('POSE_RUNTIME_ERROR','pose-inference','Runtime'));await flush();assert.equal(r.m.state,'ERROR');assert.equal(r.m.frame(old),false);r.m.result(old);assert.equal(r.m.state,'ERROR');
 await r.m.start();r.m.result(old);assert.notEqual(r.m.state,'RUNNING');await r.m.stop();
});
test('stream without frames differs from permission wait and unavailable video',async()=>{
 for(const readyState of [0,4]){const r=rig();await r.m.start();r.video.readyState=readyState;r.m.tick();r.time(15001);r.m.tick();await flush();assert.equal(r.m.error.code,readyState<2?'VIDEO_START_TIMEOUT':'VIDEO_NO_FRAMES');assert.equal(r.video.srcObject,null);}
});
test('model close is a barrier for hidden/reentry and rapid mode switching',async()=>{
 const closed=deferred(),r=rig({cleanup:()=>closed.promise});await r.m.start();const old=r.m.session,stop=r.m.stop(),next=r.m.start();await flush();assert.equal(r.counts().created,1);assert.equal(r.m.frame(old),false);
 closed.resolve();await stop;await next;assert.equal(r.counts().created,2);assert.equal(r.counts().max,1);await r.m.stop();
});
test('cleanup failure is visible and prevents a competing model until page reload',async()=>{
 const r=rig({cleanup:async()=>{throw Error('close failed');}});await r.m.start();await r.m.stop();assert.equal(r.m.error.code,'MODEL_CLEANUP_ERROR');await r.m.start();assert.equal(r.counts().created,1);assert.equal(r.m.state,'ERROR');
});

test('queued reentry is checked again after late permission; leaving twice cannot reopen camera',async()=>{
 const permission=deferred();let entered=true,starts=0;const r=rig({canStart:()=>entered,createCamera:()=>({async start(){starts++;await permission.promise;},stop(){}})});
 const old=r.m.start();await flush();await r.m.stop();const retry=r.m.start();entered=false;permission.resolve();await old;await retry;assert.equal(starts,1);assert.equal(r.m.session.live,false);
});
test('ended stream is rejected before cached pixels can be considered fresh',async()=>{const r=rig();await r.m.start();r.video.srcObject.active=false;r.m.tick();await flush();assert.equal(r.m.error.code,'CAMERA_STREAM_ENDED');assert.equal(r.m.session.live,false);});

test('an in-flight model timeout is not misclassified as missing video frames',async()=>{const r=rig();await r.m.start();r.m.session.inFlight=true;r.m.frame(r.m.session);r.time(20000);r.m.tick();assert.equal(r.m.error,null);r.m.session.inFlight=false;r.m.tick();await flush();assert.equal(r.m.error.code,'VIDEO_NO_FRAMES');});

test('Camera.stop failure still stops media tracks and cleans models, with a visible cleanup error',async()=>{let cleaned=0;const r=rig({createCamera:()=>({async start(){r.video.srcObject={getTracks:()=>[{stop(){}}]};},async stop(){throw Error('camera stop rejected');}}),cleanup:async()=>{cleaned++;}});await r.m.start();await r.m.stop();assert.equal(r.video.srcObject,null);assert.equal(cleaned,1);assert.equal(r.m.error.code,'MODEL_CLEANUP_ERROR');assert.equal(r.m.state,'ERROR');});
