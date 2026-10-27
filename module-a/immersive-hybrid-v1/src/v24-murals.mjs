// V2.4 planning data only; coordinates are design-model units, not survey data.
// The navigation/reading cameras for 03–05 are unresolved candidate values.
const source=name=>new URL(`../../../水龙祠壁画素材/网页展示图/${name}`,import.meta.url).href;
export const V24_MURALS=Object.freeze([
 {id:'mural-01',label:'第一幅',source:source('mural-01-display.webp'),position:[4.865,1.55,4.8],rotation:-Math.PI/2,width:3.65,height:1.2547,stopCamera:null,readingCamera:null,transition:null,status:'v23-implemented'},
 {id:'mural-02',label:'第二幅',source:source('mural-02-display.webp'),position:[4.515,1.85,-11.75],rotation:-Math.PI/2,width:6.1,height:1.3796,stopCamera:{position:[1.4,1.85,-11.75],target:[4.515,1.85,-11.75],fov:48},readingCamera:null,transition:null,status:'candidate-not-implemented'},
 {id:'mural-03',label:'第三幅',source:null,position:[2.25,1.85,-14.865],rotation:0,width:3.35,height:2,stopCamera:null,readingCamera:null,transition:null,status:'planned'},
 {id:'mural-04',label:'第四幅',source:null,position:[-2.25,1.85,-14.865],rotation:0,width:3.35,height:2,stopCamera:null,readingCamera:null,transition:null,status:'planned'},
 {id:'mural-05',label:'第五幅',source:null,position:[-4.515,1.85,-11.75],rotation:Math.PI/2,width:6.1,height:1.64395,stopCamera:null,readingCamera:null,transition:null,status:'planned'},
]);

// A front-facing PlaneGeometry with Y rotation. Ordering is TL, TR, BR, BL;
// UV direction remains the original texture's direction, without mirroring.
export function muralGeometry(m){
 const [x,y,z]=m.position,axis=[Math.cos(m.rotation),0,-Math.sin(m.rotation)],normal=[Math.sin(m.rotation),0,Math.cos(m.rotation)];
 const at=(u,v)=>[x+axis[0]*u,y+v,z+axis[2]*u];
 const w=m.width/2,h=m.height/2;
 return {normal,corners:[at(-w,h),at(w,h),at(w,-h),at(-w,-h)]};
}
