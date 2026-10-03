// Optional A04 controller; the existing renderer owns the single render loop.
import {routeStyle,paletteFor,wallReveal} from '../module-a/visual-director/state.mjs';
export function createA04Scene(T, camera, scene, root, roofs, pins) {
  let state=null,overviewAspect=0,overviewCache=null;
  const group=new T.Group(); group.name='A04-route'; group.visible=false; scene.add(group);
  const material=new T.LineBasicMaterial({color:0xb9a98f,depthTest:false,transparent:true});
  const lines=[],dots=[],segments=[],nodeLabels=[];
  for(const text of ["⑤ 第五幅","① 第一幅","② 第二幅"]){const el=document.createElement("span");el.className='route-node-label';el.textContent=text;el.style.cssText="position:absolute;z-index:4;font:13px system-ui;color:#d8d2c5;background:#101519d9;padding:3px 6px;pointer-events:none;display:none;transform:translate(-50%,10px)";document.body.append(el);nodeLabels.push(el);}
  const bounds=new T.Box3(new T.Vector3(-5.9,-.6,-16.5),new T.Vector3(5.9,3.4,13));
  const corners=[];
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new T.Vector3(x,y,z));
  function projected() {
    camera.updateMatrixWorld();
    const p=corners.map(v=>v.clone().project(camera));
    return {left:Math.min(...p.map(v=>v.x))*.5+.5,right:Math.max(...p.map(v=>v.x))*.5+.5,
      top:.5-Math.max(...p.map(v=>v.y))*.5,bottom:.5-Math.min(...p.map(v=>v.y))*.5};
  }
  function visibleBounds(){
    root.updateMatrixWorld(true);camera.updateMatrixWorld();let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;const point=new T.Vector3();
    root.traverse(m=>{if(!m.isMesh||!m.visible||!m.parent.visible||m.material.opacity<.1)return;const positions=m.geometry.attributes.position;for(let i=0;i<positions.count;i++){point.fromBufferAttribute(positions,i).applyMatrix4(m.matrixWorld).project(camera);const x=point.x*.5+.5,y=.5-point.y*.5;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}});return {left,right,top,bottom};
  }
  const setCamera=c=>{camera.position.fromArray(c.position);camera.lookAt(new T.Vector3(...c.target));camera.updateMatrixWorld();};
  function overview() {
    if(overviewCache&&overviewAspect===camera.aspect)return overviewCache;
    const previous={position:camera.position.toArray(),quaternion:camera.quaternion.clone()};
    const target=[0,-2.3,-1.75],theta=4.4,phi=.72;
    let near=15,far=100,c;
    for(let i=0;i<24;i++) {
      const d=(near+far)/2;
      c={position:[d*Math.sin(phi)*Math.sin(theta),target[1]+d*Math.cos(phi),target[2]+d*Math.sin(phi)*Math.cos(theta)],target};
      setCamera(c);const box=projected();
      if(box.right-box.left>.68||box.bottom-box.top>.61)near=d;else far=d;
    }
    camera.position.fromArray(previous.position);camera.quaternion.copy(previous.quaternion);camera.updateMatrixWorld();
    overviewAspect=camera.aspect;overviewCache=c;return c;
  }
  function ensureRoute(paths) {
    if(lines.length)return;
    paths.forEach((points,i)=>{
      const geometry=new T.BufferGeometry().setFromPoints(points.map(v=>new T.Vector3(...v)));
      const line=new T.Line(geometry,material);line.renderOrder=20;group.add(line);lines.push(line);
      const parts=points.slice(1).map((point,j)=>{const a=new T.Vector3(...points[j]),b=new T.Vector3(...point),delta=b.clone().sub(a);const mesh=new T.Mesh(new T.CylinderGeometry(.038,.038,1,8),new T.MeshBasicMaterial({color:0xb9a98f,transparent:true,depthTest:false}));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());mesh.renderOrder=20;group.add(mesh);const future=new T.Mesh(mesh.geometry,new T.MeshBasicMaterial({color:0xb9a98f,transparent:true,depthTest:false}));future.quaternion.copy(mesh.quaternion);future.position.copy(a).addScaledVector(delta,.5);future.scale.set(.6,delta.length(),.6);future.renderOrder=19;group.add(future);const backing=new T.Mesh(mesh.geometry,new T.MeshBasicMaterial({color:0x101519,transparent:true,opacity:.9,depthTest:false}));backing.quaternion.copy(mesh.quaternion);backing.renderOrder=18;group.add(backing);return {mesh,future,backing,a,delta,length:delta.length()};});segments.push(parts);
      const dot=new T.Mesh(new T.SphereGeometry(.15,12,8),new T.MeshBasicMaterial({color:0xb9a98f,depthTest:false,transparent:true}));
      dot.position.fromArray(points.at(-1));dot.renderOrder=21;group.add(dot);dots.push(dot);
    });
  }
  function grow(line,points,progress) {
    if(points.length<2){line.visible=false;return;}
    const lengths=points.slice(1).map((p,i)=>Math.hypot(...p.map((v,j)=>v-points[i][j])));
    let left=lengths.reduce((a,b)=>a+b,0)*progress;const positions=[points[0]];
    for(let i=0;i<lengths.length;i++) {
      const f=Math.min(1,left/lengths[i]);positions.push(points[i].map((v,j)=>v+(points[i+1][j]-v)*f));
      left-=lengths[i];if(left<=0)break;
    }
    // Reuse a fixed buffer during animation, avoiding per-frame GPU allocations.
    const attribute=line.geometry.attributes.position;
    positions.forEach((p,i)=>attribute.setXYZ(i,...p));attribute.needsUpdate=true;
    line.geometry.setDrawRange(0,positions.length);line.geometry.computeBoundingSphere();line.visible=false;
  }
  return {
    overview,
    guideStart(){return {muralId:'mural-05',camera:overview(),routeComplete:true};},
    set(next){state=next;if(next)ensureRoute(next.paths);group.visible=Boolean(next);if(!next){nodeLabels.forEach(el=>el.style.display="none");pins.forEach(p=>p.button.textContent=p.m.label);}},
    apply(){
      if(!state)return false;
      setCamera(state.camera);
      roofs.forEach(m=>{const transparent=state.roofOpacity<1;if(m.material.transparent!==transparent){m.material.transparent=transparent;m.material.needsUpdate=true;}m.material.opacity=state.roofOpacity;m.material.depthWrite=!transparent;});
      material.opacity=state.routeOpacity;const palette=paletteFor(document.body.dataset?.directorAccent);
      lines.forEach((line,i)=>{grow(line,state.paths[i],state.growth[i]);const style=routeStyle(state.growth,i,state.elapsed,state.routeComplete);let left=segments[i].reduce((n,p)=>n+p.length,0)*state.growth[i];for(const part of segments[i]){const f=Math.max(0,Math.min(1,left/part.length));part.mesh.visible=f>0;part.mesh.scale.set(style.current?1.18:1,part.length*f,style.current?1.18:1);part.mesh.position.copy(part.a).addScaledVector(part.delta,f/2);part.mesh.material.color.set(palette.route);part.future.material.color.set(palette.route);part.mesh.material.opacity=state.routeOpacity*style.trace;part.backing.visible=f>0&&style.trace>0;part.backing.position.copy(part.mesh.position);part.backing.scale.copy(part.mesh.scale);part.backing.scale.x*=1.65;part.backing.scale.z*=1.65;part.backing.material.opacity=.9*state.routeOpacity;part.future.visible=style.future>0&&f<1;part.future.material.opacity=state.routeOpacity*style.future;left-=part.length;}dots[i].visible=state.growth[i]>=1;dots[i].material.color.set(palette.accent);dots[i].material.opacity=state.routeOpacity*(i?state.secondaryOpacity??1:1);});
      return true;
    },
    labels(){if(!state)return;document.querySelectorAll(".spatial-label").forEach(el=>el.style.opacity=state.labelOpacity);nodeLabels.forEach((el,i)=>{const v=dots[i].position.clone().project(camera);el.style.display=state.growth[i]>=1&&state.routeOpacity>0?"block":"none";el.style.left=(v.x*.5+.5)*innerWidth+"px";el.style.top=(.5-v.y*.5)*innerHeight+"px";el.style.opacity=state.routeOpacity*(state.secondaryOpacity??1);});for(const pin of pins){
      const current=pin.m.id===state.target&&(!state.routeComplete||state.guideStartProgress>0);
      const labelWeight=state.mode==='playing'?wallReveal(state.elapsed):1;
      pin.button.style.opacity=String(state.labelOpacity*(current?labelWeight:(1-.2*state.entryProgress)*(state.secondaryOpacity??1)));pin.line.style.opacity=pin.dot.style.opacity=state.labelOpacity*(current?labelWeight:(1-.55*state.entryProgress)*(state.secondaryOpacity??1));
      pin.button.dataset.current=String(current);pin.button.textContent=pin.m.label+(current&&state.entryProgress>.5?" · 当前":"");
      // Small local backing keeps the active label readable over pale plaster.
      pin.button.style.background=current?'#101519d9':'transparent';
      pin.button.setAttribute('aria-label',pin.m.label+(current?'，当前观看目标':'，路线位置'));
    }},
    projection(id){const mural=root.getObjectByName(id);if(!mural||!state)return null;const subject=mural.getObjectByName(id+'-display-texture')||mural;setCamera(state.camera);subject.updateWorldMatrix(true,true);const box=new T.Box3().setFromObject(subject),points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).project(camera));const xs=points.map(p=>(p.x+1)*innerWidth/2),ys=points.map(p=>(1-p.y)*innerHeight/2);const quad=subject.isMesh&&subject.geometry.attributes.position.count===4?[0,1,3,2].map(i=>{const p=new T.Vector3().fromBufferAttribute(subject.geometry.attributes.position,i).applyMatrix4(subject.matrixWorld).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};}):null;return {left:Math.min(...xs),top:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys),quad};},
    getState(){return state?{...state,bounds:visibleBounds(),camera:{position:camera.position.toArray(),target:state.camera.target}}:null;},
  };
}
