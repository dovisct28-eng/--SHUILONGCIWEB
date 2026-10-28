// Replay existing B1 browser checks into maintenance/local; never overwrite B1 evidence.
const fs=require('fs'),path=require('path'),{createRequire}=require('module');
const name=process.argv[2];if(!['browser','regression','module-b'].includes(name))throw Error('Expected browser, regression or module-b');
const root=path.resolve(__dirname,'../../..'),originalOut=path.join(root,'docs/validation/temple-model-v2/integration-b1'),file=path.join(originalOut,'scripts',name+'.cjs'),out=path.join(__dirname,'local/b1-replay');fs.mkdirSync(path.join(out,'local'),{recursive:true});fs.mkdirSync(path.join(out,'selected'),{recursive:true});
let source=fs.readFileSync(file,'utf8');const initial="path.resolve(__dirname,'..')";if(!source.includes(initial))throw Error('Unexpected B1 script header');source=source.replace(initial,JSON.stringify(out));
if(name==='module-b')source=source.replaceAll('fs.readFileSync(path.join(out,file))','fs.readFileSync(path.join('+JSON.stringify(originalOut)+',file))');
if(name==='regression'){
 // Existing production CDN versions served from already recorded QA cache, no product edits.
 const injection=`const newPage=b.newPage.bind(b);b.newPage=async(...args)=>{const p=await newPage(...args);for(const [url,file]of [['https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js*','qa-three-0.160.0.mjs'],['https://unpkg.com/gsap@3.12.5/dist/gsap.min.js','qa-gsap-3.12.5.js']])await p.route(url,r=>r.fulfill({body:fs.readFileSync(path.join(${JSON.stringify(originalOut)},'local',file)),contentType:'text/javascript'}));return p;};`;
 source=source.replace('report.pass=false;try{','report.pass=false;'+injection+'try{');
}
const originalRequire=createRequire(file),network=[];
const attach=p=>{p.on('response',r=>{if(r.status()>=400)network.push({url:r.url(),status:r.status()});});};
function qaRequire(id){const lib=originalRequire(id);if(id!=='playwright')return lib;return {...lib,chromium:new Proxy(lib.chromium,{get(target,key){if(key!=='launch')return target[key];return async(...args)=>{const browser=await target.launch(...args),makeContext=browser.newContext.bind(browser),makePage=browser.newPage.bind(browser);browser.newContext=async(...a)=>{const c=await makeContext(...a);c.on('page',attach);return c;};browser.newPage=async(...a)=>{const p=await makePage(...a);attach(p);return p;};return browser;};}})};}
process.on('exit',()=>fs.writeFileSync(path.join(out,name+'-http-errors.json'),JSON.stringify({errors:network,note:'Regression intentionally injects a model-page 503; distinguish fault injection from ordinary loads.'},null,2)+'\n'));
new Function('require','__dirname',source)(qaRequire,path.dirname(file));
