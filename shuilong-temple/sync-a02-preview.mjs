// Synchronize only changed runtime modules. Never rebuild geometry, GLB or textures.
import fs from 'node:fs';import{inlineA02}from './inline-a02.mjs';
const file=new URL('水龙祠-交互预览.html',import.meta.url);let preview=fs.readFileSync(file,'utf8');
for(const[symbol,name]of [['inlineMarkers','narrative-markers.mjs'],['inlineDirector','director-light.mjs']]){
 let source=fs.readFileSync(new URL(name,import.meta.url),'utf8');
 source=source.replace(/import \{([^}]+)\} from '\.\.\/module-a\/visual-director\/state\.mjs';/,(_,names)=>`const {${names}}=(()=>{${fs.readFileSync(new URL('../module-a/visual-director/state.mjs',import.meta.url),'utf8').replaceAll('export ','')}\nreturn {${names}};})();`);
 source=inlineA02(source);
 const expression=new RegExp(`const ${symbol}="(?:\\\\.|[^"\\\\])*";`);if(!expression.test(preview))throw Error(`Missing ${symbol}`);
 preview=preview.replace(expression,()=>`const ${symbol}=${JSON.stringify(source)};`);
}
const environment=fs.readFileSync(new URL('a01-environment.mjs',import.meta.url),'utf8');
const oldCall='a01Environment?.apply(environmentExit*(lineState?.environmentWeight??1),lineState?.progress??1,lineState?.reducedMotion??false);';
const roomCall='const roomSite=visualTour?0:smooth(Math.max(0,Math.min(1,(visualScreens-6.4)/.8)))*(1-smooth(Math.max(0,Math.min(1,(visualScreens-10.2)/.75))));a01Environment?.apply((environmentExit+roomSite*(1-environmentExit))*(lineState?.environmentWeight??1),lineState?.progress??1,lineState?.reducedMotion??false,roomSite);';
preview=preview.replace(oldCall,roomCall);
preview=preview.replace(/const inlineA01Environment="(?:\\.|[^"\\])*";/,()=>`const inlineA01Environment=${JSON.stringify(environment)};`);
fs.writeFileSync(file,preview);console.log('A02 preview modules synchronized; model binary untouched.');
