const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process');
const html=fs.readFileSync(path.join(__dirname,'public/index.html'),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
new vm.Script(script.replace(/^\s*import .*?;$/gm, '').replace("import('three')",'Promise.resolve({})'));
cp.execFileSync(process.execPath,['--check',path.join(__dirname,'server.js')]);
const base=cp.execFileSync('git',['show','fd46e4f:Mural-Exhibition/public/index.html'],{encoding:'utf8'});
const block=(s,start,end)=>{const a=s.indexOf(start),b=s.indexOf(end,a);assert.ok(a>=0&&b>a,`Missing protected block: ${start}`);return s.slice(a,b).replace(/\r\n/g,'\n');};
for(const [a,b] of [['const cyberScripts','function loadEntryImage'],['function initMediaPipe','let cameraStart'],['let cameraStart','let continuousOpenFrames'],['function isHandOpen','function handleGestureLogic']]) {
 assert.equal(block(html,a,b),block(base,a,b),`Protected core changed: ${a}`);
}
// B03 authorizes layout fitting, cancelable textures and one shared reveal action.
// The hand classification, thresholds, cooldown, pointer and scroll math stay exact.
const gesture=s=>block(s,'function handleGestureLogic','function triggerSwipeFlash').replace(/if \(dist > 0\.35 && !isRevealed\) \{[\s\S]*?(?=\n            \} else if)/,'REVEAL_ACTION');
assert.equal(gesture(html),gesture(base),'Gesture recognition/scrolling algorithm changed');
for(const removed of ['panMural','splash-poem','splash-subtitle','hideSplash','is-loaded','picsum.photos'])assert.ok(!html.includes(removed),removed);
assert.ok(html.includes('data-src="gallery/mural-02-detail.webp"'));
assert.equal(block(html,'<section id="splash-screen"','<div id="entry-mode-notice"'),block(base,'<section id="splash-screen"','<div id="entry-mode-notice"'));
assert.ok(!html.includes("        initWebGL();"));
assert.ok(fs.statSync(path.join(__dirname,'public/b01/mural-02-left.webp')).size<1024*1024);
// V2 explicitly authorizes Alpha feedback, bounded point density and capped DPR.
const legacyShader=s=>block(s,'const vertexShader','function initWebGL').replace(/\s*uniform float uFigure;\s*uniform float uFeedback;/g,'').replace(/\s*uniform vec2 uTexel;/g,'').replace(/\s*\/\/ FIGURE_FEEDBACK_START[\s\S]*?\/\/ FIGURE_FEEDBACK_END/g,'').replace(' * (1.0 - uFigure)','').replace('mix(1.0 - totalDisp, uFeedback, uFigure)','(1.0 - totalDisp)').replace(/\s+/g,' ');
assert.equal(legacyShader(html),legacyShader(base),'Legacy shader equations changed outside authorized figure feedback');
assert.equal((html.match(/new THREE.WebGLRenderer/g)||[]).length,1);
console.log('B01 syntax/composition, dependencies, legacy shader equations, camera lifecycle/gesture recognition and scroll math: PASS');
