// A01 display choices, not surveyed architecture. Shared chapter states restore
// during the existing 6.2–7.2 screen handoff; geometry and mural materials stay intact.
import { createA01Camera } from './a01-camera.mjs';
import { createA01Materials } from './a01-material.mjs';
const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));
const smooth = n => { const t=clamp(n); return t*t*(3-2*t); };
export function deriveHeroWeight(screens=0) {
  return 1-smooth((screens-6.2)/1);
}
export function createA01ArtDirection(T, {camera,root,scene,renderer,sun,fill,floor}) {
  const cameraRig=createA01Camera(T,camera);
  const entries=[];
  root.children.filter(g=>!g.name.startsWith('mural-')).forEach(g=>g.traverse(m=>{
    if(m.isMesh)entries.push(m.material);
  }));
  const colors={roof:[.47,.54,.63],wood:[.54,.43,.35],brick:[.66,.51,.46],plaster:[1.35,1.37,1.39],stone:[.72,.82,.90],paving:[.74,.77,.79]};
  const surfaces={roof:[.77,.035],wood:[.88,0],brick:[.98,0],plaster:[.98,0],stone:[.94,0],paving:[.95,0]};
  const baseSurfaces=new Map(entries.map(m=>[m,{roughness:m.roughness,metalness:m.metalness}]));
  const surfaceRig=createA01Materials(T,entries);
  const multiplier=new T.Color(),white=new T.Color(1,1,1),neutral=new T.Color(.46,.51,.56),cameraTarget=new T.Vector3();
  const oldSun=sun.position.clone(),heroSun=new T.Vector3(-16,22,16);
  const sunColor=sun.color.clone(),skyColor=fill.color.clone(),groundColor=fill.groundColor.clone(),fogColor=scene.fog.color.clone();
  const warm=new T.Color(0xffd4a1),cool=new T.Color(0xa5b9ce),ground=new T.Color(0x313d4a),inkFog=new T.Color(0x647b89);
  return {
    apply(weight,state,line) {
      // A rapid A01→A04 jump must reset FOV before the tour owns camera position.
      const fov=34-2*weight;
      surfaceRig.apply(weight*(line?.materialWeight??1));
      if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
      // Called after shared focus restores each base color, so seeks cannot accumulate tint.
      for(const m of entries){const tint=colors[m.userData.textureKey];if(!tint)continue;
        multiplier.setRGB(...tint);multiplier.lerp(neutral,1-(line?.materialWeight??1));multiplier.lerp(white,1-weight);
        m.color.multiply(multiplier);
        const base=baseSurfaces.get(m),surface=surfaces[m.userData.textureKey],amount=weight*(line?.materialWeight??1);
        m.roughness=base.roughness+(surface[0]-base.roughness)*amount;m.metalness=base.metalness+(surface[1]-base.metalness)*amount;
      }
      const lit=weight*(line?.lightingWeight??1);
      renderer.toneMappingExposure=1.18-.20*lit;
      fill.intensity=1.2-.37*lit;
      sun.color.copy(sunColor).lerp(warm,lit);
      fill.color.copy(skyColor).lerp(cool,lit);fill.groundColor.copy(groundColor).lerp(ground,lit);
      scene.fog.color.copy(fogColor).lerp(inkFog,weight);
      sun.position.copy(oldSun).lerp(heroSun,lit);
      sun.intensity=state.lightIntensity+.95*lit;
      scene.fog.density=state.fogDensity+.003*lit;
      floor.material.opacity=.15+.20*lit;
      // The legacy infinite shadow plane writes depth, hiding every downhill slope.
      // A01 terrain receives the same sun shadows; restore the plane for A02.
      floor.visible=weight<1;
      floor.material.depthWrite=weight===0;
      floor.material.opacity=.15*(1-weight);
    },
    camera(theta,phi,distance,target,weight,line=null) {
      cameraTarget.copy(cameraRig.apply(theta,phi,distance,target,weight,line));
    },
    setCameraCandidate: value=>cameraRig.setCandidate(value),
    getState(){
      root.updateMatrixWorld(true);camera.updateMatrixWorld();
      const point=new T.Vector3(),bounds={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
      root.children.filter(g=>!g.name.startsWith('mural-')&&g.name!=='A01ArchitectureLines').forEach(g=>g.traverse(mesh=>{
        if(!mesh.isMesh)return;const positions=mesh.geometry.attributes.position;
        for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).project(camera);const x=(point.x+1)/2,y=(1-point.y)/2;
          bounds.left=Math.min(bounds.left,x);bounds.right=Math.max(bounds.right,x);bounds.top=Math.min(bounds.top,y);bounds.bottom=Math.max(bounds.bottom,y);
        }
      }));
      return {position:camera.position.toArray(),target:cameraTarget.toArray(),fov:camera.fov,aspect:camera.aspect,bounds};
    },
  };
}
