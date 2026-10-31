// The canonical markup and all behavior live in the existing study controller.
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'v35.html'),'utf8');
const output=source.replace('<head>','<head><base href="../immersive-hybrid-v1/design-studies/interior-visual-v3/">').replace('data-variant="v35"','data-variant="v35" data-audience="true"');
const target=path.resolve(__dirname,'../../../gallery/index.html');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,output);
