'use strict';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const modal=$('#modal'),content=$('#modal-content');
let user=null,csrf='',selected=null,studios=[],timer,pendingMatch=null;
const looks={
 Classic:{detail:'Light definition · Natural finish',description:'Light, defined lashes for an effortless everyday look.'},
 Hybrid:{detail:'Soft volume · Wispy finish',description:'A blend of natural definition and soft fullness, with a little extra texture.'},
 Wispy:{detail:'Airy texture · Fluttery finish',description:'Varying lengths create an airy, textured finish. Personalize the placement with your lash artist.'},
 Volume:{detail:'Full texture · Statement finish',description:'A fuller, expressive look for extra definition. Discuss suitable lash weight with your artist.'}
};
const demos=[];
function escapeHTML(v){const el=document.createElement('span');el.textContent=String(v);return el.innerHTML;}
function open(html){content.innerHTML=html;if(!modal.open)modal.showModal();}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('visible'),4000);}
async function api(action,data){
 let response;try{response=await fetch('api.php?action='+encodeURIComponent(action),{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{},body:data?JSON.stringify(data):undefined,credentials:'same-origin'});}catch{throw new Error('Cannot reach the server. Open this page through PHP; see SETUP.md.');}
 let result;try{result=await response.json();}catch{throw new Error('PHP is unavailable. Open this project through your PHP server; see SETUP.md.');}
 if(!response.ok)throw new Error(result.error||'Something went wrong. Please try again.');
 if(action==='session'&&result.user&&window.ProfileData){ProfileData.hydrate(result.user.id,result.journey);if(result.journey?.quizCount===0){try{sessionStorage.removeItem('lashmatch-result-'+result.user.id);}catch{}}}
 if(action==='session'&&result.user&&window.SavedItems)SavedItems.hydrate(result.user.id,result.saved);
 if(action==='session'&&result.user?.role==='admin'&&!document.querySelector('[data-admin-link]')){const nav=document.querySelector('.sidebar nav');if(nav){const link=document.createElement('a');link.href='admin/admin.html';link.textContent='Admin Dashboard';link.dataset.adminLink='';link.className='nav-item';nav.append(link);}}
 return result;
}
function account(){
 $$('[data-auth]').forEach(b=>b.setAttribute('aria-label',user?'Your LashMatch account':b.dataset.auth==='login'?'Login':'Sign Up'));
}
function showAccount(){
 open('<p class="eyebrow">YOUR ACCOUNT</p><h2>Hello, '+escapeHTML(user.name)+'.</h2><p>'+escapeHTML(user.email)+'</p><button class="button" id="account-quiz">Find My Match</button><button class="text-button" id="logout">Log out</button><div class="message" role="alert"></div>');
 $('#account-quiz').onclick=quiz;
 $('#logout').onclick=async()=>{
 const message=$('.message',content);
 try{await api('logout',{});user=null;csrf='';account();modal.close();toast('You have been logged out.');}catch(error){message.textContent=error.message;}
 };
}
function auth(mode){location.assign(mode==='login'?'login.html':'signup.html');}
function quiz(){location.assign('preference.html?v=criteria-menu-1');}
function showResult(answers){
 pendingMatch=answers;const match={natural:'Classic',balanced:'Hybrid',textured:'Wispy',dramatic:'Volume'}[answers.finish];setStyle(match);
 const notes={almond:'Ask your artist about a balanced map or a gentle outer-corner lift.',round:'Ask your artist whether a subtle outer-corner emphasis suits your desired look.',hooded:'Ask your artist about curl and placement that keep lashes visible above the lid.',monolid:'Ask your artist about curl and length that complement your lid and natural lash direction.',unsure:'Your lash artist can help identify your eye shape and personalize your lash map.'};
 open('<p class="eyebrow">IT’S A MATCH</p><h2>Your <em>'+match+'</em> era.</h2><p>'+escapeHTML(looks[match].description)+'</p><p>'+notes[answers.eye_shape]+'</p><p>'+(answers.occasion==='event'?'For your event, bring a reference photo and discuss the final look with your artist.':'For daily wear, discuss a comfortable length and your maintenance routine with your artist.')+'</p><p class="notice">Style inspiration only. Your artist should assess which extensions suit your natural lashes.</p><button class="button" id="save">'+(user?'Save My Match':'Sign Up to Save')+'</button><button class="text-button" id="result-preview">Preview this style</button><div class="message" role="status"></div>');
 $('#result-preview').onclick=preview;
 $('#save').onclick=async()=>{if(!user){auth('signup');return;}const button=$('#save'),message=$('.message',content);button.disabled=true;try{await api('save_match',answers);await SavedItems.save('looks',user.id,[...new Set([...SavedItems.list('looks',user.id),match])]);pendingMatch=null;message.textContent='Your '+match+' match is saved to your account.';button.textContent='Saved ✓';}catch(error){message.textContent=error.message;button.disabled=false;}};
}
function setStyle(style){selected=style;}
function preview(){
 location.assign('tryon.html?v=5&style='+encodeURIComponent(selected||''));
}
function showStudios(){
 const rows=[...document.querySelectorAll('.finished-setting')];
 if(rows.length){try{sessionStorage.setItem('lashmatch-studio-look-'+user.id,JSON.stringify({type:rows[0].querySelector('strong').textContent,colors:rows[2].querySelector('small').textContent,placement:rows[3].querySelector('strong').textContent}));}catch{}}
 location.assign('Fstudios.html');
}

