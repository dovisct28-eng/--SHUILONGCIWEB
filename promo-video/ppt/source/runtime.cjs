const path=require('node:path');
const {createRequire}=require('node:module');
const modules=process.env.PPT_NODE_MODULES||'C:/Users/dovis/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const requireBundle=createRequire(path.join(modules,'package.json'));
function loadPptxGenJS(){
 const fs=require('node:fs'),Module=require('node:module');
 const filename=requireBundle.resolve('pptxgenjs');let source=fs.readFileSync(filename,'utf8');
 // PptxGenJS 4.0.1 emits slideMaster2..N declarations although it creates one master.
 // Correct the generator in memory; never change the shared dependency or packed XML.
 const target='        strXml += `<Override PartName="/ppt/slideMasters/slideMaster${idx + 1}.xml"';
 if(source.includes(target))source=source.replace(target,'        if (idx === 0) strXml += `<Override PartName="/ppt/slideMasters/slideMaster${idx + 1}.xml"');
 else throw Error('PptxGenJS content-type patch no longer matches; review this dependency version.');
 const patched=new Module(filename,module);patched.filename=filename;patched.paths=Module._nodeModulePaths(path.dirname(filename));patched._compile(source,filename);return patched.exports;
}
module.exports={modules,requireBundle,loadPptxGenJS,root:path.resolve(__dirname,'../../..'),base:path.resolve(__dirname,'..')};
