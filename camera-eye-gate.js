'use strict';
// Fail closed: capture is allowed only after both eyes are detected open.
window.CameraEyeGate = (() => {
 let detectorPromise, detector, timer, generation=0;
 function eyesInsideGuide(points,source) {
  const frame=document.querySelector('.camera-view').getBoundingClientRect();
  const path=document.querySelector('.face-guide path');
  const matrix=path?.getScreenCTM();
  const live=source.tagName==='VIDEO';
  const width=live?source.videoWidth:source.width,height=live?source.videoHeight:source.height;
  if(!matrix||!width||!height||!frame.width||!frame.height)return false;
  const inverse=matrix.inverse(),scale=Math.max(frame.width/width,frame.height/height);
  const offsetX=(frame.width-width*scale)/2,offsetY=(frame.height-height*scale)/2;
  const guides=[...document.querySelectorAll('.face-guide .eye-guide')];
  if(guides.length!==2)return false;
  const eyes=[[33,133,160,159,158,144,145,153],[362,263,385,386,387,380,374,373]];
  const mapped=eyes.map(indices=>indices.map(index=>{
   const p=points[index];if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return null;
   const x=frame.left+offsetX+(live?1-p.x:p.x)*width*scale;
   const y=frame.top+offsetY+p.y*height*scale;
   if(x<frame.left||x>frame.right||y<frame.top||y>frame.bottom)return null;
   return new DOMPoint(x,y).matrixTransform(inverse);
  }));
  if(mapped.some(eye=>eye.some(p=>!p)))return false;
  // Assign by visible horizontal position so mirrored video and photos agree.
  mapped.sort((a,b)=>a.reduce((n,p)=>n+p.x,0)-b.reduce((n,p)=>n+p.x,0));
  return mapped.every((eye,index)=>eye.every(p=>
   path.isPointInFill(p)&&guides[index].isPointInFill(p)));

 }
 function message(result,source) {
  if(result.faceLandmarks?.length!==1)return result.faceLandmarks?.length?'Keep only one face in the camera.':'Position your face in the guide with both eyes visible.';
  if(!eyesInsideGuide(result.faceLandmarks[0],source))return 'Align each eye inside its eye outline.';
  const scores=result.faceBlendshapes?.[0]?.categories || [];
  const left=scores.find(item=>item.categoryName==='eyeBlinkLeft')?.score;
  const right=scores.find(item=>item.categoryName==='eyeBlinkRight')?.score;
  if(!Number.isFinite(left)||!Number.isFinite(right))return 'Keep both eyes clearly visible.';
  return left>=0.35||right>=0.35?'Open both eyes to enable capture.':'';
 }
 async function load() {
  if(!detectorPromise)detectorPromise=(async()=>{
   const {FaceLandmarker,FilesetResolver}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
   const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
   detector=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'},runningMode:'IMAGE',numFaces:2,outputFaceBlendshapes:true,minFaceDetectionConfidence:0.6,minFacePresenceConfidence:0.6});
   return detector;
  })().catch(error=>{detectorPromise=null;throw error;});
  return detectorPromise;
 }
 function stop(){generation++;clearTimeout(timer);}
 function check(source){
  if(!detector)return 'Eye detector is still loading. Please wait.';
  try{return message(detector.detect(source),source);}catch{return 'Eye detection failed. Enable the camera again to retry.';}
 }
 async function start(video,button,hint,onError){
  stop();const token=generation;button.disabled=true;hint.textContent='Loading eye detector...';
  try{await load();}catch{if(token===generation)onError('Eye detector could not load. Check your connection and try again.');return;}
  if(token!==generation)return;
  function tick(){
   if(token!==generation)return;
   const problem=document.hidden||video.readyState<2||video.paused?'Waiting for a clear camera frame...':check(video);
   button.disabled=Boolean(problem);hint.textContent=problem||'Both eyes are open and aligned with the eye outlines. You can take your photo.';
   timer=setTimeout(tick,100);
  }
  tick();
 }
 return {start,stop,check};
})();
