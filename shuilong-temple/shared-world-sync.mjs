// Runtime and offline source synchronization only; never rebuild model assets.
import './sync-a02-preview.mjs';
import fs from 'node:fs';
const file=new URL('水龙祠-交互预览.html',import.meta.url);
let html=fs.readFileSync(file,'utf8');
const shared=fs.readFileSync(new URL('./shared-world.mjs',import.meta.url),'utf8');
const literal=`const inlineSharedWorld=${JSON.stringify(shared)};`;
if(html.includes('const inlineSharedWorld='))html=html.replace(/const inlineSharedWorld="(?:\\.|[^"\\])*";/,()=>literal);
else html=html.replace('const localModule=',literal+'\nconst localModule=');
if(!html.includes('const {deriveSharedWorldState}=await localModule'))html=html.replace('const [{createA04Scene}',"const {deriveSharedWorldState}=await localModule(inlineSharedWorld,'./shared-world.mjs');\nconst [{createA04Scene}");
html=html.replace(/(?:if\(!new URLSearchParams\(location.search\).has\('controlled'\)\))*environment=mod\.createEnvironment\(T,scene,\{assets:location\.protocol==='file:'\?inlineEnvironmentAssets:mod\.ENVIRONMENT_ASSETS\}\);/,
  "if(!new URLSearchParams(location.search).has('controlled'))environment=mod.createEnvironment(T,scene,{assets:location.protocol==='file:'?inlineEnvironmentAssets:mod.ENVIRONMENT_ASSETS});");
const update=`function updateArtDirection(){
 const state=deriveVisual(visualScreens,visualTour),world=deriveSharedWorldState(visualScreens,visualTour);
 state.heroWeight=visualTour?0:heroWeight(visualScreens);
 if(lineState&&!visualTour&&visualScreens<3.25){state.environmentOpacity*=lineState.environmentWeight;state.foregroundOpacity*=lineState.environmentWeight;}
 environment?.apply({...state,environmentOpacity:a01Art?0:state.environmentOpacity,foregroundOpacity:a01Art?0:state.foregroundOpacity});
 a01Environment?.apply(world.environment*(lineState?.environmentWeight??1),lineState?.progress??1,lineState?.reducedMotion??false,world.room,world.posterClearance,world);
 const routeLook=visualScreens>=12.3&&visualScreens<=18.002?Math.max(0,Math.min(1,(visualScreens-12.3)/.75)):0;
 if(routeLook>0){const blend=routeLook*routeLook*(3-2*routeLook);state.focusStrength*=1-blend;state.architectureWeight+=(1-state.architectureWeight)*blend;state.target=null;}
 applyFocus(state);sun.intensity=state.lightIntensity;scene.fog.density=state.fogDensity;
 a01Art?.apply(state.heroWeight,state,lineState);a01Post?.apply(state.heroWeight,lineState);directorLight?.apply(visualScreens,visualTour);
 if(a01Environment&&world.visible)floor.visible=false;
}`;
html=html.replace(/function updateArtDirection\(\)\{[\s\S]*?\nwindow\.shuilongTemple\.setVisualProgress=/,update+'\nwindow.shuilongTemple.setVisualProgress=');
html=html.replace('spatialVisibility=state?.spatialLabels??reveal;for(const mesh of roofMeshes)', 'spatialVisibility=state?.spatialLabels??reveal;if(!state?.selectiveCutaway)for(const mesh of roofMeshes)');
if(!html.includes('getSharedWorldIdentity'))html=html.replace('window.shuilongTemple.getA01EnvironmentState=()=>a01Environment?.getState();',`window.shuilongTemple.getA01EnvironmentState=()=>a01Environment?.getState();
window.shuilongTemple.setPosterTitleRects=rects=>a01Environment?.setTitleRects(deriveSharedWorldState(visualScreens,visualTour).posterClearance>0?rects:[]);
window.shuilongTemple.getSharedWorldState=()=>deriveSharedWorldState(visualScreens,visualTour);
window.shuilongTemple.getSharedWorldIdentity=()=>({root,renderer,environment:a01Environment?.identity});
window.shuilongTemple.getA03CutawayState=()=>directorLight?.getCutawayState();`);
html=html.replace('a01Environment?.setTitleRects(rects);','a01Environment?.setTitleRects(deriveSharedWorldState(visualScreens,visualTour).posterClearance>0?rects:[]);');
fs.writeFileSync(file,html);console.log('Shared world and selective cutaway synchronized. Model binary untouched.');
