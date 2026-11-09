// Coordinates normalized to the unchanged 2880 × 990 display image.
// Descriptions refer only to visible forms, not historical identities.
export const OBSERVATIONS=Object.freeze([
 {id:'banners',number:'01',title:'竖向旗幡',center:[.278,.285],zoom:2.55,box:[.22,.06,.12,.48],copy:'画面左侧偏中的位置，可见数面向上展开的旗幡。旗面、长杆与相邻人物形成密集的竖向线条。'},
 {id:'rider',number:'02',title:'骑乘形象',center:[.48,.43],zoom:2.7,box:[.40,.20,.16,.47],copy:'画面中部可见骑在马背上的人物。沿人物与马匹的轮廓，观察骑乘形象和周围步行人物的穿插关系。'},
 {id:'figures',number:'03',title:'并行人物',center:[.565,.755],zoom:2.65,box:[.49,.56,.17,.40],copy:'画面下部偏中，可见数位相邻的人物。衣纹、手部姿态与持物方向交错，构成连续的观看线索。'},
].map(Object.freeze));
// Coordinates refer to each mural's current Web display photograph.
export const OBSERVATIONS_BY_MURAL=Object.freeze({
 'mural-01':OBSERVATIONS,
 'mural-02':[
  {id:'temple-and-table',number:'01',title:'祠门与桌案',center:[.095,.78],zoom:3.8,copy:'画面左下有一座带匾额的建筑，门前可见一张红色桌案，几个人物聚在案旁。李济民将建筑辨读为水龙祠，并把桌案一带解释为设醮场景。',source:'李济民，2025，第119页，图7、8'},
  {id:'cloud-bands',number:'02',title:'云纹分层',center:[.355,.675],zoom:3.6,copy:'顺着卷曲的云纹，可以看到人物和马匹分布在不同高度。《发现报告》将整幅画面概括为由云纹分隔的上、中、下三层。',source:'刘灿姣、林伟，2016，第20页'},
  {id:'upper-flags',number:'03',title:'上层旗幡',center:[.504,.078],zoom:4,copy:'上层人物头顶伸出多根旗杆，红色和深色旗面相间。可沿旗杆往下看，观察旗幡如何穿插在人马之间。',source:'刘灿姣、林伟，2016，第20页'},
 ],
 'mural-05':[
  {id:'raised-implements',number:'01',title:'举起长兵器的人物',center:[.908,.186],zoom:4,copy:'照片右上部仍能看到数道长杆斜向伸出。对照郑富天所引的壁画局部图，可以观察人物举起或向前持握长兵器的姿态。',source:'郑富天，2024，第125–126页，图3-41局部'},
  {id:'remaining-clouds',number:'02',title:'云纹与人物残迹',center:[.606,.427],zoom:4,copy:'画面中部偏右还能看到浅红色的卷云，残存的人物轮廓分布在云纹上下。可对照郑富天对第五铺三层构图的描述，沿着这段云纹寻找分层的痕迹。',source:'郑富天，2024，第25、125页，图3-41（全图）'},
  {id:'temple-remains',number:'03',title:'画中的水龙祠',center:[.971,.665],zoom:4,copy:'照片右下靠近露砖缺口的位置，仍可辨认横栏和框线。郑富天将第五铺下层描绘的建筑辨读为水龙祠，可对照这里残存的建筑线条。',source:'郑富天，2024，第126页'},
 ],
});
let imageWidth=2880,imageHeight=990;
export function setImageSize(w,h){if(!(w>0&&h>0))throw Error("Invalid image size");imageWidth=w;imageHeight=h;}
export function fitImage(width,height){const s=Math.min(width/imageWidth,height/imageHeight);return {width:imageWidth*s,height:imageHeight*s};}
export function clampTransform({zoom,x,y},viewport){zoom=Math.max(1,Math.min(4,zoom));const fit=fitImage(viewport.width,viewport.height),limitX=Math.max(0,(fit.width*zoom-viewport.width)/2),limitY=Math.max(0,(fit.height*zoom-viewport.height)/2);return {zoom,x:Math.max(-limitX,Math.min(limitX,x))||0,y:Math.max(-limitY,Math.min(limitY,y))||0};}
export function regionTransform(region,viewport){const fit=fitImage(viewport.width,viewport.height);return clampTransform({zoom:region.zoom,x:(.5-region.center[0])*fit.width*region.zoom,y:(.5-region.center[1])*fit.height*region.zoom},viewport);}
export function visibleRect(transform,viewport){const fit=fitImage(viewport.width,viewport.height),w=fit.width*transform.zoom,h=fit.height*transform.zoom;return {x:Math.max(0,(.5-(viewport.width/2+transform.x)/w)*imageWidth),y:Math.max(0,(.5-(viewport.height/2+transform.y)/h)*imageHeight),width:Math.min(imageWidth,viewport.width/w*imageWidth),height:Math.min(imageHeight,viewport.height/h*imageHeight)};}
