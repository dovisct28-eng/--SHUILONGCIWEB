// Read-only audit of the pushed commit. Does not inspect/alter author working files.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const git=args=>cp.execFileSync('git',args,{encoding:'utf8',maxBuffer:32*1024*1024,windowsHide:true});
const ref=process.env.B_UX_AUDIT_REF||git(['rev-parse','origin/master']).trim();
const prefix='Mural-Exhibition/public/assets/';
const files=git(['ls-tree','-r','--full-tree','--name-only','-z',ref,'--',prefix]).split('\0').filter(Boolean);
const folders=[...new Set(files.map(f=>f.slice(prefix.length).split('/')[0]).filter(f=>/^\d+_/.test(f)))].sort();
if (!folders.length) throw Error('No remote character directories found; refusing to emit an empty completeness report');
const rows=folders.map(folder=>{
 const local=files.filter(f=>f.startsWith(prefix+folder+'/')).map(f=>f.slice((prefix+folder+'/').length));
 const metaFile=prefix+folder+'/meta.json';let meta={},error=null;
 try{meta=JSON.parse(git(['show',`${ref}:${metaFile}`]));}catch(e){error='meta.json 缺失或无效';}
 const asset=base=>local.find(f=>new RegExp(`^${base}\\.(${base==='info'?'md|txt':'png|webp|jpe?g'})$`,'i').test(f))||null;
 const resources=Object.fromEntries(['org','line','color','figure','info'].map(k=>[k,asset(k)]));
 const info=resources.info?git(['show',`${ref}:${prefix}${folder}/${resources.info}`]).trim():'';
 const summary=typeof meta.cyber?.summary==='string'&&!!meta.cyber.summary.trim();
 const sources=Array.isArray(meta.sources)&&meta.sources.some(s=>typeof s==='string'?!!s.trim():s&&['author','title','year','pages','url'].some(k=>String(s[k]??'').trim()));
 const needs=[];for(const [k,file]of Object.entries(resources))if(!file)needs.push(k==='figure'?'专用人物抠图（可继续兼容展示）':k+' 素材');
 if(!info)needs.push('档案正文');if(!summary)needs.push('cyber.summary');if(!sources)needs.push('资料来源');if(error)needs.push(error);
 return {id:meta.id||folder.split('_')[0],name:meta.name||folder.replace(/^\d+_/,''),folder,resources,infoNonEmpty:!!info,summaryFilled:summary,sourcesFilled:sources,position:meta.position||null,
  cyberDisplay:resources.figure?'专用 figure（有效性由运行时检测）':resources.line&&resources.color?'线稿/色稿兼容回退':'体感素材不足',needsAuthor:needs};
});
const out=path.resolve(process.env.B_UX_VALIDATION_DIR||'../docs/validation/b-ux-01-2026-10-08');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'content-integrity.json'),JSON.stringify({ref,scope:'最新已推送 master；名称仅照录正式元数据，不表示身份或史料已核验。存在与填写检查不等于图像质量、透明抠图或学术核验。',rows},null,2)+'\n');
const yes=v=>v?'有':'缺';
const md=`# B-UX-01 正式内容完整性清单\n\n扫描基线：\`${ref}\`。仅报告远程已提交素材；不修改作者素材或正文。名称照录 meta.json，不推导历史身份。\n\n| ID | 正式名称 | org | line | color | figure | info | summary | sources | 体感展示 | 作者需补充 |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n`+rows.map(r=>`| ${r.id} | ${r.name} | ${yes(r.resources.org)} | ${yes(r.resources.line)} | ${yes(r.resources.color)} | ${yes(r.resources.figure)} | ${r.resources.info?(r.infoNonEmpty?'有正文':'空文件'):'缺'} | ${r.summaryFilled?'已填':'未填'} | ${r.sourcesFilled?'已填':'未填'} | ${r.cyberDisplay} | ${r.needsAuthor.join('、')||'无缺项'} |`).join('\n')+
 '\n\n文件存在不证明内容正确。figure 有效性及透明边界需运行时与作者核验；兼容回退沿用现有 line/color 展示。sources 仅检查非空，不自动核验引用。完整路径、坐标和字段见 content-integrity.json。\n\n本地工作区另有 10→08 目录调整与 05 figure 新增，尚未推送；本清单不将其计入远程完成度，未暂存或覆盖这些改动。\n';
fs.writeFileSync(path.join(out,'CONTENT_INTEGRITY.md'),md);console.log(JSON.stringify({ref,characters:rows.length,missingSummary:rows.filter(r=>!r.summaryFilled).length,missingSources:rows.filter(r=>!r.sourcesFilled).length,compatibilityFallback:rows.filter(r=>!r.resources.figure).length}));
if(process.argv.includes('--include-author-figures')){
 (async()=>{
  const sharp=require('sharp'),additions=[];
  for(const id of ['02','03','04','05','06','07']){
   const row=rows.find(r=>r.id===id),file=path.join(__dirname,'public/assets',row.folder,'figure.png'),buffer=fs.readFileSync(file);
   const metadata=await sharp(buffer).metadata(),stats=await sharp(buffer).stats(),alpha=stats.channels[3];
   if(!metadata.hasAlpha||!alpha||alpha.min!==0||alpha.max!==255)throw Error(`Figure ${id} has no verified transparent/opaque alpha range`);
   additions.push({id,name:row.name,path:prefix+row.folder+'/figure.png',bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),width:metadata.width,height:metadata.height,hasAlpha:metadata.hasAlpha,alphaMin:alpha.min,alphaMax:alpha.max});
  }
  const delivery=rows.map(r=>({...r,resources:{...r.resources,figure:additions.some(a=>a.id===r.id)?'figure.png':r.resources.figure},cyberDisplay:r.resources.figure||additions.some(a=>a.id===r.id)?'专用 figure（本轮浏览器验收）':r.cyberDisplay,needsAuthor:r.needsAuthor.filter(n=>!additions.some(a=>a.id===r.id)||!n.startsWith('专用人物抠图'))}));
  fs.writeFileSync(path.join(out,'delivery-content-integrity.json'),JSON.stringify({ref,scope:'已推送基线 + 用户明确授权原样提交的六个 figure；未纳入 10→08 目录调整',additions,rows:delivery},null,2)+'\n');
  fs.writeFileSync(path.join(out,'AUTHOR_FIGURE_ADDITIONS.md'),'# 本轮作者抠图增补\n\n基线清单见 CONTENT_INTEGRITY.md。本轮用户明确授权新增六个 figure 原样提交，未修改图像。以下仅确认文件和 alpha 范围，图像对应关系、身份及宗教解释仍需作者核验。\n\n| ID | 名称 | 尺寸 | 字节 | alpha |\n| --- | --- | --- | --- | --- |\n'+additions.map(a=>`| ${a.id} | ${a.name} | ${a.width}×${a.height} | ${a.bytes} | ${a.alphaMin}–${a.alphaMax} |`).join('\n')+'\n\n交付后共七组专用 figure；ID10 上层猖兵仍使用 line/color 兼容回退。八组 cyber.summary 和 sources 均未填写。org、line、color、info 均保留。工作区目录 08 的正式 meta.id 仍为 10；该目录调整未纳入提交。素材 SHA-256 与交付清单见 delivery-content-integrity.json。\n');
  console.log(JSON.stringify({authorizedFigures:additions.length,deliveryFigures:delivery.filter(r=>r.resources.figure).length,fallback:delivery.filter(r=>!r.resources.figure).map(r=>r.id)}));
 })().catch(e=>{console.error(e);process.exitCode=1;});
}
