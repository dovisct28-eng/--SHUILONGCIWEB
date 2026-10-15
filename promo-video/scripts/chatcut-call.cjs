const fs=require('node:fs'),path=require('node:path');
const {rpc}=require('./chatcut-bridge.cjs');
const base=path.resolve(__dirname,'..');
const projectId='050726e1-fb18-4c5b-beb0-851c06f616fe';
async function call(name,args={}){
 const current=await rpc('tools/call',{name:'get_active_project',arguments:{}});
 if(current.result.structuredContent?.projectId!==projectId)throw Error('ChatCut active project changed; mutation not attempted');
 const response=await rpc('tools/call',{name,arguments:args},name==='track_progress'?600000:90000);
 fs.mkdirSync(path.join(base,'local/receipts'),{recursive:true});
 const receipt=path.join(base,'local/receipts',`${Date.now()}-${name}.json`);
 fs.writeFileSync(receipt,JSON.stringify(response.result,null,2));
 let index=0;
 function printable(value){
  if(Array.isArray(value))return value.map(printable);
  if(value&&typeof value==='object'){
   if(value.type==='image'&&value.data){const imagePath=receipt.replace('.json',`-${index++}.png`);fs.writeFileSync(imagePath,Buffer.from(value.data,'base64'));return {type:'image',localPath:imagePath};}
   return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,printable(v)]));
  }
  return value;
 }
 console.log(JSON.stringify({receipt:path.relative(base,receipt),result:printable(response.result)},null,2));
 if(response.result.isError)throw Error('ChatCut tool returned an error; see saved receipt');
 return response.result;
}
if(require.main===module){const [name,file]=process.argv.slice(2);call(name,file?JSON.parse(fs.readFileSync(file,'utf8')):{}).catch(e=>{console.error(e.message);process.exitCode=1;});}
module.exports={call};
