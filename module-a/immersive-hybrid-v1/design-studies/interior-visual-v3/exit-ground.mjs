// Adjust only the ground of the gallery's live exterior shot. The shared
// terrain still supplies geometry, depth, shadows and its original edge fade.
export function installExitGround(environment,T){
 const soil=environment?.getObjectByName('SlopingSoil');
 if(!soil)return;
 const {material}=soil,compile=material.onBeforeCompile,cacheKey=material.customProgramCacheKey();
 const weight={value:0};
 const earth={value:new T.Color('#51483e')},shade={value:new T.Color('#39342e')};
 material.onBeforeCompile=function(shader,renderer){
  compile.call(this,shader,renderer);
  shader.uniforms.galleryExitGround=weight;
  shader.uniforms.galleryEarth=earth;
  shader.uniforms.galleryEarthShade=shade;
  shader.fragmentShader=`
uniform float galleryExitGround;
uniform vec3 galleryEarth;
uniform vec3 galleryEarthShade;
`+shader.fragmentShader.replace('#include <opaque_fragment>',`
    if (galleryExitGround > 0.) {
      vec2 ground = a01World.xz;
      float frontage = smoothstep(12.2, 13.2, ground.y)
        * (1. - smoothstep(5.6, 9.5, abs(ground.x)))
        * (1. - smoothstep(17.8, 22.5, ground.y));
      float contact = 1. - smoothstep(13.5, 14.6, ground.y);
      float nearField = smoothstep(14.4, 17.8, ground.y);
      float variation = .89 + .16 * noise(ground * .87) + .06 * noise(ground * 5.1);
      vec3 earth = mix(galleryEarth, galleryEarthShade, .34 * contact + .60 * nearField);
      // Retain the scene's shadow detail while compressing slope highlights.
      vec3 luma = vec3(.2126, .7152, .0722);
      float light = dot(outgoingLight, luma) / max(.01, dot(diffuseColor.rgb, luma));
      float softLight = mix(.92, clamp(light, .55, 1.45), .34);
      outgoingLight = mix(outgoingLight, earth * variation * softLight, frontage * galleryExitGround);
    }
    #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=>cacheKey+'-gallery-exit-ground';
 material.needsUpdate=true;
 return amount=>{weight.value=amount;};
}
