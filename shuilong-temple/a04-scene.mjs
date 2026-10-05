// The existing renderer owns the single temple and render loop.
import { paletteFor } from '../module-a/visual-director/state.mjs';
import {a04Labels} from '../module-a/a04/composition.mjs';
import {routeWeights} from '../module-a/a04/timing.mjs';
export function createA04Scene(T,camera,scene,root,roofs,pins){
  let state=null,overviewKey='',overviewCache=null;
  const group=new T.Group();group.name='A04-route';group.visible=false;scene.add(group);
  const segments=[],nodeLabels=[],traceMaterials=[],futureMaterials=[];
  const vector=new T.Vector3(),look=new T.Vector3();
  const coreIds=['mural-05','mural-01','mural-02'];
  const css=document.createElement('style');css.textContent=`
  .a04-node{position:absolute;z-index:4;display:none;transform:translate(-50%,-50%);pointer-events:none;color:#a8aaa2;font:13px/1.5 "Narrative Sans","Microsoft YaHei",sans-serif;text-align:center;text-shadow:0 2px 6px #101519}
  .a04-node b{display:block;width:30px;height:30px;margin:0 auto 4px;line-height:30px;font-size:22px;font-weight:400;border:1px solid transparent;border-radius:50%}
  .a04-node[data-current=true]{color:#e2dcd0}.a04-node[data-current=true] b{width:40px;height:40px;line-height:40px;font-size:28px;border-color:#b9a98f;outline:1px solid #b9a98f60;outline-offset:4px}
  `;document.head.append(css);
  for(const [i,name]of ['第五铺','第一铺','第二铺'].entries()){const el=document.createElement('span');el.className='a04-node';el.innerHTML=`<b>${['⑤','①','②'][i]}</b><span>${name}</span>`;document.body.append(el);nodeLabels.push(el);}
  const corners=[];for(const x of [-5.9,5.9])for(const y of [-.6,6.8])for(const z of [-16.5,13])corners.push(new T.Vector3(x,y,z));
  const setCamera=c=>{camera.position.fromArray(c.position);look.fromArray(c.target);camera.lookAt(look);camera.updateMatrixWorld();};
  function projected(){camera.updateMatrixWorld();let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;for(const p of corners){vector.copy(p).project(camera);left=Math.min(left,vector.x*.5+.5);right=Math.max(right,vector.x*.5+.5);top=Math.min(top,.5-vector.y*.5);bottom=Math.max(bottom,.5-vector.y*.5);}return {left,right,top,bottom};}
  function visibleBounds(){root.updateMatrixWorld(true);camera.updateMatrixWorld();let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
    root.traverse(m=>{if(!m.isMesh||!m.visible||!m.parent.visible||m.material.opacity<.1)return;const positions=m.geometry.attributes.position;for(let i=0;i<positions.count;i++){vector.fromBufferAttribute(positions,i).applyMatrix4(m.matrixWorld).project(camera);const x=vector.x*.5+.5,y=.5-vector.y*.5;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}});return {left,right,top,bottom};}
  function overview(){const key=camera.aspect+':'+camera.fov;if(overviewCache&&overviewKey===key)return overviewCache;
    const position=camera.position.clone(),quaternion=camera.quaternion.clone(),target=[1,.1,-2.8],theta=4.4,phi=.86;
    let near=15,far=100,c;for(let i=0;i<24;i++){const d=(near+far)/2;c={position:[target[0]+d*Math.sin(phi)*Math.sin(theta),target[1]+d*Math.cos(phi),target[2]+d*Math.sin(phi)*Math.cos(theta)],target};setCamera(c);const box=projected();if(box.right-box.left>.82||box.bottom-box.top>.75)near=d;else far=d;}
    camera.position.copy(position);camera.quaternion.copy(quaternion);camera.updateMatrixWorld();overviewKey=key;return overviewCache=c;
  }
  function ensureRoute(paths){if(segments.length)return;const geometry=new T.CylinderGeometry(.014,.014,1,6);
    paths.forEach(points=>{const trace=new T.MeshBasicMaterial({color:0xb9a98f,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,fog:false}),future=trace.clone();traceMaterials.push(trace);futureMaterials.push(future);
      let total=0;const parts=points.slice(1).map((point,j)=>{const a=new T.Vector3(...points[j]),delta=new T.Vector3(...point).sub(a),length=delta.length();total+=length;
        const mesh=new T.Mesh(geometry,trace),next=new T.Mesh(geometry,future);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());next.quaternion.copy(mesh.quaternion);mesh.renderOrder=20;next.renderOrder=19;group.add(mesh,next);return {mesh,next,a,delta,length};});segments.push({parts,total});
    });
  }
  function hideLabels(){nodeLabels.forEach(el=>el.style.display='none');}
  return {
    overview,guideStart:()=>({muralId:'mural-05',camera:overview(),routeComplete:true}),
    set(next){state=next;if(next)ensureRoute(next.paths);group.visible=Boolean(next);if(!next){hideLabels();for(const pin of pins){pin.button.style.background='transparent';delete pin.button.dataset.current;}}},
    apply(){if(!state)return false;setCamera(state.camera);const palette=paletteFor(document.body.dataset.directorAccent);
      segments.forEach(({parts,total},i)=>{const style=routeWeights(state.growth,i,state.currentRoute,state.routeComplete||state.currentRoute===-1);traceMaterials[i].color.set(style.current?palette.route:0x595c55);futureMaterials[i].color.set(palette.route);traceMaterials[i].opacity=state.routeOpacity*style.trace;futureMaterials[i].opacity=state.routeOpacity*style.future;
        let left=total*state.growth[i];for(const part of parts){const f=Math.max(0,Math.min(1,left/part.length));part.mesh.visible=f>0&&state.routeOpacity>.001;part.mesh.scale.set(style.current?1.3:1,part.length*f,style.current?1.3:1);part.mesh.position.copy(part.a).addScaledVector(part.delta,f/2);part.next.visible=f<1&&style.future>0&&state.routeOpacity>.001;part.next.scale.set(.65,part.length*(1-f),.65);part.next.position.copy(part.a).addScaledVector(part.delta,(f+1)/2);left-=part.length;}
      });return true;
    },
    labels(){if(!state)return;document.querySelectorAll('.spatial-label').forEach(el=>el.style.opacity='0');
      for(const pin of pins){pin.button.hidden=true;pin.line.style.display=pin.dot.style.display='none';}
      const points=coreIds.map(id=>{const pin=pins.find(p=>p.m.id===id);if(!pin)return null;vector.fromArray(pin.m.position).project(camera);return {id,x:(vector.x*.5+.5)*innerWidth,y:(.5-vector.y*.5)*innerHeight,z:vector.z};}).filter(Boolean);
      const placements=a04Labels(points,innerWidth,innerHeight,state.target);nodeLabels.forEach((el,i)=>{const p=placements.find(p=>p.id===coreIds[i]);const secondary=state.guideStartProgress>0&&i>0?state.secondaryOpacity:1;
        el.style.display=p&&secondary>.001?'block':'none';if(!p)return;el.dataset.current=String(p.current);el.style.left=p.lx+'px';el.style.top=p.ly+'px';el.style.opacity=String(state.entryProgress*secondary*(p.current?1:state.target ? .42 : .72));
      });
    },
    projection(id){const mural=root.getObjectByName(id);if(!mural||!state)return null;const subject=mural.getObjectByName(id+'-display-texture')||mural;setCamera(state.camera);subject.updateWorldMatrix(true,true);const box=new T.Box3().setFromObject(subject),points=[];for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).project(camera));const xs=points.map(p=>(p.x+1)*innerWidth/2),ys=points.map(p=>(1-p.y)*innerHeight/2);const quad=subject.isMesh&&subject.geometry.attributes.position.count===4?[0,1,3,2].map(i=>{const p=new T.Vector3().fromBufferAttribute(subject.geometry.attributes.position,i).applyMatrix4(subject.matrixWorld).project(camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};}):null;return {left:Math.min(...xs),top:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys),quad};},
    getState:()=>state?{...state,bounds:visibleBounds(),camera:{position:camera.position.toArray(),target:state.camera.target}}:null,
  };
}
