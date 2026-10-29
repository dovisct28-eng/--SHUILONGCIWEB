import {FIRST_MURAL} from './corridor-path.mjs';
import {MURAL_SOURCE,projectedCorners,readingDistance} from './mural-anchor.mjs';
import {readingPhases} from './mural-transition-controller.mjs';

// L0 and the held L2 environment are the actual existing architecture. L1 and
// the digital image share geometry, texture, color pipeline AND depth buffer.
// No background photograph, CSS mask, second renderer or scene reconstruction.
export function createMuralCompositor({T,camera,renderer,invalidate,depthTexture}){
 let texture,geometry,original,digital,shade,loading,status='idle',error=null,progress=0,active=false,disposed=false,mode='hybrid';
 const scene=new T.Scene(),depthSize=new T.Vector2(),depthUniforms={architectureDepth:{value:null},depthSize:{value:depthSize}};
 let phaseSampler=readingPhases,discoveryOpacity=()=>1;
 const timings=[],virtual=camera.clone(),front=camera.clone(),startQ=new T.Quaternion(),vp=new T.Matrix4(),uniforms={readingVP:{value:vp},rectify:{value:0}};
 function planeMaterial(projected){const m=new T.MeshBasicMaterial({map:texture,side:T.FrontSide,toneMapped:false,fog:false,transparent:true,depthWrite:false,depthTest:false});
  m.onBeforeCompile=s=>{Object.assign(s.uniforms,depthUniforms);s.fragmentShader='uniform sampler2D architectureDepth;uniform vec2 depthSize;\n'+s.fragmentShader.replace('void main() {','void main() {\nif(gl_FragCoord.z>texture2D(architectureDepth,gl_FragCoord.xy/depthSize).r+0.000003)discard;');if(projected){Object.assign(s.uniforms,uniforms);s.vertexShader='uniform mat4 readingVP;uniform float rectify;\n'+s.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nif(rectify>0.){gl_Position=readingVP*modelMatrix*vec4(transformed,1.);\ngl_Position.z=mix(gl_Position.z,-.90*gl_Position.w,smoothstep(0.,.35,rectify));}');}};m.customProgramCacheKey=()=>projected?'mural-v23-reading':'mural-v23-original';return m;}
 function clear(){for(const mesh of [original,digital,shade]){mesh?.removeFromParent();mesh?.material.dispose();}geometry?.dispose();shade?.geometry.dispose();texture?.dispose();original=digital=shade=texture=geometry=null;}
 function update(time=2){if(!original)return;const ph=phaseSampler(progress),q=mode==='original'?0:ph.rectify,blend=mode==='original'?0:mode==='digital'?1:ph.handoff;
  const visible=time>1.59;original.visible=visible&&(!active||blend<1);original.material.opacity=Math.max(0,Math.min(1,discoveryOpacity(time)));digital.visible=visible&&active&&blend>0;digital.material.opacity=blend;
  // Project a rigid, unchanged plane through a virtual reading camera. This
  // changes perspective, not the bitmap's intrinsic proportions or UVs.
  virtual.copy(camera);startQ.copy(camera.quaternion);const d=readingDistance(camera.aspect,camera.fov);
  front.copy(camera);front.position.set(FIRST_MURAL.position[0]-d,FIRST_MURAL.position[1],FIRST_MURAL.position[2]);front.lookAt(...FIRST_MURAL.position);front.updateMatrixWorld();
  virtual.position.copy(camera.position).lerp(front.position,q);virtual.quaternion.copy(startQ).slerp(front.quaternion,q);virtual.updateMatrixWorld();virtual.updateProjectionMatrix();vp.multiplyMatrices(virtual.projectionMatrix,virtual.matrixWorldInverse);uniforms.rectify.value=q;
  shade.visible=active&&q>0;shade.material.uniforms.strength.value=q;
 }
 async function load(retry=false){if(loading)return loading;if(status==='ready')return true;if(disposed)return false;status='loading';error=null;const began=performance.now();
  loading=(async()=>{try{clear();if(!depthTexture())throw Error('建筑深度缓冲暂不可用');const start=performance.now();const img=new Image();img.src=MURAL_SOURCE.url;await img.decode();if(disposed)return false;if(img.naturalWidth!==2880||img.naturalHeight!==990)throw Error('壁画素材尺寸不符');timings.push({id:'image-load-decode',ms:performance.now()-start});
   texture=new T.Texture(img);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());texture.needsUpdate=true;
   geometry=new T.PlaneGeometry(FIRST_MURAL.width,FIRST_MURAL.height);
   original=new T.Mesh(geometry,planeMaterial(false));digital=new T.Mesh(geometry,planeMaterial(true));
   for(const [mesh,name,order]of [[original,'V23-mural-original',2.5],[digital,'V23-mural-digital',4]]){mesh.name=name;mesh.position.fromArray(FIRST_MURAL.position);mesh.rotation.y=FIRST_MURAL.rotationY;mesh.renderOrder=order;mesh.frustumCulled=false;scene.add(mesh);mesh.updateMatrixWorld();}
   shade=new T.Mesh(new T.PlaneGeometry(2,2),new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms:{strength:{value:0}},vertexShader:'varying vec2 uv2;void main(){uv2=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'varying vec2 uv2;uniform float strength;void main(){float edge=clamp(length((uv2-.5)*vec2(1.2,1.)),0.,1.);gl_FragColor=vec4(.024,.033,.040,strength*(.76+edge*.13));}'}));shade.name='V23-held-architecture-depth-field';shade.renderOrder=3;shade.frustumCulled=false;scene.add(shade);
   const warm=performance.now(),target=new T.WebGLRenderTarget(64,64,{type:T.HalfFloatType}),old=renderer.getRenderTarget();
   try{active=true;progress=.1;update();original.visible=digital.visible=shade.visible=true;await renderer.compileAsync(scene,camera);renderer.initTexture(texture);renderer.setRenderTarget(target);depthUniforms.architectureDepth.value=depthTexture();renderer.render(scene,camera);}finally{renderer.setRenderTarget(old);target.dispose();active=false;progress=0;update(0);}
   timings.push({id:'shader-upload-first-draw',ms:performance.now()-warm},{id:'total-prepare',ms:performance.now()-began});status='ready';invalidate();return true;
  }catch(e){clear();status='failed';error=e.message;invalidate();return false;}finally{loading=null;}})();return loading;
 }
 return {load,update,render(){if(!original||!original.visible&&!digital.visible)return;const depth=depthTexture();if(!depth||renderer.getContext().isContextLost()){if(active)throw Error('建筑深度或 WebGL 暂不可用');return;}depthUniforms.architectureDepth.value=depth;renderer.getDrawingBufferSize(depthSize);const auto=renderer.autoClear;try{renderer.autoClear=false;renderer.render(scene,camera);}finally{renderer.autoClear=auto;}},get status(){return status;},get error(){return error;},setProgress(p,notify=true){active=true;progress=Math.max(0,Math.min(1,p));if(notify)invalidate();},reset(){active=false;progress=0;mode='hybrid';invalidate();},setMode(v){if(!['original','hybrid','digital'].includes(v))throw Error('Unknown mural mode');mode=v;invalidate();},
  setReadingPhases(sampler=readingPhases){phaseSampler=sampler;},
  setDiscoveryOpacity(sampler=()=>1){discoveryOpacity=sampler;invalidate();},
  state(){return {status,error,active,progress,mode,originalOpacity:original?.material.opacity??null,phases:phaseSampler(progress),anchor:FIRST_MURAL,source:MURAL_SOURCE,corners:projectedCorners(T,camera),readingCorners:projectedCorners(T,virtual),camera:{position:virtual.position.toArray(),quaternion:virtual.quaternion.toArray(),projectionMatrix:virtual.projectionMatrix.toArray()},layers:['L0 original depth-tested architecture','L1 original anchored mural','L2 held original architecture with procedural depth field','L3 reading UI in parent'],timings:[...timings],imageBytesEstimate:2880*990*4*4/3,sharedTexture:true,sharedGeometry:true,colorPipeline:'sRGB original texture, post-exempt overlay with actual architecture depth texture'};},
  dispose(){disposed=true;clear();}
 };
}
