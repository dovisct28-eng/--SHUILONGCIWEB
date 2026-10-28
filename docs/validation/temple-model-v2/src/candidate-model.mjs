// Local candidate construction over a frozen copy of the original source.
// Existing materials/helpers are reused; no edit to the production model.
export function corridorMetrics(config,variant){
 const b=config.baseline,factor=variant.corridor?config.corridors[variant.corridor]:1;
 const effective=(b.wallInner-b.columnX)*factor,columnX=b.wallInner-effective;
 const innerMargin=variant.corridor?.24:.075,roofOuter=variant.corridor?5.25:b.roofOuter;
 return {factor,columnX,effectiveWidth:effective,shaftClearance:effective-b.columnRadius,footClearance:effective-b.footHalfWidth,floorInner:columnX-innerMargin,floorOuter:b.floorOuter,floorWidth:b.floorOuter-columnX+innerMargin,roofInner:columnX-.22,roofOuter,roofWidth:roofOuter-columnX+.22,courtBetweenColumns:2*columnX,courtBetweenFeet:2*(columnX-.2),cameraCentreX:(columnX+b.wallInner)/2};
}
export function createCandidate(T,source,config,variant){
 if(!source.includes('return root;'))throw Error('Frozen baseline source is incompatible');
 const expose=source.replace('return root;','root.userData.helpers={part,box,col,roof,wallMesh,wallBox,line,mesh,mats}; return root;');
 const root=new Function('T',expose+'\nreturn makeTemple(T);')(T),h=root.userData.helpers;
 const removed=[];function replace(name){const old=root.getObjectByName(name);if(!old)throw Error('Missing '+name);removed.push(old);root.remove(old);h.part(name);}
 const cm=corridorMetrics(config,variant),structure={corridor:cm,stage:variant.stage?config.stages[variant.stage]:null,roof:variant.roof?config.roofs[variant.roof]:null};
 if(variant.corridor){
  for(const side of [-1,1]){
   replace(side<0?'04_WestGallery':'05_EastGallery');
   const floorCentre=(cm.floorInner+cm.floorOuter)/2,roofCentre=(cm.roofInner+cm.roofOuter)/2;
   h.box(side*floorCentre,.16,.85,cm.floorWidth,.32,19.4,'stone');
   // The same column Z grid keeps mural-01 unobstructed. Bases now sit on paving.
   for(const z of [-7.2,-2.4,2.4,7.2,9.5]){
    h.col(side*cm.columnX,z,1.615,2.47); // wood .38..2.85; stone foot bottom .32
    h.box(side*(cm.columnX+4.89)/2,2.89,z,4.89-cm.columnX+.24,.16,.18,'wood');
   }
   h.box(side*cm.columnX,2.89,1.1,.20,.16,19.3,'wood');
   h.box(side*4.89,2.91,1.1,.18,.18,19.3,'wood');
   // Wide roof, fixed outer edge. Shortened hall end meets beneath the hall eave.
   h.roof(side*roofCentre,1.45,19.2,cm.roofWidth,2.95,.57,Math.PI/2);
   // Three longitudinal purlins supported on short blocks above cross beams.
   for(const fraction of [.12,.5,.88]){
    const x=cm.roofInner+cm.roofWidth*fraction,v=Math.abs((x-roofCentre)/(cm.roofWidth/2)),roofY=2.95+.57*(1-v**.65);
    const run=19.2*(.66+.34*v)-.08;
    h.box(side*x,roofY-.035,1.45,.13,.12,run,'wood');
    for(const z of [-7.2,-2.4,2.4,7.2,9.5]){if(Math.abs(z-1.45)>run/2)continue;h.box(side*x,(2.97+roofY-.07)/2,z,.15,Math.max(.02,roofY-.07-2.97),.17,'wood');}
   }
   // One small step to the unchanged raised hall platform, not a detached slab.
   h.box(side*floorCentre,.365,-7.975,cm.floorWidth,.09,.35,'stone');
  }
 }
 if(variant.stage){
  replace('06_Stage');const p=config.stages[variant.stage],front=p.z-p.depth/2,back=p.z+p.depth/2,px=p.width/2-.27;
  h.box(0,.49,p.z,p.width,.98,p.depth,'stone');
  // Rear room is a restrained design mass, not a claim about surveyed joinery.
  const wallHeight=p.eave-.98,wallY=(p.eave+.98)/2;
  h.wallBox(0,wallY,back-.12,p.width-.2,wallHeight,.20,'z',-1);
  for(const side of [-1,1])h.wallBox(side*(p.width/2-.12),wallY,back-p.rearRoomDepth/2-.08,.20,wallHeight,p.rearRoomDepth,'x',-side);
  const colTop=p.eave-.08,colBottom=1.04;
  for(const x of [-px,px])for(const z of [front+.24,back-.25])h.col(x,z,(colTop+colBottom)/2,colTop-colBottom);
  for(const z of [front+.24,back-.25])h.box(0,p.eave-.04,z,p.width-.30,.20,.22,'wood');
  for(const x of [-px,px])h.box(x,p.eave-.04,p.z,.20,.20,p.depth-.2,'wood');
  h.box(0,1.03,front+.06,p.width-.15,.10,.16,'wood');
  h.roof(0,p.z-(variant.stage==='B'?.3:0),p.roofWidth,p.roofDepth-(variant.stage==='B'?.6:0),p.eave,p.rise);
  if(variant.stage==='B'){
   // Lower rear roof makes the rear volume legible without ornament or a new room type.
   h.roof(0,back-.43,p.width-.10,1.5,p.eave,.28);
  }
 }
 if(variant.roof){
  const hall=root.getObjectByName('03_MainHall');
  for(const o of [...hall.children])if(o.material.userData.texture==='roof')hall.remove(o);
  // Add to this existing group through the original helper's part context, then merge.
  h.part('08_HallRoofCandidate');const p=config.roofs[variant.roof];
  function pt(u,v,lift=0){const a=Math.abs(u),b=Math.abs(v);return [u*p.width/2,p.eave+p.rise*(1-b**p.exponent)+.08*a**12*b**5+.06*a**16*(1-b)+lift,p.z+v*p.depth/2];}
  const positions=[],indices=[],nx=40,nz=18;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++)positions.push(...pt(i/nx*2-1,j/nz*2-1));
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1;indices.push(a,c,b,b,c,c+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();h.mesh(g,'tile').material.side=T.DoubleSide;
  for(let i=0;i<=66;i++)for(const sign of [-1,1])h.line(Array.from({length:11},(_,j)=>pt(i/33-1,sign*j/10,.022)),.023,'tileDetail');
  for(const sign of [-1,1]){h.line(Array.from({length:33},(_,i)=>pt(i/16-1,sign,.025)),.073,'ridge');h.line(Array.from({length:25},(_,i)=>pt(sign,i/12-1,.035)),.06,'ridge');}
  h.line(Array.from({length:25},(_,i)=>pt(i/12-1,0,.065)),.095,'ridge');
  for(const side of [-1,1]){
   const z0=-15.3,z1=-8.35,u=side*4.65/(p.width/2),shape=new T.Shape();shape.moveTo(-z1,3.35);shape.lineTo(-z0,3.35);
   for(let j=0;j<=40;j++){const z=z0+(z1-z0)*j/40,v=(z-p.z)/(p.depth/2);shape.lineTo(-z,pt(u,v)[1]-.025);}shape.closePath();
   const upper=new T.ExtrudeGeometry(shape,{depth:.22,bevelEnabled:false,curveSegments:1});upper.rotateY(Math.PI/2);h.wallMesh(upper,'x',-side,side*4.65-.11,0,0);
   h.box(side*4.65,3.34,-11.75,.26,.10,6.6,'wood');
   h.box(side*4.65,3.025,-15.175,.22,.65,.25,'brick');
   h.box(side*4.65,3.025,-8.40,.22,.65,.10,'brick');
  }
 }
 delete root.userData.helpers;root.userData.candidate={id:variant.id,structure};root.updateMatrixWorld(true);
 return {root,structure,removed};
}
