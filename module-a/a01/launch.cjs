const path=require('node:path'),fs=require('node:fs'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),origin='http://127.0.0.1:4173',url=origin+'/module-a/a01/';
async function inspect(base,expectedRoot,version){
 try{const response=await fetch(base+'/api/module-a-runtime',{signal:AbortSignal.timeout(2000),cache:'no-store'});if(!response.ok)throw Error('occupied');const data=await response.json();if(data.app!=='shuilongci-module-a'||data.version!==version||path.resolve(data.root)!==path.resolve(expectedRoot))throw Error('occupied');return true;
 }catch(e){if(e.cause?.code==='ECONNREFUSED')return false;throw Error('4173端口已有旧版或其他服务，请关闭原 Module A server 窗口后重试；未停止任何已有服务。',{cause:e});}
}
async function launchModuleA({base=origin,expectedRoot=root,noOpen=false,spawn=cp.spawn,wait=ms=>new Promise(r=>setTimeout(r,ms)),timeout=10000}={}){
 const {MODULE_A_RUNTIME}=await import('./server.mjs');const target=base+'/module-a/a01/';let reused=await inspect(base,expectedRoot,MODULE_A_RUNTIME),child;
 if(!reused){const logs=path.join(expectedRoot,'.module-a-runtime');fs.mkdirSync(logs,{recursive:true});const fd=fs.openSync(path.join(logs,'server.log'),'a');try{child=spawn(process.execPath,[path.join(__dirname,'server.mjs')],{cwd:expectedRoot,env:{...process.env,A01_PORT:new URL(base).port||'4173'},detached:true,windowsHide:true,stdio:['ignore',fd,fd]});}finally{fs.closeSync(fd);}child.unref();const started=Date.now();while(!await inspect(base,expectedRoot,MODULE_A_RUNTIME)){if(child.exitCode!=null)throw Error('模块A服务启动失败，请查看 .module-a-runtime/server.log');if(Date.now()-started>timeout)throw Error('模块A服务启动超时，请查看 .module-a-runtime/server.log');await wait(100);}}
 if(!noOpen&&process.platform==='win32'){const browser=spawn('rundll32.exe',['url.dll,FileProtocolHandler',target],{detached:true,windowsHide:true,stdio:'ignore'});browser.unref();}
 return {url:target,reused,pid:child?.pid};
}
if(require.main===module)launchModuleA({noOpen:process.argv.includes('--no-open')}).then(r=>console.log(`模块A V3.5${r.reused?'（复用已核实服务）':'（独立后台服务）'}：${r.url}\n关闭本启动窗口不会停止网页服务。`)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={launchModuleA,inspect};
