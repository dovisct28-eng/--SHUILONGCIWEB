// Reversible surface weathering. Original textures, UVs and geometry stay intact.
export function createA01Materials(T,entries){
  const amount={value:0},base=new Map();
  for(const m of new Set(entries)){
    const kind=m.userData.textureKey;if(!kind)continue;
    base.set(m,{normal:m.normalScale.clone(),mapped:Boolean(m.normalMap)});
    m.onBeforeCompile=s=>{
      s.uniforms.a01Surface=amount;
      s.vertexShader='varying vec3 a01SurfacePosition;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\na01SurfacePosition=position;');
      s.fragmentShader='varying vec3 a01SurfacePosition;uniform float a01Surface;\n'+s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec3 p=a01SurfacePosition;
        float weather=.5+.5*sin(p.x*.53+p.z*.26)*sin(p.z*.71+p.y*.42);
        float fine=.5+.5*sin(p.x*11.13+p.z*19.4+p.y*4.3);
        ${kind==='roof'?`float roofValue=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
        diffuseColor.rgb=mix(diffuseColor.rgb,roofValue*vec3(.78,.90,1.12),a01Surface);`:''}
        diffuseColor.rgb*=mix(1.,.83+.16*weather+.055*fine,a01Surface);
        ${['brick','plaster','wood','stone'].includes(kind)?`float foot=1.-smoothstep(.1,1.3,p.y);diffuseColor.rgb*=1.-foot*a01Surface*.28;`:''}`);
      s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
        roughnessFactor=mix(roughnessFactor,clamp(roughnessFactor+(weather-.5)*${kind==='roof'?'.22':'.08'},.45,1.),a01Surface);`);
    };m.customProgramCacheKey=()=>`a01-surface-v2-${kind}`;
  }
  return {apply(weight){amount.value=weight;for(const [m,entry]of base){
    // The embedded normal image can finish after this controller is constructed.
    // Capture its authoritative GLB scale once, before applying any A01 multiplier.
    if(Boolean(m.normalMap)!==entry.mapped){entry.normal.copy(m.normalScale);entry.mapped=Boolean(m.normalMap);}
    m.normalScale.copy(entry.normal).multiplyScalar(1+weight*(m.userData.textureKey==='roof'?.55:.25));
  }},getState(){return {weight:amount.value,kinds:[...new Set([...base.keys()].map(m=>m.userData.textureKey))]};}};
}
