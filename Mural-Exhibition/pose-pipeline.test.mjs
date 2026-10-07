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
