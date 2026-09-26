'use strict';
(()=>{
 const icon=id=>'<svg aria-hidden="true"><use href="#'+id+'"/></svg>';
 const crop=box=>'<svg viewBox="'+box+'" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="r11.png" width="1620" height="1080"/></svg>';
 $('.sidebar-art').innerHTML=crop('0 686 285 394');$('.profile-decoration').innerHTML=crop('1370 218 211 162');$('.confidence-art').innerHTML=crop('1425 486 165 162');
 let showAll=false;
 let studioNames={},databaseQuizCount=0;
 function activity(){const events=ProfileData.events(user.id).slice();for(const kind of ['looks','studios']){const dates=SavedItems.dates(kind,user.id);for(const item of SavedItems.list(kind,user.id)){const type=kind==='looks'?'save-look':'save-studio';if(Number.isFinite(dates[item])&&!events.some(e=>e.type===type&&String(e.item)===String(item)))events.push({type,item,at:dates[item]});}}return events.sort((a,b)=>b.at-a.at);}
 function render(){
 const profile=ProfileData.read(user.id),events=activity();
 $('#profile-name').textContent=profile.displayName||user.name.split(' ')[0];
 $('#profile-tagline').textContent=profile.tagline||'';
 $('#profile-quote').textContent=profile.quote?'\u201c'+profile.quote+'\u201d':'';
 const portrait=$('#profile-portrait');portrait.replaceChildren();
 if(typeof profile.photo==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(profile.photo)){const img=document.createElement('img');img.src=profile.photo;img.alt='Your profile photo';portrait.append(img);}else{portrait.textContent=(profile.displayName||user.name).charAt(0).toUpperCase();}
 $('#profile-looks-count').textContent=SavedItems.list('looks',user.id).length;$('#profile-studios-count').textContent=SavedItems.list('studios',user.id).length;
 const quizCount=databaseQuizCount;
 $('#profile-quiz-count').textContent=quizCount;
 const steps=Number(quizCount>0)+Number(ProfileData.summary(user.id).triedOn)+Number(SavedItems.list('studios',user.id).length>0);
 $('#beauty-progress').value=steps;$('#beauty-progress-text').textContent=steps+'/3';
 const types={'quiz':['quiz-icon','Completed the quiz'],'tryon':['camera','Completed a try-on session'],'save-look':['heart','Saved a lash look'],'save-studio':['pin','Saved a studio'],'remove-look':['heart','Removed a saved lash look'],'remove-studio':['pin','Removed a saved studio']};
 const visible=(showAll?events:events.slice(0,4)).filter(e=>types[e.type]);
 $('#profile-activity-list').innerHTML=visible.length?visible.map(e=>{const [i,label]=types[e.type];const name=e.type.endsWith('studio')?studioNames[e.item]:null;return '<li><span class="activity-badge">'+icon(i)+'</span><span>'+escapeHTML(label+(name?' ('+name+')':''))+'</span><time datetime="'+new Date(e.at).toISOString()+'">'+escapeHTML(new Intl.DateTimeFormat('en-US',{month:'short',day:'2-digit',year:'numeric',hour:'numeric',minute:'2-digit'}).format(e.at))+'</time></li>';}).join(''):'<li class="profile-empty">'+icon('spark')+'<div><strong>Your beauty journey starts here.</strong><p>Take the quiz, try a lash look, or save a favorite to see your activity.</p><a href="preference.html">Take the Quiz</a></div></li>';
 $('#view-all-activity').hidden=events.length<=4;$('#view-all-activity').textContent=showAll?'Show Less':'View All';$('#view-all-activity').setAttribute('aria-expanded',String(showAll));
 }
 function edit(){
 const p=ProfileData.read(user.id);
 open('<h2>Edit Profile</h2><p>Personalize how your profile appears in this browser.</p><form id="profile-edit-form"><label>Display name<input name="displayName" maxlength="50" required value="'+escapeHTML(p.displayName||user.name.split(' ')[0])+'"></label><label>About you<input name="tagline" maxlength="80" value="'+escapeHTML(p.tagline||'')+'"></label><label>Your quote<input name="quote" maxlength="160" value="'+escapeHTML(p.quote||'')+'"></label><p class="profile-form-status" role="status"></p><button class="button">Save Changes</button></form>');
 $('#profile-edit-form').onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.target));for(const k of Object.keys(values))values[k]=values[k].trim();if(!values.displayName){$('.profile-form-status').textContent='Please enter your display name.';return;}const ok=ProfileData.write(user.id,{...ProfileData.read(user.id),...values});render();modal.close();toast(ok?'Profile updated.':'Updated for this visit. Browser storage is unavailable.');};
 }
 $('#edit-profile').onclick=edit;
 $('#change-photo').onclick=()=>$('#profile-photo-input').click();
 $('#profile-photo-input').onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){toast('Choose a JPG, PNG, or WebP image under 10 MB.');e.target.value='';return;}
 const url=URL.createObjectURL(file);
 try{const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=320;const ctx=canvas.getContext('2d'),size=Math.min(img.naturalWidth,img.naturalHeight);ctx.drawImage(img,(img.naturalWidth-size)/2,(img.naturalHeight-size)/2,size,size,0,0,320,320);const photo=canvas.toDataURL('image/jpeg',.85),ok=ProfileData.write(user.id,{...ProfileData.read(user.id),photo});render();const avatarImg=new Image();avatarImg.src=photo;avatarImg.alt='Your profile';avatarImg.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%';$('#avatar').replaceChildren(avatarImg);toast(ok?'Profile photo updated.':'Updated for this visit. Browser storage is unavailable.');}catch{toast('Unable to open this image. Please choose another photo.');}finally{URL.revokeObjectURL(url);e.target.value='';}
 };
 $('#view-all-activity').onclick=()=>{
 const entries=activity();let page=0;
 function showPage(){
 const names={'quiz':'Completed the quiz','tryon':'Completed a try-on session','save-look':'Saved a lash look','save-studio':'Saved a studio','remove-look':'Removed a saved lash look','remove-studio':'Removed a saved studio'};
 open('<h2>Your Activity</h2><ul class="profile-history-list">'+entries.slice(page*4,page*4+4).map(e=>'<li>'+escapeHTML((names[e.type]||'Activity')+(studioNames[e.item]?' ('+studioNames[e.item]+')':''))+'<time>'+escapeHTML(new Date(e.at).toLocaleString())+'</time></li>').join('')+'</ul><div class="profile-history-controls"><button class="button outline" id="activity-previous" '+(page===0?'disabled':'')+'>Previous</button><span>'+(page+1)+' / '+Math.ceil(entries.length/4)+'</span><button class="button outline" id="activity-next" '+((page+1)*4>=entries.length?'disabled':'')+'>Next</button></div>');
 $('#activity-previous').onclick=()=>{page--;showPage();};$('#activity-next').onclick=()=>{page++;showPage();};
 }showPage();
};
 $('#activity-tab').onclick=()=>{$('.profile-activity').scrollIntoView({block:'nearest'});};
 $('#profile-quiz-stat').onclick=()=>location.assign('preference.html');
 $('#profile-settings').onclick=()=>{
 open('<h2>Settings</h2><p>Signed in as <strong>'+escapeHTML(user.email)+'</strong></p><p>Your profile photo and bio are stored in this browser. Activity, saved items, and quiz results are stored in your account.</p><div class="profile-settings-actions"><button class="button" id="settings-edit">Edit Profile</button><button class="button outline" id="settings-photo">Remove Profile Photo</button><button class="button outline" id="profile-logout">Log Out</button></div>');
 $('#settings-edit').onclick=edit;$('#settings-photo').disabled=!ProfileData.read(user.id).photo;
 $('#settings-photo').onclick=()=>{const p=ProfileData.read(user.id);delete p.photo;const ok=ProfileData.write(user.id,p);$('#avatar').textContent=user.name.charAt(0).toUpperCase();delete $('#avatar').dataset.photo;render();modal.close();toast(ok?'Profile photo removed.':'Removed for this visit. Browser storage is unavailable.');};
 $('#profile-logout').onclick=async e=>{e.target.disabled=true;try{await api('logout',{});location.replace('login.html');}catch(error){toast(error.message);e.target.disabled=false;}};
 };
 $('#profile-support').onclick=()=>open('<h2>How can we help?</h2><details open><summary>How do I save a look or studio?</summary><p>Tap its heart, then open Saved from the sidebar. Tap the heart again to remove it.</p></details><details><summary>How do I find my lash match?</summary><p>Take the Quiz, select your preferences, then explore your recommended look in Try On.</p></details><details><summary>Where are my profile details stored?</summary><p>Your profile customizations are saved in this browser. Completed quizzes and try-ons are saved in your account.</p></details><details><summary>Can I book a studio?</summary><p>Studio listings are currently previews. Direct booking and live support are not available yet.</p></details>');
 $$('[data-quiz]').forEach(b=>b.onclick=()=>location.assign('preference.html'));$$('[data-results]').forEach(b=>b.onclick=()=>location.assign('home.html#results'));$$('[data-saved]').forEach(b=>b.onclick=()=>location.assign('saved.html'));
 $('#notifications').onclick=()=>open('<h2>Notifications</h2><p>You have no new notifications.</p>');
 $('#dashboard-search').onsubmit=e=>{e.preventDefault();location.assign('saved.html?q='+encodeURIComponent($('#home-search').value.trim()));};
 async function load(){try{const session=await api('session');if(!session.user){location.replace('login.html');return;}user=session.user;csrf=session.csrf;const [directory,history]=await Promise.all([api('studios'),api('matches')]);studioNames=Object.fromEntries(directory.studios.map(s=>[s.id,s.name]));databaseQuizCount=ProfileData.summary(user.id).quizCount;$('#greeting').textContent='Hi, '+user.name.split(' ')[0]+'!';$('#avatar').textContent=user.name.charAt(0).toUpperCase();render();$('.dashboard').hidden=false;$('#session-status').hidden=true;}catch{$('#session-status').innerHTML='<p>Unable to load your profile.</p><button class="button" id="retry-profile">Retry</button>';$('#retry-profile').onclick=load;}}
 addEventListener('storage',()=>{if(user)render();});addEventListener('pageshow',e=>{if(e.persisted)load();});load();
})();
