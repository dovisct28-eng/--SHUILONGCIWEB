// Coordinates normalized to the unchanged 2880 × 990 display image.
// Descriptions refer only to visible forms, not historical identities.
export const OBSERVATIONS=Object.freeze([
 {id:'banners',number:'01',title:'竖向旗幡',center:[.278,.285],zoom:2.55,box:[.22,.06,.12,.48],copy:'画面左侧偏中的位置，可见数面向上展开的旗幡。旗面、长杆与相邻人物形成密集的竖向线条。'},
 {id:'rider',number:'02',title:'骑乘形象',center:[.48,.43],zoom:2.7,box:[.40,.20,.16,.47],copy:'画面中部可见骑在马背上的人物。沿人物与马匹的轮廓，观察骑乘形象和周围步行人物的穿插关系。'},
 {id:'figures',number:'03',title:'并行人物',center:[.565,.755],zoom:2.65,box:[.49,.56,.17,.40],copy:'画面下部偏中，可见数位相邻的人物。衣纹、手部姿态与持物方向交错，构成连续的观看线索。'},
].map(Object.freeze));
export function fitImage(width,height){const s=Math.min(width/2880,height/990);return {width:2880*s,height:990*s};}
export function clampTransform({zoom,x,y},viewport){zoom=Math.max(1,Math.min(4,zoom));const fit=fitImage(viewport.width,viewport.height),limitX=Math.max(0,(fit.width*zoom-viewport.width)/2),limitY=Math.max(0,(fit.height*zoom-viewport.height)/2);return {zoom,x:Math.max(-limitX,Math.min(limitX,x))||0,y:Math.max(-limitY,Math.min(limitY,y))||0};}
export function regionTransform(region,viewport){const fit=fitImage(viewport.width,viewport.height);return clampTransform({zoom:region.zoom,x:(.5-region.center[0])*fit.width*region.zoom,y:(.5-region.center[1])*fit.height*region.zoom},viewport);}
export function visibleRect(transform,viewport){const fit=fitImage(viewport.width,viewport.height),w=fit.width*transform.zoom,h=fit.height*transform.zoom;return {x:Math.max(0,(.5-(viewport.width/2+transform.x)/w)*2880),y:Math.max(0,(.5-(viewport.height/2+transform.y)/h)*990),width:Math.min(2880,viewport.width/w*2880),height:Math.min(990,viewport.height/h*990)};}
