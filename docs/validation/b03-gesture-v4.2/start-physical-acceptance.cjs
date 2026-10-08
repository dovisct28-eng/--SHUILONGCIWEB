// Prepares a real Windows/Chrome acceptance session. Never certifies human tests.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const portArg=process.argv.find(a=>a.startsWith('--port='));
const port=portArg?Number(portArg.slice(7)):3000,noOpen=process.argv.includes('--no-open');
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid --port');
const origin=`http://localhost:${port}`,pageUrl=origin+'/index.html?gestureDebug=1';
const repoRoot=path.resolve(__dirname,'../../..'),moduleRoot=path.join(repoRoot,'Mural-Exhibition');
async function runtime(){
 try{const r=await fetch(origin+'/api/b03-runtime',{signal:AbortSignal.timeout(2500)});
  if(!r.ok)throw Error(`Port ${port} serves an older or unrelated process. Restart your project server manually or use --port with a free port.`);
  const data=await r.json();if(data.version!=='B03 V4.2')throw Error('Unexpected server version');return data;
 }catch(error){if(error.cause?.code==='ECONNREFUSED')return null;throw error;}
}
(async()=>{
 let info=await runtime(),serverPid=null;
 if(!info){
  const server=cp.spawn(process.execPath,['server.js'],{cwd:moduleRoot,env:{...process.env,PORT:String(port)},windowsHide:true,detached:true,stdio:'ignore'});
  await new Promise((resolve,reject)=>{server.once('spawn',resolve);server.once('error',reject);});serverPid=server.pid;server.unref();
  for(let n=0;n<30&&!info;n++){await new Promise(r=>setTimeout(r,200));info=await runtime();}
  if(!info)throw Error('Project server did not start');
 }
 const dir=path.join(__dirname,'local/physical');fs.mkdirSync(dir,{recursive:true});
 const names=['cold-start-10','reentry-10','half-body','left-hand','right-hand','two-hands-no-takeover','next-10','view-close-10','short-occlusion','bystander-interference','load-and-timing','idle-movement-10-minutes'];
 const record={schema:'B03 V4.2 physical acceptance',...info,createdAt:new Date().toISOString(),status:'PENDING',device:'',camera:'',browser:'',distanceCm:null,lighting:'',tests:names.map(name=>({name,status:'PENDING',observations:'',attempts:[]}))};
 const recordPath=path.join(dir,new Date().toISOString().replace(/[:.]/g,'-')+'-physical-results.json');fs.writeFileSync(recordPath,JSON.stringify(record,null,2));
 if(!noOpen){
  const candidates=[path.join(process.env.ProgramFiles||'C:/Program Files','Google/Chrome/Application/chrome.exe'),path.join(process.env['ProgramFiles(x86)']||'C:/Program Files (x86)','Google/Chrome/Application/chrome.exe'),path.join(process.env.LOCALAPPDATA||'','Google/Chrome/Application/chrome.exe')];
  const chrome=candidates.find(p=>fs.existsSync(p));if(!chrome)throw Error('Chrome was not found. Open '+pageUrl+' manually. PENDING record: '+recordPath);
  const browser=cp.spawn(chrome,['--new-window',pageUrl],{detached:true,stdio:'ignore',windowsHide:false});
  await new Promise((resolve,reject)=>{browser.once('spawn',resolve);browser.once('error',reject);});browser.unref();
 }
 console.log(JSON.stringify({status:'PENDING',serverPid,pageUrl,recordPath,message:'Follow PHYSICAL_CAMERA_CHECKLIST.md. This launcher does not record video or landmarks and never marks human tests PASS.'},null,2));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
