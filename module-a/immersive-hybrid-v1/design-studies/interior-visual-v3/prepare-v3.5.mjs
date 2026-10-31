// Compile and upload using the original renderer while the route is locked.
// No alternate scene, camera, render target or visible camera movement.
export function installPreparation(runtime,renderer){
 const samples=[];
 runtime.prepareAssets=async(group,textures)=>{
  const saved=[];group.traverse(o=>{if(o.isMesh){saved.push([o,o.visible]);o.visible=true;}});
  const start=performance.now();let upload;
  try{for(const texture of textures)renderer.initTexture(texture);upload=performance.now();let scene=group;while(scene.parent)scene=scene.parent;await renderer.compileAsync(scene,runtime.camera);}
  finally{for(const[o,visible]of saved)o.visible=visible;samples.push({name:group.name,textures:textures.length,uploadMs:(upload??performance.now())-start,totalMs:performance.now()-start});}
 };
 return samples;
}
