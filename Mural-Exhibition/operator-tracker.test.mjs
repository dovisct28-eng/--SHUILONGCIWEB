import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OperatorTracker} from './public/operator-tracker.mjs';
import {person,hand} from './b03-gesture-harness.mjs';
const update=(tracker,now,poses,hands=[])=>tracker.update({now,poseAt:now,poses,hands});
const acquire=(tracker,body=person())=>{let s;for(let at=0;at<=900;at+=100)s=update(tracker,at,[body]);return s;};

test('A: acquisition requires 800ms continuously central; edge passes and incomplete torsos cannot acquire',()=>{
 const t=new OperatorTracker();let s=update(t,0,[person()]);assert.equal(s.operatorState,'CANDIDATE');
 for(let at=100;at<=400;at+=100)s=update(t,at,[person()]);assert.equal(s.operatorState,'CANDIDATE');
 for(let at=500;at<=800;at+=100)s=update(t,at,[person()]);assert.equal(s.operatorState,'PERSON_LOCKED');
 const edge=new OperatorTracker();for(let at=0;at<2000;at+=100)assert.equal(update(edge,at,[person({x:.9})]).activeOperator,null);
 const bad=person();bad[11].visibility=.1;assert.equal(update(new OperatorTracker(),0,[bad]).operatorState,'SEARCHING');
});
test('missing pose samples cannot count as continuously stable candidate hold',()=>{
 const t=new OperatorTracker();update(t,0,[person()]);update(t,400,[person()]);
 assert.equal(update(t,800,[person()]).operatorState,'CANDIDATE');
});
test('B/D: central scoring beats body size, and locked person cannot be stolen by a larger visitor',()=>{
 const t=new OperatorTracker(),a=person(),b=person({x:.73,width:.5});let s;
 for(let at=0;at<=900;at+=100)s=update(t,at,[b,a]);const id=s.activeOperator.id;assert.equal(s.activeOperator.center.x,.5);
 for(let at=1000;at<=3000;at+=100){s=update(t,at,[a,b]);assert.equal(s.activeOperator.id,id);}
});
test('C: no cross-person pair; wrists are normalized, competitor ambiguity rejects even near hands',()=>{
 const ah=hand(.65),bh=hand(.12),a=person({hands:[ah]}),b=person({x:.85,hands:[bh]});
 const t=new OperatorTracker();const id=acquire(t,a).activeOperator.id;
 let s=update(t,1000,[a,b],[ah,bh]);assert.equal(s.activeOperator.id,id);assert.equal(s.assignedHands.length,1);
 assert.equal(s.assignedHands[0].operatorId,id);
 const ambiguous=person({x:.85,hands:[ah]});s=update(t,1100,[a,ambiguous],[ah]);assert.equal(s.assignedHands.filter(h=>h.fresh).length,0);
 for(const width of [.16,.4]){
  const tracker=new OperatorTracker(),body=person({width,hands:[ah]});acquire(tracker,body);
  const near=structuredClone(ah);near[0].x+=width*.2;
  assert.equal(update(tracker,1000,[body],[near]).assignedHands.length,1);
 }
});
test('E/F: 200ms disappearance retains ID, 1000ms releases, new person must acquire anew',()=>{
 const t=new OperatorTracker(),a=person();const id=acquire(t,a).activeOperator.id;
 let s=update(t,1100,[]);assert.equal(s.activeOperator.id,id);assert.equal(s.assignedHands.length,0);
 s=update(t,1901,[person({x:.65})]);assert.equal(s.operatorState,'PERSON_RELEASE');assert.equal(s.activeOperator,null);
 s=update(t,2001,[person({x:.65})]);assert.equal(s.operatorState,'CANDIDATE');
 for(let at=2101;at<=2801;at+=100)s=update(t,at,[person({x:.65})]);assert.equal(s.operatorState,'PERSON_LOCKED');assert.notEqual(s.activeOperator.id,id);
});
test('Leaving the central zone releases even while the body remains visible',()=>{
 const t=new OperatorTracker();acquire(t);
 for(const [at,x]of [[1000,.65],[1100,.79],[1200,.9],[2200,.9]])update(t,at,[person({x})]);
 assert.equal(t.active,null);assert.equal(t.state,'PERSON_RELEASE');
});
test('Stale/future poses never assign hands or advance acquisition; grace does not replay motion',()=>{
 const t=new OperatorTracker(),h=hand(),a=person({hands:[h]});acquire(t,a);
 let s=t.update({now:1000,poseAt:1500,poses:[a],hands:[h]});assert.equal(s.assignedHands.length,0);
 s=t.update({now:1300,poseAt:900,poses:[a],hands:[h]});assert.equal(s.assignedHands.length,0);
 s=update(t,1400,[a],[h]);assert.equal(s.assignedHands[0].fresh,true);
 s=update(t,1450,[a],[]);assert.equal(s.assignedHands[0].fresh,false);
 s=update(t,1650,[a],[]);assert.equal(s.assignedHands.length,0);
});
test('Pose order changes preserve IDs; overlapping bodies and sudden jumps withhold control',()=>{
 const t=new OperatorTracker(),a=person(),b=person({x:.9});const id=acquire(t,a).activeOperator.id;
 update(t,1000,[b,a]);assert.equal(update(t,1100,[a,b]).activeOperator.id,id);
 const s=update(t,1200,[person({x:.8})],[hand()]);assert.equal(s.assignedHands.length,0);
});
