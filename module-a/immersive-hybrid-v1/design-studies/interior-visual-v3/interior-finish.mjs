// Instance-only bounced fill. Original geometry, external presentation and mural maps are untouched.
export function installInteriorFinish(runtime,T){
 let scene=runtime.root;while(scene.parent)scene=scene.parent;
 const fill=new T.HemisphereLight('#c4b59c','#514b43',0);scene.add(fill);
 const light=new T.PointLight('#dfc5a1',0,9,2);light.position.set(3.7,2.1,6);scene.add(light);
 const roofMaterials=[];runtime.root.traverse(mesh=>{if(mesh.isMesh&&['04_WestGallery','05_EastGallery'].includes(mesh.parent.name)&&mesh.material.userData.textureKey==='roof'){const original=mesh.material,material=original.clone();material.emissive.set('#b6a58d');material.emissiveMap=original.map;material.emissiveIntensity=0;mesh.material=material;roofMaterials.push({mesh,original,material});}});
 let enabled=true,last=runtime.pose;
 function update(p){last=p;const t=Math.max(0,Math.min(1,((p.time??0)-.85)/.6));fill.intensity=enabled?.65*t:0;light.intensity=enabled?3.5*t:0;for(const {material} of roofMaterials)material.emissiveIntensity=enabled?.11*t:0;}
 const previous=runtime.setCamera;runtime.setCamera=function(p,o){update(p);return previous.call(runtime,p,o);};
 return {setEnabled(v){enabled=v;update(last);runtime.invalidate();},get state(){return {enabled,hemisphere:fill.intensity,bounce:light.intensity};},dispose(){runtime.setCamera=previous;fill.removeFromParent();light.removeFromParent();for(const {mesh,original,material} of roofMaterials){mesh.material=original;material.dispose();}}};
}
