// Art-directed narrative environment. Imaginary karst setting, not site survey.
// Near terrain, vegetation, rocks and haze share the architecture's camera/light.
const unit=n=>Math.max(0,Math.min(1,n)),ease=n=>{const t=unit(n);return t*t*(3-2*t);};
export const ENVIRONMENT_EXIT_THRESHOLD=.04;
export function environmentVisible(amount){return amount>ENVIRONMENT_EXIT_THRESHOLD;}
export function a01TerrainHeight(x,z){
  // The berm reaches the outside of the plinth, beneath the unchanged enclosure.
  const outside=Math.hypot(Math.max(0,Math.abs(x)-5.15),Math.max(0,Math.abs(z+1.75)-13.9));
  const berm=(.94+.12*Math.sin(z*.52+x*.3))*ease(outside/.6)*(1-ease((outside-1.1)/2.8));
  return -.615+berm-.10*outside**1.55+ease(outside/7)*(.42*Math.sin(x*.37+z*.13)+.31*Math.cos(z*.4));
}
export function createA01Environment(T,scene){
  const group=new T.Group();group.name='A01NarrativeEnvironment';scene.add(group);
  const resources=[],materials=[],resolution={value:new T.Vector2(1,1)},visibility={value:0},room={value:0},poster={value:0};
  const geometry=g=>{resources.push(g);return g;};
  const noise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}`;
  const mat=(color,terrain=false)=>{
    const m=new T.MeshStandardMaterial({color,roughness:1,transparent:false,depthWrite:true});materials.push(m);
    m.onBeforeCompile=s=>{
      s.uniforms.a01EnvironmentVisibility=visibility;s.uniforms.a01EnvironmentResolution=resolution;s.uniforms.a02Room=room;s.uniforms.a03Poster=poster;
      s.vertexShader='varying vec3 a01World;\n'+s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
        vec4 a01P=vec4(transformed,1.);\n#ifdef USE_INSTANCING\na01P=instanceMatrix*a01P;\n#endif\na01World=(modelMatrix*a01P).xyz;`);
      s.fragmentShader='varying vec3 a01World;uniform float a01EnvironmentVisibility;uniform vec2 a01EnvironmentResolution;uniform float a02Room;uniform float a03Poster;\n'+noise+'\n'+s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float grain=noise(a01World.xz*5.3)*.12+noise(a01World.xz*.33)*.19;
        diffuseColor.rgb*=.79+grain;
        // Only A02 compresses the surrounding site into a cool, quiet dark room.
        diffuseColor.rgb*=mix(1.,${terrain?'.34':'.36'},a02Room);
        ${terrain?'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722)))*vec3(.82,.94,1.06),a02Room*.65);':''}
        ${terrain?'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.12,.16,.14),noise(a01World.xz*.19)*.32*(1.-a02Room));float soilDetail=.66+noise(a01World.xz*2.1)*.4+noise(a01World.xz*13.)*.16;diffuseColor.rgb*=mix(1.,soilDetail,a02Room);':''}`);
      s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`vec2 edge=gl_FragCoord.xy/a01EnvironmentResolution;
        diffuseColor.a*=a01EnvironmentVisibility*smoothstep(0.,.15,edge.x)*smoothstep(0.,.15,1.-edge.x)*smoothstep(0.,.15,edge.y)*smoothstep(0.,.15,1.-edge.y);
        ${terrain?'float bank=length(max(abs(a01World.xz+vec2(0.,1.75))-vec2(6.1,15.),0.));diffuseColor.a*=1.-smoothstep(3.,19.,bank);':''}
        // Discard stops both color and depth; surviving fragments stay opaque.
        float distanceFromPlinth=length(max(abs(a01World.xz+vec2(0.,1.75))-vec2(6.1,15.),0.));
        float roomBoundary=1.-smoothstep(4.,22.,distanceFromPlinth);
        float coverage=diffuseColor.a*mix(1.,roomBoundary,a02Room);
        ${terrain?'':'coverage*=mix(1.,.30,a03Poster*smoothstep(.59,.80,edge.x)*(1.-smoothstep(.45,.67,edge.y)));'}
        float threshold=hash(floor(a01World.xz*73.+a01World.y*19.));
        ${terrain?'if(a02Room>.001){if(coverage<.002)discard;diffuseColor.a=coverage;}else{if(coverage<=threshold)discard;diffuseColor.a=1.;}':'if(coverage<=threshold*(1.-a03Poster))discard;diffuseColor.a=mix(1.,coverage,a03Poster);'}
        #include <opaque_fragment>`);
    };m.customProgramCacheKey=()=>`a01-landscape-dither-${terrain}`;return m;
  };
  // Plateau begins at the existing plinth bottom, then falls into wooded slopes.
  const land=geometry(new T.PlaneGeometry(100,100,144,144));land.rotateX(-Math.PI/2);
  const p=land.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,a01TerrainHeight(p.getX(i),p.getZ(i)));land.computeVertexNormals();
  const soil=new T.Mesh(land,mat(0x343f3d,true));soil.receiveShadow=true;soil.name='SlopingSoil';group.add(soil);
  let seed=20261003;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // Asymmetric groves with clear space around the main roof. No tree cards.
  const trees=[];for(let i=0;i<210;i++){
    const scrub=i>=146,side=i<92||i%3?-1:1,x=side*(scrub?6.25+random()*2.2:9+random()*17),z=scrub?-15+random()*28:-27+random()*62;
    if(z<-7&&z>-19&&Math.abs(x)<10.8)continue;
    trees.push([x,z,scrub?.38+random()*1.1:1.2+random()*3.0,random()*6.28]);
  }
  // Near camera silhouettes and small wall-foot clusters share the same instancing.
  trees.push([-17,-8,8.5,.3],[-18,-3,9,1.5],[-14,-13,6,.8]);
  for(const [x,z,h]of [[-6.6,-8,1.5],[-6.8,1,2.4],[-6.3,6.5,2.7],[-6.8,-17.2,3.8],[-3.2,-17.6,1.8],[-7.1,-13.4,1.5]])trees.push([x,z,h,random()*6.28]);
  // A branch-leaf brush, instanced through a 3D canopy, rather than a tree billboard.
  const brush=document.createElement('canvas');brush.width=brush.height=96;const ctx=brush.getContext('2d');
  ctx.fillStyle='white';for(let i=0;i<190;i++){
    const angle=random()*6.28,r=Math.sqrt(random())*40,x=48+Math.cos(angle)*r,y=48+Math.sin(angle)*r*.8;
    ctx.beginPath();ctx.ellipse(x,y,1+random()*3,1+random()*1.7,angle,0,6.28);ctx.fill();
  }
  const leafBrush=new T.CanvasTexture(brush);resources.push(leafBrush);
  const crownShape=geometry(new T.PlaneGeometry(1,1)),trunkShape=geometry(new T.CylinderGeometry(.035,.07,1,5));
  const leaves=mat(0x344b4b),bark=mat(0x424345),dummy=new T.Object3D();
  leaves.map=leafBrush;leaves.alphaTest=.25;leaves.side=T.DoubleSide;
  const canopies=new T.InstancedMesh(crownShape,leaves,trees.length*72),branches=new T.InstancedMesh(trunkShape,bark,trees.length*4);
  trees.forEach(([x,z,h,angle],i)=>{
    const base=a01TerrainHeight(x,z);
    for(let j=0;j<4;j++){
      const turn=angle+j*2.1;
      dummy.position.set(x+Math.cos(turn)*h*.06,base+h*(j?.50:.25),z+Math.sin(turn)*h*.06);
      dummy.rotation.set(j?.4:0,turn,j?.48:0);dummy.scale.set(j?.65:1,h*(j?.32:.50),j?.65:1);dummy.updateMatrix();branches.setMatrixAt(i*4+j,dummy.matrix);
    }
    for(let j=0;j<72;j++){
      const angle=j*2.4,r=h*.34*Math.sqrt((j+.5)/72),top=1-(r/(h*.45))**2;
      dummy.position.set(x+Math.cos(angle)*r,base+h*(.43+.37*top+.13*random()),z+Math.sin(angle)*r);
      dummy.rotation.set(random()*.8-.4,random()*6.28,random()*.7-.35);dummy.scale.set(h*(.24+random()*.15),h*(.21+random()*.15),1);dummy.updateMatrix();canopies.setMatrixAt(i*72+j,dummy.matrix);
      canopies.setColorAt(i*72+j,new T.Color().setRGB(.62+random()*.4,.71+random()*.3,.72+random()*.28));
    }
  });
  canopies.castShadow=true;canopies.receiveShadow=true;branches.castShadow=true;branches.receiveShadow=true;canopies.name='CanopyGroves';branches.name='BranchGroves';group.add(canopies,branches);
  const rocks=new T.InstancedMesh(geometry(new T.IcosahedronGeometry(1,0)),mat(0x404951),32);
  for(let i=0;i<32;i++){const x=(random()<.6?-1:1)*(6.7+random()*9),z=-23+random()*49,s=.15+random()*.6;dummy.position.set(x,a01TerrainHeight(x,z)+s*.15,z);dummy.scale.set(s,s*.4,s*.7);dummy.rotation.set(random(),random(),random());dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}rocks.castShadow=true;rocks.receiveShadow=true;rocks.name='SoilRocks';group.add(rocks);
  // Fade shadows with the same world-space pattern as the visible geometry.
  for(const mesh of [canopies,branches,rocks]){
    const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:mesh.material.map,alphaTest:mesh.material.alphaTest,side:mesh.material.side});materials.push(depth);
    depth.onBeforeCompile=s=>{
      s.uniforms.a01EnvironmentVisibility=visibility;s.uniforms.a02Room=room;
      s.vertexShader='varying vec3 fadeWorld;\n'+s.vertexShader.replace('#include <project_vertex>',`vec4 fadeP=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nfadeP=instanceMatrix*fadeP;\n#endif\nfadeWorld=(modelMatrix*fadeP).xyz;\n#include <project_vertex>`);
      s.fragmentShader='varying vec3 fadeWorld;uniform float a01EnvironmentVisibility;uniform float a02Room;\n'+noise+'\n'+s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <alphatest_fragment>',`#include <alphatest_fragment>\nfloat bank=length(max(abs(fadeWorld.xz+vec2(0.,1.75))-vec2(6.1,15.),0.));float coverage=a01EnvironmentVisibility*mix(1.,1.-smoothstep(4.,22.,bank),a02Room);if(coverage<=hash(floor(fadeWorld.xz*73.+fadeWorld.y*19.)))discard;`);
    };depth.customProgramCacheKey=()=> 'a01-environment-shadow-dither';mesh.customDepthMaterial=depth;
  }
  // Soft, static world-space mist. Scroll is the only clock; no drifting timer.
  const mist=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{amount:visibility,room:room,color:{value:new T.Color(0x879391)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float amount;uniform float room;uniform vec3 color;${noise}void main(){vec2 q=vUv*2.-1.;float edge=exp(-4.*dot(q,q));float cloud=noise(vUv*7.)*.55+noise(vUv*17.)*.25;gl_FragColor=vec4(color,amount*edge*cloud*mix(.9,.22,room));}`});materials.push(mist);
  const cloudGeometry=geometry(new T.PlaneGeometry(1,1));
  for(const [x,z,y,w,h] of [[-3,-17,.75,18,8],[-6.8,-7,.2,8,13],[-6.8,7,.3,8,16],[8,10,.5,20,8],[-8,22,1,33,13],[0,35,3,58,17]]){
    const cloud=new T.Mesh(cloudGeometry,mist);cloud.position.set(x,y,z);cloud.scale.set(w,h,1);cloud.rotation.x=-Math.PI*.4;cloud.name='GroundHaze';group.add(cloud);
  }
  let state={weight:0,establish:0,trees:trees.length};
  return {
    apply(weight,progress,reduced=false,roomWeight=0,posterWeight=0){const establish=ease((progress-.20)/.48);room.value=unit(roomWeight);poster.value=unit(posterWeight);visibility.value=unit(weight)*establish;group.visible=environmentVisible(visibility.value);state={weight,establish,visibility:visibility.value,roomWeight:room.value,posterWeight:poster.value,trees:trees.length};
      for(const material of materials){if(!material.isMeshStandardMaterial||material===soil.material)continue;const soft=poster.value>.001;if(material.transparent!==soft){material.transparent=soft;material.needsUpdate=true;}}
      const softGround=room.value>.001;if(soil.material.transparent!==softGround){soil.material.transparent=softGround;soil.material.depthWrite=!softGround;soil.material.needsUpdate=true;}
      // Fixed objects give genuine depth parallax under the shared moving camera.
      group.position.set(0,0,0);
    },
    resize(w,h,dpr=1){resolution.value.set(w*dpr,h*dpr);},
    getState(){return {...state,visible:group.visible,layers:['Foreground','GroundFog','Terrain','MidgroundGroves','ValleyMist','AtmosphericHaze'],triangles:land.index.count/3+trees.length*72*2+trees.length*4*20+32*20+12,drawCalls:10};},
    dispose(){group.removeFromParent();resources.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());},
  };
}
