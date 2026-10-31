// Explicit promotion only: ten stills; raw recordings stay in ignored local/latest.
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const {out,stage}=require('./validation-paths-v3.5.cjs'),selected=path.join(stage,'selected');
const items=[
 ['02-third-after','after-wall-2.png','A model third, right wall'],
 ['04-fourth-after','after-wall-3.png','A model fourth, left wall'],
 ['05-second-dark','after-second-dark.png','second mural dark hold'],
 ['06-second-title','after-second-title.png','second mural title/reveal'],
 ['07-a03-entry','formal-a03.png','A03 active formal gallery entrance'],
 ['09-fifth-full','after-reading-4.png','fifth mural complete natural-ratio reading'],
 ['10-case-b-third','report-after-wall-2.png','B report third, left wall'],
 ['11-case-b-fourth','report-after-wall-3.png','B report fourth, right wall'],
 ['12-route-selector','route-choice-report.png','formal A/B selector'],
 ['13-third-detail','detail-third.png','third mural zoom/pan/minimap detail']
];
(async()=>{fs.mkdirSync(selected,{recursive:true});const manifest=[];
 for(const[name,file,state]of items){const target=path.join(selected,name+'.webp');await sharp(path.join(out,'local',file)).webp({quality:90}).toFile(target);manifest.push({file:path.basename(target),source:'local/latest/local/'+file,state,viewport:[1440,900],bytes:fs.statSync(target).size});}
 fs.writeFileSync(path.join(selected,'manifest.json'),JSON.stringify({items:manifest,totalBytes:manifest.reduce((n,f)=>n+f.bytes,0),rawMedia:'local/latest; ignored; no video promoted',videoMetadata:'../video-check.json retains historical full-walk codec/decode results'},null,2)+'\n');console.log('Promoted ten stills; raw video remains ignored');
})().catch(e=>{console.error(e);process.exitCode=1});
