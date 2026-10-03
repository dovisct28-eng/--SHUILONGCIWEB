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
  const colors={roof:[.32,.44,.66],wood:[.48,.40,.34],brick:[.62,.53,.50],plaster:[1.32,1.48,1.64],stone:[.78,.84,.93],paving:[.68,.75,.83]};
  const surfaces={roof:[.77,.035],wood:[.88,0],brick:[.98,0],plaster:[.98,0],stone:[.94,0],paving:[.95,0]};
  const baseSurfaces=new Map(entries.map(m=>[m,{roughness:m.roughness,metalness:m.metalness}]));
  const roofMix={value:0};
  for(const m of new Set(entries))if(m.userData.textureKey==='roof'){
    m.onBeforeCompile=shader=>{shader.uniforms.a01RoofMix=roofMix;
      shader.fragmentShader='uniform float a01RoofMix;\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        float roofValue=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
        diffuseColor.rgb=mix(diffuseColor.rgb,roofValue*vec3(.5,.9,1.8),a01RoofMix);`);
    };m.customProgramCacheKey=()=> 'a01-roof-ink-v1';
  }
  const multiplier=new T.Color(),white=new T.Color(1,1,1),neutral=new T.Color(.46,.51,.56),cameraTarget=new T.Vector3();
  const oldSun=sun.position.clone(),heroSun=new T.Vector3(-9,18,-20),nearTarget=new T.Vector3(0,4.5,-12);
  const sunColor=sun.color.clone(),skyColor=fill.color.clone(),groundColor=fill.groundColor.clone(),fogColor=scene.fog.color.clone();
  const warm=new T.Color(0xffca8a),cool=new T.Color(0x8fa6bc),ground=new T.Color(0x252d33),inkFog=new T.Color(0x303c44);
  return {
    apply(weight,state,line) {
      // A rapid A01→A04 jump must reset FOV before the tour owns camera position.
      const fov=34-2*weight;
      roofMix.value=weight*(line?.materialWeight??1);
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
      fill.intensity=1.2-.45*lit;
      sun.color.copy(sunColor).lerp(warm,lit);
      fill.color.copy(skyColor).lerp(cool,lit);fill.groundColor.copy(groundColor).lerp(ground,lit);
      scene.fog.color.copy(fogColor).lerp(inkFog,weight);
      sun.position.copy(oldSun).lerp(heroSun,lit);
      sun.intensity=state.lightIntensity+.25*lit;
      scene.fog.density=state.fogDensity-.004*lit;
      floor.material.opacity=.15+.20*lit;
    },
    camera(theta,phi,distance,target,weight,line=null) {
      const narrow=smooth((1.5-camera.aspect)/.25);
      const near=weight*(1-smooth((line?.progress??1)/.2))*(line?.depth===0?0:1);
      const viewPhi=phi+.24*weight;
      let viewDistance=distance-(13.5-11*narrow)*weight;
      viewDistance+=(11.5+4*narrow-viewDistance)*near;
      cameraTarget.copy(target);cameraTarget.y-=1.25*weight;
      // Close view of the actual main hall, then collect the whole compound.
      cameraTarget.lerp(nearTarget,near);
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
