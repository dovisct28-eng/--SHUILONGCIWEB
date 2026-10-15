// Reuse the exact V4 capture actions and clock. Change only the response text
// in the capture browser; the Module B application and old recordings stay intact.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const base=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(__dirname,'capture-b02-v4.cjs'),'utf8');
const injection=`await p.route('**/index.html',async route=>{
 const response=await route.fetch();
 const original=await response.text();
 const modified=original.replaceAll('数字色稿 · 数字化演绎内容','数字色稿').replaceAll('数字化演绎内容','').replaceAll('交互效果模拟演示','');
 await route.fulfill({response,body:modified});
});`;
const revised=source.replace('await p.clock.install();',injection+'await p.clock.install();')
 .replace("full?'b02-full':'probe-b02'","full?'b02-final':'probe-b02-final'")
 .replace("full?'capture-b02-full-report.json':'capture-b02-probe-report.json'","full?'capture-b02-final-report.json':'capture-b02-final-probe-report.json'");
if(revised===source||!revised.includes(injection))throw Error('V4 capture patch did not apply');
fs.mkdirSync(path.join(base,'local/v4-final'),{recursive:true});
fs.writeFileSync(path.join(base,'local/v4-final/capture-source.cjs'),revised);
const runner=new Module(path.join(__dirname,'capture-b02-final.generated.cjs'),module);
runner.filename=path.join(__dirname,'capture-b02-final.generated.cjs');runner.paths=module.paths;
runner._compile(revised,runner.filename);
