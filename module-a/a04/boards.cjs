const sharp=require('sharp'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve('docs/validation/a04-high-fidelity-2026-10-05');
const title=(s,w,h)=>Buffer.from(`<svg width="${w}" height="${h}"><rect width="100%" height="100%" fill="#12191d"/><text x="16" y="28" font-family="Arial" font-size="18" fill="#e0d8cb">${s}</text></svg>`);
async function board(name,items,cols=3){const cw=640,ch=405,head=40,rows=Math.ceil(items.length/cols),parts=[];
for(let i=0;i<items.length;i++){const x=i%cols*cw,y=Math.floor(i/cols)*(ch+head);parts.push({input:title(items[i][0],cw,head),left:x,top:y},{input:await sharp(path.join(root,items[i][1])).resize(cw,ch,{fit:'contain',background:'#12191d'}).webp({quality:88}).toBuffer(),left:x,top:y+head});}
await sharp({create:{width:cw*cols,height:(ch+head)*rows,channels:3,background:'#12191d'}}).composite(parts).webp({quality:90}).toFile(path.join(root,name+'.webp'));}
(async()=>{const frames=['02-a04-entry','04-a04-fifth','05-a04-travel-first','06-a04-first','07-a04-return-second','08-a04-second','10-a04-route-summary','11-a04-fifth-handoff','12-a05-entry'];
await board('sequence',frames.map(f=>[f,'after/'+f+'.png']));
await board('before-after',['02-a04-entry','04-a04-fifth','06-a04-first','10-a04-route-summary'].flatMap(f=>[['BEFORE '+f,'before/'+f+'.png'],['AFTER '+f,'after/'+f+'.png']]),2);
await board('responsive',[1920,1440,1366,1024].flatMap(w=>[[''+w+' summary','viewports/'+w+'/10-a04-route-summary.png'],[''+w+' first','viewports/'+w+'/06-a04-first.png'],[''+w+' reduced motion','viewports/'+w+'/reduced-motion.png']]),3);
await board('duration-comparison',[['45s fifth','after/04-a04-fifth.png'],['58s fifth','duration-58/04-a04-fifth.png'],['45s first','after/06-a04-first.png'],['58s first','duration-58/06-a04-first.png'],['45s summary','after/10-a04-route-summary.png'],['58s summary','duration-58/10-a04-route-summary.png']],2);
for(const dir of ['after','duration-58'])for(const f of fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.png')))await sharp(path.join(root,dir,f)).webp({quality:90}).toFile(path.join(root,dir,f.replace('.png','.webp')));
console.log('PASS: sequence, before/after, responsive and duration boards.');
})().catch(e=>{console.error(e);process.exitCode=1;});
