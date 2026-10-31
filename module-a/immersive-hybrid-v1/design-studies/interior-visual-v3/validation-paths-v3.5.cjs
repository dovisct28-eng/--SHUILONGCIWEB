// Raw screenshots, videos and repeated reports stay local unless explicitly promoted.
const fs=require('node:fs'),path=require('node:path');
const stage=path.resolve(__dirname,'../../../../docs/validation/interior-visual-v3-5');
const out=path.resolve(process.env.V35_OUTPUT||path.join(stage,'local/latest'));
fs.mkdirSync(path.join(out,'local'),{recursive:true});
module.exports={out,stage};
