import { a03Visual, A03_TARGETS } from './composition.mjs';

// Reuse existing lights/materials. Real mural planes are excluded by construction.
export function createA03Light(T,{renderer,camera,sun,fill,root,scene,floor}) {
  const entries=[];
  root.children.filter(g=>!g.name.startsWith('mural-')).forEach(g=>g.traverse(m=>{if(m.isMesh)entries.push(m.material);}));
  const position=new T.Vector3(),focus=new T.Vector3(),direction=new T.Vector3(),target=new T.Vector3(0,-1.15,-1.75);
  const lightPosition=new T.Vector3(-12,25,-16),fog=new T.Color(0x17232c),neutral=new T.Color();
  return {
    camera(screens){const {weight}=a03Visual(screens);if(!weight)return;
      const radius=A03_TARGETS.reading.radius*Math.max(1,1.78/camera.aspect),phi=.93,theta=3.96;
      position.set(radius*Math.sin(phi)*Math.sin(theta),target.y+radius*Math.cos(phi),target.z+radius*Math.sin(phi)*Math.cos(theta));
      direction.set(0,0,-1).applyQuaternion(camera.quaternion);
      focus.copy(camera.position).addScaledVector(direction,camera.position.distanceTo(target));
      camera.position.lerp(position,weight);focus.lerp(target,weight);camera.lookAt(focus);
    },
    apply(screens){const {weight}=a03Visual(screens);if(!weight)return;
      renderer.toneMappingExposure+=(.84-renderer.toneMappingExposure)*weight;
      camera.fov+=(A03_TARGETS.reading.fov-camera.fov)*weight;camera.updateProjectionMatrix();
      sun.position.lerp(lightPosition,weight);sun.intensity+=(2.9-sun.intensity)*weight;
      fill.intensity+=(.36-fill.intensity)*weight;
      scene.fog.color.lerp(fog,weight);scene.fog.density+=(.009-scene.fog.density)*weight;
      floor.material.opacity+=(.11-floor.material.opacity)*weight;
      for(const material of entries){const key=material.userData.textureKey;
        const gray=material.color.r*.2126+material.color.g*.7152+material.color.b*.0722;
        neutral.setRGB(gray*.95,gray,gray*1.03);
        material.color.lerp(neutral,.18*weight).multiplyScalar(1-(key==='paving'?.28:key==='plaster'?.20:key==='roof'?.22:.17)*weight);
        material.roughness+=(Math.max(material.roughness,.92)-material.roughness)*weight;
      }
    },
  };
}
