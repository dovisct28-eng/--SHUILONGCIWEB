
function makeTemple(T){
 const root=new T.Group(); root.name='ShuilongTemple';
 const mats={};
 const colors={stone:0xaaa59a,wall:0xbcb09a,plaster:0xb7ac98,brick:0x805845,trim:0xa99e8a,wood:0x332923,door:0x26211e,tile:0x514b45,tileDetail:0x62574d,ridge:0x625b53,metal:0x302c25,paving:0x898375};
 for(const [name,color] of Object.entries(colors)){mats[name]=new T.MeshStandardMaterial({color,roughness:name==='metal'?.8:.96});mats[name].userData.texture=name==='brick'?'brick':name==='wood'||name==='door'?'wood':name==='tile'||name==='tileDetail'||name==='ridge'?'roof':name==='stone'?'stone':name==='paving'?'paving':name==='metal'?null:'plaster';}
 let group=root;
 function part(name){group=new T.Group();group.name=name;root.add(group);}
 function mesh(g,m,x=0,y=0,z=0){const o=new T.Mesh(g,mats[m]);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
 function box(x,y,z,w,h,d,m){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z);}
 // One closed wall volume, with separate inward plaster and outward masonry faces.
 // Splitting triangles avoids overlapping surface planes and works with the GLB batches.
 function wallMesh(geometry,axis,sign,x=0,y=0,z=0){
  const g=geometry.index?geometry.toNonIndexed():geometry,p=g.getAttribute('position'),n=g.getAttribute('normal');
  const faces={brick:{p:[],n:[]},plaster:{p:[],n:[]}},a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
  for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);const inward=b.sub(a).cross(c.sub(a)).normalize()[axis]*sign>.99,face=faces[inward?'plaster':'brick'];
   for(let j=i;j<i+3;j++){face.p.push(p.getX(j),p.getY(j),p.getZ(j));face.n.push(n.getX(j),n.getY(j),n.getZ(j));}}
  for(const [material,face] of Object.entries(faces)){if(!face.p.length)continue;const skin=new T.BufferGeometry();skin.setAttribute('position',new T.Float32BufferAttribute(face.p,3));skin.setAttribute('normal',new T.Float32BufferAttribute(face.n,3));
   if(material==='plaster'){const colors=[];for(let i=1;i<face.p.length;i+=3){const tone=.88+.12*Math.min(1,Math.max(0,(face.p[i]+y)/2));colors.push(tone,tone,tone);}skin.setAttribute('color',new T.Float32BufferAttribute(colors,3));mats.plaster.vertexColors=true;}
   mesh(skin,material,x,y,z);
  }
 }
 function wallBox(x,y,z,w,h,d,axis,sign){wallMesh(new T.BoxGeometry(w,h,d),axis,sign,x,y,z);}
 function line(points,r,m){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),Math.max(2,points.length-1),r,4,false),m);}
 function col(x,z,y=1.7,h=2.5){mesh(new T.CylinderGeometry(.12,.15,h,12),'wood',x,y,z);box(x,y-h/2,z,.4,.12,.4,'stone');mesh(new T.CylinderGeometry(.2,.23,.16,12),'stone',x,y-h/2+.11,z);}
 // Curved roof with a horizontal ridge and hipped ends. The same surface
 // supplies roof skins, tile ribs and eaves so all details remain aligned.
 function roof(cx,cz,w,d,eave,rise,rot=0){
  function pt(u,v,lift=0){const a=Math.abs(u),b=Math.abs(v),hip=.66;let f=Math.max(b,Math.max(0,(a-hip)/(1-hip)));let h=rise*(1-Math.pow(f,.65));h+=.35*Math.pow(a,10)*Math.pow(b,5);h+=.18*Math.pow(a,18)*(1-b);let x=u*w/2,z=v*d/2;return [cx+x*Math.cos(rot)-z*Math.sin(rot),eave+h+lift,cz+x*Math.sin(rot)+z*Math.cos(rot)];}
  const p=[],idx=[],nx=40,nz=18;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++)p.push(...pt(i/nx*2-1,j/nz*2-1));
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){let a=j*(nx+1)+i,b=a+1,c=a+nx+1;idx.push(a,c,b,b,c,c+1);}
  let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();const skin=mesh(g,'tile');skin.material.side=T.DoubleSide;
  const count=Math.round(w/.16);
  for(let i=0;i<=count;i++){let u=i/count*2-1;for(let sign of [-1,1]){let ps=[];for(let j=0;j<=10;j++)ps.push(pt(u,sign*j/10,.022));line(ps,.023,'tileDetail');}}
  for(let sign of [-1,1]){let ps=[];for(let i=0;i<=32;i++)ps.push(pt(i/16-1,sign,.025));line(ps,.073,'ridge');}
  let ridge=[];for(let i=0;i<=24;i++)ridge.push(pt(i/12-1,0,.065));line(ridge,.095,'ridge');
  for(let sx of [-1,1])for(let sz of [-1,1]){let ps=[];for(let i=0;i<=10;i++){let f=i/10;ps.push(pt(sx*(.66+.34*f),sz*f,.05));}line(ps,.065,'ridge');}
 }
 part('01_Base');box(0,-.3,-1.75,11.8,.6,29.5,'stone');box(0,.035,-1.75,11.45,.07,29.15,'paving');
 // Paving joints are carried by the repeating material, not one mesh per paver.
 part('02_Enclosure');
 for(let s of [-1,1]){wallBox(s*5,1.4,-1.75,.22,2.8,27.5,'x',-s);wallBox(s*5,2.82,-1.75,.32,.12,27.5,'x',-s);
  // Sparse, paired pilasters leave the mural spans (-14.5..-9 and 3.2..6.4) unobstructed.
  for(const z of [-15,-7.5,0,7.5,10])wallBox(s*5,1.45,z,.34,2.9,.3,'x',-s);}
 wallBox(0,1.65,-15.3,10,3.3,.25,'z',1);
 part('03_MainHall');box(0,.25,-11.75,9.75,.5,7.2,'stone');
 for(let k=0;k<3;k++)box(0,.08+k*.095,-7.75-k*.25,6.8,.16+k*.19,.5,'stone');
 wallBox(0,1.9,-15,9.4,2.9,.2,'z',1);
 // Each side wall has brick above the mural plaster and a low weathered brick foot.
 // The plaster is almost flush with the brick, leaving no visible picture backing.
 for(let s of [-1,1]){
  const x=s*4.65;
  box(x,3.025,-11.75,.22,.65,6.6,'brick');
  wallBox(x,1.85,-11.75,.22,1.7,6.6,'x',-s);
  box(x,.69,-11.75,.22,.62,6.6,'brick');
  box(s*4.29,3.24,-11.75,.17,.18,6.7,'wood');
 }
 // Front colonnade remains; rear mural wall has no columns or wood panels.
 for(const x of [-3.6,0,3.6])col(x,-8.35,1.92,2.9);
 box(0,3.18,-8.35,9.5,.26,.23,'wood');roof(0,-11.55,10.65,8.15,3.35,1.85);
 for(let side of [-1,1]){part(side<0?'04_WestGallery':'05_EastGallery');let x=side*4.05;box(x,.16,.85,1.75,.32,19.4,'stone');
  // Columns flank mural-01 rather than interrupting its Z=3.2..6.4 span.
  for(const z of [-7.2,-2.4,2.4,7.2,9.5]){col(side*3.25,z,1.42,2.5);box(side*4.02,2.62,z,1.62,.13,.16,'wood');}
  box(side*3.25,2.66,1.1,.19,.14,19.3,'wood');roof(x,1,20.1,2.04,2.72,.57,Math.PI/2);}
 part('06_Stage');box(0,.49,8.4,3.1,.98,2.65,'stone');
 // Stage opens toward the main hall (-Z), with its closed back at the entrance.
 box(0,1.68,9.48,2.85,1.65,.15,'wood');for(let s of [-1,1])box(s*1.35,1.64,8.47,.13,1.6,2,'wood');
 for(let x of [-1.28,1.28]){col(x,7.4,1.79,1.8);col(x,9.35,1.79,1.8);}box(0,2.65,7.4,2.9,.2,.18,'wood');roof(0,8.35,3.65,3,2.75,.95);
 part('07_Entrance');
 roof(0,10.85,10.15,2,2.91,.62);
 // Three genuine arched openings are assembled from piers and arch spandrels.
 const doors=[[-3.25,.62,1.42],[0,.76,1.68],[3.25,.62,1.42]],wallZ=11.93,top=2.85;
 let edge=-5.12;
 for(let [cx,r,spring] of doors){let l=cx-r;wallBox((edge+l)/2,top/2,wallZ,l-edge,top,.46,'z',-1);edge=cx+r;
  const verts=[],inds=[],n=18;for(let i=0;i<=n;i++){let x=-r+2*r*i/n,y=spring+Math.sqrt(Math.max(0,r*r-x*x));verts.push(cx+x,y,wallZ+.23,cx+x,top,wallZ+.23,cx+x,y,wallZ-.23,cx+x,top,wallZ-.23);if(i<n){let a=i*4;inds.push(a,a+4,a+1,a+1,a+4,a+5,a+2,a+3,a+6,a+3,a+7,a+6,a,a+2,a+4,a+2,a+6,a+4);}}
  let geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));geo.setIndex(inds);geo.computeVertexNormals();wallMesh(geo,'z',-1);
  box(cx,spring/2,wallZ+.07,2*r,spring,.07,'door');
  for(let dx=-r+.12;dx<r;dx+=.17)box(cx+dx,spring/2,wallZ+.115,.018,spring,.018,'wood');
  let infill=new T.Shape();infill.moveTo(-r,spring);infill.lineTo(r,spring);infill.absarc(0,spring,r,0,Math.PI,false);infill.closePath();wallMesh(new T.ExtrudeGeometry(infill,{depth:.42,bevelEnabled:false,curveSegments:18}),'z',-1,cx,0,wallZ-.23);
  box(cx,spring,wallZ+.24,2*r+.12,.13,.2,'wood');
  let arch=[];for(let i=0;i<=20;i++){let a=i/20*Math.PI;arch.push([cx+(r+.13)*Math.cos(a),spring+(r+.13)*Math.sin(a),wallZ+.27]);}line(arch,.105,'brick');
  for(let s of [-1,1])box(cx+s*(r+.11),spring/2,wallZ+.27,.2,spring,.25,'brick');
  box(cx,.065,wallZ+.2,2*r+.2,.13,.65,'stone');for(let s of [-1,1])mesh(new T.TorusGeometry(.047,.014,5,10),'metal',cx+s*.1,.95,wallZ+.06);
 }
 wallBox((edge+5.12)/2,top/2,wallZ,5.12-edge,top,.46,'z',-1);wallBox(0,2.86,wallZ,10.5,.18,.52,'z',-1);
 for(let x of [-5.05,-1.67,1.67,5.05])box(x,1.4,12.17,.25,2.8,.3,'brick');
 for(let x of [-5.08,5.08]){box(x,3,wallZ,.28,.2,.3,'stone');mesh(new T.SphereGeometry(.14,10,8),'trim',x,3.2,wallZ);}
 // Mural placeholders on inner wall faces. +Z is the entrance; -Z the hall.
 const murals=[
 {id:'mural-01',label:'第一幅',wall:'右侧廊内墙，越过戏台朝向主殿的一端',position:[4.865,1.55,4.8],width:3.65,height:1.2547,side:true},
 {id:'mural-02',label:'第二幅',wall:'主殿右侧内墙',position:[4.515,1.85,-11.75],width:6.1,height:1.3796,side:true},
 {id:'mural-03',label:'第三幅',wall:'主殿后墙右侧',position:[2.25,1.85,-14.865],width:3.35,height:2,side:false},
 {id:'mural-04',label:'第四幅',wall:'主殿后墙左侧',position:[-2.25,1.85,-14.865],width:3.35,height:2,side:false},
 {id:'mural-05',label:'第五幅',wall:'主殿左侧内墙',position:[-4.515,1.85,-11.75],width:6.1,height:1.64395,side:true}
 ];
 mats.mural=new T.MeshStandardMaterial({color:0x668f8c,roughness:1});
 mats.muralBorder=new T.MeshStandardMaterial({color:0xcda85d,roughness:.8});
 for(const m of murals){part(m.id);group.userData={mural:m};const [x,y,z]=m.position;
  box(x,y,z,m.side?.038:m.width,m.height,m.side?m.width:.038,'mural');
  for(const s of [-1,1]){box(x,y+s*m.height/2,z,m.side?.052:m.width+.07,.055,m.side?m.width+.07:.052,'muralBorder');box(x+(m.side?0:s*m.width/2),y,z+(m.side?s*m.width/2:0),m.side?.052:.055,m.height,m.side?.055:.052,'muralBorder');}
 }
 return root;
}
