// Preserve historical reports and original assertions; only select localhost and this task's output directory.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const tasks={a01:'module-a/a01/dark-browser-check.cjs',a02:'module-a/a02/browser-check.cjs',a03:'module-a/a03/browser-check.cjs',a04:'module-a/a04/browser-check.cjs',guides:'module-a/guide/multi-guide-check.cjs',a05:'module-a/a05/browser-check.cjs',a06:'module-a/a06/browser-check.cjs',a07:'module-a/a07/browser-check.cjs',a08:'module-a/a08/browser-check.cjs',transfer:'module-a/a04/transition-check.cjs',resilience:'module-a/guide/resilience-check.cjs',isolation:'module-a/material-isolation-check.cjs'};
const selected=process.argv[2],filename=path.resolve(tasks[selected]),output=path.resolve('docs/validation/module-a-visual-director-v2/regression',selected);fs.mkdirSync(output,{recursive:true});
process.env.MODEL_VALIDATION_DIR=output;process.env.A03_VALIDATION_DIR=output;
let source=fs.readFileSync(filename,'utf8').replaceAll('127.0.0.1:4175','127.0.0.1:4173');
source=source.replace(/path\.resolve\(__dirname,\s*['"](?:\.\.\/)+docs\/validation\/[^'"]+['"]\)/g,()=>JSON.stringify(output));
source=source.replace("path.resolve('docs/validation/module-a-dark-system')",JSON.stringify(output));
const m=new Module(filename);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));m._compile(source,filename);
