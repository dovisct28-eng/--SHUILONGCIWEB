const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {createApp}=require('./server.js');
const root=path.resolve(__dirname,'../docs/validation/b03-gesture-v4.3/local'),temp=path.join(root,'tmp');fs.mkdirSync(temp,{recursive:true});
const cases=[['lifecycle','b03-v42-browser-check.cjs','B03_V42_VALIDATION_DIR'],['ownership','b03-hand-lock-browser-check.cjs','B03_HAND_LOCK_VALIDATION_DIR'],['dwell','b03-dwell-browser-check.cjs','B03_DWELL_VALIDATION_DIR'],['b01','b01-browser-check.cjs','B01_VALIDATION_DIR'],['b02','b02-browser-check.cjs','B02_VALIDATION_DIR'],['real-models','b03-pose-browser-check.cjs','B03_POSE_VALIDATION_DIR']];
(async()=>{
 const reportPath=path.join(root,'regression-browser-results.json'),filter=process.env.B03_V43_CASES?.split(',');
 let results=[];if(fs.existsSync(reportPath)){fs.copyFileSync(reportPath,path.join(root,'regression-browser-results-attempt-'+Date.now()+'.json'));if(filter)results=JSON.parse(fs.readFileSync(reportPath));}
 if(filter&&filter.some(name=>!cases.some(c=>c[0]===name)))throw Error('Unknown regression case');
 const server=createApp().listen(0,'localhost');await new Promise(r=>server.once('listening',r));const origin='http://localhost:'+server.address().port;
 try{for(const [name,file,key]of cases.filter(c=>!filter||filter.includes(c[0]))){
  const out=path.join(root,name);fs.mkdirSync(out,{recursive:true});const log=path.join(out,'run-'+Date.now()+'.txt'),stream=fs.createWriteStream(log),start=Date.now();
  const exitCode=await new Promise((resolve,reject)=>{const child=cp.spawn(process.execPath,[file],{cwd:__dirname,env:{...process.env,[key]:out,B_VALIDATION_ORIGIN:origin,TMP:temp,TEMP:temp},windowsHide:true,stdio:['ignore','pipe','pipe']});child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});child.once('error',reject);child.once('close',resolve);});await new Promise(r=>stream.end(r));
  const result={name,command:'node '+file,status:exitCode===0?'PASS':'FAIL',exitCode,elapsedMs:Date.now()-start,log:path.relative(root,log)};const prior=results.findIndex(r=>r.name===name);if(prior>=0)results[prior]=result;else results.push(result);fs.writeFileSync(reportPath,JSON.stringify(results,null,2));console.log(name+' '+result.status+' ('+Math.round((Date.now()-start)/1000)+'s)');
 }}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
 if(results.some(r=>r.status!=='PASS'))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
