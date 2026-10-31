// Read-only replay of the four failing historical test files using pre-cleanup Git data.
// This is a unit-test baseline comparison, not a browser/hardware success substitute.
const fs=require('fs'),path=require('path'),cp=require('child_process'),{fileURLToPath,pathToFileURL}=require('url');
const root=path.resolve(__dirname,'../../..'),tag='pre-repository-cleanup-v2-2026-10-31';process.chdir(root);
const git=(...args)=>cp.execFileSync('git',args,{maxBuffer:40e6});
const originalRead=fs.readFileSync,originalDir=fs.readdirSync,cache=new Map();
function relative(value){if(value instanceof URL)value=fileURLToPath(value);if(typeof value!=='string')return null;const abs=path.resolve(value);return abs.startsWith(root+path.sep)?path.relative(root,abs).replaceAll('\\','/'):null;}
fs.readFileSync=function(value,options){const p=relative(value);if(!p||p.startsWith('.git/'))return originalRead.apply(this,arguments);let data=cache.get(p);if(!data){try{data=git('show',tag+':'+p);cache.set(p,data);}catch{return originalRead.apply(this,arguments);}}const encoding=typeof options==='string'?options:options?.encoding;return encoding?data.toString(encoding):Buffer.from(data);};
fs.readdirSync=function(value,options){const p=relative(value);if(p&&!options){try{return git('ls-tree','--name-only',tag+':'+p.replace(/\/$/,'')).toString().trim().split('\n').filter(Boolean);}catch{}}return originalDir.apply(this,arguments);};
(async()=>{for(const file of ['module-a/a01/fonts.test.mjs','module-a/a03/composition.test.mjs','module-a/copy.test.mjs','module-a/visual-director/fonts.test.mjs']){const url=pathToFileURL(path.resolve(file)).href;let source=git('show',tag+':'+file).toString('utf8').replaceAll('import.meta.url',JSON.stringify(url)).replace(/from\s+(['"])(\.[^'"]+)\1/g,(_,q,p)=>'from '+JSON.stringify(new URL(p,url).href));await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));}})().catch(e=>{console.error(e);process.exitCode=1});
