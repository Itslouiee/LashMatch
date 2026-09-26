'use strict';
const video=$('#camera-video'),canvas=$('#photo-canvas'),capture=$('#capture-photo'),retake=$('#retake-photo'),nextPhoto=$('#photo-next');
let cameraStream=null,cameraBusy=false,cameraGeneration=0,photoReady=false,photoUrl=null;
function referenceArt(box,source='ref7.png'){return '<svg viewBox="'+box+'" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="'+source+'" width="1302" height="865"/></svg>';}
$('.sidebar-art').innerHTML=referenceArt('0 552 233 250');$('.preference-decoration').innerHTML=referenceArt('1095 79 207 786');
const captureDescription=$('.question-copy>p:last-child').textContent;
function setReview(active){
 document.body.classList.toggle('review-mode',active);$('.capture-tips').hidden=active;$('.review-tips').hidden=!active;$('.review-actions').hidden=!active;$('.quiz-actions').hidden=active;
 $('#photo-title').textContent=active?'Review Photo':'Take a Photo';$('#photo-title').setAttribute('tabindex','-1');
 $('.question-copy>p:last-child').textContent=active?'Does this look good? You can retake the photo or use this one to see your recommended lash styles.':captureDescription;
 $('.preference-decoration').innerHTML=active?referenceArt('1095 74 207 784','ref8.png'):referenceArt('1095 79 207 786');
 $('.preference-decoration').setAttribute('aria-label',active?'Same Beauty, Brighter Days. Confidence looks good on you.':'See the real you with the perfect lashes. Confidence looks good on you.');
 document.title=(active?'Review Photo':'Take a Photo')+' | LashMatch';
 if(active){$('#photo-title').focus({preventScroll:true});if(innerWidth<=800)document.body.scrollTop=0;}
}
$('#review-retake').onclick=()=>startCamera();
$('#use-photo').onclick=()=>{
 if(!photoReady)return;
 let answers=null;try{answers=JSON.parse(sessionStorage.getItem('lashmatch-result-'+user.id)||'null');}catch{}
 if(answers&&['natural','balanced','dramatic','textured'].includes(answers.finish)&&['almond','round','hooded','monolid','unsure'].includes(answers.eye_shape)&&['event','everyday'].includes(answers.occasion)){showResult(answers);}
 else{open('<p class="eyebrow">PHOTO SELECTED</p><h2>Your photo is ready.</h2><p>Complete your lash preferences to see your recommended styles.</p><button class="button" id="photo-quiz">Take the Quiz</button>');$('#photo-quiz').onclick=()=>location.assign('preference.html?v=5');}
};
function stopCamera(){cameraGeneration++;if(cameraStream)cameraStream.getTracks().forEach(track=>track.stop());cameraStream=null;video.srcObject=null;capture.disabled=true;}
function cameraMessage(message,retry=false){$('#camera-feedback').hidden=false;$('#camera-status').textContent=message;$('#camera-retry').hidden=!retry;}
async function startCamera(){
 if(cameraBusy)return;setReview(false);cameraBusy=true;stopCamera();const generation=cameraGeneration;photoReady=false;nextPhoto.disabled=true;canvas.hidden=true;video.hidden=false;retake.hidden=true;capture.hidden=false;$('#capture-hint').textContent='Keep good lighting for a clearer result.';cameraMessage('Starting your camera...');
 try{
 if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia)throw new Error('Open LashMatch on localhost or HTTPS to use your camera.');
 const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:1280},height:{ideal:960}},audio:false});
 if(generation!==cameraGeneration){stream.getTracks().forEach(track=>track.stop());return;}cameraStream=stream;video.srcObject=stream;await video.play();
 if(generation!==cameraGeneration)return;
 $('#camera-feedback').hidden=true;capture.disabled=false;
 stream.getVideoTracks()[0].addEventListener('ended',()=>{if(!photoReady){stopCamera();cameraMessage('Your camera disconnected. Reconnect it and try again.',true);}});
 }catch(error){if(generation!==cameraGeneration)return;stopCamera();const messages={NotAllowedError:'Camera access was blocked. Allow camera access in your browser settings, then try again.',NotFoundError:'No camera was found. Connect a camera and try again.',NotReadableError:'Your camera could not start. Close other apps using it, then try again.'};cameraMessage(messages[error.name]||error.message||'Unable to start the camera. Please try again.',true);}finally{cameraBusy=false;}
}
$('#camera-retry').onclick=startCamera;retake.onclick=startCamera;
capture.onclick=()=>{
 if(!cameraStream||video.readyState<2||!video.videoWidth)return;
 const frame=$('.camera-view').getBoundingClientRect(),ratio=frame.width/frame.height,sourceRatio=video.videoWidth/video.videoHeight;
 const width=sourceRatio>ratio?video.videoHeight*ratio:video.videoWidth,height=sourceRatio>ratio?video.videoHeight:video.videoWidth/ratio;
 canvas.width=Math.round(width);canvas.height=Math.round(height);const context=canvas.getContext('2d');context.setTransform(-1,0,0,1,canvas.width,0);context.drawImage(video,(video.videoWidth-width)/2,(video.videoHeight-height)/2,width,height,0,0,canvas.width,canvas.height);
 photoReady=true;canvas.hidden=false;video.hidden=true;capture.hidden=true;retake.hidden=false;nextPhoto.disabled=false;$('#capture-hint').textContent='Photo captured. Continue or retake your photo.';stopCamera();setReview(true);
};
nextPhoto.onclick=()=>{if(photoReady)setReview(true);};
$$('[data-quiz]').forEach(button=>button.onclick=()=>location.assign('preference.html?v=5'));
$$('[data-preview]').forEach(button=>button.onclick=()=>{if(!photoReady&&!cameraStream)startCamera();});
$$('[data-results]').forEach(button=>button.onclick=()=>location.assign('home.html#results'));$$('[data-saved]').forEach(button=>button.onclick=()=>location.assign('saved.html'));
$$('[data-profile]').forEach(button=>button.onclick=()=>{showAccount();$('#account-quiz').onclick=()=>location.assign('preference.html?v=5');$('#logout').onclick=async()=>{try{await api('logout',{});stopCamera();location.replace('login.html');}catch(error){$('.message',content).textContent=error.message;}};});
$('#notifications').onclick=()=>open('<h2>Notifications</h2><p>You have no new notifications.</p>');$('#dashboard-search').onsubmit=event=>{event.preventDefault();showStudios();};
window.addEventListener('pagehide',()=>{stopCamera();if(photoUrl)URL.revokeObjectURL(photoUrl);});window.addEventListener('pageshow',event=>{if(event.persisted&&!photoReady)startCamera();});
async function loadTryOn(){try{const session=await api('session');if(!session.user){location.replace('login.html');return;}user=session.user;csrf=session.csrf;$('#greeting').textContent='Hi, '+user.name.split(' ')[0]+'!';$('#avatar').textContent=user.name.charAt(0).toUpperCase();const [history,catalog]=await Promise.all([api('matches'),api('catalog')]);const match=history.matches[0]||null;if(!match){location.replace('preference.html?v=5');return;}window.initializeTryOnStyles(match,catalog.styles);try{if(match)sessionStorage.setItem('lashmatch-result-'+user.id,JSON.stringify(match));else sessionStorage.removeItem('lashmatch-result-'+user.id);}catch{}const completed=Boolean(match);renderQuizProgress(4,completed?3:-1);if(!completed)$('#photo-back').href='home.html';$('.dashboard').hidden=false;$('#session-status').hidden=true;await startCamera();}catch(error){$('#session-status').innerHTML='<div><p>Unable to open your account.</p><button class="button" id="retry-session">Retry</button></div>';$('#session-status p').textContent=error.message||'Unable to open your account.';const quizLink=document.createElement('a');quizLink.href='preference.html?v=5';quizLink.textContent='Take the Quiz';$('#session-status>div').append(quizLink);$('#retry-session').onclick=loadTryOn;}}
if(document.readyState==='complete')loadTryOn();else document.addEventListener('DOMContentLoaded',loadTryOn,{once:true});
