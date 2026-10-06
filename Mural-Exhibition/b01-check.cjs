const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process');
const html=fs.readFileSync(path.join(__dirname,'public/index.html'),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
new vm.Script(script.replace(/^\s*import .*?;$/gm, '').replace("import('three')",'Promise.resolve({})'));
cp.execFileSync(process.execPath,['--check',path.join(__dirname,'server.js')]);
const base=cp.execFileSync('git',['show','fd46e4f:Mural-Exhibition/public/index.html'],{encoding:'utf8'});
const block=(s,start,end)=>s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start))).replace(/\r\n/g,'\n');
for(const [a,b] of [['const cyberScripts','function loadEntryImage'],['const vertexShader','let clock;'],['function updateWebGLMural','let clock;'],['let continuousOpenFrames','</script>']]) {
 assert.equal(block(html,a,b),block(base,a,b),`Protected core changed: ${a}`);
}
for(const removed of ['panMural','splash-poem','splash-subtitle','hideSplash','is-loaded','picsum.photos'])assert.ok(!html.includes(removed),removed);
assert.ok(html.includes('data-src="gallery/mural-02-detail.webp"'));
assert.equal(block(html,'<div id="splash-screen"','<div id="entry-mode-notice"'),block(base,'<div id="splash-screen"','<div id="entry-mode-notice"'));
assert.ok(!html.includes("        initWebGL();"));
assert.ok(fs.statSync(path.join(__dirname,'public/b01/mural-02-left.webp')).size<1024*1024);
console.log('B01 syntax/composition, cyber dependencies/shaders/mural rendering/gesture core and removed opening: PASS');
