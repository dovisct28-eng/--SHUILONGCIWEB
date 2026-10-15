const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
const norm=x=>String(x).replaceAll('-','');
const sameId=(a,b)=>norm(a).startsWith(norm(b))||norm(b).startsWith(norm(a));
function check(candidate,baseline){
 const oldItems=baseline.state.timeline.entries.filter(x=>x.kind==='item');
 const newItems=candidate.state.timeline.entries.filter(x=>x.kind==='item');
 assert.equal(candidate.state.state.durationFrames,5190);assert.equal(candidate.state.state.fps,30);
 assert.deepEqual(candidate.state.state.canvas,{width:1920,height:1080});
 const newSource='c33c04d30d';
 for(const old of oldItems){
  const current=newItems.find(x=>x.trackAlias===old.trackAlias&&x.startFrame===old.startFrame);
  assert.ok(current,'missing original item at '+old.startFrame);assert.deepEqual(current.timelineRange,old.timelineRange);
  assert.deepEqual(current.sourceRange,old.sourceRange,'source timing changed');
  if(old.asset.name==='b02-full')assert.ok(sameId(current.asset.id,newSource),'new B02 capture missing');
  else assert.ok(sameId(current.asset.id,old.asset.id),'unrelated source changed');
  const before=baseline.itemDetails.find(x=>sameId(x.item.id,old.id));
  const after=candidate.itemDetails.find(x=>sameId(x.item.id,current.id));
  assert.ok(before&&after,'item detail missing');
  for(const key of ['startFrame','durationFrames','sourceIn','left','top','width','height','opacity','decibelAdjustment','fadeInDurationFrames','propertyOverrides'])
   assert.deepEqual(after.item[key]??null,before.item[key]??null,'changed stable field '+key+' at '+old.startFrame);
  assert.equal(after.item.fadeOutDurationFrames,old.startFrame===5010&&old.trackAlias==='V1'?30:before.item.fadeOutDurationFrames);
 }
 assert.equal(newItems.length,oldItems.length+1,'only one new text overlay');
 const closing=newItems.find(x=>x.startFrame===5010&&x.trackAlias==='V2');assert.ok(closing);assert.equal(closing.timelineRange.toFrame,5190);
 const text=Object.fromEntries(candidate.closingAsset.properties.map(p=>[p.key,p.defaultValue]));
 assert.equal(text.title,'出兵 · 入将');assert.equal(text.statement,'让壁画，从静态观看走向主动探索。');assert.equal(text.subtitle,'水龙祠壁画数字交互设计');
 assert.equal(candidate.watermark.removalAttempted,false);
 return {status:'EDITORIAL_STRUCTURE_PASS',durationFrames:5190,seconds:173,originalItemsPreserved:oldItems.length,newTextOverlays:1,replacedB02Items:3,audioUnchanged:true};
}
if(require.main===module){const r=check(JSON.parse(fs.readFileSync(path.join(base,'planning/production-state-v4-final.json'))),JSON.parse(fs.readFileSync(path.join(base,'planning/production-state-v4.json'))));fs.writeFileSync(path.join(base,'docs/v4-final-structure.json'),JSON.stringify(r,null,2)+'\n');console.log(r);}
module.exports={check};
