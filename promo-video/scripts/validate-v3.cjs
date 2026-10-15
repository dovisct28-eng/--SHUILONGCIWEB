const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function check(manifest,plan){
 const s=manifest.state,items=s.timeline.entries.filter(e=>e.kind==='item'),mainId=s.timeline.tracks[0].id;
 assert.equal(s.state.durationFrames,plan.durationFrames,'version duration');assert.equal(s.state.fps,plan.fps);
 assert.deepEqual(s.state.canvas,{width:plan.width,height:plan.height});
 const visual=items.filter(x=>x.trackId===mainId).sort((a,b)=>a.startFrame-b.startFrame);
 let end=0;for(const v of visual){assert.equal(v.timelineRange.fromFrame,end,'visual gap/overlap');end=v.timelineRange.toFrame;}assert.equal(end,plan.durationFrames);
 assert.equal(visual.length,plan.shots.length,'shot count');
 for(const shot of plan.shots){const v=visual.find(v=>v.startFrame===shot.startFrame);assert.ok(v,shot.id);assert.equal(v.timelineRange.toFrame,shot.endFrame,shot.id+' range');if(shot.kind==='real-web-capture'){assert.equal(v.itemType,'video');assert.ok(Math.abs(v.sourceRange.start-shot.sourceInFrame/plan.fps*1e6)<2,shot.id+' source in');}else if(shot.kind==='actual-source-frame-hold')assert.equal(v.itemType,'image');else assert.equal(v.itemType,'motion-graphic');}
 const sfx=s.timeline.tracks.find(t=>t.name==='交互确认音');assert.ok(sfx);
 assert.deepEqual(items.filter(x=>x.trackId===sfx.id).map(x=>x.startFrame).sort((a,b)=>a-b),plan.gestureEvents.map(e=>e.triggerFrame));
 const cc=s.timeline.tracks.find(t=>t.name==='中文字幕与作品标题');assert.ok(cc);
 const captions=items.filter(x=>x.trackId===cc.id).sort((a,b)=>a.startFrame-b.startFrame);assert.equal(captions.length,plan.captions.length);
 for(const cue of plan.captions){assert.ok(captions.find(x=>x.startFrame===cue.start&&x.timelineRange.toFrame===cue.end),cue.id+' caption range');}
 for(let i=1;i<captions.length;i++)assert.ok(captions[i].startFrame>=captions[i-1].timelineRange.toFrame,'caption overlap');
 const a03=visual.find(x=>x.startFrame===plan.chapters.find(c=>c.id==='A03').startFrame);assert.equal(a03.timelineRange.toFrame-a03.startFrame,180,'six second A03');
 const b03=visual.find(x=>x.startFrame===plan.chapters.find(c=>c.id==='B03').startFrame);assert.equal(b03.timelineRange.toFrame-b03.startFrame,1110,'37 second simulation');
 const music=s.timeline.tracks.find(t=>t.name.includes('纯器乐配乐'));assert.ok(items.some(x=>x.trackId===music.id&&x.startFrame===0&&x.timelineRange.toFrame===plan.durationFrames));
 return {version:plan.version,status:'EDITORIAL_STRUCTURE_PASS',durationFrames:plan.durationFrames,fps:plan.fps,shots:visual.length,captions:captions.length,sfxFrames:plan.gestureEvents.map(e=>e.triggerFrame),limits:['Native timeline structure is verified; pixel motion, source resource readiness and music listening require actual output verification.']};
}
function validate(manifest,plan){const r=check(manifest,plan);fs.writeFileSync(path.resolve(__dirname,'../docs/production-validation-v3.json'),JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r));return r;}
module.exports={check,validate};
