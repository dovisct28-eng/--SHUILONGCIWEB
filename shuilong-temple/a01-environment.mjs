// Art-directed narrative environment. Imaginary karst setting, not site survey.
// Near terrain, vegetation, rocks and haze share the architecture's camera/light.
const unit=n=>Math.max(0,Math.min(1,n)),ease=n=>{const t=unit(n);return t*t*(3-2*t);};
export function a01TerrainHeight(x,z){
  const outside=Math.hypot(Math.max(0,Math.abs(x)-6.05),Math.max(0,Math.abs(z+1.75)-14.9));
  return -.615-.10*outside**1.55+ease(outside/7)*(.42*Math.sin(x*.37+z*.13)+.31*Math.cos(z*.4));
}
export function createA01Environment(T,scene){
  const group=new T.Group();group.name='A01NarrativeEnvironment';scene.add(group);
  const resources=[],materials=[],resolution={value:new T.Vector2(1,1)},visibility={value:0};
  const geometry=g=>{resources.push(g);return g;};
  const noise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}`;
  const mat=(color,terrain=false)=>{
    const m=new T.MeshStandardMaterial({color,roughness:1,transparent:true,depthWrite:true});materials.push(m);
    m.onBeforeCompile=s=>{
      s.uniforms.a01EnvironmentVisibility=visibility;s.uniforms.a01EnvironmentResolution=resolution;
      s.vertexShader='varying vec3 a01World;\n'+s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
        vec4 a01P=vec4(transformed,1.);\n#ifdef USE_INSTANCING\na01P=instanceMatrix*a01P;\n#endif\na01World=(modelMatrix*a01P).xyz;`);
      s.fragmentShader='varying vec3 a01World;uniform float a01EnvironmentVisibility;uniform vec2 a01EnvironmentResolution;\n'+noise+'\n'+s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float grain=noise(a01World.xz*5.3)*.12+noise(a01World.xz*.33)*.19;
        diffuseColor.rgb*=.79+grain;
        ${terrain?'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.12,.16,.14),noise(a01World.xz*.19)*.32);':''}`);
      s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`vec2 edge=gl_FragCoord.xy/a01EnvironmentResolution;
        diffuseColor.a*=a01EnvironmentVisibility*smoothstep(0.,.15,edge.x)*smoothstep(0.,.15,1.-edge.x)*smoothstep(0.,.15,edge.y)*smoothstep(0.,.15,1.-edge.y);
        ${terrain?'float bank=length(max(abs(a01World.xz+vec2(0.,1.75))-vec2(6.1,15.),0.));diffuseColor.a*=1.-smoothstep(3.,19.,bank);':''}
        #include <opaque_fragment>`);
    };m.customProgramCacheKey=()=>`a01-landscape-${terrain}`;return m;
  };
  // Plateau begins at the existing plinth bottom, then falls into wooded slopes.
  const land=geometry(new T.PlaneGeometry(100,100,96,96));land.rotateX(-Math.PI/2);
  const p=land.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,a01TerrainHeight(p.getX(i),p.getZ(i)));land.computeVertexNormals();
  const soil=new T.Mesh(land,mat(0x414e53,true));soil.receiveShadow=true;soil.name='SlopingSoil';group.add(soil);
  let seed=20261003;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // Asymmetric groves with clear space around the main roof. No tree cards.
  const trees=[];for(let i=0;i<210;i++){
    const scrub=i>=146,side=i<92||i%3?-1:1,x=side*(scrub?6.5+random()*5.5:7.7+random()*19),z=scrub?-19+random()*34:-27+random()*62;
    if(z<-7&&z>-19&&Math.abs(x)<10.8)continue;
    trees.push([x,z,scrub?.38+random()*1.1:1.2+random()*3.0,random()*6.28]);
  }
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
  // Soft, static world-space mist. Scroll is the only clock; no drifting timer.
  const mist=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{amount:visibility,color:{value:new T.Color(0x9ba9aa)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`varying vec2 vUv;uniform float amount;uniform vec3 color;${noise}void main(){vec2 q=vUv*2.-1.;float edge=exp(-3.*dot(q,q));float cloud=noise(vUv*7.)*.55+noise(vUv*17.)*.25;gl_FragColor=vec4(color,amount*edge*cloud*.72);}`});materials.push(mist);
  const cloudGeometry=geometry(new T.PlaneGeometry(1,1));
  for(const [x,z,y,w,h] of [[-9,-18,.3,19,7],[12,10,.7,25,10],[-8,22,1,33,13],[0,35,3,58,17]]){
    const cloud=new T.Mesh(cloudGeometry,mist);cloud.position.set(x,y,z);cloud.scale.set(w,h,1);cloud.rotation.x=-Math.PI*.4;cloud.name='GroundHaze';group.add(cloud);
  }
  let state={weight:0,establish:0,trees:trees.length};
  return {
    apply(weight,progress,reduced=false){const establish=ease((progress-.20)/.48);visibility.value=weight*establish;group.visible=visibility.value>.0001;state={weight,establish,trees:trees.length};
      const movement=reduced?0:(1-ease((progress-.2)/.48));group.position.set(movement*.4,0,movement*.8);
    },
    resize(w,h,dpr=1){resolution.value.set(w*dpr,h*dpr);},
    getState(){return {...state,visible:group.visible,layers:['Foreground','NearAtmosphere','Terrain','MidgroundGroves','FarHaze'],triangles:land.index.count/3+trees.length*72*2+trees.length*4*20+32*20+8,drawCalls:8};},
    dispose(){group.removeFromParent();resources.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());},
  };
}
