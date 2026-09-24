// Optional A04 controller; the existing renderer owns the single render loop.
export function createA04Scene(T, camera, scene, root, roofs, pins) {
  let state=null,overviewAspect=0,overviewCache=null;
  const group=new T.Group(); group.name='A04-route'; group.visible=false; scene.add(group);
  const material=new T.LineBasicMaterial({color:0xb84f63,depthTest:false,transparent:true});
  const lines=[],dots=[],segments=[],nodeLabels=[];
  for(const text of ["01 · 出发","02","03"]){const el=document.createElement("span");el.textContent=text;el.style.cssText="position:absolute;font:12px system-ui;color:#843348;background:#f4f0e7e8;padding:2px 5px;pointer-events:none;display:none;transform:translate(-50%,8px)";document.body.append(el);nodeLabels.push(el);}
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
      const parts=points.slice(1).map((point,j)=>{const a=new T.Vector3(...points[j]),b=new T.Vector3(...point),delta=b.clone().sub(a);const mesh=new T.Mesh(new T.CylinderGeometry(.045,.045,1,8),new T.MeshBasicMaterial({color:0xb84f63,transparent:true,depthTest:false}));mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());mesh.renderOrder=20;group.add(mesh);return {mesh,a,delta,length:delta.length()};});segments.push(parts);
      const dot=new T.Mesh(new T.SphereGeometry(.15,12,8),new T.MeshBasicMaterial({color:0xb84f63,depthTest:false,transparent:true}));
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
    handoff(){const d=Math.max(5.5/(2*Math.tan(camera.fov*Math.PI/360)*camera.aspect*.78),2/(2*Math.tan(camera.fov*Math.PI/360)*.55));return {position:[4.52-d,1.85,-11.75],target:[4.52,1.85,-11.75]};},
    set(next){state=next;if(next)ensureRoute(next.paths);group.visible=Boolean(next);if(!next){nodeLabels.forEach(el=>el.style.display="none");pins.forEach(p=>p.button.textContent=p.m.label);}},
    apply(){
      if(!state)return false;
      setCamera(state.camera);
      roofs.forEach(m=>{m.material.opacity=state.roofOpacity;m.material.transparent=true;m.material.depthWrite=false;});
      material.opacity=state.routeOpacity;
      lines.forEach((line,i)=>{grow(line,state.paths[i],state.growth[i]);let left=segments[i].reduce((n,p)=>n+p.length,0)*state.growth[i];for(const part of segments[i]){const f=Math.max(0,Math.min(1,left/part.length));part.mesh.visible=f>0;part.mesh.scale.set(1,part.length*f,1);part.mesh.position.copy(part.a).addScaledVector(part.delta,f/2);part.mesh.material.opacity=state.routeOpacity;left-=part.length;}dots[i].visible=state.growth[i]>=1;dots[i].material.opacity=state.routeOpacity;});
      return true;
    },
    labels(){if(!state)return;document.querySelectorAll(".spatial-label").forEach(el=>el.style.opacity=state.labelOpacity);nodeLabels.forEach((el,i)=>{const v=dots[i].position.clone().project(camera);el.style.display=state.growth[i]>=1&&state.routeOpacity>0?"block":"none";el.style.left=(v.x*.5+.5)*innerWidth+"px";el.style.top=(.5-v.y*.5)*innerHeight+"px";el.style.opacity=state.routeOpacity;});for(const pin of pins){
      const current=pin.m.id===state.target;
      pin.button.style.opacity=String(state.labelOpacity*(current?1:1-.55*state.entryProgress));pin.line.style.opacity=pin.dot.style.opacity=state.labelOpacity*(current?1:1-.55*state.entryProgress);
      pin.button.dataset.current=String(current);pin.button.textContent=pin.m.label+(current&&state.entryProgress>.5?" · 当前":"");
      pin.button.setAttribute('aria-label',pin.m.label+(current?'，当前观看目标':'，路线位置'));
    }},
    getState(){return state?{...state,bounds:visibleBounds(),camera:{position:camera.position.toArray(),target:state.camera.target}}:null;},
  };
}
