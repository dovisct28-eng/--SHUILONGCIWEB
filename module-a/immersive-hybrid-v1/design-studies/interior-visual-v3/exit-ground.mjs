// The gallery decorates the existing soil material, keeping its geometry,
// shadow receiving, fog and edge coverage in the shared world.
const baseColorUrl=new URL('./assets/exit-ground/compacted-earth-basecolor.webp',import.meta.url);

export async function loadExitGroundImage(){
 try{
  const response=await fetch(baseColorUrl,{signal:AbortSignal.timeout(4000)});
  return response.ok?await createImageBitmap(await response.blob()):null;
 }catch{
  return null;
 }
}

export function installExitGround(environment,T,renderer,image){
 const soil=environment?.getObjectByName('SlopingSoil');
 if(!soil){image?.close();return;}
 // A small neutral texture keeps the shot stable if the asset cannot load.
 const texture=image?new T.Texture(image):new T.DataTexture(new Uint8Array([114,98,83,255]),1,1);
 texture.colorSpace=T.SRGBColorSpace;
 texture.flipY=false;
 texture.wrapS=texture.wrapT=T.MirroredRepeatWrapping;
 texture.minFilter=T.LinearMipmapLinearFilter;
 texture.magFilter=T.LinearFilter;
 texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 texture.generateMipmaps=true;
 texture.needsUpdate=true;

 const {material}=soil,compile=material.onBeforeCompile,programKey=material.customProgramCacheKey;
 const cacheKey=programKey.call(material);
 const weight={value:0},map={value:texture};
 material.onBeforeCompile=function(shader,activeRenderer){
  compile.call(this,shader,activeRenderer);
  shader.uniforms.galleryExitGround=weight;
  shader.uniforms.gallerySoilMap=map;
  shader.fragmentShader=`
uniform float galleryExitGround;
uniform sampler2D gallerySoilMap;
`+shader.fragmentShader.replace('#include <roughnessmap_fragment>',`
    vec2 ground = a01World.xz;
    float frontage = smoothstep(12.2, 13.2, ground.y)
      * (1. - smoothstep(6.0, 10.2, abs(ground.x)))
      * (1. - smoothstep(17.8, 22.5, ground.y));
    float soilMix = frontage * galleryExitGround;
    float soilHeight = 0.;
    // Orthographic world-space projection follows the slope without swimming.
    // The central facade spans one tile. Mirrored wrapping softens the joins at the sides.
    if (galleryExitGround > 0.) {
      vec2 soilUv = mat2(.94, .342, -.342, .94) * ground / 8.8 + vec2(.98, .04);
      vec3 soilColor = texture2D(gallerySoilMap, soilUv).rgb;
      soilHeight = dot(soilColor, vec3(.2126, .7152, .0722));
      float contact = (1. - smoothstep(13.55, 14.55, ground.y))
        * (1. - smoothstep(4.6, 6.3, abs(ground.x)));
      float foreground = smoothstep(14.35, 17.7, ground.y);
      soilColor = mix(vec3(soilHeight), soilColor, .60);
      soilColor *= .42 * (1. - .28 * contact) * (1. - .33 * foreground);
      diffuseColor.rgb = mix(diffuseColor.rgb, soilColor, soilMix);
    }
    #include <roughnessmap_fragment>
    roughnessFactor = mix(roughnessFactor, mix(.98, .88, smoothstep(.07, .25, soilHeight)), soilMix);
`).replace('#include <normal_fragment_maps>',`
    #include <normal_fragment_maps>
    if (galleryExitGround > 0.) {
      // Derive shallow surface relief from the same albedo sample.
      vec3 tangent = dFdx(-vViewPosition), bitangent = dFdy(-vViewPosition);
      vec3 r1 = cross(bitangent, normal), r2 = cross(normal, tangent);
      float det = dot(tangent, r1);
      vec3 gradient = dFdx(soilHeight) * r1 + dFdy(soilHeight) * r2;
      normal = normalize(max(abs(det), 1e-8) * normal - sign(det) * gradient * (.040 * soilMix));
    }
`).replace('#include <opaque_fragment>',`
    // Keep the original lighting and shadows dominant. Restrain bright slopes.
    outgoingLight = mix(outgoingLight, diffuseColor.rgb * .90, .30 * soilMix);
    #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=>cacheKey+'-gallery-textured-earth';
 material.needsUpdate=true;
 return {
  setWeight(amount){weight.value=amount;},
  dispose(){
   material.onBeforeCompile=compile;
   material.customProgramCacheKey=programKey;
   material.needsUpdate=true;
   texture.dispose();
   image?.close();
  },
 };
}
