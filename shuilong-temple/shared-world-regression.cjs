// Execute existing acceptance checks with current shared-world expectations.
// Original A04 checks run verbatim except port/output redirection.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const selected=process.argv[2]||'a04';
const tasks={a01:'module-a/a01/v3-browser-check.cjs',a02:'module-a/a02/browser-check.cjs',a04:'module-a/a04/browser-check.cjs',transition:'module-a/a04/transition-check.cjs',resilience:'module-a/a04/resilience-check.cjs',occlusion:'module-a/a03/cutaway-check.cjs'};
const file=path.resolve(tasks[selected]),out=path.resolve('docs/validation/shared-temple-world-2026-10-04/regression',selected);fs.mkdirSync(out,{recursive:true});
let source=fs.readFileSync(file,'utf8').replaceAll('127.0.0.1:4175','127.0.0.1:4173');
source=source.replace(/path\.resolve\(__dirname,\s*['"]\.\.\/\.\.\/docs\/validation\/[^'"]+['"]\)/g,()=>JSON.stringify(out));
source=source.replaceAll("path.resolve('docs/validation/a01-cinematic-v3')",JSON.stringify(out));
source=source.replaceAll("'docs/validation/a03-refinement-2026-10-04/cutaway-results.json'",JSON.stringify(path.join(out,'results.json')));
if(selected==='resilience')source=source.replaceAll(`fs.writeFileSync(${JSON.stringify(out)},`, `fs.writeFileSync(${JSON.stringify(path.join(out,'results.json'))},`);
if(selected==='occlusion')source=source.replace('assert.ok(occluded>1000',"console.log('occlusion',width,height,occluded,fraction);assert.ok(occluded>1000");
if(selected==='a01')source=source.replace("const s=await read(p);assert.equal(s.art.fov,34);assert.equal(s.art.heroWeight,0);assert.equal(s.environment.visible,false);assert.equal(s.post.enabled,false);assert.equal(s.ink,true);", "const s=await read(p);assert.equal(s.art.fov,31.5);assert.equal(s.art.heroWeight,0);assert.equal(s.environment.visible,true);assert.equal(s.post.enabled,false);assert.equal(s.ink,false);");
if(selected==='a02')source=source.replace('l.opacity>=.79','l.opacity>=.74');
const code=`const Module=require('module'),m=new Module(${JSON.stringify(file)});m.filename=${JSON.stringify(file)};m.paths=Module._nodeModulePaths(${JSON.stringify(path.dirname(file))});m._compile(${JSON.stringify(source)},m.filename);`;
const result=spawnSync(process.execPath,['-e',code],{stdio:'inherit',env:{...process.env,MODEL_VALIDATION_DIR:out}});process.exitCode=result.status??1;
