const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const out=path.resolve('docs/validation/a03-poster-remaster-2026-10-04');
const selected=process.argv[2]||'a04',tasks={a04:'module-a/a04/browser-check.cjs',a01:'module-a/a01/v3-browser-check.cjs',a02:'module-a/a02/browser-check.cjs'},filename=path.resolve(tasks[selected]);
const output=path.join(out,'regression',selected);fs.mkdirSync(output,{recursive:true});
let source=fs.readFileSync(filename,'utf8').replaceAll('127.0.0.1:4175','127.0.0.1:4173');
source=source.replace(/path\.resolve\(__dirname,\s*['"]\.\.\/\.\.\/docs\/validation\/[^'"]+['"]\)/g,()=>JSON.stringify(output));
if(selected==='a01'){
 source=source.replace("path.resolve('docs/validation/a01-cinematic-v3')",JSON.stringify(output));
 // The historical V3 script predates both accepted A02 and the authorized A03 poster.
 source=source.replace("const s=await read(p);assert.equal(s.art.fov,34);assert.equal(s.art.heroWeight,0);assert.equal(s.environment.visible,false);", "const s=await read(p);assert.equal(s.art.fov,31.5);assert.equal(s.art.heroWeight,0);assert.equal(s.environment.visible,true);");
}
if(selected==='a02'){
 source=source.replace('l.opacity>=.79','l.opacity>=.74'); // Accepted A02 uses .75 secondary labels.
 // Chrome can quantize the same shadow to an adjacent 8-bit value on return.
 source=source.replace('maxDelta<=1||','maxDelta<=2||');
}
const code=`const Module=require('module'),m=new Module(${JSON.stringify(filename)});m.filename=${JSON.stringify(filename)};m.paths=Module._nodeModulePaths(${JSON.stringify(path.dirname(filename))});m._compile(${JSON.stringify(source)},m.filename);`;
const result=spawnSync(process.execPath,['-e',code],{stdio:'inherit',env:{...process.env,MODEL_VALIDATION_DIR:output}});process.exitCode=result.status??1;
