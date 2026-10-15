// Read-only source audit. Outputs are confined to promo-video/docs/.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const baseline = 'd90aaa29173269270420c18df4a2a37c21fbf8f1';
const git = (...args) => execFileSync('git', args, {cwd:root, maxBuffer:16*1024*1024});
const tree = new Map(git('ls-tree','-rlz',baseline).toString('utf8').split('\0').filter(Boolean).map(line => {
  const [,hash,bytes,file] = line.match(/^\d+ blob ([a-f0-9]+)\s+(\d+)\t(.+)$/) || [];
  return [file,{gitBlob:hash,bytes:Number(bytes)}];
}));
const selected = new Map();
function add(file, role) { selected.set(file,role); }
for (const id of ['01','02','05']) add(`水龙祠壁画素材/网页展示图/mural-${id}-display.webp`,'authentic-mural-web-copy');
for (const [file,role] of [
 ['shuilong-temple/shuilong-temple.glb','project-architecture-design-model'],
 ['shuilong-temple/mural-locations.json','design-wall-anchors'],
 ['shuilong-temple/environment-assets/a01-v3/karst-valley.webp','AI-designed-environment-not-site'],
 ['Mural-Exhibition/public/gallery/mural-02-detail.webp','B02-authentic-panorama-web-copy'],
 ['Mural-Exhibition/public/b03/karst-valley.webp','B03-designed-environment'],
 ['module-a/visual-director/fonts/narrative-serif.woff2','subset-font-OFL-coverage-pending'],
 ['module-a/visual-director/fonts/narrative-sans.woff2','subset-font-OFL-coverage-pending']
]) add(file,role);
const prefix = 'Mural-Exhibition/public/assets/';
const folders = new Set([...tree.keys()].filter(f=>f?.startsWith(prefix)).map(f=>f.slice(prefix.length).split('/')[0]));
for (const entry of fs.readdirSync(path.join(root,prefix),{withFileTypes:true})) if(entry.isDirectory() && /^\d+_/.test(entry.name)) folders.add(entry.name);
for (const folder of [...folders].sort()) for (const name of ['meta.json','info.txt','info.md','org.png','line.png','color.png','figure.png','video.mp4']) {
 const file = prefix+folder+'/'+name;
 if(tree.has(file)||fs.existsSync(path.join(root,file))) add(file,name.startsWith('org')?'mural-detail':name.startsWith('line')?'digital-line-study':name.startsWith('color')||name.startsWith('figure')?'digital-color-study':name.startsWith('info')?'character-text-unverified-history':name==='video.mp4'?'existing-motion-provenance-pending':'character-metadata');
}
async function main() {
 const sharp = require('sharp');
 const records=[];
 for (const [file,role] of selected) {
  const abs=path.join(root,file), exists=fs.existsSync(abs), remote=tree.get(file)||null;
  const r={path:file,role,baseline:remote,localExists:exists,status:exists?(remote?'CHECKING':'LOCAL_ONLY'):'LOCAL_DELETED',rights:'PENDING: possession is not competition-use clearance'};
  if(exists){
   const data=fs.readFileSync(abs);
   r.localBytes=data.length;r.sha256=crypto.createHash('sha256').update(data).digest('hex');
   const blob=crypto.createHash('sha1').update(Buffer.from(`blob ${data.length}\0`)).update(data).digest('hex');
   r.status=remote?(blob===remote.gitBlob?'MATCHES_BASELINE':'LOCAL_MODIFIED'):'LOCAL_ONLY';
   if(remote && r.status==='LOCAL_MODIFIED' && /\.(txt|md|json)$/.test(file)){
    const normalized=Buffer.from(data.toString('utf8').replace(/\r\n/g,'\n'));
    const normalizedBlob=crypto.createHash('sha1').update(Buffer.from(`blob ${normalized.length}\0`)).update(normalized).digest('hex');
    if(normalizedBlob===remote.gitBlob)r.status='MATCHES_BASELINE_AFTER_EOL_NORMALIZATION';
   }
   if(/\.(png|webp)$/i.test(file)){
    const m=await sharp(data).metadata();r.width=m.width;r.height=m.height;r.hasAlpha=m.hasAlpha;
   }
  }
  records.push(r);
 }
 const report={baseline,auditedDate:'2026-10-15',scope:'metadata/hash inspection, no image edits, no rights certification',records};
 const output=path.join(root,'promo-video/docs/asset-register.json');
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({baseline,assets:records.length,states:records.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{}),output:'promo-video/docs/asset-register.json'}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
