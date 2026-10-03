// Two passes: multisampled HDR scene with depth, then lightweight depth AO / grade.
// No second scene traversal, normal target, composer dependency, bloom or RAF.
export function createA01Post(T,renderer,scene,camera){
  const target=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,depthBuffer:true});
  target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);target.samples=2;
  const screen=new T.Scene(),quadCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);
  const uniforms={colorBuffer:{value:target.texture},depthBuffer:{value:target.depthTexture},texel:{value:new T.Vector2(1,1)},inverseProjection:{value:camera.projectionMatrixInverse},weight:{value:0}};
  const material=new T.ShaderMaterial({depthTest:false,depthWrite:false,transparent:true,uniforms,
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`varying vec2 vUv;uniform sampler2D colorBuffer;uniform sampler2D depthBuffer;uniform vec2 texel;uniform mat4 inverseProjection;uniform float weight;
      vec3 viewPosition(vec2 uv){float depth=texture2D(depthBuffer,uv).r;vec4 p=inverseProjection*vec4(uv*2.-1.,depth*2.-1.,1.);return p.xyz/p.w;}
      void main(){vec4 c=texture2D(colorBuffer,vUv);if(c.a<.0001){gl_FragColor=vec4(0.);return;}
        vec3 p=viewPosition(vUv);vec2 slope=vec2(dFdx(p.z),dFdy(p.z));float ao=0.;
        for(int i=0;i<12;i++){float a=float(i)*2.39996;float radius=3.+float(i)*1.5;vec2 delta=vec2(cos(a),sin(a))*radius;
          vec2 uv=vUv+delta*texel;vec3 q=viewPosition(uv);float z=q.z-(p.z+dot(slope,delta));
          ao+=smoothstep(.025,.18,z)*(1.-smoothstep(.32,1.1,z))*texture2D(colorBuffer,uv).a;}
        c.rgb*=1.-weight*min(.30,ao/12.*.85);
        // Restrained split tone in linear light, no LUT or glowing masonry.
        float l=dot(c.rgb,vec3(.2126,.7152,.0722));float dark=1.-smoothstep(.04,.28,l);
        c.rgb=mix(c.rgb,c.rgb*vec3(.92,1.015,1.07),dark*weight*.5);
        c.rgb=mix(c.rgb,c.rgb*vec3(1.035,1.01,.965),smoothstep(.45,1.8,l)*weight);
        // Alpha stays independent: matte backdrop and title never pass through grade.
        vec2 q=vUv-.5;c.rgb*=1.-weight*.10*dot(q,q);
        gl_FragColor=c;
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`});
  const geometry=new T.PlaneGeometry(2,2),quad=new T.Mesh(geometry,material);quad.frustumCulled=false;screen.add(quad);
  let enabled=false,error=null,last={calls:0,triangles:0,lines:0},size=[1,1],rendering=false;
  // Three logs shader errors by default; make a failed post program observable
  // inside our existing render catch, so it cannot hide a healthy scene.
  const shaderFailure=(gl,program)=>{throw Error(`A01 post shader compilation failed: ${gl.getProgramInfoLog(program)}`);};
  return {
    apply(weight,line){uniforms.weight.value=weight*(line?.solid??1);enabled=weight>.001&&(line?.solid??1)>.02;},
    resize(width,height){const dpr=Math.min(renderer.getPixelRatio(),1.5);size=[Math.max(1,Math.round(width*dpr)),Math.max(1,Math.round(height*dpr))];target.setSize(...size);uniforms.texel.value.set(1/size[0],1/size[1]);},
    render(){if(!enabled||error){renderer.render(scene,camera);last={...renderer.info.render};return;}
      const autoReset=renderer.info.autoReset;try{rendering=true;renderer.info.autoReset=true;
        // Match the original renderer's scene counters (shadow traversal excluded).
        renderer.setRenderTarget(target);renderer.clear();renderer.render(scene,camera);const sceneStats={...renderer.info.render};
        renderer.setRenderTarget(null);renderer.clear();const previousShaderError=renderer.debug.onShaderError;
        try{renderer.debug.onShaderError=shaderFailure;renderer.render(screen,quadCamera);}finally{renderer.debug.onShaderError=previousShaderError;}
        last={...renderer.info.render,calls:sceneStats.calls+renderer.info.render.calls,triangles:sceneStats.triangles+renderer.info.render.triangles,lines:sceneStats.lines+renderer.info.render.lines};
        Object.assign(renderer.info.render,last);
      }catch(e){error=String(e);renderer.setRenderTarget(null);renderer.render(scene,camera);last={...renderer.info.render};}finally{renderer.info.autoReset=autoReset;rendering=false;}},
    getState(){return {enabled:enabled&&!error,error,passes:enabled&&!error?2:1,size,aoSamples:12,stats:last,colorDepthBytes:size[0]*size[1]*12,multisampleBytes:size[0]*size[1]*12*target.samples,targetBytes:size[0]*size[1]*12*(1+target.samples)};},
    dispose(){if(rendering)return;geometry.dispose();material.dispose();target.depthTexture.dispose();target.dispose();},
  };
}
