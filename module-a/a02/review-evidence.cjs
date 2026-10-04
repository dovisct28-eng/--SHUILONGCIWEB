// Raw PNGs and lossless WebPs stay local; dimension-preserving JPEGs keep review commits small.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),sharp=require('sharp');
const {out}=require('./capture.cjs');
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
(async()=>{const rows=[];for(const source of files(out).filter(f=>f.endsWith('.png')&&path.dirname(f)!==out)){
 const target=source.replace(/\.png$/,'.jpg');await sharp(source).jpeg({quality:90,chromaSubsampling:'4:4:4'}).toFile(target);
 const original=await sharp(source).metadata(),review=await sharp(target).metadata();
 assert.equal(review.width,original.width);assert.equal(review.height,original.height);
 rows.push({file:path.relative(out,target).replaceAll('\\','/'),width:review.width,height:review.height,bytes:fs.statSync(target).size,quality:90,lossless:false});
}fs.writeFileSync(path.join(out,'review-packing.json'),JSON.stringify(rows,null,2));console.log(`PASS: ${rows.length} review JPEGs preserve actual screenshot dimensions; total ${rows.reduce((n,r)=>n+r.bytes,0)} bytes.`);})().catch(e=>{console.error(e);process.exitCode=1;});
