const sharp=require('sharp'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve('docs/validation/module-a-dark-system');
async function sheet(name,entries,columns=3){const w=480,h=330,rows=Math.ceil(entries.length/columns),composite=[];
 for(let i=0;i<entries.length;i++){const [label,file]=entries[i],x=i%columns*w,y=Math.floor(i/columns)*h;
 composite.push({input:await sharp(path.join(root,file)).resize(w,300,{fit:'contain',background:'#101519'}).toBuffer(),left:x,top:y+30});
 composite.push({input:Buffer.from(`<svg width="480" height="30"><rect width="480" height="30" fill="#101519"/><text x="12" y="21" font-family="sans-serif" font-size="15" fill="#d8d2c5">${label}</text></svg>`),left:x,top:y});}
 await sharp({create:{width:w*columns,height:h*rows,channels:3,background:'#101519'}}).composite(composite).jpeg({quality:90}).toFile(path.join(root,name));}
(async()=>{
await sheet('01-a01-cinematic-contact-sheet.jpg',[0,6,12,18,25,32,38,45,52,58,64,70,82,100].map(n=>[`${n}%`,`animation/${n}-1440x900.png`]));
await sheet('02-a01-a02-handoff-contact-sheet.jpg',[6.1,6.2,6.35,6.5,6.65,6.8,7,7.2,7.4].map(n=>[`${n} screens`,`handoff/${n.toFixed(2)}-1440x900.png`]));
await sheet('03-a02-dark-space.jpg',['space','overview','core'].map(n=>[`A02 ${n}`,`chapters/a02-${n}-1440x900.png`]));
await sheet('04-a03-theme.jpg',[['A03 1440','chapters/a03-1440x900.png'],['A03 1024','chapters/a03-1024x768.png']],2);
await sheet('05-a04-route.jpg',['a04','mural-05','mural-01','mural-02','route-03','withdrawn'].map(n=>[n,`regression/a04/${n==='a04'?'overview-1440x900':['mural-05','mural-01','mural-02'].includes(n)?'mural-textures/'+n:n}.png`]));
await sheet('06-a05-a07-mural-space.jpg',['05','06','07'].flatMap(n=>[['intro',`a${n}-intro`],['scan',`a${n}-scan`]].map(([label,file])=>[`A${n} ${label}`,`chapters/${file}-1440x900.png`])));
await sheet('07-a08-ending.jpg',[[1440,900],[1920,1080],[1366,768],[1024,768]].map(([w,h])=>[`${w}x${h}`,`chapters/a08-${w}x${h}.png`]),2);
await sheet('08-module-a-dark-system-contact-sheet.jpg',[['Hero','animation/100-1440x900.png'],...['a02-overview','a03','a04','a05-scan','a06-scan','a07-scan','a08'].map(n=>[n,`chapters/${n}-1440x900.png`])]);
await sheet('09-before-after.jpg',[['opening','animation/12'],['hero','animation/100'],['handoff','handoff/6.65'],['a02','chapters/a02-overview']].flatMap(([n,file])=>[[`Before ${n}`,`before/${n}-1440x900.png`],[`After ${n}`,`${file}-1440x900.png`]]),2);
await sheet('10-responsive-contact-sheet.jpg',[['opening','animation/12'],['Hero','animation/100'],['handoff','handoff/6.65'],['A02','chapters/a02-overview'],['A04','regression/a04/overview'],['A05','chapters/a05-intro'],['A08','chapters/a08']].flatMap(([n,file])=>[[1920,1080],[1440,900],[1366,768],[1024,768]].map(([w,h])=>[`${n} ${w}x${h}`,`${file}-${w}x${h}.png`])),4);
await sheet('10-responsive-contact-sheet.jpg',[['opening','animation/12'],['Hero','animation/100'],['handoff','handoff/6.65'],['A02','chapters/a02-overview'],['A04','regression/a04/overview'],['A05','chapters/a05-intro'],['A08','chapters/a08']].flatMap(([n,file])=>[[1920,1080],[1440,900],[1366,768],[1024,768]].map(([w,h])=>[`${n} ${w}x${h}`,`${file}-${w}x${h}.png`])),4);
console.log('Contact sheets generated from localhost evidence');
})().catch(e=>{console.error(e);process.exitCode=1;});
