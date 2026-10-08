import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OperatorTracker} from './public/operator-tracker.mjs';
import {person,hand} from './b03-gesture-harness.mjs';
const update=(tracker,now,poses,hands=[])=>tracker.update({now,poseAt:now,poses,hands});
const acquire=(tracker,body=person())=>{let s;for(let at=0;at<=900;at+=100)s=update(tracker,at,[body]);return s;};

test('A: acquisition requires 800ms continuously central; edge passes and single shoulders cannot acquire',()=>{
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
 let s=update(t,1000,[a,b],[ah,bh]);assert.equal(s.activeOperator.id,id);assert.ok(s.assignedHands.length<=1);
 assert.ok(s.assignedHands.every(h=>h.operatorId===id));
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

test('V3.1 A/B: shoulders alone acquire centrally at near, middle and farther scales; one shoulder does not',()=>{
 for(const width of [.18,.3,.6]){
  const t=new OperatorTracker(),b=person({width,upper:true,missingWrists:['left','right']});
  assert.equal(update(t,0,[b]).operatorState,'CANDIDATE');
  let s;for(let at=100;at<=800;at+=100)s=update(t,at,[b]);
  assert.equal(s.operatorState,'PERSON_LOCKED');assert.equal(s.diagnostics.bodyMode,'upper');
  assert.equal(s.activeOperator.confidence,1);assert.equal(s.diagnostics.hipsVisible,false);
 }
 for(const i of [11,12]){const b=person({upper:true});b[i].visibility=0;assert.equal(acquire(new OperatorTracker(),b).activeOperator,null);}
});
test('V3.1 C/D: hips in/out and gradual approach/retreat preserve shoulder anchor and operator ID',()=>{
 const t=new OperatorTracker();const id=acquire(t,person({upper:true})).activeOperator.id;
 let at=900;for(const width of [.36,.44,.54,.65,.8,.65,.54,.44,.36,.3])for(const upper of [true,false,true]){
  const s=update(t,at+=80,[person({width,upper})]);assert.equal(s.operatorState,'PERSON_LOCKED');
  assert.equal(s.activeOperator.id,id);assert.equal(s.activeOperator.center.y,.35);
  assert.equal(s.activeOperator.bodyMode,upper?'upper':'full');
 }
 const s=update(t,at+80,[person({width:.12,upper:true})],[hand()]);
 assert.equal(s.activeOperator.id,id);assert.equal(s.assignedHands.length,0);
});
test('V3.1 E/F/I: missing or drifting Pose wrist falls back to own shoulders, strong wrists retain priority',()=>{
 for(const missingWrists of [[],['left'],['right'],['left','right']]){
  const t=new OperatorTracker(),hands=[hand(.25),hand(.75)],b=person({upper:true,hands,missingWrists});
  const id=acquire(t,b).activeOperator.id;
  for(const at of [1000,1100,1200]){
   const s=update(t,at,[b],hands);assert.equal(s.activeOperator.id,id);assert.equal(s.assignedHands.length,2);
   for(const side of ['left','right'])assert.equal(s.assignedHands.find(h=>h.side===side).source,missingWrists.includes(side)?'fallback':'pose');
  }
 }
 const t=new OperatorTracker(),hands=[hand(.25),hand(.75)],b=person({upper:true,hands});acquire(t,b);
 b[16].x=.01;b[16].y=.05;const s=update(t,1000,[b],hands);
 assert.equal(s.assignedHands.length,2);assert.equal(s.diagnostics.rightSource,'fallback');
 assert.equal(s.assignedHands.find(h=>h.side==='right').fallbackReason,'TOO_FAR');
});
test('V3.1 G/H: competitor envelopes and unresolved overlapping bodies block cross-person pairs without releasing',()=>{
 const t=new OperatorTracker(),hands=[hand(.25),hand(.75)],a=person({upper:true,hands,missingWrists:['right']});
 const id=acquire(t,a).activeOperator.id;
 const b=person({x:.24,width:.3,upper:true,hands:[hands[1]],missingWrists:['left','right']});
 let s=update(t,1000,[a,b],hands);assert.ok(s.assignedHands.length<2);assert.equal(s.activeOperator.id,id);
 assert.equal(s.diagnostics.assignmentBlocked,true);assert.ok(s.diagnostics.assignmentRejections.some(r=>r.reason==='AMBIGUOUS_PERSON'));
 const overlap=person({x:.52,upper:true,missingWrists:['left','right']});
 s=update(t,1100,[a,overlap],hands);assert.equal(s.activeOperator.id,id);assert.equal(s.assignedHands.length,0);
 // Recover the same identity once overlapping observations separate again.
 s=update(t,1200,[a],hands);assert.equal(s.activeOperator.id,id);assert.equal(s.assignedHands.length,2);
});
test('V3.1: fallback side follows unmirrored shoulder labels; ambiguous center and duplicate hands are refused',()=>{
 const t=new OperatorTracker(),b=person({upper:true,missingWrists:['left','right']});acquire(t,b);
 let s=update(t,1000,[b],[hand(.25),hand(.75)]);assert.equal(s.diagnostics.leftSource,'fallback');
 assert.equal(s.assignedHands.find(h=>h.side==='left').wrist.x,.75);
 s=update(t,1100,[b],[hand(.5)]);assert.equal(s.assignedHands.length,0);
 assert.ok(s.diagnostics.assignmentRejections.some(r=>r.reason==='AMBIGUOUS_SIDE'));
 s=update(t,1200,[b],[hand(.25),hand(.25)]);assert.equal(s.assignedHands.length,0);
 assert.ok(s.diagnostics.assignmentRejections.some(r=>r.reason==='AMBIGUOUS_SIDE'));
 const outside=update(t,1300,[b],[hand(.99,.99)]);assert.ok(outside.diagnostics.assignmentRejections.some(r=>r.reason==='OUTSIDE_OPERATOR_ENVELOPE'));
});
test('V3.1: fallback grace reserves ownership only, expires, rejects jumps and stale pose; true shoulder loss releases',()=>{
 const t=new OperatorTracker(),b=person({upper:true,missingWrists:['left','right']}),hands=[hand(.25),hand(.75)];
 const id=acquire(t,b).activeOperator.id;update(t,1000,[b],hands);
 let s=update(t,1100,[b],[]);assert.equal(s.assignedHands.length,2);assert.ok(s.assignedHands.every(h=>h.source==='grace'&&!h.fresh));
 s=update(t,1201,[b],[]);assert.equal(s.assignedHands.length,0);assert.equal(s.activeOperator.id,id);
 update(t,1300,[b],hands);s=update(t,1350,[b],[hand(.25,.1)]);
 assert.ok(s.diagnostics.assignmentRejections.some(r=>r.reason==='HAND_JUMP'));assert.equal(s.activeOperator.id,id);
 s=t.update({now:1600,poseAt:1300,poses:[b],hands});assert.equal(s.diagnostics.assignmentStatus,'STALE');assert.equal(s.assignedHands.length,0);
 s=update(t,2351,[]);assert.equal(s.operatorState,'PERSON_RELEASE');
 s=update(t,2400,[b]);assert.equal(s.operatorState,'CANDIDATE');
});
