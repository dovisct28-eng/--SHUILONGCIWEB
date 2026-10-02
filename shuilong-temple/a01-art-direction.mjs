// A01 display choices, not surveyed architecture. Shared chapter states restore
// during the existing 6.2–7.2 screen handoff; geometry and mural materials stay intact.
const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));
const smooth = n => { const t=clamp(n); return t*t*(3-2*t); };
export function deriveHeroWeight(screens=0) {
  return 1-smooth((screens-6.2)/1);
}
export function createA01ArtDirection(T, {camera,root,scene,renderer,sun,fill,floor}) {
  const entries=[];
  root.children.filter(g=>!g.name.startsWith('mural-')).forEach(g=>g.traverse(m=>{
    if(m.isMesh)entries.push(m.material);
  }));
  const colors={roof:[.38,.41,.45],wood:[.55,.49,.44],brick:[.86,.78,.82],plaster:[1.65,1.72,1.80],stone:[.91,.94,.96],paving:[.88,.91,.95]};
  const multiplier=new T.Color(),white=new T.Color(1,1,1),neutral=new T.Color(.86,.84,.80),cameraTarget=new T.Vector3();
  const oldSun=sun.position.clone(),heroSun=new T.Vector3(-20,28,-12);
  return {
    apply(weight,state,line) {
      // A rapid A01→A04 jump must reset FOV before the tour owns camera position.
      const fov=34-2*weight;
      if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
      // Called after shared focus restores each base color, so seeks cannot accumulate tint.
      for(const m of entries){const tint=colors[m.userData.textureKey];if(!tint)continue;
        multiplier.setRGB(...tint);multiplier.lerp(neutral,1-(line?.materialWeight??1));multiplier.lerp(white,1-weight);
        m.color.multiply(multiplier);
      }
      const lit=weight*(line?.lightingWeight??1);
      renderer.toneMappingExposure=1.18-.12*lit;
      fill.intensity=1.2-.25*lit;
      sun.position.copy(oldSun).lerp(heroSun,lit);
      sun.intensity=state.lightIntensity-.15*lit;
      scene.fog.density=state.fogDensity-.004*lit;
      floor.material.opacity=.15+.07*lit;
    },
    camera(theta,phi,distance,target,weight) {
      const narrow=smooth((1.5-camera.aspect)/.25);
      const viewPhi=phi+.24*weight,viewDistance=distance-(13.5-11*narrow)*weight;
      cameraTarget.copy(target);cameraTarget.y-=1.25*weight;
      camera.position.set(cameraTarget.x+viewDistance*Math.sin(viewPhi)*Math.sin(theta),cameraTarget.y+viewDistance*Math.cos(viewPhi),cameraTarget.z+viewDistance*Math.sin(viewPhi)*Math.cos(theta));
      camera.lookAt(cameraTarget);
    },
    getState(){
      root.updateMatrixWorld(true);camera.updateMatrixWorld();
      const point=new T.Vector3(),bounds={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
      root.children.filter(g=>!g.name.startsWith('mural-')&&g.name!=='A01ArchitectureLines').forEach(g=>g.traverse(mesh=>{
        if(!mesh.isMesh)return;const positions=mesh.geometry.attributes.position;
        for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).project(camera);const x=(point.x+1)/2,y=(1-point.y)/2;
          bounds.left=Math.min(bounds.left,x);bounds.right=Math.max(bounds.right,x);bounds.top=Math.min(bounds.top,y);bounds.bottom=Math.max(bounds.bottom,y);
        }
      }));
      return {position:camera.position.toArray(),target:cameraTarget.toArray(),fov:camera.fov,bounds};
    },
  };
}
