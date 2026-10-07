// One local inference model. No image is uploaded; only model/runtime files use CDN.
// Emscripten's WASM loader uses importScripts; this must be a classic Worker.
const runtime=import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
let model=null;
self.onmessage=async({data})=>{
 try {
  if(data.type==='init'){
   const {FilesetResolver,PoseLandmarker}=await runtime;
   const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
   model=await PoseLandmarker.createFromOptions(files,{
    baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',delegate:'CPU'},
    runningMode:'VIDEO',numPoses:data.maxPeople,minPoseDetectionConfidence:.6,minPosePresenceConfidence:.6,
    minTrackingConfidence:.6,outputSegmentationMasks:false
   });self.postMessage({type:'ready'});
  }else if(data.type==='frame'){
   const start=performance.now();
   try {const result=model.detectForVideo(data.image,data.at);self.postMessage({type:'poses',session:data.session,at:data.at,poses:result.landmarks,inferenceMs:performance.now()-start});}
   finally {data.image.close();}
  }else if(data.type==='close'){model?.close();model=null;self.close();}
 }catch(error){self.postMessage({type:'error',message:String(error.message||error)});}
};
