// One-time migration: copy the confirmed B geometry into the production source.
// Kept as an auditable migration; normal builds use build-model.mjs only.
const fs=require('node:fs'),assert=require('node:assert/strict');
const file='shuilong-temple/model-source.js';
let source=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
assert.ok(!source.includes('COMBINED_B'),'Migration already applied');
const candidate=fs.readFileSync('docs/validation/temple-model-v2/src/candidate-model.mjs','utf8').replace(/\r\n/g,'\n');
const configuration=JSON.parse(fs.readFileSync('docs/validation/temple-model-v2/candidate-config.json'));
const stage=configuration.stages.B,roof=configuration.roofs.B;
const corridor={factor:1.2,columnX:2.922,effectiveWidth:1.968,floorInner:2.682,floorOuter:4.925,floorWidth:2.243,roofInner:2.702,roofOuter:5.25,roofWidth:2.548,cameraCentreX:3.906};
const parameters=` // COMBINED_B: confirmed design-model geometry, not surveyed dimensions.\n const COMBINED_B=${JSON.stringify({corridor,stage,roof})};\n`;
source=source.replace(" const root=new T.Group();",parameters+" const root=new T.Group();");
// The hall roof is built once in a separate group, including its gable masonry.
source=source.replace('roof(0,-11.55,10.65,8.15,3.35,1.85);','');
const begin=source.indexOf(' for(let side of [-1,1]){part('),end=source.indexOf(" part('07_Entrance');",begin);
assert.ok(begin>0&&end>begin);
let galleries=candidate.slice(candidate.indexOf('  for(const side of [-1,1]){'),candidate.indexOf('\n if(variant.stage)'));
galleries=galleries.slice(0,galleries.lastIndexOf('\n }'));
galleries=galleries.replace("replace(side<0?'04_WestGallery':'05_EastGallery');","part(side<0?'04_WestGallery':'05_EastGallery');").replace(/\bh\./g,'');
let theatre=candidate.slice(candidate.indexOf("  replace('06_Stage');"),candidate.indexOf('\n if(variant.roof)'));
theatre=theatre.slice(0,theatre.lastIndexOf('\n }')).replace("replace('06_Stage');const p=config.stages[variant.stage]","part('06_Stage');const p=COMBINED_B.stage").replace(/\bh\./g,'').replaceAll("variant.stage==='B'",'true');
let hall=candidate.slice(candidate.indexOf("  h.part('08_HallRoofCandidate');"),candidate.indexOf('\n delete root.userData.helpers'));
hall=hall.slice(0,hall.lastIndexOf('\n }')).replace(/\bh\./g,'').replace("part('08_HallRoofCandidate');const p=config.roofs[variant.roof];","part('08_MainHallRoof');group.userData.roofAssembly=true;const p=COMBINED_B.roof;");
source=source.slice(0,begin)+' const cm=COMBINED_B.corridor;\n'+galleries+'\n {\n'+theatre+'\n }\n {\n'+hall+'\n }\n'+source.slice(end);
source=source.replace(' return root;'," root.userData.modelVersion='V2.4-B1-combined-b';\n return root;");
assert.ok(!source.includes('variant.')&&!source.includes('config.'));
fs.writeFileSync(file,source);
