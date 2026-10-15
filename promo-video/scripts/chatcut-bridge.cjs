// Invoke only the existing user-configured ChatCut Desktop MCP transport.
// No config writes, app source inspection, registration, or credentials output.
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),readline=require('node:readline');
const root=path.resolve(__dirname,'..');
async function rpc(method,args={},timeoutMs=45000){
 const config=fs.readFileSync('C:/Users/dovis/.codex/config.toml','utf8');
 const section=config.match(/\[mcp_servers\.chatcut_desktop\]([\s\S]*?)(?=\n\[|$)/)?.[1]||'';
 const command=section.match(/^command\s*=\s*'([^']+)'/m)?.[1];
 if(!command||path.basename(command)!=='chatcut-mcp.cmd')throw Error('Expected existing ChatCut Desktop transport was not found');
 const child=spawn('cmd.exe',['/d','/c',command],{windowsHide:true,env:{...process.env,CHATCUT_MCP_CLIENT:'codex'},stdio:['pipe','pipe','pipe']});
 const pending=new Map();let next=1,stderr='';
 child.stderr.on('data',d=>{stderr+=d.toString();});
 const lines=readline.createInterface({input:child.stdout});
 lines.on('line',line=>{try{const message=JSON.parse(line);if(message.id&&pending.has(message.id)){const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(Error(JSON.stringify(message.error))):p.resolve(message.result);}}catch{}});
 const send=(method,params)=>new Promise((resolve,reject)=>{const id=next++;pending.set(id,{resolve,reject});child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');});
 const timeout=setTimeout(()=>{for(const p of pending.values())p.reject(Error('ChatCut MCP timeout'));child.kill();},timeoutMs);
 child.on('exit',code=>{for(const p of pending.values())p.reject(Error('ChatCut MCP exited: '+code+'; '+stderr.replace(/https?:\/\/\S+/g,'[URL]').slice(0,250)));});
 try{
  const initialization=await send('initialize',{protocolVersion:'2024-11-05',capabilities:{},clientInfo:{name:'codex-promo-production',version:'1.0.0'}});
  child.stdin.write(JSON.stringify({jsonrpc:'2.0',method:'notifications/initialized'})+'\n');
  const result=await send(method,args);
  return {initialization,result};
 }finally{clearTimeout(timeout);lines.close();child.stdin.end();child.kill();}
}
if(require.main===module){
 const [method='tools/list',...rest]=process.argv.slice(2);
 const args=rest[0]?JSON.parse(fs.readFileSync(rest[0],'utf8')):{};
 rpc(method,args).then(r=>{fs.mkdirSync(path.join(root,'local'),{recursive:true});fs.writeFileSync(path.join(root,'local/chatcut-last-result.json'),JSON.stringify(r,null,2));if(method==='tools/list'){fs.writeFileSync(path.join(root,'local/chatcut-manifest.json'),JSON.stringify(r,null,2));console.log(JSON.stringify({instructions:r.initialization.instructions,serverInfo:r.initialization.serverInfo,tools:r.result.tools.map(t=>({name:t.name,description:t.description}))},null,2));}else console.log(JSON.stringify(r.result,null,2));}).catch(e=>{console.error(e.message);process.exitCode=1;});
}
module.exports={rpc};
