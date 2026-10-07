// All bounds use source-image coordinates. Layout never accumulates transforms.
const finite = (v, fallback, min, max) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
export const defaultLayout = Object.freeze({ scale:1, anchorX:.5, anchorY:1, offsetX:0, offsetY:0 });
export function cyberDiagnostics(value) {
 if (value == null) return [];
 if (typeof value !== 'object' || Array.isArray(value)) return ['cyber 配置应为对象，已使用默认值'];
 const messages=[];
 if (value.summary != null && typeof value.summary !== 'string') messages.push('cyber.summary 应为作者填写的文字');
 if (value.bounds != null && !validBounds(value.bounds)) messages.push('cyber.bounds 异常，已使用自动边界');
 if (value.layout != null && (typeof value.layout !== 'object' || Array.isArray(value.layout))) messages.push('cyber.layout 异常，已使用默认值');
 for(const [key,min,max] of [['scale',.2,2],['anchorX',0,1],['anchorY',0,1],['offsetX',-.5,.5],['offsetY',-.5,.5]]) {
  const n=value.layout?.[key];if(n!=null && (typeof n !== 'number'||!Number.isFinite(n)||n<min||n>max))messages.push(`cyber.layout.${key} 超出有效范围，已使用安全值`);
 }
 if(value.orbit!=null){
  if(typeof value.orbit!=='object'||Array.isArray(value.orbit))messages.push('cyber.orbit 异常，已使用自动环绕布局');
  else {
   for(const [key,min,max] of [['maxPanels',0,5],['bias',-1,1],['intensity',0,1],['offsetX',-.25,.25],['offsetY',-.25,.25]]){const n=value.orbit[key];if(n!=null&&(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max))messages.push(`cyber.orbit.${key} 超出有效范围，已使用安全值`);}
   if(value.orbit.template!=null&&!['auto','vertical','horizontal','asymmetric'].includes(value.orbit.template))messages.push('cyber.orbit.template 未识别，已使用自动模板');
  }
 }
 return messages;
}
export function validBounds(b) {
 return !!b && ['x','y','width','height'].every(k => typeof b[k] === 'number' && Number.isFinite(b[k])) && b.x >= 0 && b.y >= 0 && b.width > 0 && b.height > 0 && b.x + b.width <= 1.000001 && b.y + b.height <= 1.000001;
}
export function cyberConfig(value = {}) {
 const source=value && typeof value==='object' && !Array.isArray(value)?value:{},layout=source.layout || {},orbit=source.orbit || {};
 const result={...source,summary:typeof source.summary==='string'?source.summary:'',layout:{...layout,scale:finite(layout.scale,1,.2,2),anchorX:finite(layout.anchorX,.5,0,1),anchorY:finite(layout.anchorY,1,0,1),offsetX:finite(layout.offsetX,0,-.5,.5),offsetY:finite(layout.offsetY,0,-.5,.5)},orbit:{...orbit,template:['vertical','horizontal','asymmetric'].includes(orbit.template)?orbit.template:'auto',maxPanels:Math.round(finite(orbit.maxPanels,5,0,5)),bias:finite(orbit.bias,0,-1,1),intensity:finite(orbit.intensity,1,0,1),offsetX:finite(orbit.offsetX,0,-.25,.25),offsetY:finite(orbit.offsetY,0,-.25,.25)}};
 if(validBounds(source.bounds))result.bounds={...source.bounds};else delete result.bounds;
 return result;
}
export function alphaBounds(pixels, width, height, { threshold = 1, padding = .015 } = {}) {
 return alphaGeometry(pixels,width,height,{threshold,padding}).bounds;
}
// One full-resolution pass preserves every alpha>=1 pixel, including thin/faint
// structures. The 24x24 grid is analysis only; it never edits source pixels.
export function alphaGeometry(pixels, width, height, { threshold = 1, padding = .015 } = {}) {
 if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || pixels.length !== width * height * 4) throw Error('Alpha 数据尺寸异常');
 const size=24,counts=Array(size*size).fill(0);
 let minX=width,minY=height,maxX=-1,maxY=-1,transparent=0,total=0,sumX=0,sumY=0;
 for (let y=0;y<height;y++) for (let x=0;x<width;x++) {
  const a=pixels[(y*width+x)*4+3]; if (a < 250) transparent++;
  if (a >= threshold) { minX=Math.min(minX,x); maxX=Math.max(maxX,x); minY=Math.min(minY,y); maxY=Math.max(maxY,y); total++;sumX+=x+.5;sumY+=y+.5;counts[Math.min(size-1,Math.floor(y/height*size))*size+Math.min(size-1,Math.floor(x/width*size))]++; }
 }
 if (maxX < 0) throw Error('人物抠图有效边界为空');
 if (transparent/(width*height) < .005) throw Error('人物抠图 Alpha 基本全不透明，请导出透明背景或提供手动 bounds');
 const raw={x:minX/width,y:minY/height,width:(maxX-minX+1)/width,height:(maxY-minY+1)/height};
 const centroid={x:sumX/total/width,y:sumY/total/height};
 const distribution={left:0,right:0,upper:0,lower:0};
 counts.forEach((n,i)=>{distribution[(i%size+.5)/size<raw.x+raw.width/2?'left':'right']+=n/total;distribution[(Math.floor(i/size)+.5)/size<raw.y+raw.height/2?'upper':'lower']+=n/total;});
 const px=Math.max(2,Math.ceil(width*padding)),py=Math.max(2,Math.ceil(height*padding));
 minX=Math.max(0,minX-px);minY=Math.max(0,minY-py);maxX=Math.min(width-1,maxX+px);maxY=Math.min(height-1,maxY+py);
 const bounds={x:minX/width,y:minY/height,width:(maxX-minX+1)/width,height:(maxY-minY+1)/height};
 return {bounds,raw,centroid,aspect:raw.width*width/(raw.height*height),distribution,coverage:total/(width*height),grid:{size,counts,width,height}};
}
// Cache only tiny measurements, never decoded images or canvas pixel arrays.
const measured = new Map();
export function measureFigure(image, key) {
 if (measured.has(key)) return {...measured.get(key),cacheHit:true};
 const start=performance.now(),canvas=document.createElement('canvas');canvas.width=image.naturalWidth || image.width;canvas.height=image.naturalHeight || image.height;
 try {
  const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const geometry=alphaGeometry(ctx.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
  const result={bounds:geometry.bounds,geometry,width:canvas.width,height:canvas.height,scanMs:performance.now()-start};
  measured.set(key,result);if(measured.size>64)measured.delete(measured.keys().next().value);return {...result,cacheHit:false};
 } finally { canvas.width=canvas.height=0; }
}
export function stageSafeArea(width, height, panelLeft = width, revealed = false) {
 const x=width*(revealed?.17:.24),right=revealed?panelLeft-72:width*.74;
 return {x,y:104,width:Math.max(1,right-x),height:Math.max(1,height-104-(revealed?242:200))};
}
export function figureLayout({width,height,bounds,safe,layout = defaultLayout}) {
 if (![width,height,safe.width,safe.height].every(n=>Number.isFinite(n)&&n>0) || !validBounds(bounds)) throw Error('人物构图边界异常');
 const bw=bounds.width*width,bh=bounds.height*height,c=cyberConfig({layout}).layout;
 const fitScale=Math.min(safe.width/bw,safe.height/bh)*.96;
 // Positive author scales respect the full silhouette safety ceiling.
 const scale=Math.min(fitScale*c.scale,Math.min(safe.width/bw,safe.height/bh));
 const desiredX=safe.x+safe.width*.5+safe.width*c.offsetX;
 const desiredY=safe.y+safe.height+safe.height*c.offsetY;
 const bx=Math.max(safe.x,Math.min(safe.x+safe.width-bw*scale,desiredX-bw*scale*c.anchorX));
 const by=Math.max(safe.y,Math.min(safe.y+safe.height-bh*scale,desiredY-bh*scale*c.anchorY));
 return {scale,x:bx-bounds.x*width*scale,y:by-bounds.y*height*scale,fitScale,effective:{x:bx,y:by,width:bw*scale,height:bh*scale}};
}
export function particleGrid(aspect, budget = 80000) {
 if (!Number.isFinite(aspect) || aspect<=0) throw Error('人物比例异常');
 const x=Math.max(1,Math.min(400,Math.floor(Math.sqrt(budget*aspect))));
 const y=Math.max(1,Math.min(400,Math.floor(budget/(x+1))-1));
 return {x,y,vertices:(x+1)*(y+1)};
}
export const canEnterCyber = item => !!(item?.figurePath || item?.resources?.figure || (item?.linePath && item?.colorPath));
