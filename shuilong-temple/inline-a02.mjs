import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const wrap=(names,source)=>`const {${names}}=(()=>{${source.replaceAll('export ','')}\nreturn {${names}};})();`;
// A03 presentation dependencies are nested in the same offline module scope.
const inlineTheme=url=>fs.readFileSync(url,'utf8').replace(/import\s*\{([^}]+)\}\s*from\s*'([^']+)';/g,(_,names,relative)=>wrap(names,inlineTheme(new URL(relative,url))));
export function inlineA02(source) {
  source=source.replace("import {roomLabels,circled} from '../module-a/a02/markers.mjs';",wrap('roomLabels,circled',read('../module-a/a02/markers.mjs')));
  if(source.includes("import {createA02Light} from './a02-light.mjs';")){
    const light=read('./a02-light.mjs').replace("import {architecturalRoom,ease} from '../module-a/a02/spatial.mjs';",wrap('architecturalRoom,ease',read('../module-a/a02/spatial.mjs'))).replace("import {directorState} from '../module-a/visual-director/state.mjs';",wrap('directorState',read('../module-a/visual-director/state.mjs')));
    source=source.replace("import {createA02Light} from './a02-light.mjs';",wrap('createA02Light',light));
  }
  return source.replace(/import\s*\{([^}]+)\}\s*from\s*'(\.\.\/module-a\/(?:a03|a04)\/[^']+)';/g,(_,names,relative)=>wrap(names,inlineTheme(new URL(relative,import.meta.url))));
}
