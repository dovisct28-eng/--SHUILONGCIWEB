import { a03Visual, A03_TARGETS } from './composition.mjs';
// Lighting/materials come from the A02 rig, including its two existing local lights.
export function createA03Light(T,{camera}) {
  const position=new T.Vector3(),focus=new T.Vector3(),direction=new T.Vector3(),target=new T.Vector3(0,-1.15,-1.75);
  return {
    camera(screens){const {weight}=a03Visual(screens);if(!weight)return;
      const radius=A03_TARGETS.reading.radius*Math.max(1,1.78/camera.aspect),phi=.93,theta=3.96;
      position.set(radius*Math.sin(phi)*Math.sin(theta),target.y+radius*Math.cos(phi),target.z+radius*Math.sin(phi)*Math.cos(theta));
      direction.set(0,0,-1).applyQuaternion(camera.quaternion);
      focus.copy(camera.position).addScaledVector(direction,camera.position.distanceTo(target));
      camera.position.lerp(position,weight);focus.lerp(target,weight);camera.lookAt(focus);
    },
    apply(screens){const {weight}=a03Visual(screens);if(!weight)return;
      camera.fov+=(A03_TARGETS.reading.fov-camera.fov)*weight;camera.updateProjectionMatrix();
    },
  };
}
