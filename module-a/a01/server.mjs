import {createReadStream,statSync} from 'node:fs';
import {createServer} from 'node:http';
import {extname,join,normalize,resolve,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
export const MODULE_A_ROOT=resolve(fileURLToPath(new URL('../../',import.meta.url)));
export const MODULE_A_RUNTIME='V3.5-resilient-local-1';
const types={'.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.glb':'model/gltf-binary','.png':'image/png','.webp':'image/webp'};
export function createModuleAServer({root=MODULE_A_ROOT,openStream=createReadStream}={}){
 root=resolve(root);
 return createServer((request,response)=>{
  const fail=(code,text)=>{if(!response.headersSent)response.writeHead(code,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}).end(text);else response.destroy();};
  let requested;try{requested=decodeURIComponent(new URL(request.url,'http://localhost').pathname);}catch{fail(400,'Invalid URL');return;}
  if(requested==='/api/module-a-runtime'){response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify({app:'shuilongci-module-a',version:MODULE_A_RUNTIME,root}));return;}
  if(!['GET','HEAD'].includes(request.method)){fail(405,'Method not allowed');return;}
  const relative=requested==='/'?'module-a/a01/index.html':requested.replace(/^\/+/, '');let file=resolve(root,normalize(relative));
  if(file!==root&&!file.startsWith(root+sep)){fail(404,'Not found');return;}
  try{if(statSync(file).isDirectory())file=join(file,'index.html');const info=statSync(file);if(!info.isFile()){fail(404,'Not found');return;}response.setHeader('Content-Type',types[extname(file).toLowerCase()]||'application/octet-stream');response.setHeader('Content-Length',info.size);response.setHeader('Cache-Control',extname(file).toLowerCase()==='.webp'?'public, max-age=3600':'no-store');
   if(request.method==='HEAD'){response.end();return;}
   const stream=openStream(file);stream.on('error',e=>{if(!response.headersSent)response.removeHeader('Content-Length');fail(['ENOENT','ENOTDIR'].includes(e.code)?404:500,'File unavailable');});response.on('close',()=>stream.destroy());stream.pipe(response);
  }catch(e){if(!response.headersSent)response.removeHeader('Content-Length');fail(['ENOENT','ENOTDIR'].includes(e.code)?404:500,'File unavailable');}
 });
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const port=Number(process.env.A01_PORT||4173),server=createModuleAServer();server.on('error',e=>{console.error(`Module A server: ${e.message}`);process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log(`A01 prototype: http://127.0.0.1:${server.address().port}/module-a/a01/`));}
