const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..');
const forbidden=['字幕属性可编辑核验','交互效果模拟演示','数字化演绎内容'];
function check(manifest,plan,{files=true}={}){
 const s=manifest.state,items=s.timeline.entries.filter(e=>e.kind==='item');
 const registered=JSON.parse(fs.readFileSync(path.join(base,'planning/motion-graphics-properties-v4.json'),'utf8'));
 assert.ok(plan.durationFrames/plan.fps<=180,'duration cap');assert.equal(s.state.durationFrames,plan.durationFrames);assert.equal(s.state.fps,plan.fps);assert.deepEqual(s.state.canvas,{width:plan.width,height:plan.height});
 const main=s.timeline.tracks.find(t=>t.alias==='V1'),visual=items.filter(x=>x.trackId===main.id).sort((a,b)=>a.startFrame-b.startFrame);
 assert.equal(visual.length,plan.shots.length);let end=0;
 for(const [i,v]of visual.entries()){const shot=plan.shots[i];assert.equal(v.startFrame,end,'visual gap/overlap');assert.equal(v.startFrame,shot.startFrame);assert.equal(v.timelineRange.toFrame,shot.endFrame);end=v.timelineRange.toFrame;assert.equal(v.asset.id,shot.assetId,'source asset');if(shot.kind==='real-web-capture')assert.ok(Math.abs(v.sourceRange.start-shot.sourceInFrame/plan.fps*1e6)<2,'source in');if(files)assert.ok(fs.statSync(path.join(base,shot.source)).size>0,'readable source');}assert.equal(end,plan.durationFrames);
 const captions=items.filter(x=>x.trackAlias==='V2').sort((a,b)=>a.startFrame-b.startFrame);assert.equal(captions.length,plan.captions.length);
 for(const cue of plan.captions){const v=captions.find(x=>x.startFrame===cue.start&&x.timelineRange.toFrame===cue.end);assert.ok(v,'caption timing '+cue.id);assert.equal(v.asset.id,cue.assetId);assert.ok(!forbidden.some(t=>cue.text.includes(t)));if(manifest.itemDetails){const d=manifest.itemDetails.find(d=>v.id.replaceAll('-','').startsWith(d.item.id.replaceAll('-',''))),asset=registered.find(a=>v.asset.id.replaceAll('-','').startsWith(a.id.replaceAll('-','')));assert.ok(d&&asset,'native caption detail and registered defaults');const p={...Object.fromEntries(asset.properties.map(p=>[p.key,p.defaultValue])),...d.item.propertyOverrides};assert.equal(cue.kind==='recap'?p.title+'\n'+p.description:cue.kind==='title'?p.title:p.text,cue.text,'native visible text');}}
 for(let i=1;i<captions.length;i++)assert.ok(captions[i].startFrame>=captions[i-1].timelineRange.toFrame,'caption overlap');
 const titles=plan.captions.filter(c=>c.kind==='title');assert.equal(titles.length,1);assert.ok(titles[0].end<270,'title precedes webpage title');
 const sfx=items.filter(x=>x.trackAlias==='A2').map(x=>x.startFrame).sort((a,b)=>a-b),expected=[...plan.gestureEvents.map(e=>e.triggerFrame),...plan.audio.recapSfxFrames].sort((a,b)=>a-b);assert.deepEqual(sfx,expected,'SFX event positions');
 for(const e of plan.gestureEvents){assert.equal(e.triggerFrame-e.dwellStartFrame,plan.fps);assert.ok(e.releaseCompleteFrame>e.releaseFrame);}
 assert.ok(items.some(x=>x.trackAlias==='A1'&&x.startFrame===0&&x.timelineRange.toFrame===plan.durationFrames),'full music coverage');
 const recaps=plan.shots.filter(x=>x.id.startsWith('recap-'));assert.equal(recaps.length,3);for(const r of recaps){assert.equal(r.rectangle.width/r.rectangle.height,16/9);assert.ok(r.rectangle.top+r.rectangle.height<=910,'recap text separated');}
 const rendered=JSON.stringify(manifest.itemDetails??{});assert.ok(!forbidden.some(t=>rendered.includes(t)),'native instance text clean');
 if(files){const stamp=f=>{const ms=Math.round(f/plan.fps*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};const expected=plan.captions.map((c,i)=>`${i+1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.srtText??c.text}\n`).join('\n');assert.equal(fs.readFileSync(path.join(base,'subtitles/chubingrujiang-v4.srt'),'utf8').replaceAll('\r\n','\n'),expected,'SRT matches native cue content and time');}
 if(manifest.itemDetails){for(const d of manifest.itemDetails){assert.equal(d.item.playbackRate??1,1,'no whole clip slow motion');}}
 return {version:'v4',status:'EDITORIAL_STRUCTURE_PASS',durationFrames:plan.durationFrames,seconds:plan.durationFrames/plan.fps,shots:visual.length,captions:captions.length,sfxFrames:sfx,limits:['Native structure and source readability do not replace actual export checks or human audiovisual review.']};
}
if(require.main===module){const plan=JSON.parse(fs.readFileSync(path.join(base,'planning/timeline-v4.json'))),manifest=JSON.parse(fs.readFileSync(path.join(base,'planning/production-state-v4.json')));const r=check(manifest,plan);fs.writeFileSync(path.join(base,'docs/production-validation-v4.json'),JSON.stringify(r,null,2)+'\n');console.log(JSON.stringify(r));}
module.exports={check,forbidden};
