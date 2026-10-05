import test from 'node:test';import assert from 'node:assert/strict';
import {sampleTour,route,duration} from './path.mjs';
import {cutawayState} from './cutaway-state.mjs';
import {routeWeights,storyTime} from './timing.mjs';
import {a04Labels} from './composition.mjs';
const overview={position:[-32,37,-12],target:[1,.1,-2.8]};
test('45 and 58 second candidates share all camera/route milestones',()=>{assert.equal(duration,45);for(let t=0;t<=45;t+=.1){const a=sampleTour(t,overview),b=sampleTour(t*58/45,overview,58);for(const key of ['position','target'])for(let i=0;i<3;i++)assert.ok(Math.abs(a.camera[key][i]-b.camera[key][i])<1e-10);assert.ok(Math.abs(storyTime(t*58/45,58)-t)<1e-10);}});
test('route grows only along the frozen world paths and active trace outranks other states',()=>{assert.deepEqual(route[0],[[-2.7,.56,-11.75]]);let previous=[0,0,0];for(let t=0;t<=45;t+=.1){const sample=sampleTour(t,overview);sample.growth.forEach((g,i)=>assert.ok(g>=previous[i]));previous=sample.growth;}const active=routeWeights([1,.5,0],1,1),past=routeWeights([1,.5,0],0,1);assert.ok(active.trace>past.trace&&past.trace>active.future);assert.equal(routeWeights([1,1,1],1,-1,true).current,false);});
test('local window follows travel, restores wall support at stops and returns to summary',()=>{const at=t=>cutawayState({...sampleTour(t,overview),entryProgress:1});for(const t of [6,20,34]){const s=at(t);assert.equal(s.wallWeight,0);assert.equal(s.summary,0);assert.ok(s.half[1]<5);}assert.notDeepEqual(at(9).center,at(16).center);assert.equal(at(45).summary,1);const completed=cutawayState({routeComplete:true,entryProgress:1,guideStartProgress:0});assert.equal(completed.name,'summary');assert.equal(completed.summary,1);assert.equal(cutawayState({routeComplete:true,entryProgress:1,guideStartProgress:1}).wallWeight,0);assert.equal(cutawayState(null).weight,0);});
test('label layout preserves anchors, avoids viewport edges and has only one current node',()=>{for(const [w,h]of [[1920,1080],[1440,900],[1366,768],[1024,768]]){const points=['mural-05','mural-01','mural-02'].map(id=>({id,x:w*.5,y:h*.5,z:.8}));const labels=a04Labels(points,w,h,'mural-05');assert.equal(labels.filter(p=>p.current).length,1);for(const p of labels){assert.equal(p.x,w*.5);assert.equal(p.y,h*.5);assert.ok(p.lx>=64&&p.lx<=w-64&&p.ly>=105&&p.ly<=h-115);}}});
test('moving openings remain continuous and reveal the return destination without removing the opposite roof edge',()=>{const at=t=>cutawayState({...sampleTour(t,overview),entryProgress:1});const middle=at(27);assert.ok(middle.center[1]-middle.half[1]<-15.2);assert.ok(middle.center[0]-middle.half[0]>-2);for(const boundary of [8,18,22,32]){const a=at(boundary-.0001),b=at(boundary+.0001);for(const key of ['center','half'])for(let i=0;i<2;i++)assert.ok(Math.abs(a[key][i]-b[key][i])<.01);}});
test('summary closes all windows and fifth approach reopens gradually and reversibly',()=>{const at=p=>cutawayState({routeComplete:true,entryProgress:1,guideStartProgress:p});assert.equal(at(0).summary,1);assert.equal(at(.35).summary,0);let last=1;for(let p=0;p<=.35;p+=.01){const s=at(p);assert.ok(s.summary<=last);assert.deepEqual(s.center,[-1.4,-11.75]);last=s.summary;}assert.ok(at(.001).summary>.999);assert.equal(at(0).summary,1);assert.equal(cutawayState({...sampleTour(41,overview),entryProgress:1}).summary,1);});
test('fifth opening covers the complete main-hall roof including ridge/eave edges',()=>{
  const bounds={min:[-5.380647,-15.698],max:[5.380647,-7.402]};
  const states=[cutawayState({...sampleTour(0,overview),entryProgress:1}),cutawayState({...sampleTour(7.9,overview),entryProgress:1}),cutawayState({routeComplete:true,entryProgress:1,guideStartProgress:1})];
  for(const s of states)for(let i=0;i<2;i++){
    assert.ok(s.center[i]-s.half[i]+.02<bounds.min[i]);
    assert.ok(s.center[i]+s.half[i]-.02>bounds.max[i]);
  }
  const after= cutawayState({...sampleTour(10,overview),entryProgress:1});
  for(const [i,value]of [2.9,3.5].entries())assert.ok(Math.abs(after.half[i]-value)<1e-12);
});
