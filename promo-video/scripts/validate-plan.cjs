const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=path.resolve(__dirname,'..');
function validate(plan,register){
 const passed=[];
 const check=(name,fn)=>{fn();passed.push(name);};
 const range=(r)=>{assert.ok(Number.isInteger(r.start)&&Number.isInteger(r.end)&&r.start>=0&&r.end>r.start&&r.end<=plan.durationFrames,'invalid frame range');};
 check('format and fixed source',()=>{assert.equal(plan.width,1920);assert.equal(plan.height,1080);assert.equal(plan.fps,30);assert.ok(Number.isInteger(plan.durationFrames)&&plan.durationFrames>=120*plan.fps);assert.equal(plan.sourceCommit,register.baseline);});
 check('six chapters cover the full planned duration',()=>{assert.equal(plan.chapters.length,6);let at=0;for(const c of plan.chapters){range(c);assert.equal(c.start,at,'chapter gap/overlap');at=c.end;}assert.equal(at,plan.durationFrames);});
 check('shots are continuous and belong to chapters',()=>{assert.ok(plan.shots.length);assert.equal(new Set(plan.shots.map(s=>s.id)).size,plan.shots.length);let at=0;for(const s of plan.shots){range(s);assert.equal(s.start,at,'shot gap/overlap');const c=plan.chapters.find(c=>c.id===s.chapter);assert.ok(c&&s.start>=c.start&&s.end<=c.end,'shot crosses chapter boundary');assert.ok(['real-ui','programmed','simulation'].includes(s.kind));at=s.end;}assert.equal(at,plan.durationFrames);});
 check('A03 has six independent seconds between A02 and A04',()=>{
  const index=id=>plan.shots.findIndex(s=>s.sourceModules?.includes(id));
  const indices=['A02','A03','A04'].map(index);
  assert.ok(indices.every(i=>i>=0)&&indices[0]<indices[1]&&indices[1]<indices[2],'missing or reordered A02/A03/A04');
  const a03=plan.shots.filter(s=>s.sourceModules?.includes('A03'));
  assert.equal(a03.length,1,'A03 requires an independent shot');
  const s=a03[0];assert.equal(s.kind,'real-ui');assert.equal(s.end-s.start,6*plan.fps,'A03 must stay six seconds');
  assert.ok(Number.isInteger(s.stableStartFrame)&&Number.isInteger(s.stableEndFrame)&&s.stableStartFrame>=s.start&&s.stableEndFrame<=s.end&&s.stableEndFrame-s.stableStartFrame>=3*plan.fps,'A03 stable reading too short');
 });
 check('every referenced source exists in the audited remote baseline',()=>{const byPath=new Map(register.records.map(r=>[r.path,r]));for(const s of plan.shots){assert.ok(s.assets.length);for(const key of s.assets){const p=plan.assets[key],r=byPath.get(p);assert.ok(r?.localExists&&r.baseline&&r.status.startsWith('MATCHES_BASELINE'),'untracked, deleted, changed, or unaudited visual source: '+key);}}});
 check('captions are independent, legible in duration, and nonoverlapping',()=>{let at=0;for(const c of plan.captions){range(c);assert.ok(c.start>=at,'caption overlap');assert.ok(c.text.trim());assert.ok(c.text.split('\n').length<=2);const seconds=(c.end-c.start)/plan.fps;assert.ok(seconds>=2&&seconds<=5,'caption duration');at=c.end;}});
 check('simulation disclosure covers every simulated frame',()=>{const disclosures=plan.overlays.filter(o=>o.purpose==='simulation-disclosure'&&o.text==='交互效果模拟演示');for(const s of plan.shots.filter(s=>s.kind==='simulation'))for(let f=s.start;f<s.end;f++)assert.ok(disclosures.some(o=>f>=o.start&&f<o.end),'undisclosed simulation frame '+f);const s04=plan.shots.filter(s=>s.chapter==='S04');assert.ok(s04.length&&s04.every(s=>s.kind==='simulation'));for(const o of plan.overlays)range(o);});
 check('gesture dwell, action order, transition, and release are causal',()=>{
  assert.deepEqual(plan.gestureEvents.map(e=>e.action),['NEXT','OPEN','CLOSE']);
  const simulation=plan.chapters.find(c=>c.id==='S04');
  let previousRelease=simulation.start;
  for(const e of plan.gestureEvents){
   assert.ok(Object.entries(e).filter(([k])=>k.endsWith('Frame')).every(([,v])=>Number.isInteger(v)&&v>=simulation.start&&v<simulation.end),'gesture frame outside simulation');
   assert.ok(e.moveInFrame>=previousRelease&&e.moveInFrame<=e.dwellStartFrame,'action before previous release');
   assert.ok(e.triggerFrame-e.dwellStartFrame>=30,'trigger before one second dwell');
   assert.ok(e.transitionEndFrame>=e.triggerFrame,'transition before action');
   if(e.action!=='NEXT')assert.ok(e.transitionEndFrame-e.triggerFrame>=23,'reading transition under 750ms');
   assert.ok(e.releaseStartFrame>=e.transitionEndFrame,'release during transition');
   assert.ok(e.releaseEndFrame-e.releaseStartFrame>=8,'release under 250ms');
   previousRelease=e.releaseEndFrame;
  }
 });
 check('music has a recurring theme, complete arrangement, and aligned cues',()=>{
  assert.ok(plan.audio.themeId&&plan.audio.themeDescription&&plan.audio.stemRoles.length>=4,'music plan lacks thematic layers');
  assert.equal(plan.audio.sections.length,plan.chapters.length);
  for(const [i,s]of plan.audio.sections.entries()){
   const c=plan.chapters[i];assert.deepEqual([s.id,s.start,s.end],[c.id,c.start,c.end],'music section coverage');
   assert.equal(s.themeId,plan.audio.themeId);assert.ok(s.arrangement&&s.lead&&s.support.length);
  }
  for(const cue of plan.audio.cues)assert.ok(Number.isInteger(cue.frame)&&cue.frame>=0&&cue.frame<plan.durationFrames,'music cue outside film');
  const a03=plan.shots.find(s=>s.sourceModules?.includes('A03')),cue=plan.audio.cues.find(c=>c.id==='A03-theme');
  assert.ok(cue?.kind==='music'&&cue.frame>=a03.stableStartFrame&&cue.frame<a03.stableEndFrame,'A03 theme cue misses reading');
  for(const e of plan.gestureEvents)assert.equal(plan.audio.cues.find(c=>c.id===e.action+'-confirm')?.frame,e.triggerFrame,'sound and gesture trigger differ');
 });
 return passed;
}
const time=(frame,fps=30)=>{
 const ms=Math.round(frame/fps*1000),hh=Math.floor(ms/3600000),mm=Math.floor(ms/60000)%60,ss=Math.floor(ms/1000)%60;
 return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;
};
function exportPlan(plan,checks){
 const kind={'real-ui':'真实页面录制（待录）',programmed:'项目素材程序合成（待制）',simulation:'交互模拟（待制）'};
 const md=[`# ${plan.shots.length}镜头制作清单 · ${plan.durationFrames/plan.fps}秒 · Phase 1规划稿`,'','由`planning/timeline.json`生成。所有媒体均待制作；时码采用30fps的[start,end)，不是已有视频证据。每镜建议另录前后各1秒handle，最终剪辑仅使用下列区间。',''];
 for(const c of plan.chapters){md.push(`## ${c.id} ${c.title} · ${time(c.start).replace(',000','')}–${time(c.end).replace(',000','')}`,'');for(const s of plan.shots.filter(s=>s.chapter===c.id)){
  md.push(`### ${s.id} · ${time(s.start)}–${time(s.end)} · ${(s.end-s.start)/30}秒`,'',`- 类型：${kind[s.kind]}；帧区间F${s.start}–F${s.end-1}${s.sourceModules?.length?'；模块：'+s.sourceModules.join(' / '):''}。`,`- 画面：${s.visual}。`,`- 操作/制作：${s.operation}。`,`- 素材：${s.assets.map(a=>'`'+plan.assets[a]+'`').join('；')}。`,`- 转场：${s.transition}；声音：${s.sound}。`,`- 验收：${s.acceptance}。`,'');
 }}
 fs.writeFileSync(path.join(base,'docs/shot-list.md'),md.join('\n').trimEnd()+'\n');
 const srt=plan.captions.map((c,i)=>`${i+1}\n${time(c.start)} --> ${time(c.end)}\n${c.text}\n`).join('\n');
 fs.mkdirSync(path.join(base,'subtitles'),{recursive:true});
 fs.writeFileSync(path.join(base,'subtitles/chubingrujiang-planning.srt'),srt);
 fs.writeFileSync(path.join(base,'docs/plan-validation.json'),JSON.stringify({date:'2026-10-15',status:'PASS',checks,shots:plan.shots.length,chapters:plan.chapters.length,captions:plan.captions.length,frames:plan.durationFrames,limits:'Planning invariants only. No rendered media, visual review, export, rights, or real-camera acceptance.'},null,2)+'\n');
}
if(require.main===module){const plan=JSON.parse(fs.readFileSync(path.join(base,'planning/timeline.json'),'utf8')),register=JSON.parse(fs.readFileSync(path.join(base,'docs/asset-register.json'),'utf8'));const checks=validate(plan,register);exportPlan(plan,checks);console.log(JSON.stringify({status:'PASS',checks:checks.length,shots:plan.shots.length,frames:plan.durationFrames,captions:plan.captions.length}));}
module.exports={validate,time};
