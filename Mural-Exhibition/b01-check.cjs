const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process');
const html=fs.readFileSync(path.join(__dirname,'public/index.html'),'utf8');
const script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
new vm.Script(script.replace("import('three')",'Promise.resolve({})'));
cp.execFileSync(process.execPath,['--check',path.join(__dirname,'server.js')]);
const base=cp.execFileSync('git',['show','39167fa:Mural-Exhibition/public/index.html'],{encoding:'utf8'});
const block=(s,start,end)=>{s=s.replace('let clock;','const clock = new THREE.Clock();');return s.slice(s.indexOf(start),s.indexOf(end,s.indexOf(start))).replace(/\r\n/g,'\n');};
for(const [a,b] of [['const ANCHORS_CONFIG','let globalAssetsData'],['function getBaseDimensions','// ======================================================='],['function loadSeriesData','// ======================================================='],['window.switchLayer =','// 独立监听器'],['const vertexShader','const clock ='],['let continuousOpenFrames','</script>']]) {
 assert.equal(block(html,a,b).replace('            clock ||= new THREE.Clock();\n',''),block(base,a,b),`Protected core changed: ${a}`);
}
for(const removed of ['panMural','splash-poem','splash-subtitle','hideSplash','is-loaded','picsum.photos'])assert.ok(!html.includes(removed),removed);
assert.ok(html.includes('data-src="assets/splash-bg.png"'));
assert.ok(!html.includes("        initWebGL();"));
assert.ok(fs.statSync(path.join(__dirname,'public/b01/mural-02-left.webp')).size<1024*1024);
console.log('B01 syntax, original map coordinates/drag/zoom, gallery layers/data, shaders/render core, gesture algorithm and removed opening: PASS');
