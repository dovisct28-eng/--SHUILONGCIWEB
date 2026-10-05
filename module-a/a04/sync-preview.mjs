import '../../shuilong-temple/shared-world-sync.mjs';
import fs from 'node:fs';
import {inlineA02} from '../../shuilong-temple/inline-a02.mjs';
const file=new URL('../../shuilong-temple/水龙祠-交互预览.html',import.meta.url);
let html=fs.readFileSync(file,'utf8');
const source=inlineA02(fs.readFileSync(new URL('../../shuilong-temple/a04-scene.mjs',import.meta.url),'utf8').replace(/import \{([^}]+)\} from '\.\.\/module-a\/visual-director\/state\.mjs';/,(_,names)=>`const {${names}}=(()=>{${fs.readFileSync(new URL('../visual-director/state.mjs',import.meta.url),'utf8').replaceAll('export ','')}\nreturn {${names}};})();`));
html=html.replace(/const inlineA04="(?:\\.|[^"\\])*";/,()=>`const inlineA04=${JSON.stringify(source)};`);
fs.writeFileSync(file,html);console.log('A04 runtime synchronized; GLB and mural assets untouched.');
