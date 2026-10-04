import { a03Visual, A03_TARGETS } from './composition.mjs';
const easeExit=n=>{const t=Math.max(0,Math.min(1,(n-3)/.35));return t*t*(3-2*t);};
// Lighting/materials come from the A02 rig, including its two existing local lights.
export function createA03Light(T,{camera,root}) {
  const position=new T.Vector3(),focus=new T.Vector3(),direction=new T.Vector3(),target=new T.Vector3(0,-1.15,-1.75);
  const wallReveal={value:0};
  const patched=new Set();
  // Existing west enclosure/main-hall skins occlude mural-05 in this view.
  // A soft material reveal preserves their geometry and the other wall faces.
  root?.children.filter(g=>['02_Enclosure','03_MainHall'].includes(g.name)).forEach(g=>g.traverse(mesh=>{
    const m=mesh.material;if(!mesh.isMesh||!['brick','plaster'].includes(m.userData.textureKey))return;
    mesh.userData.a03WallMaterial=m;mesh.userData.a03WallShadow=mesh.castShadow;
    if(patched.has(m))return;patched.add(m);
    const compile=m.onBeforeCompile,cache=m.customProgramCacheKey.bind(m);
    m.onBeforeCompile=shader=>{
      compile.call(m,shader);shader.uniforms.a03WallReveal=wallReveal;
      shader.vertexShader='varying vec3 a03WallPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\na03WallPosition=(modelMatrix*vec4(transformed,1.)).xyz;');
      shader.fragmentShader='varying vec3 a03WallPosition;uniform float a03WallReveal;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float nearWall=(1.-smoothstep(-4.4,-4.2,a03WallPosition.x))*smoothstep(-15.5,-14.8,a03WallPosition.z)*(1.-smoothstep(-8.7,-7.8,a03WallPosition.z));
        diffuseColor.a*=1.-.86*a03WallReveal*nearWall;
        #include <opaque_fragment>`);
    };
    m.customProgramCacheKey=()=>cache()+'-a03-west-reveal-v1';m.needsUpdate=true;
  }));
  return {
    walls(screens){const local=screens-10.2;wallReveal.value=a03Visual(screens).cutaway*(1-easeExit(local));
      const soft=wallReveal.value>.001;
      root?.traverse(mesh=>{const m=mesh.userData.a03WallMaterial;if(!m)return;if(m.transparent!==soft){m.transparent=soft;m.needsUpdate=true;}m.depthWrite=!soft;mesh.castShadow=soft?false:mesh.userData.a03WallShadow;});
    },
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
