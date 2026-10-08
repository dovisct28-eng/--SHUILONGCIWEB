// One local inference model. No image is uploaded; only model/runtime files use CDN.
// Emscripten's WASM loader uses importScripts; this must be a classic Worker.
let model=null;
self.onmessage=async({data})=>{
 let stage=data.type==='frame'?'POSE_RUNTIME_ERROR':'POSE_RUNTIME_DOWNLOAD';
 try {
  if(data.type==='init'){
   const {FilesetResolver,PoseLandmarker}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
   const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
   stage='POSE_MODEL_DOWNLOAD_OR_INIT';
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
 }catch(error){self.postMessage({type:'error',code:stage,source:data.type==='frame'?'pose-inference':'pose-model',message:String(error.message||error)});}
};
