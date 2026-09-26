'use strict';
(() => {
 const styles=['Classic','Hybrid','Wispy','Volume'].map(name=>[name,looks[name].description]);
 const lashProfiles=[{count:20,length:.13,width:.006},{count:32,length:.19,width:.007},{count:36,length:.21,width:.007},{count:52,length:.23,width:.009}];
 let lashesVisible=true;
 let detectorPromise, eyes=null, activeEye='left', activeStyle=0, strength=1, revision=0;
 const stage=document.createElement('section');stage.className='eye-stage';stage.hidden=true;
 stage.innerHTML='<div class="eye-preview-column"><div class="eye-photo"><canvas id="eye-preview" width="700" height="630" aria-label="Zoomed left eye"></canvas><span class="zoom-label">&#9906; Zoomed View</span><div class="eye-feedback"><p id="eye-status" role="status">Finding your eyes...</p><button id="eye-retry" type="button" hidden>Try Again</button></div></div><div class="eye-toggle" role="group" aria-label="Choose your eye"><button type="button" data-eye="left" aria-pressed="true" disabled>&#9673; Left Eye</button><button type="button" data-eye="right" aria-pressed="false" disabled>&#9673; Right Eye</button></div><p id="eye-announcement" class="eye-note" role="status"></p></div><div class="eye-recommendations"><h2><svg aria-hidden="true"><use href="#spark"/></svg> Recommended for You</h2><p id="eye-recommendation-copy">Explore these lash styles on your eye.</p><div class="eye-style-list" role="group" aria-label="Lash styles">'+styles.map((s,i)=>'<button class="eye-style" type="button" data-eye-style="'+i+'" aria-pressed="'+(i===0)+'"><svg viewBox="'+[801,941,1081,1221][i]+' 465 117 96" aria-hidden="true"><image href="ref9.png" width="1620" height="1080"/></svg><strong>'+s[0]+'</strong><small>'+s[1]+'</small><span class="style-check" aria-hidden="true"></span></button>').join('')+'</div><button id="eye-customize" class="button" type="button" disabled>Customize &rarr;</button><div id="eye-custom-controls" hidden><label for="lash-strength">Lash length</label><input id="lash-strength" type="range" min="0.5" max="1.6" step="0.1" value="1"><p class="eye-note">Illustrative lash preview</p></div></div><button id="eye-back" type="button">&larr; Back</button>';
 $('.photo-layout').after(stage);
 const lashActions=document.createElement('div');lashActions.className='lash-selection-actions';
 const lashBack=$('#eye-back');lashBack.before(lashActions);lashActions.append(lashBack);
 const lashDone=document.createElement('button');lashDone.id='lash-done';lashDone.type='button';lashDone.className='button';lashDone.textContent='Done';lashDone.disabled=true;lashActions.append(lashDone);
 lashDone.onclick=showFinishedPreview;
 const colorModes=[
  {id:'full',name:'Full Color',description:'One color across the entire lash.',y:383,colors:['#624637','#ab4e70','#df77ac','#8060b1','#3e879f','#375841'],names:['Brown','Rose','Pink','Purple','Teal','Green']},
  {id:'accent',name:'Color Accent',description:'Black lashes with a touch of your chosen color.',y:562,colors:['#ea83b0','#9270b5','#598dcb','#408369','#d2aa50','#b03040'],names:['Pink','Purple','Blue','Green','Gold','Red']},
  {id:'mix',name:'Color Mix',description:'Black lashes with a blend of multiple colors.',y:744,colors:['#ea83b0','#efa078','#e6bf59','#408369','#598dcb','#9270b5'],names:['Pink','Peach','Gold','Green','Blue','Purple']}
 ];
 let colorMode=null,colorIndex=0;
 const colorStage=document.createElement('section');colorStage.className='color-stage';colorStage.hidden=true;colorStage.setAttribute('aria-label','Choose your color style');
 const colorArt=(box,fit='slice')=>{
  const [x,y,width,height]=box.split(' ').map(Number),clipId='color-crop-'+[x,y,width,height].join('-');
  return '<svg viewBox="'+box+'" preserveAspectRatio="xMidYMid '+fit+'" aria-hidden="true"><defs><clipPath id="'+clipId+'" clipPathUnits="userSpaceOnUse"><rect x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" rx="8"/></clipPath></defs><image href="r1.png" width="1620" height="1080" clip-path="url(#'+clipId+')"/></svg>';
 };
 colorStage.innerHTML='<div class="color-options">'+colorModes.map(mode=>'<article class="color-option"><span class="color-example">'+colorArt('344 '+mode.y+' 297 150','meet')+'</span><button type="button" class="color-mode-choice" data-color-mode="'+mode.id+'" aria-label="Preview '+mode.name+'"><span class="color-copy"><strong>'+mode.name+'</strong><span>'+mode.description+'</span></span><span class="color-arrow" aria-hidden="true">&#8250;</span></button><div class="color-swatches" role="group" aria-label="'+mode.name+' colors">'+mode.colors.map((color,i)=>'<button type="button" data-color-pick="'+mode.id+'" data-color-index="'+i+'" style="--swatch:'+color+'" aria-label="Preview '+mode.name+' in '+mode.names[i]+'" title="'+mode.names[i]+'"></button>').join('')+'</div></article>').join('')+'</div><button type="button" id="color-back">&#8249; Back</button>';
 stage.after(colorStage);
 const selectedCard=document.createElement('aside');selectedCard.className='color-selected';selectedCard.hidden=true;selectedCard.innerHTML='<small>Selected Lash Style</small><div><span id="color-selected-image"></span><span><strong id="color-selected-name"></strong><span id="color-selected-description"></span></span></div>';
 $('.question-copy').prepend(selectedCard);
 function showColorStage(){
  $$('[data-color-mode]').forEach(button=>{const isSelected=button.dataset.colorMode===colorMode;button.setAttribute('aria-pressed',String(isSelected));button.closest('.color-option').classList.toggle('is-selected',isSelected);});
  stage.hidden=true;colorStage.hidden=false;selectedCard.hidden=false;document.body.classList.add('color-mode');
  $('#photo-title').textContent='Choose Your Color Style';$('.question-copy .eyebrow').textContent='LASHMATCH CUSTOMIZE';$('.question-copy>p:last-of-type').textContent='Make it yours! Pick how you want to add color to your '+styles[activeStyle][0]+' lashes.';
  $('#color-selected-name').textContent=styles[activeStyle][0]+' Lashes';$('#color-selected-description').textContent=styles[activeStyle][1];$('#color-selected-image').innerHTML='<svg viewBox="'+[801,941,1081,1221][activeStyle]+' 465 117 96" aria-hidden="true"><image href="ref9.png" width="1620" height="1080"/></svg>';
  $('.preference-decoration').innerHTML=colorArt('1364 99 256 981');$('.preference-decoration').setAttribute('aria-label','Same Beauty, Brighter Days. Confidence looks good on you.');
  document.title='Choose Your Color Style | LashMatch';$('#photo-title').focus({preventScroll:true});
 }
 function leaveColorStage(){
  colorStage.hidden=true;selectedCard.hidden=true;stage.hidden=false;document.body.classList.remove('color-mode');
  $('#photo-title').textContent='Preview Your Quiz Match';$('.question-copy .eyebrow').textContent='LASHMATCH TRY-ON';$('.question-copy>p:last-of-type').textContent='See your recommended lash style on your eye, then customize your look.';
  $('.preference-decoration').innerHTML=referenceArt('1095 79 207 786');$('.preference-decoration').setAttribute('aria-label','See the real you with the perfect lashes. Confidence looks good on you.');
  document.title='Preview Your Quiz Match | LashMatch';$('#eye-customize').focus({preventScroll:true});drawEye();
 }
 function applyColor(mode,index){if(mode==='full'){showFullColor(colorModes[0].colors[index]);return;}if(mode==='accent'){showAccent(colorModes[1].colors[index]);return;}if(mode==='mix'){showMix(colorModes[2].colors[index]);return;}colorMode=mode;colorIndex=index;leaveColorStage();$('#eye-announcement').textContent+=' · '+colorModes.find(item=>item.id===mode).name;}
 $('#color-back').onclick=leaveColorStage;
 $$('[data-color-mode]').forEach(button=>button.onclick=()=>button.dataset.colorMode==='full'?showFullColor():button.dataset.colorMode==='accent'?showAccent():showMix());
 $$('[data-color-pick]').forEach(button=>button.onclick=()=>applyColor(button.dataset.colorPick,Number(button.dataset.colorIndex)));
 let fullColor='#ec6896',colorIntensity=0.8,colorPlacement='even',zoomAmount=1;
 const fullPanel=document.createElement('section');fullPanel.className='full-color-panel';fullPanel.hidden=true;fullPanel.setAttribute('aria-label','Full Color settings');
 const fullPalette=[['Pink','#ec6896'],['Purple','#9560b7'],['Blue','#2495df'],['Green','#62ae72'],['Red','#e84158'],['Yellow','#fac527'],['White','#ffffff']];
 const placementArt='<svg viewBox="0 0 180 60" aria-hidden="true">'+Array.from({length:26},(_,i)=>{const x=15+i*6,y=43-18*Math.sin(i/25*Math.PI);return '<path d="M'+x+' '+y+'q'+((i-12)*.45)+' -10 '+((i-12)*.7)+' -23"/>';}).join('')+'</svg>';
 fullPanel.innerHTML='<div class="full-setting"><h2><span>1</span>Choose your color</h2><p>Pick a color for your entire lashes.</p><div class="full-palette">'+fullPalette.map(([name,hex])=>'<button type="button" data-full-color="'+hex+'" aria-pressed="false"><span style="background:'+hex+'"></span>'+name+'</button>').join('')+'<label class="custom-lash-color"><input id="custom-lash-color" type="color" value="#ec6896" aria-label="Choose custom lash color"><span>Custom</span></label></div></div><div class="full-setting"><h2><span>2</span>Adjust color intensity</h2><p>Control how bold the color is.</p><label class="intensity-control"><span>Subtle</span><input id="color-intensity" aria-label="Color intensity" type="range" min="0" max="100" value="80"><span>Bold</span></label></div><div class="full-setting"><h2><span>3</span>Adjust color placement</h2><p>Choose how the color is applied to your lashes.</p><div class="placement-options"><button type="button" data-placement="even" aria-pressed="true">'+placementArt+'<strong>Mixed Evenly</strong><small>Color is spread throughout the lashes.</small></button><button type="button" data-placement="tips" aria-pressed="false">'+placementArt+'<strong>Colored Tips</strong><small>Color focused on the lash tips.</small></button></div></div>';
 $('.eye-recommendations').after(fullPanel);
 const fullDone=document.createElement('button');fullDone.id='full-done';fullDone.className='button';fullDone.type='button';fullDone.hidden=true;fullDone.textContent='Done';
 const fullBack=document.createElement('button');fullBack.id='full-back';fullBack.type='button';fullBack.hidden=true;fullBack.textContent='← Back';const fullActions=document.createElement('div');fullActions.className='full-color-actions';fullActions.hidden=true;fullActions.append(fullBack,fullDone);stage.append(fullActions);
 const zoomControls=document.createElement('div');zoomControls.className='eye-zoom-controls';zoomControls.innerHTML='<button id="eye-zoom-out" type="button">− Full face</button><input id="eye-zoom" type="range" min="0" max="100" value="100" aria-label="Preview zoom"><button id="eye-zoom-in" type="button">+ Eye</button>';
 $('.eye-toggle').after(zoomControls);
 function setZoom(value){zoomAmount=value;$('#eye-zoom').value=String(value*100);drawEye();}
 $('#eye-zoom').oninput=event=>setZoom(Number(event.target.value)/100);$('#eye-zoom-out').onclick=()=>setZoom(0);$('#eye-zoom-in').onclick=()=>setZoom(1);
 function syncFullColor(){
  $$('[data-full-color]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.fullColor===fullColor)));
  $('#custom-lash-color').value=fullColor;fullPanel.style.setProperty('--lash-color',fullColor);drawEye();
 }
 function exitFullColor(){document.body.classList.remove('full-color-mode','accent-mode','mix-mode');mixPanel.hidden=true;selectedCard.hidden=true;accentPanel.hidden=true;accentControls.hidden=true;fullPanel.hidden=true;fullActions.hidden=true;fullDone.hidden=true;fullBack.hidden=true;$('.eye-recommendations').hidden=false;$('#eye-back').hidden=false;}
 function showFullColor(hex){
  if(hex)fullColor=hex;colorMode='full';leaveColorStage();document.body.classList.add('full-color-mode');fullPanel.hidden=false;fullActions.hidden=false;fullDone.hidden=false;fullBack.hidden=false;$('.eye-recommendations').hidden=true;$('#eye-back').hidden=true;
  $('#photo-title').textContent='Full Color';$('.question-copy .eyebrow').textContent='LASHMATCH CUSTOMIZE';$('.question-copy>p:last-of-type').textContent='One color across the entire lash.';document.title='Full Color | LashMatch';setZoom(1);syncFullColor();$('#photo-title').focus({preventScroll:true});
 }
 fullBack.onclick=()=>{exitFullColor();showColorStage();};
 fullDone.onclick=showFinishedPreview;
 $$('[data-full-color]').forEach(button=>button.onclick=()=>{fullColor=button.dataset.fullColor;syncFullColor();});
 $('#custom-lash-color').oninput=event=>{fullColor=event.target.value;syncFullColor();};
 $('#color-intensity').oninput=event=>{colorIntensity=Number(event.target.value)/100;drawEye();};
 $$('[data-placement]').forEach(button=>button.onclick=()=>{colorPlacement=button.dataset.placement;$$('[data-placement]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));drawEye();});
 let accentColors=['#e27b9e','#a44ac8'],accentSlot=0,accentIntensity=.7,accentPlacement='middle';
 const accentPalette=[['Pink','#e27b9e'],['Purple','#a44ac8'],['Red','#df3851'],['Blue','#509de1'],['Green','#4ca66b'],['Yellow','#f7cb42'],['White','#ffffff']];
 const accentPlacements=[['inner','Inner Accent','Colored strands on the inner part of the lashes.',369],['middle','Middle Accent','Colored strands on the middle section of the lashes.',499],['outer','Outer Accent','Colored strands on the outer part of the lashes.',626],['full','Full Accent','Accent colors throughout the entire lash line.',756]];
 const accentPanel=document.createElement('section');accentPanel.className='accent-placement-panel';accentPanel.hidden=true;accentPanel.setAttribute('aria-label','Accent color placement');
 accentPanel.innerHTML='<h2>Color Placement</h2><p>Where do you want the accent colors?</p><div class="accent-placement-list" role="group" aria-label="Accent placement">'+accentPlacements.map(([id,name,description,y])=>'<button type="button" data-accent-placement="'+id+'" aria-pressed="'+(id==='middle')+'"><span class="accent-placement-image"><svg viewBox="870 '+y+' 188 112" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><clipPath id="accent-crop-'+id+'"><rect x="870" y="'+y+'" width="188" height="112" rx="6"/></clipPath></defs><image href="r3.png" width="1620" height="1080" clip-path="url(#accent-crop-'+id+')"/></svg></span><span class="accent-placement-copy"><strong>'+name+'</strong><small>'+description+'</small></span><span class="accent-radio" aria-hidden="true"></span></button>').join('')+'</div>';
 fullPanel.after(accentPanel);
 const accentControls=document.createElement('section');accentControls.className='accent-controls';accentControls.hidden=true;accentControls.setAttribute('aria-label','Accent colors');
 accentControls.innerHTML='<div class="accent-color-slots">'+[0,1].map(slot=>'<div><strong>Color '+(slot+1)+'</strong><div class="accent-slot-controls"><button type="button" data-accent-cycle="'+slot+'" data-direction="-1" aria-label="Previous color '+(slot+1)+'">&#8249;</button><button type="button" data-accent-slot="'+slot+'" aria-label="Edit color '+(slot+1)+'" aria-pressed="'+(slot===0)+'"></button><button type="button" data-accent-cycle="'+slot+'" data-direction="1" aria-label="Next color '+(slot+1)+'">&#8250;</button></div></div>').join('')+'</div><div class="accent-palette" role="group" aria-label="Color for selected slot">'+accentPalette.map(([name,hex])=>'<button type="button" data-accent-color="'+hex+'" style="--accent-swatch:'+hex+'" aria-label="'+name+'" title="'+name+'"></button>').join('')+'<input type="color" id="accent-custom" aria-label="Custom accent color"></div><label class="accent-intensity-label" for="accent-intensity">Adjust accent intensity</label><div class="intensity-control"><span>Subtle</span><input type="range" id="accent-intensity" min="0" max="100" value="70" aria-label="Accent intensity"><span>Bold</span></div>';
 $('.eye-preview-column').append(accentControls);
 function syncAccent(){
  $$('[data-accent-slot]').forEach(button=>{const slot=Number(button.dataset.accentSlot);button.style.background=accentColors[slot];button.setAttribute('aria-pressed',String(slot===accentSlot));});
  $$('[data-accent-color]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.accentColor===accentColors[accentSlot])));$('#accent-custom').value=accentColors[accentSlot];drawEye();
 }
 function showAccent(hex){
  if(hex)accentColors[0]=hex;colorMode='accent';leaveColorStage();document.body.classList.add('full-color-mode','accent-mode');fullPanel.hidden=true;accentPanel.hidden=false;accentControls.hidden=false;fullActions.hidden=false;fullDone.hidden=false;fullBack.hidden=false;$('.eye-recommendations').hidden=true;$('#eye-back').hidden=true;
  $('#photo-title').textContent='Color Accent';$('.question-copy .eyebrow').textContent='LASHMATCH CUSTOMIZE';$('.question-copy>p:last-of-type').textContent='Pick two accent colors.';document.title='Color Accent | LashMatch';
  $('.preference-decoration').innerHTML=colorArt('1364 99 256 981');$('.preference-decoration').setAttribute('aria-label','Same Beauty, Brighter Days. Confidence looks good on you.');setZoom(1);syncAccent();$('#photo-title').focus({preventScroll:true});
 }
 $$('[data-accent-slot]').forEach(button=>button.onclick=()=>{accentSlot=Number(button.dataset.accentSlot);syncAccent();});
 $$('[data-accent-cycle]').forEach(button=>button.onclick=()=>{accentSlot=Number(button.dataset.accentCycle);const current=accentPalette.findIndex(([,hex])=>hex===accentColors[accentSlot]);accentColors[accentSlot]=accentPalette[(current+Number(button.dataset.direction)+accentPalette.length)%accentPalette.length][1];syncAccent();});
 $$('[data-accent-color]').forEach(button=>button.onclick=()=>{accentColors[accentSlot]=button.dataset.accentColor;syncAccent();});
 $('#accent-custom').oninput=event=>{accentColors[accentSlot]=event.target.value;syncAccent();};
 $('#accent-intensity').oninput=event=>{accentIntensity=Number(event.target.value)/100;drawEye();};
 $$('[data-accent-placement]').forEach(button=>button.onclick=()=>{accentPlacement=button.dataset.accentPlacement;$$('[data-accent-placement]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));drawEye();});
 function accentAt(outer){return accentPlacement==='full'||accentPlacement==='inner'&&outer<.34||accentPlacement==='middle'&&outer>=.33&&outer<=.67||accentPlacement==='outer'&&outer>.66;}
 const mixPalette=[['Pink','#ff7faf'],['Purple','#ad64c7'],['Blue','#0098ff'],['Green','#46bc7e'],['Red','#df343a'],['Yellow','#f9c43f'],['White','#ffffff'],['Orange','#ff8658'],['Teal','#2abfb5'],['Lavender','#b58be5']];
 let mixColors=['#ff7faf','#ad64c7','#46bc7e'],mixIntensity=.75,mixPlacement='even';
 const mixPanel=document.createElement('section');mixPanel.className='full-color-panel mix-panel';mixPanel.hidden=true;mixPanel.setAttribute('aria-label','Color Mix settings');
 mixPanel.innerHTML='<div class="full-setting"><h2><span>1</span>Choose your colors</h2><p id="mix-color-status" role="status">Pick two or more colors to mix.</p><div class="full-palette mix-palette">'+mixPalette.map(([name,hex])=>'<button type="button" data-mix-color="'+hex+'" aria-pressed="false"><span style="background:'+hex+'"></span>'+name+'</button>').join('')+'<button type="button" id="mix-rainbow" aria-pressed="false"><span class="rainbow-swatch"></span>Rainbow</button></div></div><div class="full-setting"><h2><span>2</span>Adjust color intensity</h2><p>Control how much color you want.</p><label class="intensity-control"><span>Subtle</span><input type="range" id="mix-intensity" min="0" max="100" value="75" aria-label="Mix intensity"><span>Bold</span></label></div><div class="full-setting"><h2><span>3</span>Adjust color placement</h2><p>Choose how the colors are blended on your lashes.</p><div class="placement-options mix-placements">'+[['even','Mixed Evenly','Colors are spread throughout the lashes.'],['tips','Colored Tips','Colors focused on the lash tips.'],['gradient','Gradient Blend','A soft, seamless blend of your chosen colors.']].map(([id,name,description])=>'<button type="button" data-mix-placement="'+id+'" aria-pressed="'+(id==='even')+'">'+placementArt+'<strong>'+name+'</strong><small>'+description+'</small></button>').join('')+'</div></div>';
 accentPanel.after(mixPanel);
 function syncMix(){
  $$('[data-mix-color]').forEach(button=>button.setAttribute('aria-pressed',String(mixColors.includes(button.dataset.mixColor))));
  $('#mix-rainbow').setAttribute('aria-pressed',String(mixColors.length===mixPalette.length&&mixPalette.every(([,hex])=>mixColors.includes(hex))));
  mixPanel.style.setProperty('--lash-color',mixColors[0]);$('#mix-color-status').textContent=mixColors.length+' colors selected. Pick two or more to mix.';drawEye();
 }
 function showMix(hex){
  if(hex&&!mixColors.includes(hex))mixColors=[hex,...mixColors];colorMode='mix';leaveColorStage();document.body.classList.add('full-color-mode','mix-mode');mixPanel.hidden=false;fullActions.hidden=false;fullDone.hidden=false;fullBack.hidden=false;$('.eye-recommendations').hidden=true;$('#eye-back').hidden=true;selectedCard.hidden=false;
  $('#photo-title').textContent='Color Mix';$('.question-copy .eyebrow').textContent='LASHMATCH CUSTOMIZE';$('.question-copy>p:last-of-type').textContent='Create your own unique lash look.';document.title='Color Mix | LashMatch';
  $('.preference-decoration').innerHTML=colorArt('1364 99 256 981');$('.preference-decoration').setAttribute('aria-label','Same Beauty, Brighter Days. Confidence looks good on you.');setZoom(1);syncMix();$('#photo-title').focus({preventScroll:true});
 }
 $$('[data-mix-color]').forEach(button=>button.onclick=()=>{
  const hex=button.dataset.mixColor;
  if(mixColors.includes(hex)){if(mixColors.length===2){$('#mix-color-status').textContent='Keep at least two colors. Add another color before removing this one.';return;}mixColors=mixColors.filter(color=>color!==hex);}else mixColors.push(hex);syncMix();
 });
 $('#mix-rainbow').onclick=()=>{mixColors=mixPalette.map(([,hex])=>hex);syncMix();};
 $('#mix-intensity').oninput=event=>{mixIntensity=Number(event.target.value)/100;drawEye();};
 $$('[data-mix-placement]').forEach(button=>button.onclick=()=>{mixPlacement=button.dataset.mixPlacement;$$('[data-mix-placement]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));drawEye();});
 function mixedColorAt(position){
  const point=Math.max(0,Math.min(1,position))*(mixColors.length-1),index=Math.min(mixColors.length-2,Math.floor(point)),fraction=point-index;
  const a=mixColors[index],b=mixColors[index+1];
  return '#'+[1,3,5].map(offset=>Math.round(parseInt(a.slice(offset,offset+2),16)*(1-fraction)+parseInt(b.slice(offset,offset+2),16)*fraction).toString(16).padStart(2,'0')).join('');
 }
 async function getDetector(){
  if(!detectorPromise)detectorPromise=(async()=>{
   const {FaceLandmarker,FilesetResolver}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
   const files=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
   return FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'},runningMode:'IMAGE',numFaces:2,minFaceDetectionConfidence:0.6,minFacePresenceConfidence:0.6});
  })().catch(error=>{detectorPromise=null;throw error;});
  return detectorPromise;
 }
 function eyeGeometry(points,indices){
  // Detection uses the unmirrored photo; map landmarks back onto the mirrored capture.
  const lid=indices.map(i=>({x:(1-points[i].x)*canvas.width,y:points[i].y*canvas.height})).sort((a,b)=>a.x-b.x);
  const first=lid[0],last=lid[lid.length-1],width=Math.hypot(last.x-first.x,last.y-first.y);
  return {lid,width,x:(first.x+last.x)/2,y:(first.y+last.y)/2};
 }
 async function detectEyes(){
  const token=++revision;eyes=null;$('.eye-feedback').hidden=false;$('#eye-retry').hidden=true;$('#eye-status').textContent='Finding your eyes...';stage.setAttribute('aria-busy','true');
  $$('[data-eye]').forEach(b=>b.disabled=true);$('#eye-customize').disabled=true;lashDone.disabled=true;$('#eye-announcement').textContent='';$('#eye-preview').getContext('2d').clearRect(0,0,700,630);
  try{
   const detector=await getDetector();if(token!==revision||stage.hidden)return;
   const input=document.createElement('canvas');input.width=canvas.width;input.height=canvas.height;const ctx=input.getContext('2d');ctx.translate(input.width,0);ctx.scale(-1,1);ctx.drawImage(canvas,0,0);
   const result=detector.detect(input);
   if(result.faceLandmarks.length!==1)throw new Error(result.faceLandmarks.length?'Keep only your face in the photo, then retake.':'No clear face found. Retake with both eyes visible and good lighting.');
   const points=result.faceLandmarks[0];
   eyes={left:eyeGeometry(points,[362,385,386,387,388,466,263]),right:eyeGeometry(points,[33,246,161,160,159,158,133])};
   if(Object.values(eyes).some(e=>!Number.isFinite(e.width)||e.width<8||e.lid.some(p=>p.x<0||p.x>canvas.width||p.y<0||p.y>canvas.height)))throw new Error('Move closer and keep both eyes fully inside the photo, then retake.');
   $('.eye-feedback').hidden=true;$$('[data-eye]').forEach(b=>b.disabled=false);$('#eye-customize').disabled=false;lashDone.disabled=false;drawEye();
  }catch(error){if(token!==revision)return;eyes=null;$('#eye-status').textContent=error.message.startsWith('No clear')||error.message.startsWith('Keep only')||error.message.startsWith('Move closer')?error.message:'Eye detection could not load. Check your connection and try again, or go Back to retake.';$('#eye-retry').hidden=false;}
  finally{if(token===revision)stage.setAttribute('aria-busy','false');}
 }
 // Smooth lid interpolation keeps individual Classic fibers attached between landmarks.
 function classicLidPoint(lid,t){
  const u=Math.max(0,Math.min(1,t))*(lid.length-1),i=Math.min(lid.length-2,Math.floor(u)),f=u-i;
  const p0=lid[Math.max(0,i-1)],p1=lid[i],p2=lid[i+1],p3=lid[Math.min(lid.length-1,i+2)];
  const value=key=>.5*((2*p1[key])+(-p0[key]+p2[key])*f+(2*p0[key]-5*p1[key]+4*p2[key]-p3[key])*f*f+(-p0[key]+3*p1[key]-3*p2[key]+p3[key])*f*f*f);
  return {x:value('x'),y:value('y')};
 }
 function classicFiber(eye,t,i,side){
  const root=classicLidPoint(eye.lid,t),a=classicLidPoint(eye.lid,t-.006),b=classicLidPoint(eye.lid,t+.006);
  const span=Math.hypot(b.x-a.x,b.y-a.y)||1,tx=(b.x-a.x)/span,ty=(b.y-a.y)/span;
  const outer=side==='left'?1-t:t;
  // Stable variation: changing zoom or color must not reshuffle the hairs.
  const noise=Math.sin((i+1)*127.1)*43758.5453,jitter=noise-Math.floor(noise);
  const length=eye.width*(.105+.155*Math.pow(Math.sin(Math.PI*outer),.8)+.035*outer)*strength*(.86+.24*jitter);
  const sweep=(t-.5)*.85+(jitter-.5)*.19,nx=ty,ny=-tx;
  const tip={x:root.x+(nx*.86+tx*sweep)*length,y:root.y+(ny*.86+ty*sweep)*length};
  const control={x:root.x+(nx*.28-tx*sweep*.18)*length,y:root.y+(ny*.28-ty*sweep*.18)*length};
  return {root,tip,control,tx,ty,radius:eye.width*(.0015+.0007*jitter),alpha:.68+.22*jitter};
 }
 function drawLashes(ctx,eye,side){
  if(!lashesVisible)return;
  const type=styles[activeStyle][2]||styles[activeStyle][0],profile=lashProfiles[['Classic','Hybrid','Wispy','Volume'].indexOf(type)],count=type==='Classic'?62:profile.count;
  ctx.lineCap='round';
  for(let i=0;i<count;i++){
   const t=(i+0.5)/count,position=t*(eye.lid.length-1),index=Math.min(eye.lid.length-2,Math.floor(position)),f=position-index,a=eye.lid[index],b=eye.lid[index+1];
   const px=a.x+(b.x-a.x)*f,py=a.y+(b.y-a.y)*f,outer=side==='left'?1-t:t;
   let length=eye.width*profile.length*(0.5+Math.sin(Math.PI*t)*0.5);
   if(type==='Hybrid')length*=i%4===0?1.12:.9;if(type==='Wispy')length*=i%3===0?1.35:.72;
   length*=strength;const bend=(t-0.5)*length*0.8;
   const fiber=type==='Classic'?classicFiber(eye,t,i,side):null;
   const stroke=()=>{if(fiber){const {root,tip,control,tx,ty,radius}=fiber;ctx.save();ctx.globalAlpha*=fiber.alpha;ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.moveTo(root.x-tx*radius,root.y-ty*radius);ctx.quadraticCurveTo(control.x-tx*radius*.65,control.y-ty*radius*.65,tip.x,tip.y);ctx.quadraticCurveTo(control.x+tx*radius*.65,control.y+ty*radius*.65,root.x+tx*radius,root.y+ty*radius);ctx.closePath();ctx.fill();ctx.restore();return;}ctx.beginPath();ctx.moveTo(px,py);ctx.quadraticCurveTo(px+bend*0.3,py-length*0.45,px+bend,py-length);ctx.stroke();};
   ctx.lineWidth=eye.width*profile.width;ctx.strokeStyle='rgba(34,20,19,.85)';stroke();
   const palette=colorModes.find(mode=>mode.id===colorMode);
   if(!palette)continue;
   const colored=colorMode==='full'||colorMode==='accent'&&accentAt(outer)&&i%3!==0||colorMode==='mix'&&i%3!==0;
   if(!colored)continue;
   ctx.save();
   if(colorMode==='full'){
    ctx.globalAlpha=colorIntensity;
    if(colorPlacement==='tips'){
     const gradient=ctx.createLinearGradient(px,py,fiber?fiber.tip.x:px+bend,fiber?fiber.tip.y:py-length);gradient.addColorStop(0,'transparent');gradient.addColorStop(.55,'transparent');gradient.addColorStop(.72,fullColor);gradient.addColorStop(1,fullColor);ctx.strokeStyle=gradient;
    }else ctx.strokeStyle=fullColor;
   }else if(colorMode==='accent'){ctx.globalAlpha=accentIntensity;ctx.strokeStyle=accentColors[Math.floor((side==='left'?1-t:t)*count/2)%2];}else if(colorMode==='mix'){
    ctx.globalAlpha=mixIntensity;
    const color=mixPlacement==='gradient'?mixedColorAt(outer):mixColors[Math.floor(outer*count/2)%mixColors.length];
    if(mixPlacement==='tips'){const gradient=ctx.createLinearGradient(px,py,fiber?fiber.tip.x:px+bend,fiber?fiber.tip.y:py-length);gradient.addColorStop(0,'transparent');gradient.addColorStop(.55,'transparent');gradient.addColorStop(.75,color);gradient.addColorStop(1,color);ctx.strokeStyle=gradient;}else ctx.strokeStyle=color;
   }else ctx.strokeStyle=palette.colors[colorIndex];
   stroke();ctx.restore();
  }
 }
 function drawEye(){
  if(!eyes)return;
  const output=$('#eye-preview'),ctx=output.getContext('2d'),eye=eyes[activeEye];
  const closeWidth=Math.min(eye.width*2.25,canvas.width,canvas.height/0.9),closeHeight=closeWidth*0.9;
  const closeX=Math.max(0,Math.min(canvas.width-closeWidth,eye.x-closeWidth/2)),closeY=Math.max(0,Math.min(canvas.height-closeHeight,eye.y-closeHeight*.60));
  const w=canvas.width+(closeWidth-canvas.width)*zoomAmount,h=canvas.height+(closeHeight-canvas.height)*zoomAmount,x=closeX*zoomAmount,y=closeY*zoomAmount;
  const scale=Math.min(output.width/w,output.height/h),offsetX=(output.width-w*scale)/2,offsetY=(output.height-h*scale)/2;
  ctx.clearRect(0,0,output.width,output.height);ctx.save();ctx.beginPath();ctx.rect(offsetX,offsetY,w*scale,h*scale);ctx.clip();ctx.translate(offsetX,offsetY);ctx.scale(scale,scale);ctx.translate(-x,-y);
  ctx.drawImage(canvas,0,0);drawLashes(ctx,eyes.left,'left');drawLashes(ctx,eyes.right,'right');ctx.restore();
  const label=zoomAmount===0?'Full face':'Your '+activeEye+' eye';output.setAttribute('aria-label',lashesVisible?label+' with '+styles[activeStyle][0]+' lash preview':label+' original photo');$('#eye-announcement').textContent=label+' · '+styles[activeStyle][0];$('.zoom-label').textContent=zoomAmount===0?'Full Face View':'Preview on Your Eye';
 }

 const finished=document.createElement('section');finished.className='finished-preview';finished.hidden=true;
 finished.innerHTML='<div class="finished-portrait"><canvas id="finished-face" aria-label="Your photo with customized lashes"></canvas></div><aside class="finished-details"><header><h2>Your Lash Look</h2><button type="button" id="finished-edit">&#9998; Edit</button></header><dl id="finished-settings"></dl><div class="finished-closeup"><p>Close-Up View</p><canvas id="finished-eye" width="900" height="370" aria-label="Close-up of your customized lashes"></canvas></div></aside><div class="finished-actions"><button type="button" id="finished-retake">&#8635; Retake</button><button class="button" type="button" id="finished-finish">Finish <svg aria-hidden="true"><use href="#arrow"/></svg></button></div>';
 stage.after(finished);let previousSteps='';
 function showFinishedPreview(){
  lashesVisible=true;compareButton.textContent='Show original';compareButton.setAttribute('aria-pressed','false');
  if(!eyes)return;resetCompleteView();previousSteps=$('.quiz-steps').innerHTML;
  exitFullColor();leaveColorStage();stage.hidden=true;finished.hidden=false;document.body.classList.add('finished-mode');
  renderQuizProgress(4);
  $('#photo-title').textContent='Try-On Preview';$('.question-copy .eyebrow').textContent='LASHMATCH';$('.question-copy>p:last-of-type').textContent='See your customized look.';document.title='Try-On Preview | LashMatch';
  $('.preference-decoration').innerHTML=referenceArt('1095 74 207 784','ref8.png');$('.preference-decoration').setAttribute('aria-label','Same Beauty, Brighter Days. Confidence looks good on you.');
  const face=$('#finished-face');face.width=canvas.width;face.height=canvas.height;const ctx=face.getContext('2d');ctx.drawImage(canvas,0,0);drawLashes(ctx,eyes.left,'left');drawLashes(ctx,eyes.right,'right');
  const eye=eyes[activeEye],close=$('#finished-eye'),w=Math.min(eye.width*2.15,face.width,face.height*close.width/close.height),h=w*close.height/close.width;
  close.getContext('2d').drawImage(face,Math.max(0,Math.min(face.width-w,eye.x-w/2)),Math.max(0,Math.min(face.height-h,eye.y-h*.57)),w,h,0,0,close.width,close.height);
  const colors=colorMode==='accent'?accentColors:colorMode==='mix'?mixColors:[];
  const colorName=hex=>[...fullPalette,...accentPalette,...mixPalette,...colorModes.flatMap(m=>m.colors.map((c,i)=>[m.names[i],c]))].find(([,c])=>c.toLowerCase()===hex.toLowerCase())?.[0]||hex;
  const placement=colorMode==='accent'?accentPlacements.find(([id])=>id===accentPlacement).slice(1,3):colorMode==='mix'?[{even:'Mixed Evenly',tips:'Colored Tips',gradient:'Gradient Blend'}[mixPlacement],{even:'Colors are spread throughout the lashes.',tips:'Colors focused on the lash tips.',gradient:'A soft blend of your chosen colors.'}[mixPlacement]]:colorMode==='full'?[colorPlacement==='tips'?'Colored Tips':'Mixed Evenly',colorPlacement==='tips'?'Color focused on the lash tips.':'Color is spread throughout the lashes.']:['Natural','Natural black lash placement.'];
  const intensity=colorMode==='accent'?accentIntensity:colorMode==='mix'?mixIntensity:colorIntensity,level=!colorMode?'Natural':intensity<.34?'Subtle':intensity<=.75?'Medium':'Bold';
  const previewIcons={
   'Lash Type':'<path d="M3 9q9 11 18 0M5 12l-2 3m5-1-2 4m5-3v4m3-4 1 4m3-5 2 3m0-5 3 2"/>',
   'Full Color':'<path d="m9 3 2 5 5 2-5 2-2 5-2-5-5-2 5-2Zm9 10 1.5 3.5L23 18l-3.5 1.5L18 23l-1.5-3.5L13 18l3.5-1.5Z"/>',
   'Accent Colors':'<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-4c-2-1-1-3 1-3h3c5 0 3-11-6-11Z"/><circle cx="7" cy="9" r="1"/><circle cx="12" cy="6" r="1"/><circle cx="17" cy="9" r="1"/>',
   'Intensity':'<path d="M3 14h4v7H3Zm7-5h4v12h-4Zm7-6h4v18h-4Z"/>'
  };previewIcons.Placement=previewIcons['Lash Type'];previewIcons['Mix Colors']=previewIcons['Accent Colors'];
  const row=(icon,label,value,description)=>'<div class="finished-setting"><span class="finished-setting-icon" aria-hidden="true">'+'<svg viewBox="0 0 24 24">'+previewIcons[label]+'</svg></span><dt>'+label+'</dt><dd><strong>'+value+'</strong><small>'+description+'</small></dd></div>';
  $('#finished-settings').innerHTML=row('&#9697;','Lash Type',styles[activeStyle][0]+' Lashes',styles[activeStyle][1])+row('&#10023;','Full Color',colorMode==='full'?colorName(fullColor):'None',colorMode==='full'?'Color across the entire lash.':'Natural black base.')+row('&#10047;',colorMode==='mix'?'Mix Colors':'Accent Colors',colors.length?'<span class="finished-swatches">'+colors.map(c=>'<span style="background:'+c+'" title="'+colorName(c)+'"></span>').join('')+'</span>':'None',colors.map(colorName).join(' + ')||'No accent colors selected.')+row('&#9697;','Placement',placement[0],placement[1])+row('&#9776;','Intensity',level,level==='Medium'?'A noticeable yet natural look.':level==='Bold'?'A bold, vibrant look.':'A soft, natural look.');$('#photo-title').focus({preventScroll:true});
 }

 const finalBadge=document.createElement('div');finalBadge.className='final-look-badge';finalBadge.hidden=true;$('.finished-portrait').append(finalBadge);
 const finalNote=document.createElement('p');finalNote.className='final-match-note';finalNote.hidden=true;finalNote.innerHTML='Your<br>Perfect Match &#9825;';$('.finished-closeup').append(finalNote);
 function resetCompleteView(){
  document.body.classList.remove('complete-mode');finalBadge.hidden=true;finalNote.hidden=true;
  $('.finished-details h2').textContent='Your Lash Look';$('#finished-edit').innerHTML='&#9998; Edit';$('#finished-retake').innerHTML='&#8635; Retake';$('#finished-finish').innerHTML='Finish <svg aria-hidden="true"><use href="#arrow"/></svg>';
  $('#finished-finish').onclick=showCompleteLook;$('#finished-retake').onclick=()=>{leaveFinishedPreview();exitFullColor();closeStage();startCamera();};
 }
 let profileTryOnRecorded=false,tryOnSaving=false;const tryOnRequest=crypto.randomUUID();
 async function showCompleteLook(){
  if(!eyes||tryOnSaving)return;
  if(!profileTryOnRecorded&&user){tryOnSaving=true;try{await ProfileData.record(user.id,"tryon",tryOnRequest);profileTryOnRecorded=true;}catch(error){toast(error.message);return;}finally{tryOnSaving=false;}}
  if(!eyes)return;document.body.classList.add('complete-mode');renderQuizProgress(4);
  $('#photo-title').textContent='Your Final Lash Look';$('.question-copy .eyebrow').textContent='LASHMATCH';$('.question-copy>p:last-of-type').textContent="Here's your customized look. You're all set!";document.title='Your Final Lash Look | LashMatch';
  $('.finished-details h2').textContent='Your Lash Details';$('#finished-edit').innerHTML='&#9998; Edit Look';
  const rows=$$('.finished-setting',finished),mode=colorModes.find(item=>item.id===colorMode),fullName=rows[1].querySelector('strong').textContent;
  rows[1].querySelector('dt').textContent='Color Style';rows[1].querySelector('strong').textContent=mode?.name||'Classic Black';rows[1].querySelector('small').textContent=mode?.description||'Natural black lashes.';rows[2].querySelector('dt').textContent='Colors Used';
  if(colorMode==='full'){const swatches=document.createElement('span');swatches.className='finished-swatches';const dot=document.createElement('span');dot.style.background=fullColor;dot.title=fullName;swatches.append(dot);rows[2].querySelector('strong').replaceChildren(swatches);rows[2].querySelector('small').textContent=fullName;}
  rows[3].querySelector('dt').textContent='Colors Placement';
  finalBadge.replaceChildren(rows[0].querySelector('.finished-setting-icon').cloneNode(true));const copy=document.createElement('span'),title=document.createElement('strong'),description=document.createElement('small');title.textContent=styles[activeStyle][0]+' Lashes';description.textContent=styles[activeStyle][1];copy.append(title,description);finalBadge.append(copy);finalBadge.hidden=false;finalNote.hidden=false;
  $('#finished-retake').innerHTML='&#8635; Try Another Look';$('#finished-retake').onclick=()=>{leaveFinishedPreview();exitFullColor();leaveColorStage();$('.quiz-panel').scrollTop=0;};
  $('#finished-finish').innerHTML='<svg aria-hidden="true"><use href="#pin"/></svg><span>Find Studios Near You<small>Book your appointment and bring your look to life!</small></span><svg aria-hidden="true"><use href="#arrow"/></svg>';$('#finished-finish').onclick=showStudios;
  $('.quiz-panel').scrollTop=0;$('#photo-title').focus({preventScroll:true});
 }
 $('#finished-finish').onclick=showCompleteLook;
 function leaveFinishedPreview(){finished.hidden=true;document.body.classList.remove('finished-mode','complete-mode');$('.quiz-steps').innerHTML=previousSteps;}
 $('#finished-edit').onclick=()=>{leaveFinishedPreview();if(colorMode==='full')showFullColor();else if(colorMode==='accent')showAccent();else if(colorMode==='mix')showMix();else leaveColorStage();};
 $('#finished-retake').onclick=()=>{leaveFinishedPreview();exitFullColor();closeStage();startCamera();};
 function closeStage(){revision++;stage.hidden=true;document.body.classList.remove('eye-mode');$('.photo-layout').hidden=false;setReview(true);$('.question-copy .eyebrow').textContent='LASHMATCH QUIZ';}
 $('#eye-back').onclick=closeStage;$('#eye-retry').onclick=detectEyes;
 $$('[data-eye]').forEach(button=>button.onclick=()=>{activeEye=button.dataset.eye;$$('[data-eye]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));drawEye();});
 $$('[data-eye-style]').forEach(button=>button.onclick=()=>{activeStyle=Number(button.dataset.eyeStyle);setStyle(styles[activeStyle][0]);$('#photo-title').dataset.selectedStyle=styles[activeStyle][0];$$('[data-eye-style]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));drawEye();});
 $('#eye-customize').onclick=showColorStage;
 $('#lash-strength').oninput=event=>{strength=Number(event.target.value);drawEye();};
 window.initializeTryOnStyles=(match,catalog)=>{
  if(!match?.style)throw new Error('Complete the quiz before trying on your recommended lashes.');
  catalog=catalog.filter(style=>style.name===match.style);
  if(!catalog.length)throw new Error('Your recommended style is unavailable. Please retake the quiz.');
  styles.splice(0,styles.length,...catalog.map(s=>[s.name,s.description,s.type||s.name]));
  const template=$('.eye-style').cloneNode(true),list=$('.eye-style-list');list.replaceChildren();
  catalog.forEach((s,index)=>{const button=template.cloneNode(true);button.dataset.eyeStyle=index;if(s.image_data){const image=new Image();image.src=s.image_data;image.alt=s.name;image.style.cssText='width:72px;height:60px;object-fit:cover;border-radius:8px';button.querySelector('svg,img').replaceWith(image);}button.onclick=()=>{activeStyle=index;setStyle(s.name);$('#photo-title').dataset.selectedStyle=s.name;$$('[data-eye-style]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));drawEye();};list.append(button);});
  const requested=match.style;
  const requestedIndex=styles.findIndex(s=>s[0]===requested),matchIndex=styles.findIndex(s=>s[0]===match?.style);
  activeStyle=requestedIndex>=0?requestedIndex:matchIndex>=0?matchIndex:0;setStyle(styles[activeStyle][0]);
  styles.forEach(s=>{const entry=catalog.find(entry=>entry.name===s[0]);if(entry)s[1]=entry.description;});
  $$('.eye-style').forEach((button,index)=>{button.dataset.style=styles[index][0];button.setAttribute('aria-pressed',String(index===activeStyle));button.querySelector('strong').textContent=styles[index][0]+' Lashes';button.querySelector('small').textContent=(index===matchIndex?'Your quiz match. ':'')+styles[index][1];button.classList.toggle('quiz-match',index===matchIndex);});
  $('#eye-recommendation-copy').textContent=matchIndex>=0?'Your quiz match is '+match.style+' Lashes. This preview uses your latest quiz result.':'Explore the available lash styles. Take the quiz for a personalized match.';
  $('.eye-recommendations h2').lastChild.textContent=matchIndex>=0?' Your Quiz Match':' Available Lash Styles';
  $('#photo-title').dataset.selectedStyle=styles[activeStyle][0];
 };
 $('#use-photo').onclick=()=>{
  if(!photoReady)return;setReview(false);document.body.classList.add('eye-mode');$('.photo-layout').hidden=true;$('.quiz-actions').hidden=true;stage.hidden=false;
  $('#photo-title').textContent='Preview Your Quiz Match';$('.question-copy .eyebrow').textContent='LASHMATCH TRY-ON';$('.question-copy>p:last-child').textContent='See your recommended lash style on your eye, then customize your look.';document.title='Preview Your Quiz Match | LashMatch';
  $$('[data-eye-style]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.eyeStyle)===activeStyle)));
  activeEye='left';$$('[data-eye]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.eye==='left')));$('#photo-title').focus({preventScroll:true});detectEyes();
 };
})();
