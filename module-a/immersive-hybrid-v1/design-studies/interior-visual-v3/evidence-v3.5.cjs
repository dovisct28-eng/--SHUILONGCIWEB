const fs=require('fs'),path=require('path'),sharp=require('sharp'),cp=require('child_process'),assert=require('assert/strict');
const out=path.resolve('docs/validation/interior-visual-v3-5'),selected=path.join(out,'selected');fs.mkdirSync(selected,{recursive:true});
(async()=>{const manifest=[];for(const[name,file,state]of[
 ['01-third-before','before-wall-2.png','V3.4 continuous third dock'],['02-third-after','formal-wall-2.png','V3.5 formal continuous third dock'],
 ['03-fourth-before','before-wall-3.png','V3.4 continuous fourth dock'],['04-fourth-after','formal-wall-3.png','V3.5 formal continuous fourth dock'],
 ['05-second-dark','after-second-dark.png','V3.5 real first-to-second dark phase'],['06-second-title','after-second-title.png','V3.5 real first-to-second title phase'],
 ['07-a03-entry','formal-a03.png','formal A03 preserved poster + gallery link'],['08-module-b','formal-module-b.png','real module B landing'],['09-fifth-full','after-reading-4.png','fifth full contain image']]){
  const target=path.join(selected,name+'.webp');await sharp(path.join(out,'local',file)).webp({quality:90}).toFile(target);manifest.push({file:path.basename(target),source:'local/'+file,state,viewport:[1440,900],bytes:fs.statSync(target).size});}
 const integration=JSON.parse(fs.readFileSync(path.join(out,'integration-results.json'))),video=path.join(selected,'continuous-walk-1440x900.webm');assert.equal(integration.pass,true);fs.copyFileSync(integration.video,video);manifest.push({file:path.basename(video),source:integration.video,state:'uncut real formal A03, gate, five murals, representative detail, unavailable + real B, browser return',viewport:[1440,900],bytes:fs.statSync(video).size});
 const ffmpeg='D:/YJS/研二上/水龙祠视频3/optimized-v1/tools/ffmpeg.exe';
 const info=cp.spawnSync(ffmpeg,['-hide_banner','-i',video],{encoding:'utf8',windowsHide:true});
 const decode=cp.spawnSync(ffmpeg,['-hide_banner','-v','error','-i',video,'-f','null','-'],{encoding:'utf8',windowsHide:true,timeout:180000});assert.equal(decode.status,0,decode.stderr);
 const check={pass:true,untrimmed:true,codecMetadata:info.stderr.split(/\r?\n/).filter(l=>/Duration:|Stream.*Video:/.test(l)),decodeExit:decode.status,decodeErrors:decode.stderr,bytes:fs.statSync(video).size};fs.writeFileSync(path.join(out,'video-check.json'),JSON.stringify(check,null,2));fs.writeFileSync(path.join(selected,'manifest.json'),JSON.stringify({items:manifest,totalBytes:manifest.reduce((n,f)=>n+f.bytes,0)},null,2));console.log(check);
})().catch(e=>{console.error(e);process.exitCode=1});
