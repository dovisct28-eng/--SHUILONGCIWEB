// Run existing checks without overwriting historical evidence.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const tasks={a05:'module-a/a05/browser-check.cjs',a06:'module-a/a06/browser-check.cjs',a07:'module-a/a07/browser-check.cjs',a08:'module-a/a08/browser-check.cjs',multi:'module-a/guide/multi-guide-check.cjs',resilience:'module-a/guide/resilience-check.cjs',transfer:'module-a/a04/transition-check.cjs',director:'module-a/visual-director/regression.cjs'};
const selected=process.argv[2];if(!tasks[selected])throw new Error('Choose '+Object.keys(tasks).join(', '));
const file=path.resolve(tasks[selected]),output=path.resolve('docs/validation/module-a-navigation-2026-10-06/regression',selected);
fs.mkdirSync(output,{recursive:true});process.env.MODEL_VALIDATION_DIR=output;process.env.A01_VALIDATION_DIR=output;
let source=fs.readFileSync(file,'utf8');
if(selected==='director'){
 process.argv[2]='a04';
 source=source.replace("path.resolve('docs/validation/module-a-visual-director-v2/regression',selected)",JSON.stringify(output));
}
source=source.replaceAll('127.0.0.1:4173','127.0.0.1:4175').replace(/path\.resolve\(__dirname,\s*['"](?:\.\.\/)+docs\/validation\/[^'"]+['"]\)/g,()=>JSON.stringify(output));
const m=new Module(file);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(source,file);
