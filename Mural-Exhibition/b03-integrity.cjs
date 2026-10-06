const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const repo=path.resolve(__dirname,'..'),out=path.join(repo,'docs/validation/b03-v2-2026-10-06/asset-integrity.json');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const scanned=require('./gallery-store.cjs').scanAssets(path.join(__dirname,'public/assets')).data;
const record={baseline:'e9d297f3653afb719f9be4b3da4e28dde210e42e',formalResources:[],background:{},figure:{},references:[]};
for(const item of scanned)for(const layer of ['org','line','color','video','info']){
 const url=item.resources[layer];if(!url)continue;const file=path.join(__dirname,'public',decodeURIComponent(url)),relative=path.relative(repo,file).replaceAll('\\','/');
 // ID10's author-renamed folder remains uncommitted; compare its original baseline path.
 const baselinePath=item.id==='10'?relative.replace('/08_上层猖兵/','/10_上层猖兵/'):relative;
 const data=cp.execFileSync('git',['show',`${record.baseline}:${baselinePath}`],{cwd:repo,maxBuffer:100*1024*1024});
 const baselineHash=crypto.createHash('sha256').update(data).digest('hex'),currentHash=hash(file);
 const exact=baselineHash===currentHash,normalized=layer==='info'&&data.toString('utf8').replaceAll('\r\n','\n')===fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');
 if(!exact&&!normalized)throw Error('Protected source changed: '+relative);
 record.formalResources.push({id:item.id,layer,file:relative,sha256:currentHash,baselineMatch:true,comparison:exact?'exact bytes':'text identical after checkout CRLF normalization'});
}
const background=path.join(repo,'shuilong-temple/environment-assets/a01-v3/karst-valley.webp'),copy=path.join(__dirname,'public/b03/karst-valley.webp');
record.background={source:path.relative(repo,background).replaceAll('\\','/'),sha256:hash(background),copySHA256:hash(copy)};if(record.background.sha256!==record.background.copySHA256)throw Error('Background differs');
const figure=path.join(__dirname,'public',decodeURIComponent(scanned.find(i=>i.id==='01').figurePath));record.figure={file:path.relative(repo,figure).replaceAll('\\','/'),bytes:fs.statSync(figure).size,sha256:hash(figure),origin:'Author-provided existing figure.png, unchanged bytes; matches subject in formal color.png'};
for(const name of ['provided-default.png','provided-index.png','provided-line.png','provided-theatre.png'])record.references.push({file:name,sha256:hash(path.join(path.dirname(out),'references',name)),role:'AI visual reference only; not runtime heritage material'});
fs.writeFileSync(out,JSON.stringify(record,null,2)+'\n');console.log('Original resources preserved:',record.formalResources.length,'; background exact; author figure recorded');
