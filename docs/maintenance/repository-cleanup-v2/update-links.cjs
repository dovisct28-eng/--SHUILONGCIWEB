// Update retained Markdown links; do not rewrite historical JSON test measurements.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'../../..');process.chdir(root);
const removed=new Map(JSON.parse(fs.readFileSync(path.join(__dirname,'deleted-files.json'))).map(f=>[f.path,f]));
const protectedFiles=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'original-work-protection.json'))).map(f=>f.path));
const files=cp.execFileSync('git',['ls-files','-z'],{encoding:'utf8',maxBuffer:5e6}).split('\0').filter(f=>f.endsWith('.md')&&fs.existsSync(f)&&!protectedFiles.has(f)&&!f.startsWith('docs/maintenance/repository-cleanup-v1/'));
const updates=[];for(const file of files){let old=fs.readFileSync(file,'utf8'),count=0;
 let text=old.replace(/(!?)\[([^\]]*)\]\(([^)\n]+)\)/g,(full,image,label,url)=>{
  let target=url.replace(/^<|>$/g,'').replace(/\s+"[^"\n]*"$/,'');if(/^(?:https?:|#|mailto:|data:)/.test(target))return full;
  try{target=decodeURIComponent(target.split('#')[0].split('?')[0]);}catch{return full;}
  const absolute=target.startsWith('/')?path.resolve(root,target.slice(1)):path.resolve(path.dirname(path.resolve(root,file)),target),relative=path.relative(root,absolute).replaceAll('\\','/'),f=removed.get(relative);if(!f)return full;count++;
  if(f.git==='tracked')return `[${label}（历史归档）](https://github.com/dovisct28-eng/--SHUILONGCIWEB/blob/pre-repository-cleanup-v2-2026-10-31/${relative.split('/').map(encodeURIComponent).join('/')})`;
  if(f.source==='verified-identical-validation-copy'){const to=path.relative(path.dirname(path.resolve(root,file)),path.resolve(root,f.recovery.path)).replaceAll('\\','/');return `[${label}（相同保留副本）](<${to}>)`;}
  const to=path.relative(path.dirname(path.resolve(root,file)),path.join(__dirname,'CLEANUP_REPORT.md')).replaceAll('\\','/');return `[${label}（原始输出已精简）](${to})`;
 });
 if(count){text='> 2026-10-31清理注：被精简的历史媒体链接已改为清理前Tag或已核对的相同副本；下文原测试结果保持当时记录，不能作为最新运行结论。\n\n'+text;fs.writeFileSync(file,text);updates.push({file,replacedLinks:count});}
}
const stages=new Set([...removed.keys()].filter(p=>p.startsWith('docs/validation/')).map(p=>p.split('/')[2]));
for(const stage of stages){const file='docs/validation/'+stage+'/README.md';if(protectedFiles.has(file))continue;const header=stage==='interior-visual-v3-5'?'> 2026-10-31清理V2：本目录保留技术报告、视频元数据与10张当前精选；大批原始媒体已精简，新运行默认local/latest。清理后的真实回归见 [清理验收](../../maintenance/repository-cleanup-v2/VALIDATION.md)。历史完整媒体按deleted-files.json中的Tag或副本恢复。\n\n':'> 历史阶段（已被V3.5主线替代）：保留参数、测试数据与设计演变说明。部分截图/录像已按V2文件级清单精简；原已跟踪媒体可在pre-repository-cleanup-v2-2026-10-31恢复，重复媒体见清单中的保留副本。不得重跑旧入口检查作为当前正式验收。\n\n';
 const existing=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'# '+stage+' historical technical record\n';fs.writeFileSync(file,header+existing);
}
const base='module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/';
for(const name of ['README.md','V3_2_REPORT.md','V3_3_REPORT.md']){const file=base+name;if(fs.existsSync(file))fs.writeFileSync(file,'> 当前入口为 `/module-a/gallery/`。v32/v33/v34独立HTML及其预览入口已退役；下文参数/算法保留为历史研究记录，需要旧页面时从pre-repository-cleanup-v2-2026-10-31恢复。v35母版、正式运行控制器及AI/相机资源继续保留。\n\n'+fs.readFileSync(file,'utf8'));}
const integration='docs/validation/interior-visual-v3-5/INTEGRATION.md';let s=fs.readFileSync(integration,'utf8').replace('| `v32.html` / `v33.html` / `v34.html` | 历史独立原型，保留各自参数 |','| V3.2 / V3.3 / V3.4历史独立入口 | 已退役，清理前Tag可恢复；参数与共用代码保留 |');fs.writeFileSync(integration,s);
fs.writeFileSync(path.join(__dirname,'link-updates.json'),JSON.stringify({updated:updates,retiredStages:[...stages],historicalMeasurementsRewritten:false},null,2)+'\n');console.log('Updated retained Markdown files:',updates.length,'stage notices:',stages.size);
