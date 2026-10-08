const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process');
const html=fs.readFileSync(path.join(__dirname,'public/index.html'),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
new vm.Script(script.replace(/^\s*import .*?;$/gm, '').replace("import('three')",'Promise.resolve({})'));
cp.execFileSync(process.execPath,['--check',path.join(__dirname,'server.js')]);
const base=cp.execFileSync('git',['show','fd46e4f:Mural-Exhibition/public/index.html'],{encoding:'utf8'});
const block=(s,start,end)=>{const a=s.indexOf(start),b=s.indexOf(end,a);assert.ok(a>=0&&b>a,`Missing protected block: ${start}`);return s.slice(a,b).replace(/\r\n/g,'\n');};
for(const [a,b] of [['const cyberScripts','function loadEntryImage']]) {
 const current=block(html,a,b).split('// Only NEXT')[0].trimEnd().replace('            nextGesture.resetGestureState(); renderGestureFeedback();\n','');
 const frozen=block(base,a,b).replace(/        let continuousOpenFrames = 0;\n        let continuousClosedFrames = 0;\n        let currentHandState = 'closed';\n\n/,'');
 assert.equal(current,frozen.trimEnd(),`Protected core changed: ${a}`);
}
// B03 authorizes layout fitting, cancelable textures and one shared reveal action.
// V3 authorizes camera/Pose ownership and arbitration. Classifier and scroll equations stay exact.
const gesture=require('./b03-gesture-contract.cjs');
const gestureBaseline=cp.execFileSync('git',['show','af582f5:Mural-Exhibition/public/index.html'],{encoding:'utf8'});
assert.equal(gesture(html),gesture(gestureBaseline),'Protected hand classification/archive reading changed');
assert.equal((html.match(/new Hands\(/g)||[]).length,1);
assert.equal((html.match(/new Camera\(/g)||[]).length,1);
assert.ok(html.includes('width: 320, height: 240'));
assert.ok(html.includes('handsFrameVersion !== cameraVersion'));
assert.ok(html.includes('if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0)'));
assert.ok(!html.includes('handsWithSize'));
for(const removed of ['panMural','splash-poem','splash-subtitle','hideSplash','is-loaded','picsum.photos'])assert.ok(!html.includes(removed),removed);
assert.ok(html.includes('data-src="gallery/mural-02-detail.webp"'));
assert.equal(block(html,'<section id="splash-screen"','<div id="entry-mode-notice"'),block(base,'<section id="splash-screen"','<div id="entry-mode-notice"'));
assert.ok(!html.includes("        initWebGL();"));
assert.ok(fs.statSync(path.join(__dirname,'public/b01/mural-02-left.webp')).size<1024*1024);
// V2 explicitly authorizes Alpha feedback, bounded point density and capped DPR.
const legacyShader=s=>block(s,'const vertexShader','function initWebGL').replace(/\s*uniform float uFigure;\s*uniform float uFeedback;/g,'').replace(/\s*uniform vec2 uTexel;/g,'').replace(/\s*\/\/ FIGURE_FEEDBACK_START[\s\S]*?\/\/ FIGURE_FEEDBACK_END/g,'').replace(' * (1.0 - uFigure)','').replace('mix(1.0 - totalDisp, uFeedback, uFigure)','(1.0 - totalDisp)').replace(/\s+/g,' ');
assert.equal(legacyShader(html),legacyShader(base),'Legacy shader equations changed outside authorized figure feedback');
assert.equal((html.match(/new THREE.WebGLRenderer/g)||[]).length,1);
console.log('B01 syntax/composition, dependencies, legacy shader equations, camera lifecycle, classification and archive scroll math: PASS');
