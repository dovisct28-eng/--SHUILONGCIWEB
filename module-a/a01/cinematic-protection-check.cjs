// Reuse frozen guide/handoff checks, but preserve their historical evidence paths.
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const out=path.resolve(process.env.A01_VALIDATION_DIR||'docs/validation/a01-cinematic-v2');
for(const [relative,folder]of [['module-a/guide/multi-guide-check.cjs','guide-regression'],['module-a/a08/browser-check.cjs','a08-regression']]){
 const filename=path.resolve(relative),source=fs.readFileSync(filename,'utf8');
 const redirected=source.replace(/const output\s*=\s*path\.resolve\(__dirname,[^;]+;/,`const output=${JSON.stringify(path.join(out,folder))};`);
 if(redirected===source)throw new Error(`Evidence directory pattern changed: ${relative}`);
 const code=`const Module=require('module'),m=new Module(${JSON.stringify(filename)});m.filename=${JSON.stringify(filename)};m.paths=Module._nodeModulePaths(${JSON.stringify(path.dirname(filename))});m._compile(${JSON.stringify(redirected)},m.filename);`;
 const result=spawnSync(process.execPath,['-e',code],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
}
console.log('PASS: A05/A06/A07 guide order and A08 active handoff; historical evidence preserved');
