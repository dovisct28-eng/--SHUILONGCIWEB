const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {root,base,requireBundle}=require('./runtime.cjs');const sharp=requireBundle('sharp');
const specs=[
 ['mural-05','水龙祠壁画素材/网页展示图/mural-05-display.webp',[6],'Full image; no crop','authentic mural display derivative'],
 ['mural-01','水龙祠壁画素材/网页展示图/mural-01-display.webp',[6],'Full image; no crop','authentic mural display derivative'],
 ['mural-02','水龙祠壁画素材/网页展示图/mural-02-display.webp',[1,2,6,12],'Full image; no crop','authentic mural display derivative'],
 ['architecture','docs/validation/promo-video-v4-final/selected/architecture-master-f530.webp',[2,3,4,5,11],'Full screenshot','actual final video frame of project model'],
 ['architecture-crop','docs/validation/promo-video-v4-final/selected/architecture-master-f530.webp',[5],{left:270,top:210,width:1280,height:740},'actual final video model frame; cropped'],
 ['route','docs/validation/promo-video-v4-final/selected/route-second-master-f1600.webp',[3,4,11],'Full screenshot','actual final video frame'],
 ['theme','docs/validation/promo-video-v4-final/selected/theme-master-f780.webp',[2],'Full screenshot','actual final video frame'],
 ['gesture-dwell','docs/validation/promo-video-v4-final/local/gesture-dwell-master-f3839.png',[9],'Full frame','preset gesture demonstration; not real camera test'],
 ['gesture-select','docs/validation/promo-video-v4-final/local/gesture-close-master-f4480.png',[3,4,9],'Full frame','preset gesture demonstration; not real camera test'],
 ['gesture-open','docs/validation/promo-video-v4-final/selected/gesture-open-master-f4200.webp',[9,11],'Full frame','preset gesture demonstration; not real camera test'],
 ['recap','docs/validation/promo-video-v4-final/local/recap-gallery-master-f4760.png',[11],'Full frame','actual final video frame'],
 ['ending','docs/validation/promo-video-v4-final/selected/ending-master-f5115.webp',[11],'Full frame','actual final video frame'],
 ['person-org','Mural-Exhibition/public/assets/01_南门何五猖/org.png',[8],{left:0,top:720,width:570,height:599},'authentic mural detail; matching crop for comparison'],
 ['person-line','Mural-Exhibition/public/assets/01_南门何五猖/line.png',[8],{left:0,top:720,width:570,height:599},'project line interpretation on source mural'],
 ['person-color','Mural-Exhibition/public/assets/01_南门何五猖/color.png',[8],{left:0,top:720,width:570,height:599},'digital design interpretation; not historic color restoration'],
 ['figure','Mural-Exhibition/public/assets/01_南门何五猖/figure.png',[12],'Full transparent image','digital design interpretation'],
 ];
(async()=>{
 const manifest=[];fs.mkdirSync(path.join(base,'assets/processed'),{recursive:true});
 const gestureBefore=path.join(base,'assets/processed/gesture-before.png');
 const gestureVideo=path.join(root,'promo-video/renders/v4-final/chubing-rujiang-v4-master.mp4');
 if(!fs.existsSync(gestureBefore))execFileSync(path.join(root,'promo-video/editor/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'),['-v','error','-ss','123','-i',gestureVideo,'-frames:v','1','-c:v','png',gestureBefore]);
 manifest.push({name:'gesture-before',source:'promo-video/renders/v4-final/chubing-rujiang-v4-master.mp4 at 123 seconds',slides:[9],sourceWidth:1920,sourceHeight:1080,crop:'Full actual final frame; no overlay',nature:'Preset gesture flow animation, not physical camera footage',license:'Competition permission not independently verified'});
 for(const [name,src,slides,crop,nature]of specs){const file=path.join(root,src),data=fs.readFileSync(file);const m=await sharp(data).metadata();let pipeline=sharp(data);if(typeof crop==='object')pipeline=pipeline.extract(crop);const out=path.join(base,'assets/processed',name+'.png');await pipeline.png().toFile(out);const om=await sharp(out).metadata();manifest.push({name,source:src,slides,sourceWidth:m.width,sourceHeight:m.height,outputWidth:om.width,outputHeight:om.height,crop,nature,sha256:crypto.createHash('sha256').update(data).digest('hex'),license:'Project-supplied asset; competition permission not independently verified',watermark:'No watermark removed; no animation frames used for P08'});}
 for(const name of ['b02-panorama','b02-panorama-zoom','b02-detail','b02-index']){const src=path.join(base,'assets/processed',name+'.png');if(fs.existsSync(src)){const m=await sharp(src).metadata();manifest.push({name,source:'Current local B02 via source/capture.cjs',slides:name==='b02-detail'?[4,7]:[3,4,7],sourceWidth:m.width,sourceHeight:m.height,crop:'Full browser content, no tool chrome',nature:'Actual current UI screenshot; local user-edited copy retained',license:'Competition permission not independently verified'});}}
 fs.writeFileSync(path.join(base,'content/asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(base,'content/asset-manifest.md'),'# 素材清单\n\n所有图像仅做裁切、等比缩放和格式转换。未镜像、调色、修复或覆盖母版。版权/参赛许可仍待权利人核实。\n\n| 名称 | 来源 | 页 | 原始像素 | 处理 | 性质 |\n|---|---|---|---|---|---|\n'+manifest.map(m=>`| ${m.name} | ${m.source} | ${m.slides.join(',')} | ${m.sourceWidth}×${m.sourceHeight} | ${typeof m.crop==='object'?JSON.stringify(m.crop):m.crop} | ${m.nature} |`).join('\n')+'\n');console.log('Prepared',manifest.length,'assets');
})().catch(e=>{console.error(e);process.exitCode=1;});
