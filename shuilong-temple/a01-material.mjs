// Reversible surface weathering. Original textures, UVs and geometry stay intact.
export function createA01Materials(T,entries,meshes=[]){
  const amount={value:0},reveal={value:1},hero={value:0},base=new Map();
  for(const m of new Set(entries)){
    const kind=m.userData.textureKey;if(!kind)continue;
    base.set(m,{normal:m.normalScale.clone(),mapped:Boolean(m.normalMap)});
    m.onBeforeCompile=s=>{
      s.uniforms.a01Surface=amount;s.uniforms.a01Reveal=reveal;s.uniforms.a01Hero=hero;
      s.vertexShader='varying vec3 a01SurfacePosition;varying vec3 a01WorldPosition;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\na01SurfacePosition=position;a01WorldPosition=(modelMatrix*vec4(position,1.)).xyz;');
      s.fragmentShader='varying vec3 a01SurfacePosition;varying vec3 a01WorldPosition;uniform float a01Surface;uniform float a01Reveal;uniform float a01Hero;\n'+s.fragmentShader;
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
      s.fragmentShader=s.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
        vec3 world=a01WorldPosition;
        float score=dot(world,vec3(-.018,.13,.028));
        float uneven=sin(world.x*1.7+world.z*.83)*sin(world.z*2.1+world.y*1.3)*.018;
        float illuminated=smoothstep(-.04,.07,score-(1.0-1.9*a01Reveal)+uneven);
        illuminated=mix(1.,illuminated,a01Hero);
        if(illuminated<.015)discard;
        diffuseColor.a*=illuminated;`);
      s.fragmentShader=s.fragmentShader.replace('#include <fog_fragment>',`#include <fog_fragment>
        float distanceAir=smoothstep(35.,75.,length(cameraPosition-a01WorldPosition));
        float lowAir=(1.-smoothstep(-.6,2.,a01WorldPosition.y))*.06;
        gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(.39,.43,.45),a01Hero*(distanceAir*.19+lowAir));`);
    };m.customProgramCacheKey=()=>`a01-surface-v3-${kind}`;
  }
  const shadowMaterials=[];
  for(const mesh of meshes){
    if(!mesh.material.userData.textureKey)continue;
    const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking});shadowMaterials.push(depth);
    depth.onBeforeCompile=s=>{
      s.uniforms.a01Reveal=reveal;s.uniforms.a01Hero=hero;
      s.vertexShader='varying vec3 sweepWorld;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nsweepWorld=(modelMatrix*vec4(position,1.)).xyz;');
      s.fragmentShader='varying vec3 sweepWorld;uniform float a01Reveal;uniform float a01Hero;\n'+s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>
        float score=dot(sweepWorld,vec3(-.018,.13,.028));
        float uneven=sin(sweepWorld.x*1.7+sweepWorld.z*.83)*sin(sweepWorld.z*2.1+sweepWorld.y*1.3)*.018;
        if(a01Hero>.001&&score-(1.0-1.9*a01Reveal)+uneven<.015)discard;`);
    };depth.customProgramCacheKey=()=> 'a01-sweep-shadow-v3';mesh.customDepthMaterial=depth;
  }
  return {apply(weight,solid=1,heroWeight=0){amount.value=weight;reveal.value=solid;hero.value=heroWeight;for(const [m,entry]of base){
    // The embedded normal image can finish after this controller is constructed.
    // Capture its authoritative GLB scale once, before applying any A01 multiplier.
    if(Boolean(m.normalMap)!==entry.mapped){entry.normal.copy(m.normalScale);entry.mapped=Boolean(m.normalMap);}
    m.normalScale.copy(entry.normal).multiplyScalar(1+weight*(m.userData.textureKey==='roof'?.55:.25));
  }},getState(){return {weight:amount.value,kinds:[...new Set([...base.keys()].map(m=>m.userData.textureKey))]};},dispose(){shadowMaterials.forEach(m=>m.dispose());}};
}
