const {test}=require('node:test'),assert=require('node:assert/strict'),net=require('node:net'),cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
test('Windows acceptance launcher starts an isolated real server and creates only PENDING records without opening Chrome',async()=>{
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'localhost',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const root=path.resolve(__dirname,'../docs/validation/b03-gesture-v4.2'),script=path.join(root,'start-physical-acceptance.cjs');let report;
 try{
  const output=await new Promise((resolve,reject)=>cp.execFile(process.execPath,[script,'--no-open','--port='+port],{windowsHide:true,timeout:20000},(error,stdout,stderr)=>error?reject(Object.assign(error,{stderr})):resolve(stdout)));
  report=JSON.parse(output);assert.equal(report.status,'PENDING');assert.ok(Number.isInteger(report.serverPid));
  const data=JSON.parse(fs.readFileSync(report.recordPath,'utf8'));assert.equal(data.status,'PENDING');assert.equal(data.version,'B03 V4.2');assert.ok(/^[0-9a-f]{40}$/.test(data.commitSha));assert.equal(data.tests.length,12);assert.ok(data.tests.every(t=>t.status==='PENDING'&&t.attempts.length===0));
  const actual=await fetch(`http://localhost:${port}/api/b03-runtime`).then(r=>r.json());assert.equal(actual.commitSha,data.commitSha);
  fs.writeFileSync(path.join(root,'local/launcher-results.json'),JSON.stringify({status:'PASS',scope:'Real Node/Express server and CLI record preparation with --no-open; Chrome/hardware not invoked.',physicalCamera:'PENDING',runtime:actual,recordPath:path.relative(root,report.recordPath),tests:data.tests.length},null,2));
 }finally{if(report?.serverPid){try{process.kill(report.serverPid);}catch(error){if(error.code!=='ESRCH')throw error;}}}
});
