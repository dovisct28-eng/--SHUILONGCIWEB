import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PosePipeline} from './public/pose-pipeline.mjs';
function fixture(){
 let workers=0,frames=0,closed=0;
 const worker={postMessage(data){if(data.type==='init')queueMicrotask(()=>this.onmessage({data:{type:'ready'}}));else {frames++;data.image.close();this.frame=data;}},terminate(){workers--;}};
 const pipeline=new PosePipeline({workerFactory:()=>{workers++;return worker;},bitmapFactory:async()=>({close(){closed++;}})});
 return {pipeline,worker,counts:()=>({workers,frames,closed})};
}
test('one model, one pending inference, 12.5 FPS cap, timestamp association and reentry stale rejection',async()=>{
 const {pipeline:p,worker:w,counts}=fixture();await Promise.all([p.initialize(),p.initialize()]);assert.equal(counts().workers,1);
 p.start();await p.submit({},100);await p.submit({},200);assert.equal(counts().frames,1);
 const old=w.frame;p.stop();p.start();w.onmessage({data:{type:'poses',session:old.session,at:100,poses:[[]],inferenceMs:10}});
 assert.equal(p.latest.at,-Infinity);assert.equal(p.snapshot().staleResults,1);
 await p.submit({},300);w.onmessage({data:{type:'poses',session:w.frame.session,at:300,poses:[[]],inferenceMs:10}});
 await p.submit({},350);assert.equal(counts().frames,2);assert.equal(p.latest.at,300);
 await p.initialize();assert.equal(counts().workers,1);p.dispose();assert.equal(counts().workers,0);
});
test('late bitmap after mode stop is closed and never sent to an old session',async()=>{
 let finish,closed=0;const {pipeline:p,counts}=fixture();await p.initialize();p.start();
 p.bitmapFactory=()=>new Promise(r=>finish=r);const pending=p.submit({},100);p.stop();finish({close(){closed++;}});await pending;
 assert.equal(closed,1);assert.equal(counts().frames,0);assert.equal(p.inFlight,false);p.dispose();
});
test('synchronous worker construction failure does not poison future retries',async()=>{
 const {pipeline:p,worker:w}=fixture();let attempts=0;
 p.workerFactory=()=>{if(attempts++===0)throw Error('temporary startup failure');return w;};
 await assert.rejects(p.initialize(),/temporary/);await p.initialize();assert.equal(p.ready,true);p.dispose();
});
test('bounded initialization timeout terminates the worker; late readiness cannot resurrect it; retry creates one model',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 let terminated=0;
 const old={postMessage(){},terminate(){terminated++;}};
 const p=new PosePipeline({workerFactory:()=>old});
 const pending=p.initialize(),rejection=assert.rejects(pending,/Pose initialization timeout/);
 t.mock.timers.tick(14999);assert.equal(p.worker,old);assert.equal(p.ready,false);
 t.mock.timers.tick(1);await rejection;
 assert.equal(terminated,1);assert.equal(p.worker,null);assert.equal(p.snapshot().models,0);
 old.onmessage({data:{type:'ready'}});assert.equal(p.ready,false);
 const next={postMessage(){queueMicrotask(()=>this.onmessage({data:{type:'ready'}}));},terminate(){terminated++;}};
 p.workerFactory=()=>next;await Promise.all([p.initialize(),p.initialize()]);
 old.onerror({message:'late old-worker error'});assert.equal(p.ready,true);
 assert.equal(p.worker,next);assert.equal(p.snapshot().models,1);p.dispose();assert.equal(terminated,2);
});

test('runtime worker failure destroys poisoned instance; concurrent retry reinitializes and rejects old error/result',async()=>{
 let workers=[],terminated=0;const p=new PosePipeline({workerFactory:()=>{const w={postMessage(d){if(d.type==='init')queueMicrotask(()=>w.onmessage({data:{type:'ready'}}));else this.frame=d;},terminate(){terminated++;}};workers.push(w);return w;},bitmapFactory:async()=>({close(){}})});
 await p.initialize();p.start();await p.submit({},100);const old=workers[0];old.onmessage({data:{type:'error',message:'runtime failure',code:'POSE_RUNTIME_ERROR'}});
 assert.equal(p.ready,false);assert.equal(p.worker,null);assert.equal(terminated,1);await Promise.all([p.initialize(),p.initialize()]);assert.equal(workers.length,2);assert.equal(p.ready,true);
 old.onmessage({data:{type:'poses',at:100,session:1,poses:[[]],inferenceMs:1}});old.onerror({message:'late failure'});assert.equal(p.error,null);assert.equal(p.latest.at,-Infinity);p.dispose();
});
test('dispose while initializing settles promise and rejects late ready; conversion error requires actual reinitialize',async()=>{
 const w={postMessage(){},terminate(){}};const p=new PosePipeline({workerFactory:()=>w});const start=p.initialize(),rejected=assert.rejects(start,/disposed/);p.dispose();await rejected;w.onmessage({data:{type:'ready'}});assert.equal(p.ready,false);
 const {pipeline:q,worker:r}=fixture();await q.initialize();q.start();q.bitmapFactory=async()=>{throw new DOMException('bitmap fail','InvalidStateError');};await q.submit({},100);assert.equal(q.error.code,'FRAME_CONVERSION_ERROR');assert.equal(q.worker,null);assert.equal(q.ready,false);q.dispose();
});

test('reentry with a healthy in-flight old frame does not use reset submit time as a timeout',async()=>{
 const {pipeline:p,worker:w}=fixture();await p.initialize();p.start();await p.submit({},100);const old=w.frame;p.stop();p.start();await p.submit({},200);assert.equal(p.error,null);assert.equal(p.inFlight,true);
 w.onmessage({data:{type:'poses',at:old.at,session:old.session,poses:[],inferenceMs:10}});assert.equal(p.inFlight,false);assert.equal(p.latest.at,-Infinity);await p.submit({},300);assert.equal(w.frame.at,300);p.dispose();
});