function render(){ if(!$("#studio-list"))return;
 const query=$('#search').value.toLowerCase().trim(),list=studios.filter(s=>(s.name+' '+s.city+' '+s.specialties.join(' ')).toLowerCase().includes(query));
 $('#studio-list').innerHTML=list.length?list.map(s=>'<article class="studio-item"><svg><use href="#pin"/></svg><h3>'+escapeHTML(s.name)+'</h3><p class="city">'+escapeHTML(s.city)+(Number(s.is_demo)?' · Demo studio':'')+'</p><p>'+escapeHTML(s.description)+'</p><div class="tags">'+s.specialties.map(tag=>'<span class="tag">'+escapeHTML(tag)+'</span>').join('')+'</div><button class="button outline" data-studio="'+Number(s.id)+'">View Studio <svg><use href="#arrow"/></svg></button></article>').join(''):'<p class="empty">No studios found. Try another name, city, or lash style.</p>';
 $$('[data-studio]').forEach(b=>b.onclick=()=>{const s=studios.find(s=>Number(s.id)===Number(b.dataset.studio));open('<p class="eyebrow">STUDIO SPOTLIGHT'+(Number(s.is_demo)?' · DEMO':'')+'</p><h2>'+escapeHTML(s.name)+'</h2><p>'+escapeHTML(s.address)+'</p><p>'+escapeHTML(s.description)+'</p><p>'+(Number(s.is_demo)?'This is a fictional sample listing. Contact details and appointments will be available when real studios are added.':'Online booking is not available yet.')+'</p><button class="button" id="studio-quiz">Find a Style to Bring</button>');$('#studio-quiz').onclick=quiz;});
}
$('#close').onclick=()=>modal.close();
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
$$('[data-auth]').forEach(b=>b.onclick=()=>user?showAccount():auth(b.dataset.auth));
$$('[data-quiz]').forEach(b=>b.onclick=quiz);
$$('[data-preview]').forEach(b=>b.onclick=preview);
$$('[data-studios]').forEach(b=>b.onclick=showStudios);
const panels={
 features:['Made for your eyes.','Explore personalized lash recommendations, find your preferred style, and browse lash studios.','Get Started'],
 how:['Find your perfect lash look.','1. Tell us your eye shape and preferred finish.<br>2. Explore your recommended lash style.<br>3. Find a studio and discuss your look with a lash artist.','Find My Match'],
 about:['Beauty meets you.','LashMatch: A Personalized Lash Recommendation, Virtual Try-On, and Studio Locater System.','Find My Match']
};
$$('[data-panel]').forEach(b=>b.onclick=()=>{const p=panels[b.dataset.panel];open('<p class="eyebrow">LASHMATCH</p><h2>'+p[0]+'</h2><p>'+p[1]+'</p><button class="button" id="panel-quiz">'+p[2]+'</button>');$('#panel-quiz').onclick=quiz;});
studios=demos;
if(location.protocol!=='file:'){
 api('session').then(r=>{csrf=r.csrf;user=r.user;account();}).catch(()=>{});
 api('catalog').then(r=>{for(const s of r.styles)looks[s.name]={...(looks[s.name]||{}),description:s.description,type:s.type||s.name};}).catch(()=>{});
 api('studios').then(r=>{studios=r.studios;render();}).catch(()=>{});
}
if(location.hash==='#signup')auth('signup');

function renderQuizProgress(activeStep, completedThrough=activeStep-1){
 const progress=document.querySelector(".quiz-steps");if(!progress)return;
 const labels=["Preferences","Volume","Occasion","Match","Preview","Search","Studios"];
 progress.innerHTML=labels.map((label,index)=>'<li'+(index===activeStep?' aria-current="step"':index<=completedThrough?' class="done"':'')+'><span>'+(index+1)+'</span>'+label+'</li>').join('');
}

$$('[data-sidebar-logout]').forEach(button=>button.addEventListener('click',async()=>{
 if(button.disabled)return;
 button.disabled=true;button.setAttribute('aria-busy','true');
 const label=button.querySelector('span');label.textContent='Logging out...';
 try{
  await api('logout',{});
  if(typeof stopCamera==='function')stopCamera();
  location.replace('login.html');
 }catch(error){
  toast(error.message||'Unable to log out. Please try again.');
  button.disabled=false;button.removeAttribute('aria-busy');label.textContent='Logout';
 }
}));
