// Re-run original acceptance assertions, storing evidence separately from history.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const tasks={a04:'module-a/a04/browser-check.cjs',guides:'module-a/guide/multi-guide-check.cjs',a08:'module-a/a08/browser-check.cjs',transfer:'module-a/a04/transition-check.cjs',resilience:'module-a/guide/resilience-check.cjs'};
const selected=process.argv[2]||'a04',filename=path.resolve(tasks[selected]);
const output=path.resolve('docs/validation/module-a-dark-system/regression',selected);fs.mkdirSync(output,{recursive:true});
let source=fs.readFileSync(filename,'utf8').replaceAll('127.0.0.1:4175','127.0.0.1:4173');
source=source.replace(/path\.resolve\(__dirname,\s*['"]\.\.\/\.\.\/docs\/validation\/[^'"]+['"]\)/g,()=>JSON.stringify(output));
const code=`const Module=require('module'),m=new Module(${JSON.stringify(filename)});m.filename=${JSON.stringify(filename)};m.paths=Module._nodeModulePaths(${JSON.stringify(path.dirname(filename))});m._compile(${JSON.stringify(source)},m.filename);`;
const result=spawnSync(process.execPath,['-e',code],{stdio:'inherit',env:{...process.env,MODEL_VALIDATION_DIR:output}});process.exitCode=result.status??1;
