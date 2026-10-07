// Digital exhibition treatment, never a reconstruction of actual conservation state.
// No extra texture, renderer, image request or permanent animation loop.
export const SURFACE_PRESETS=Object.freeze({
 off:Object.freeze({grain:0,erosion:0,cracks:0,edge:0,blend:0}),
 subtle:Object.freeze({grain:.018,erosion:.025,cracks:0,edge:.018,blend:.006}),
 standard:Object.freeze({grain:.032,erosion:.045,cracks:0,edge:.028,blend:.01}),
 strong:Object.freeze({grain:.052,erosion:.07,cracks:.006,edge:.038,blend:.015})
});
const limits={grain:.06,erosion:.08,cracks:.01,edge:.04,blend:.02};
export function surfaceConfig(value={}) {
 const source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 const preset=Object.hasOwn(SURFACE_PRESETS,source.preset)?source.preset:'standard';
 const result={...source,preset};
 for(const [key,max] of Object.entries(limits))result[key]=preset==='off'?0:typeof source[key]==='number'&&Number.isFinite(source[key])?Math.max(0,Math.min(max,source[key])):SURFACE_PRESETS[preset][key];
 return result;
}
export const exhibitionTiming=Object.freeze({first:1.05,cached:.62,move:.65,exit:.12});
export function hashNoise(x,y) {const n=Math.sin(x*127.1+y*311.7)*43758.5453123;return n-Math.floor(n);}
export function valueNoise(x,y) {
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
 return (hashNoise(ix,iy)*(1-sx)+hashNoise(ix+1,iy)*sx)*(1-sy)+(hashNoise(ix,iy+1)*(1-sx)+hashNoise(ix+1,iy+1)*sx)*sy;
}
// Shared CPU noise field (<1.2 MiB); compute hashes once, not once per panel
// or character. No WebGL noise texture. Panels are capped at 380px by HF-02.
let panelNoise;
function sharedPanelNoise() {
 if(panelNoise)return panelNoise;
 const edge=380,grain=new Float32Array(edge*edge),wear=new Float32Array(edge*edge);
 const grid=Array.from({length:29},(_,y)=>Array.from({length:29},(_,x)=>hashNoise(x,y)));
 for(let y=0;y<edge;y++)for(let x=0;x<edge;x++){
  const i=y*edge+x,ix=Math.floor(x/14),iy=Math.floor(y/14),fx=x/14-ix,fy=y/14-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  grain[i]=hashNoise(x,y)-.5;
  const n=(grid[iy][ix]*(1-sx)+grid[iy][ix+1]*sx)*(1-sy)+(grid[iy+1][ix]*(1-sx)+grid[iy+1][ix+1]*sx)*sy;
  wear[i]=Math.max(0,(n-.64)/.36);
 }
 return panelNoise={edge,grain,wear};
}
// Small orbit canvases only; keep alpha exactly and never accumulate treatment.
export function treatPanel(raw,width,height,value) {
 const c=surfaceConfig(value),out=new Uint8ClampedArray(raw);
 if(c.preset==='off')return out;
 const shared=sharedPanelNoise();
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;if(!raw[i+3])continue;
  const j=y*shared.edge+x;
  const grain=shared.grain[j]*c.grain*.55;
  const wear=shared.wear[j]*c.erosion*.5;
  const factor=1+grain-wear;
  for(let k=0;k<3;k++)out[i+k]=raw[i+k]*factor;
 }
 return out;
}
const declarations=`
 uniform vec2 uSurfaceSize;
 uniform vec2 uSurfaceTexel;
 uniform vec4 uSurface;
 uniform float uEnvironment;
 uniform float uPigment;
 uniform float uEdgePulse;
 float muralHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 float muralNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(muralHash(i),muralHash(i+vec2(1,0)),f.x),mix(muralHash(i+vec2(0,1)),muralHash(i+vec2(1,1)),f.x),f.y);}
`;
const treatment=`
 #ifdef USE_MAP
 vec2 muralP=vMapUv*uSurfaceSize;
 if(uSurface.x+uSurface.y+uSurface.z+uSurface.w+uEnvironment+uEdgePulse>0.0){
  float neighbor=min(min(texture2D(map,vMapUv+vec2(uSurfaceTexel.x,0)).a,texture2D(map,vMapUv-vec2(uSurfaceTexel.x,0)).a),min(texture2D(map,vMapUv+vec2(0,uSurfaceTexel.y)).a,texture2D(map,vMapUv-vec2(0,uSurfaceTexel.y)).a));
  float interior=smoothstep(0.2,0.9,neighbor);
  float grain=(muralHash(floor(muralP))-.5)*uSurface.x;
  float field=muralNoise(muralP/18.0);
  float wear=smoothstep(.64,.94,field)*uSurface.y;
  float crack=(1.0-smoothstep(.0,.035,abs(sin(muralP.y*.11+field*8.0))))*smoothstep(.78,.94,muralNoise(muralP/31.0))*uSurface.z;
  diffuseColor.rgb*=1.0+(grain-wear-crack-uEnvironment*.25)*interior;
  // A restrained neutral light follows actual alpha, with no rectangular glow.
  diffuseColor.rgb+=vec3(.72,.69,.62)*(1.0-neighbor)*diffuseColor.a*(uSurface.w+uEdgePulse);
 }
 if(uPigment<.9999){
  float field=muralNoise(muralP/24.0);
  float front=smoothstep(field*.35+vMapUv.y*.42-.16,field*.35+vMapUv.y*.42+.18,uPigment);
  float shade=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
  diffuseColor.rgb=mix(vec3(shade*.34),diffuseColor.rgb,front);
  diffuseColor.a*=mix(.18,1.0,front);
 }
 #endif
`;
export function attachSurface(material,THREE,image) {
 const uniforms={uSurfaceSize:{value:new THREE.Vector2(600,600)},uSurfaceTexel:{value:new THREE.Vector2(1/image.width,1/image.height)},uSurface:{value:new THREE.Vector4()},uEnvironment:{value:0},uPigment:{value:1},uEdgePulse:{value:0}};
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.fragmentShader=declarations+shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>'+treatment);
 };
 material.customProgramCacheKey=()=> 'b03-mural-surface-v1';
 material.userData.surface={uniforms,config:surfaceConfig()};
 return material.userData.surface;
}
export function applySurface(surface,value,degraded=false) {
 if(!surface)return;
 const c=surfaceConfig(value);surface.config=c;
 const u=surface.uniforms;
 u.uSurface.value.set(c.grain,c.erosion,degraded?0:c.cracks,degraded?0:c.edge);u.uEnvironment.value=degraded?0:c.blend;
}
// Slow frame windows degrade decoration only. No camera or figure resolution changes.
export class DecorationBudget {
 constructor(){this.reset();}
 reset(){this.last=0;this.total=0;this.samples=0;this.slow=0;this.degraded=false;}
 sample(now,active=true){
  if(!active){this.last=this.total=this.samples=this.slow=0;return false;}
  if(this.last){const dt=now-this.last;if(dt<250){this.total+=dt;this.samples++;}}
  this.last=now;
  if(this.samples<120)return false;
  this.slow=this.total/this.samples>28?this.slow+1:0;this.samples=this.total=0;
  if(this.slow>=2&&!this.degraded){this.degraded=true;return true;}return false;
 }
}
