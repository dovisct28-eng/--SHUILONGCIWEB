// Opt-in adapter for the ORIGINAL running temple instance. No new renderer,
// scene builder, GLB reader, environment copy or production scroll controller.
export async function attachEntryRuntime(ctx){
  const {T,scene,root,camera,renderer,sun,fill,a01Art,a01Post,resizeScene,updateArtDirection,schedule,texturePromises}=ctx;
  const api=window.shuilongTemple;
  api.setA01Presentation(1,false);api.setVisualProgress(5);
  api.setMuralPresentation({visibility:0,revealWalls:0});
  const textures=await Promise.all(texturePromises);
  if(textures.some(t=>!t))throw Error('建筑纹理加载失败');
  updateArtDirection();
  const intro=api.getIntroState();
  a01Art.camera(intro.theta,intro.phi,intro.distance,new T.Vector3(...intro.target),1,{progress:1});
  const baseline=a01Art.getState();
  const saved=[];let removedTriangles=0;
  // Only central wooden leaves, battens and handles. The arched masonry
  // infill, lintel, jambs, trim and sill remain exactly as modeled.
  root.getObjectByName('07_Entrance').traverse(mesh=>{
    if(!mesh.isMesh)return;
    const key=mesh.material.userData.textureKey;
    if(key&&key!=='wood')return;
    const g=mesh.geometry,p=g.attributes.position,index=g.index,keep=[];
    for(let i=0;i<index.count;i+=3){const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];
      const leaf=ids.every(k=>Math.abs(p.getX(k))<=.761&&p.getY(k)>=-.001&&p.getY(k)<=1.681&&p.getZ(k)>11.70&&p.getZ(k)<12.17);
      if(leaf)removedTriangles++;else keep.push(...ids);
    }
    if(keep.length!==index.count){const copy=g.clone();copy.setIndex(keep);saved.push({mesh,original:g,opened:copy});mesh.geometry=copy;}
  });
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  const bounce=scene.children.find(o=>o.isPointLight&&o.position.x===3);
  const bounceBase=bounce?{position:bounce.position.clone(),intensity:bounce.intensity}:null;
  let scheduled=false,renderCount=0,pose={position:baseline.position,target:baseline.target,fov:baseline.fov},disposed=false;
  function invalidate(){if(!scheduled&&!disposed){scheduled=true;schedule();}}
  function setCamera(next){
    if(!next||![...next.position,...next.target,next.fov].every(Number.isFinite))throw Error('Invalid entry camera');
    pose=structuredClone(next);invalidate();
  }
  function renderFrame(){
    if(disposed)return;
    scheduled=false;resizeScene();
    const raw=Math.max(0,Math.min(1,((pose.time??0)-.65)/.27)),inside=raw*raw*(3-2*raw);
    camera.near=.1-.055*inside;
    // Use the already existing A02 gallery practical, as restrained bounced
    // light inside the doorway. Overview remains pixel-identical to A01.
    if(bounce){bounce.position.copy(bounceBase.position).lerp(new T.Vector3(.7,2,11),inside);bounce.intensity=8*inside;}
    camera.position.fromArray(pose.position);camera.lookAt(...pose.target);camera.fov=pose.fov;camera.updateProjectionMatrix();camera.updateMatrixWorld();
    if(a01Post)a01Post.render();else renderer.render(scene,camera);
    renderCount++;window.modelReady=true;
  }
  const project=p=>{const v=new T.Vector3(...p).project(camera);return {x:(v.x+1)/2,y:(1-v.y)/2,depth:v.z,visible:v.z>=-1&&v.z<=1&&Math.abs(v.x)<=1&&Math.abs(v.y)<=1};};
  const ray=new T.Raycaster();
  const architecture=[];root.traverse(o=>{if(o.isMesh&&!o.parent.name.startsWith('mural-'))architecture.push(o);});
  function intersections(a,b){const origin=new T.Vector3(...a),delta=new T.Vector3(...b).sub(origin);ray.set(origin,delta.clone().normalize());ray.near=0;ray.far=delta.length();return ray.intersectObjects(architecture,false).filter(h=>h.object.visible&&h.object.parent.visible).map(h=>({object:h.object.name,distance:h.distance,point:h.point.toArray()}));}
  function handoff(){
    renderFrame();const vertical=2*Math.tan(camera.fov*Math.PI/360);
    const gate=[[ -.76,0,11.93],[.76,0,11.93],[-.76,1.615,11.93],[.76,1.615,11.93]];
    const components={leftJamb:[-.87,1,12.20],rightJamb:[.87,1,12.20],lintel:[0,1.68,12.17],stageBack:[0,1.68,9.555],rightPassage:[2,1.38,9.5]};
    const occlusion=Object.fromEntries(Object.entries(components).map(([key,p])=>[key,{world:p,projection:project(p),...{hits:intersections(pose.position,p).slice(0,2)}}]));
    return {version:'2.1',modelUnits:'design model, not a survey',camera:{...pose,quaternion:camera.quaternion.toArray(),near:camera.near,far:camera.far,aspect:camera.aspect},viewport:[innerWidth,innerHeight],view:{verticalFov:camera.fov,horizontalFov:2*Math.atan(vertical/2*camera.aspect)*180/Math.PI,verticalSpanAtUnitDistance:vertical},gatePlane:{z:11.93,openingBelowLintel:{x:[-.76,.76],y:[.13,1.615]},corners:gate.map(project)},components:occlusion,light:{exposure:renderer.toneMappingExposure,toneMapping:'ACESFilmic',colorSpace:renderer.outputColorSpace,sun:{position:sun.position.toArray(),intensity:sun.intensity,color:sun.color.getHexString()},fill:{intensity:fill.intensity,color:fill.color.getHexString()},existingGalleryBounce:bounce?{position:bounce.position.toArray(),intensity:bounce.intensity,color:bounce.color.getHexString()}:null,fog:{color:scene.fog.color.getHexString(),density:scene.fog.density},post:a01Post?.getState()},visibility:{gateBehindCamera:gate.every(p=>!project(p).visible),stageBackVisible:occlusion.stageBack.projection.visible,matchingInteriorAsset:false,readyForFinalComposite:false,reason:'门内停靠面向戏台及右通道；尚无匹配室内素材或正式切换蒙版'},removedTriangles};
  }
  function captureMask(cutoff=2){
    const old=scene.overrideMaterial,background=scene.background;
    const mask=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{cutoff:{value:cutoff}},vertexShader:'varying float d;void main(){vec4 p=modelViewMatrix*vec4(position,1.);d=-p.z;gl_Position=projectionMatrix*p;}',fragmentShader:'varying float d;uniform float cutoff;void main(){gl_FragColor=vec4(vec3(1.-step(cutoff,d)),1.);}'});
    try{scene.background=new T.Color(0);scene.overrideMaterial=mask;renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png');}finally{scene.overrideMaterial=old;scene.background=background;mask.dispose();invalidate();}
  }
  function setDoorOpen(open){for(const item of saved)item.mesh.geometry=open?item.opened:item.original;renderer.shadowMap.needsUpdate=true;invalidate();}
  const runtime={setCamera,renderFrame,invalidate,baseline,intersections,handoff,captureMask,setDoorOpen,
    get camera(){return camera;},get root(){return root;},get pose(){return structuredClone(pose);},
    stats:()=>({rendererUUID:renderer.domElement.dataset.entryRenderer,renderCount,renderers:1,canvases:document.querySelectorAll('canvas').length,removedTriangles,doorMeshes:saved.length,memory:{...renderer.info.memory},post:a01Post?.getState(),environment:api.getA01EnvironmentState()}),
    dispose(){disposed=true;removeEventListener('resize',invalidate);removeEventListener('pageshow',invalidate);if(bounce){bounce.position.copy(bounceBase.position);bounce.intensity=bounceBase.intensity;}for(const item of saved){item.mesh.geometry=item.original;item.opened.dispose();}}};
  renderer.domElement.dataset.entryRenderer=crypto.randomUUID();
  addEventListener('resize',invalidate);addEventListener('pageshow',invalidate);addEventListener('pagehide',e=>{if(!e.persisted)runtime.dispose();});
  api.entry=runtime;return runtime;
}
