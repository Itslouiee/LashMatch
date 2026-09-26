/* Original admin layouts, populated only from authenticated database records. */
(() => {
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page=location.pathname.split('/').pop(),dialog=$('#admin-dialog');
let data,csrf='',editing=null,upload,gridPage=1,selected=new Set(),busy=false;
const status=document.createElement('p');status.className='live-status';status.textContent='Loading your administrator account...';document.body.prepend(status);
function open(title,html){$('#dialog-title').textContent=title;$('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();}
$('.dialog-close').onclick=()=>dialog.close();
async function request(action,body){
 const r=await fetch('../api.php?action='+encodeURIComponent(action),{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{},body:body?JSON.stringify(body):undefined});
 const result=await r.json();if(!r.ok){if(r.status===401)location.replace('../login.html?role=admin');throw Error(result.error||'Request failed.');}return result;
}
function note(message){let el=$('#admin-feedback');if(!el){el=document.createElement('p');el.id='admin-feedback';el.className='local-data-note';el.setAttribute('role','status');$('.topbar').after(el);}el.textContent=message;}
async function refresh(){data=await request('admin_data');$('.profile-copy strong').textContent=data.user.name;$('.avatar').textContent=data.user.name[0].toUpperCase();renderPage();}
async function save(form,action,body,done){
 if(busy)return;busy=true;const button=form.querySelector('[type=submit]');if(button)button.disabled=true;
 const error=form.querySelector('#form-message,.settings-message,.live-error');
 if(error)error.textContent='';
 try{await request(action,body);await refresh();if(done)done();note('Changes saved.');}
 catch(e){if(error)error.textContent=e.message;else note(e.message);}
 finally{busy=false;if(button)button.disabled=false;}
}
const icon=name=>'<svg aria-hidden="true"><use href="#'+name+'"/></svg>';
const core=name=>false;
const active=s=>Number(s.is_active)&&s.in_service_area;
const thumb=s=>s.image_data?'<img src="'+esc(s.image_data)+'" alt="'+esc(s.name)+'">':'<span data-lash-preview="'+esc(s.name)+'" aria-label="'+esc(s.name)+' preview">Preview</span>';
const studioThumb=s=>s.image_data?'<img src="'+esc(s.image_data)+'" alt="'+esc(s.name)+'">':'<span class="avatar">'+esc(s.name[0]||'S')+'</span>';
const pill=(text,yes=true)=>'<span class="status-pill '+(yes?'':'status-inactive')+'">'+esc(text)+'</span>';
function countRows(rows,size=7){
 gridPage=Math.min(gridPage,Math.max(1,Math.ceil(rows.length/size)));
 if($('#entry-count'))$('#entry-count').textContent='Showing '+(rows.length?(gridPage-1)*size+1:0)+' to '+Math.min(gridPage*size,rows.length)+' of '+rows.length+' entries';
 if($('#current-page'))$('#current-page').textContent=gridPage;
 if($('#previous-page'))$('#previous-page').disabled=gridPage===1;
 if($('#next-page'))$('#next-page').disabled=gridPage*size>=rows.length;
 return rows.slice((gridPage-1)*size,gridPage*size);
}
function check(id){return '<td class="check-cell"><input type="checkbox" data-select="'+id+'" '+(selected.has(String(id))?'checked':'')+' aria-label="Select row"></td>';}
function wireSelection(){
 $$('[data-select]').forEach(b=>b.onchange=()=>{b.checked?selected.add(b.dataset.select):selected.delete(b.dataset.select);});
 if($('#select-all')){const boxes=$$('[data-select]');$('#select-all').checked=boxes.length>0&&boxes.every(b=>b.checked);$('#select-all').disabled=!boxes.length;}
}
function bindFilters(local,form){
 const input=$(local);if(input)input.oninput=()=>{$('#admin-search').value=input.value;gridPage=1;renderPage();};
 $('#admin-search').oninput=e=>{if(input)input.value=e.target.value;gridPage=1;renderPage();};
 if($(form)){ $(form).onsubmit=e=>e.preventDefault();$(form).onreset=()=>{setTimeout(()=>{gridPage=1;$('#admin-search').value='';renderPage();},0);};}
 $$('select[id$="-filter"]').forEach(s=>s.onchange=()=>{gridPage=1;renderPage();});
 if($('#previous-page'))$('#previous-page').onclick=()=>{gridPage--;renderPage();};
 if($('#next-page'))$('#next-page').onclick=()=>{gridPage++;renderPage();};
 if($('#select-all'))$('#select-all').onchange=e=>{$$('[data-select]').forEach(b=>{b.checked=e.target.checked;b.onchange();});};
}
function cityOptions(){const options=data.cavite_cities.map(c=>'<option>'+esc(c)+'</option>').join('');if($('#city-filter'))$('#city-filter').innerHTML='<option value="">All Cities</option>'+options;return options;}
function imageInput(id,zone){
 const read=async file=>{if(!file)return;if(!['image/png','image/jpeg'].includes(file.type)||file.size>2097152){$('#form-message').textContent='Choose a PNG or JPG up to 2 MB.';return;}
 try{const result=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});const img=new Image();img.src=result;await img.decode();upload=result;$('#upload-preview').innerHTML='<img src="'+result+'" alt="Selected image">';$('#form-message').textContent='';}catch{$('#form-message').textContent='Unable to open this image.';}};
 $(id).onchange=e=>read(e.target.files[0]);
 $(zone).ondragover=e=>e.preventDefault();$(zone).ondrop=e=>{e.preventDefault();read(e.dataTransfer.files[0]);};
}
function styles(){
 const q=$('#style-search').value.toLowerCase(),type=$('#type-filter').value,state=$('#status-filter').value;
 const rows=data.styles.filter(s=>(s.name+' '+s.description).toLowerCase().includes(q)&&(!type||s.type===type)&&(!state||Boolean(Number(s.is_active))===(state==='Active')));
 $('#styles-body').innerHTML=countRows(rows).map(s=>'<tr>'+check(s.id)+'<td><span class="style-thumb">'+thumb(s)+'</span></td><td class="style-name">'+esc(s.name)+'</td><td><span class="type-pill type-'+s.type.toLowerCase()+'">'+esc(s.type)+'</span></td><td class="style-description">'+esc(s.description)+'</td><td>'+pill(Number(s.is_active)?'Active':'Inactive',Number(s.is_active))+'</td><td><div class="row-actions"><button data-edit="'+s.id+'" aria-label="Edit '+esc(s.name)+'">'+icon('edit')+'</button><button data-delete="'+s.id+'" '+(core(s.name)?'disabled title="Required by the quiz"':'')+' aria-label="Delete '+esc(s.name)+'">'+icon('trash')+'</button></div></td></tr>').join('')||'<tr><td colspan="7" class="empty-row">No matching lash styles.</td></tr>';
 wireSelection();$$('[data-edit]').forEach(b=>b.onclick=()=>editStyle(Number(b.dataset.edit)));
 $$('[data-delete]').forEach(b=>b.onclick=()=>{const s=data.styles.find(s=>Number(s.id)===Number(b.dataset.delete));open('Delete lash style?','<p>Remove '+esc(s.name)+' from the catalog?</p><form id="delete-form"><p class="live-error"></p><button type="submit" class="pink-button">Delete</button></form>');$('#delete-form').onsubmit=e=>{e.preventDefault();save(e.target,'admin_style_delete',{id:Number(s.id)},()=>dialog.close());};});
}
function editStyle(id){
 editing=id||null;upload=undefined;const s=data.styles.find(s=>Number(s.id)===id);
 $('#style-form').reset();$('#form-message').textContent='';$('#editor-title').textContent=s?'Edit Lash Style':'Add New Lash Style';
 $('#style-name').value=s?.name||'';$('#style-type').value=s?.type||'';$('#style-description').value=s?.description||'';$('#style-status').value=s&&!Number(s.is_active)?'Inactive':'Active';
 const pinned=Boolean(s&&core(s.name));$('#style-name').readOnly=pinned;$('#style-type').disabled=pinned;$('#style-status').disabled=pinned;
 $('#upload-preview').innerHTML=s?thumb(s):'<span>No image selected</span>';
 $('#style-editor').hidden=false;$('.styles-layout').classList.remove('editor-closed');
}
function initStyles(){
 ['#style-type','#type-filter'].forEach(id=>{$(id).innerHTML='<option value="">'+(id==='#style-type'?'Select type':'All Types')+'</option>'+['Classic','Hybrid','Volume','Wispy'].map(s=>'<option>'+s+'</option>').join('');});
 bindFilters('#style-search','#style-filters');$('#add-style').onclick=()=>editStyle();
 const close=()=>{$('#style-editor').hidden=true;$('.styles-layout').classList.add('editor-closed');};
 $('#close-editor').onclick=$('#cancel-style').onclick=close;imageInput('#style-image','#upload-zone');
 $('#style-form').onsubmit=e=>{e.preventDefault();const body={name:$('#style-name').value.trim(),type:$('#style-type').value,description:$('#style-description').value.trim(),is_active:$('#style-status').value==='Active'};if(editing)body.id=editing;if(upload!==undefined)body.image_data=upload;save(e.target,'admin_style_save',body,()=>editStyle());};
 editStyle();
}
function studioList(capabilities=false){
 const q=$(capabilities?'#capability-search':'#studio-search').value.toLowerCase(),city=$('#city-filter').value,state=$('#status-filter').value;
 const rows=data.studios.filter(s=>(s.name+' '+s.city+' '+s.specialties.join(' ')).toLowerCase().includes(q)&&(!city||s.city===city)&&(!state||Boolean(active(s))===(state==='Active')));
 const target=$(capabilities?'#capability-body':'#studio-body');
 target.innerHTML=countRows(rows,6).map(s=>'<tr>'+check(s.id)+(capabilities?'<td><div class="capability-studio"><span class="style-thumb">'+studioThumb(s)+'</span><strong>'+esc(s.name)+'</strong></div></td>':'<td><span class="style-thumb">'+studioThumb(s)+'</span></td><td class="style-name">'+esc(s.name)+'</td>')+'<td>'+esc(s.city)+(s.in_service_area?', Cavite':'')+'</td>'+(capabilities?'<td>'+s.specialties.map(x=>'<span class="capability-tag">'+esc(x)+'</span>').join('')+'</td><td>'+esc([...(s.capabilities.colors||[]),...(s.capabilities.customizations||[]),...(s.capabilities.services||[])].join(', ')||'None')+'</td>':'<td>'+esc(s.phone||'Not provided')+'</td><td>Not rated</td>')+'<td>'+pill(s.in_service_area?(Number(s.is_active)?'Active':'Inactive'):'Outside Cavite',Boolean(active(s)))+'</td><td><div class="row-actions"><button data-edit="'+s.id+'" aria-label="Edit '+esc(s.name)+'">'+icon('edit')+'</button>'+(!capabilities?'<button data-status="'+s.id+'" aria-label="'+(Number(s.is_active)?'Deactivate':'Activate')+' '+esc(s.name)+'">'+icon('settings')+'</button>':'')+'</div></td></tr>').join('')||'<tr><td colspan="8" class="empty-row">No matching studios.</td></tr>';
 wireSelection();$$('[data-edit]').forEach(b=>b.onclick=()=>capabilities?editCapabilities(Number(b.dataset.edit)):editStudio(Number(b.dataset.edit)));
 $$('[data-status]').forEach(b=>b.onclick=async()=>{const s=data.studios.find(s=>s.id===Number(b.dataset.status));b.disabled=true;try{await request('admin_studio_status',{id:s.id,is_active:!Number(s.is_active)});await refresh();note('Studio status updated.');}catch(e){note(e.message);b.disabled=false;}});
}
function editStudio(id){
 editing=id||null;upload=undefined;const s=data.studios.find(s=>s.id===id);
 $('#studio-form').reset();$('#editor-title').textContent=s?'Edit Studio':'Add New Studio';$('#form-message').textContent='';
 for(const key of ['name','address','city','latitude','longitude','phone','facebook','instagram'])$('#studio-'+key).value=s?.[key]??'';
 $('#studio-status').value=s&&!Number(s.is_active)?'Inactive':'Active';$('#upload-preview').innerHTML=s?studioThumb(s):'No image selected';
 $('#studio-editor').hidden=false;$('.studio-layout').classList.remove('editor-closed');
 if(window.updateStudioMap)window.updateStudioMap();
}
function initStudios(){
 $('#studio-city').innerHTML='<option value="">Select city</option>'+cityOptions();$('#studio-province').innerHTML='<option>Cavite</option>';$('#studio-province').disabled=true;
 $('#studio-address').placeholder='Street, barangay, city, Cavite';$('#studio-latitude').required=false;$('#studio-longitude').required=false;
 $('#studio-rating').disabled=true;$('#studio-rating').placeholder='No reviews yet';
 bindFilters('#studio-search','#studio-filters');imageInput('#studio-image','#upload-zone');$('#add-studio').onclick=()=>editStudio();
 $('#close-editor').onclick=$('#cancel-studio').onclick=()=>{$('#studio-editor').hidden=true;$('.studio-layout').classList.add('editor-closed');};
 window.initStudioMap();
 $('#studio-form').onsubmit=e=>{e.preventDefault();const old=data.studios.find(s=>s.id===editing);const body={name:$('#studio-name').value.trim(),city:$('#studio-city').value,address:$('#studio-address').value.trim(),latitude:$('#studio-latitude').value,longitude:$('#studio-longitude').value,phone:$('#studio-phone').value,facebook:$('#studio-facebook').value,instagram:$('#studio-instagram').value,is_active:$('#studio-status').value==='Active',is_demo:old?Boolean(Number(old.is_demo)):false,description:old?.description||'',specialties:old?.specialties||[]};if(editing)body.id=editing;if(upload!==undefined)body.image_data=upload;save(e.target,'admin_studio_save',body,()=>editStudio());};
 editStudio();
}
const choices={colors:['Black','Brown','Pink','Purple','Blue','Green','Red','Gold','White'],customizations:['Full Color','Color Accent','Color Mix','Mixed Evenly','Colored Tips','Gradient Blend'],services:['Lash Lift','Lash Removal','Aftercare','Consultation']};
function editCapabilities(id){
 editing=id;const s=data.studios.find(s=>s.id===id);if(!s){$('#capability-editor').hidden=true;$('#empty-editor').hidden=false;return;}
 $('#capability-editor').hidden=false;$('#empty-editor').hidden=true;$('#form-message').textContent='';
 $('#capability-profile').innerHTML='<span class="profile-studio-photo">'+studioThumb(s)+'</span><div><strong>'+esc(s.name)+'</strong><p>'+esc(s.city)+'</p></div>';
 function boxes(id,names,values,name){$(id).innerHTML=names.map(v=>'<label><input type="checkbox" name="'+name+'" value="'+esc(v)+'" '+(values.includes(v)?'checked':'')+'>'+esc(v)+'</label>').join('');}
 boxes('#supported-options',data.styles.filter(s=>Number(s.is_active)).map(s=>s.name),s.specialties,'specialties');
 for(const [key,target] of [['colors','#color-options'],['customizations','#customization-options'],['services','#service-options']])boxes(target,[...new Set([...choices[key],...(s.capabilities[key]||[])])],s.capabilities[key]||[],key);
 $('#capability-status').value=Number(s.is_active)?'Active':'Inactive';
}
function initCapabilities(){
 cityOptions();bindFilters('#capability-search','#capability-filters');$('#close-editor').onclick=$('#cancel-capability').onclick=()=>{$('#capability-editor').hidden=true;};
 $('#capability-form').onsubmit=e=>{e.preventDefault();if(!editing)return;const f=new FormData(e.target);save(e.target,'admin_studio_services',{id:editing,is_active:$('#capability-status').value==='Active',specialties:f.getAll('specialties'),colors:f.getAll('colors'),customizations:f.getAll('customizations'),services:f.getAll('services')});};
 editCapabilities(data.studios[0]?.id);
}
const finishes={natural:'Classic',balanced:'Hybrid',textured:'Wispy',dramatic:'Volume'};
function criteria(){
 const q=$('#criteria-search').value.toLowerCase(),category=$('#category-filter').value,state=$('#status-filter').value;
 const rows=data.rules.filter(r=>(r.label+' '+r.kind+' '+r.styles.map(s=>s.name).join(' ')).toLowerCase().includes(q)&&(!category||r.category===category)&&(!state||(r.style_ids.length?'Active':'Inactive')===state));
 $('#criteria-body').innerHTML=countRows(rows).map(r=>'<tr>'+check(r.volume)+'<td>'+esc(r.label)+'</td><td>'+esc(r.category)+'</td><td>'+esc(r.kind)+'</td><td>'+r.styles.map(s=>esc(s.name)+' <strong>'+r.scores[s.style_id]+' pts</strong>').join('<br>')+'</td><td>'+pill(r.style_ids.length?'Active':'Inactive',r.style_ids.length>0)+'</td><td><button data-rule="'+r.volume+'" class="pink-button">Edit</button></td></tr>').join('')||'<tr><td colspan="7" class="empty-row">No matching criteria.</td></tr>';
 $$('[data-rule]').forEach(b=>b.onclick=()=>editRule(b.dataset.rule));wireSelection();
}
function editRule(volume){
 editing=volume;const r=data.rules.find(r=>r.volume===volume);$('#criteria-editor').hidden=false;$('.styles-layout').classList.remove('editor-closed');$('#editor-title').textContent='Edit Recommendation';
 $('#criteria-name').value=r.label;$('#criteria-name').readOnly=true;$('#criteria-category').innerHTML='<option>'+esc(r.category)+'</option>';$('#criteria-category').disabled=true;$('#criteria-description').value='Lash style points for '+r.label+'.';$('#criteria-description').readOnly=true;$('#criteria-status').value=r.style_ids.length?'Active':'Inactive';$('#criteria-status').disabled=true;
 $('#option-list').textContent=r.label;const active=data.styles.filter(s=>Number(s.is_active)&&!Number(s.is_archived));
 $('#linked-options').innerHTML=active.map(s=>'<label class="quiz-score-row"><span>'+esc(s.name)+'</span><input type="number" data-style-score="'+s.id+'" aria-label="'+esc(s.name)+' points" min="0" max="100" step="1" required value="'+(r.scores[s.id]||0)+'"><span>pts</span></label>').join('');$('#linked-summary').textContent='Lash Style Points';$('#linked-picker').open=true;$('#form-message').textContent='';

}
function initCriteria(){
 $('#category-filter').innerHTML='<option value="">All Categories</option><option>Preference</option><option>Lifestyle</option>';$('#add-criteria').hidden=true;$('#add-option').hidden=true;
 bindFilters('#criteria-search','#criteria-filters');$('#close-editor').onclick=$('#cancel-criteria').onclick=()=>{$('#criteria-editor').hidden=true;$('.styles-layout').classList.add('editor-closed');};
 $('#criteria-form').onsubmit=e=>{e.preventDefault();if(!e.target.reportValidity())return;const scores=Object.fromEntries($$('[data-style-score]').map(input=>[input.dataset.styleScore,Number(input.value)]));if(!Object.values(scores).some(n=>n>0)){$('#form-message').textContent='Give at least one lash style points.';return;}save(e.target,'admin_quiz_scores_save',{key:editing,scores},()=>editRule(editing));};editRule(data.rules.find(r=>r.volume==='experience:first-time')?.volume||data.rules[0].volume);
}
function clientRows(){return data.users.filter(u=>u.role==='user');}
function userStatus(u){return !Number(u.is_active)?'Inactive':u.quiz_count?'Completed':'Registered';}
function users(){
 const clients=clientRows(),q=$('#users-search').value.toLowerCase(),state=$('#status-filter').value,style=$('#lash-filter').value;
 $('#total-users').textContent=clients.length;$('#completed-users').textContent=data.summary.completed_quizzes;$('#generated-users').textContent=data.summary.completed_tryons;$('#saved-users').textContent=data.saved.filter(s=>s.kind==='looks'&&clients.some(u=>Number(u.id)===Number(s.user_id))).length;
 $$('.users-stats .stat-card p').forEach(p=>p.textContent='From registered client accounts');
 const rows=clients.filter(u=>{const m=data.matches.find(m=>Number(m.user_id)===Number(u.id)),day=(m?.created_at||u.created_at).slice(0,10);return (u.name+' '+u.email).toLowerCase().includes(q)&&(!state||userStatus(u)===state)&&(!style||m?.style===style)&&(!$('#date-from').value||day>=$('#date-from').value)&&(!$('#date-to').value||day<=$('#date-to').value);});
 const list=countRows(rows,7);
 $('#users-body').innerHTML=list.map(u=>{const m=data.matches.find(m=>Number(m.user_id)===Number(u.id)),saved=data.saved.filter(s=>Number(s.user_id)===Number(u.id)&&s.kind==='studios'&&s.available);return '<tr>'+check(u.id)+'<td><strong>'+esc(u.name)+'</strong><small>'+esc(u.email)+'</small></td><td>'+esc(m?.style||'No quiz yet')+'</td><td>'+Number(u.tryon_count)+' completed try-ons</td><td>'+saved.length+' saved studios</td><td>'+esc(m?.created_at||u.created_at)+'</td><td>'+pill(userStatus(u),Number(u.is_active))+'</td><td><div class="row-actions"><button data-user="'+u.id+'" aria-label="View '+esc(u.name)+'">'+icon('edit')+'</button><button data-user-status="'+u.id+'" aria-label="'+(Number(u.is_active)?'Deactivate':'Activate')+'">'+icon('settings')+'</button></div></td></tr>';}).join('')||'<tr><td colspan="8" class="empty-row">No matching users.</td></tr>';
 $('#user-pagination').innerHTML='<button id="users-prev" '+(gridPage===1?'disabled':'')+'>Previous</button><span>'+gridPage+'</span><button id="users-next" '+(gridPage*7>=rows.length?'disabled':'')+'>Next</button>';$('#users-prev').onclick=()=>{gridPage--;users();};$('#users-next').onclick=()=>{gridPage++;users();};
 $$('[data-user]').forEach(b=>b.onclick=()=>showUser(Number(b.dataset.user)));$$('[data-user-status]').forEach(b=>b.onclick=async()=>{const u=clients.find(u=>Number(u.id)===Number(b.dataset.userStatus));try{await request('admin_user_status',{id:Number(u.id),is_active:!Number(u.is_active)});await refresh();}catch(e){note(e.message);}});wireSelection();
}
function userDetail(id,tab='quiz'){
 const u=data.users.find(u=>Number(u.id)===id),matches=data.matches.filter(m=>Number(m.user_id)===id);
 if(tab==='look')return '<p>'+u.tryon_count+' completed try-ons.</p><p>Camera photos stay on the client device.</p><p>Last completed: '+esc(u.last_tryon||'None')+'</p>';
 if(tab==='studios')return data.saved.filter(s=>Number(s.user_id)===id&&s.kind==='studios').map(s=>'<p>'+esc(data.studios.find(st=>st.id===Number(s.item))?.name||'Unavailable studio')+(s.available?'':' (unavailable)')+'</p>').join('')||'<p>No saved studios.</p>';
 return matches.map(m=>'<article><h3>'+esc(m.style)+'</h3><p>'+esc([m.volume,m.occasion,m.experience].filter(Boolean).join(' / '))+'</p><small>'+esc(m.created_at)+'</small></article>').join('')||'<p>No quiz results yet.</p>';
}
function showUser(id){
 editing=id;const u=data.users.find(u=>Number(u.id)===id);$('#user-details').hidden=false;$('#user-profile').innerHTML='<h3>'+esc(u.name)+'</h3><p>'+esc(u.email)+'</p>';$('#user-tab-panel').innerHTML=userDetail(id);
 $$('[data-tab]').forEach(b=>b.onclick=()=>{$$('[data-tab]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));$('#user-tab-panel').innerHTML=userDetail(id,b.dataset.tab);});
 $('#full-result').onclick=()=>open(u.name,userDetail(id)+userDetail(id,'look')+userDetail(id,'studios'));
}
function initUsers(){
 $('#lash-filter').innerHTML='<option value="">All Lash Styles</option>'+data.styles.map(s=>'<option>'+esc(s.name)+'</option>').join('');bindFilters('#users-search','#users-filters');
 $('#apply-dates').onclick=()=>{if($('#date-from').value&&$('#date-to').value&&$('#date-from').value>$('#date-to').value){$('#date-error').textContent='Choose a valid date range.';return;}$('#date-error').textContent='';$('#date-filter').open=false;gridPage=1;users();};
 $('#clear-dates').onclick=()=>{$('#date-from').value=$('#date-to').value='';users();};$('#close-details').onclick=()=>{$('#user-details').hidden=true;};$('#user-details').hidden=true;
}
function dashboard(){
 const s=data.summary,stats=[s.clients,s.lash_styles,s.active_studios,s.completed_quizzes];
 $$('.stats .stat-card').forEach((card,i)=>{card.querySelector('strong').textContent=stats[i];card.querySelector('p').textContent=i===2?'Active studios in Cavite':'From your database';});
 $('.welcome h1').textContent='Welcome, '+data.user.name+'!';
 const clients=clientRows(),ids=new Set(clients.map(u=>Number(u.id))),matches=data.matches.filter(m=>ids.has(Number(m.user_id)));
 const q=$('#admin-search').value.toLowerCase();
 const ranking=data.styles.map(s=>({...s,total:matches.filter(m=>m.style===s.name).length})).sort((a,b)=>b.total-a.total);
 $('#lash-rankings').innerHTML=ranking.filter(s=>s.name.toLowerCase().includes(q)).map((s,i)=>'<div class="lash-row"><span class="rank">'+(i+1)+'</span><span class="lash-photo">'+thumb(s)+'</span><span>'+esc(s.name)+'</span><span class="match-count">'+s.total+' results</span></div>').join('');
 $('.studio-panel p').textContent='Cavite studios most saved by clients.';
 $('#studio-rankings').innerHTML=data.studios.filter(active).filter(s=>s.name.toLowerCase().includes(q)).map(s=>({...s,total:data.saved.filter(x=>x.kind==='studios'&&Number(x.item)===s.id&&ids.has(Number(x.user_id))).length})).sort((a,b)=>b.total-a.total).slice(0,5).map((s,i)=>'<div class="studio-row"><span class="rank">'+(i+1)+'</span><span class="studio-photo">'+studioThumb(s)+'</span><span>'+esc(s.name)+'</span><span class="match-count">'+s.total+' saves</span></div>').join('')||'<p>No active Cavite studios yet.</p>';
 const activity=[...clients.map(u=>({text:u.name+' registered',at:u.created_at})),...matches.map(m=>({text:m.name+' completed a quiz: '+m.style,at:m.created_at}))].sort((a,b)=>b.at.localeCompare(a.at));
 const markup=activity.filter(a=>a.text.toLowerCase().includes(q)).map(a=>'<div class="activity-item"><span>'+icon('document')+'</span><div><strong>'+esc(a.text)+'</strong><small>'+esc(a.at)+'</small></div></div>');
 $('#recent-activities').innerHTML=markup.slice(0,5).join('')||'<p>No activity yet.</p>';$('#all-activities').onclick=()=>open('Recent activities',markup.join('')||'<p>No activity yet.</p>');
 drawChart(clients,matches);
}
function drawChart(clients,matches){
 const days=Number($('#activity-range').value),dates=Array.from({length:days},(_,i)=>{const d=new Date();d.setDate(d.getDate()-days+1+i);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');});
 const series=[dates.map(d=>clients.filter(u=>u.created_at.startsWith(d)).length),dates.map(d=>matches.filter(m=>m.created_at.startsWith(d)).length)];
 const max=Math.max(1,...series.flat());let svg='<line x1="30" y1="190" x2="770" y2="190" stroke="#e4d0da"/>';
 series.forEach((values,j)=>{svg+='<polyline fill="none" stroke="'+['#ed3681','#9564c4'][j]+'" stroke-width="3" points="'+values.map((v,i)=>(30+i*740/(days-1))+','+(190-v*150/max)).join(' ')+'"/>';values.forEach((v,i)=>{svg+='<circle cx="'+(30+i*740/(days-1))+'" cy="'+(190-v*150/max)+'" r="3" fill="'+['#ed3681','#9564c4'][j]+'"><title>'+dates[i]+': '+v+'</title></circle>';});});
 svg+='<text x="30" y="220" font-size="12">'+dates[0]+'</text><text x="680" y="220" font-size="12">'+dates.at(-1)+'</text>';
 $('#activity-chart').innerHTML=svg;$('#activity-chart').setAttribute('aria-label','Registered clients and completed quizzes over the last '+days+' days');
}
function initDashboard(){
 $('.activity-panel .panel-heading p').textContent='New clients and completed quizzes over time.';$('.chart-legend span:last-child').hidden=true;
 $('#activity-range').onchange=dashboard;$('#admin-search').oninput=dashboard;
 const links={'Add Lash Style':'admin-lash-styles.html#add','Add Studio':'admin-studios.html#add','Recommendation Criteria':'admin-recommendation-criteria.html','Users & Results':'admin-users-results.html'};
 $$('[data-section]').forEach(b=>b.onclick=()=>location.assign(links[b.dataset.section]));dashboard();
}
function settings(){
 $('#profile-display-name').textContent=data.user.name;$('#large-avatar').textContent=data.user.name[0];$('#profile-name').value=data.user.name;$('#profile-email').value=data.user.email;$('#profile-email').readOnly=true;
 $('#profile-username').value=data.user.email;$('#profile-username').removeAttribute('pattern');$('#profile-username').readOnly=true;$('#profile-phone').disabled=true;
 const account=data.users.find(u=>Number(u.id)===Number(data.user.id));$('#member-since').textContent=account?.created_at||'';$('#last-login').textContent='Current session';
}
function initSettings(){
 $('#profile-photo').disabled=true;$('#profile-photo').closest('label').title='Profile photo upload is not available here.';$('#delete-profile').disabled=true;$('#delete-profile').title='Administrator account removal is unavailable.';
 $('#password-note').textContent='Updates your account sign-in password.';$('.password-requirements').innerHTML='<strong>Password requirements:</strong><p>8 to 72 bytes.</p>';$('#new-password').maxLength=$('#confirm-password').maxLength=72;
 $('#profile-form').onsubmit=e=>{e.preventDefault();save(e.target,'admin_profile_save',{name:$('#profile-name').value.trim()});};
 $('#password-form').onsubmit=e=>{e.preventDefault();if($('#new-password').value!==$('#confirm-password').value){$('#password-message').textContent='Passwords do not match.';return;}save(e.target,'admin_password_save',{current_password:$('#current-password').value,password:$('#new-password').value},()=>{$('#password-form').reset();$('#password-message').textContent='Password updated.';});};
 $$('[data-reveal]').forEach(b=>b.onclick=()=>{const f=document.getElementById(b.dataset.reveal);f.type=f.type==='password'?'text':'password';b.setAttribute('aria-pressed',String(f.type==='text'));});
 $('#settings-logout').onclick=logout;
 const key='lashmatch-admin-display-'+data.user.id;let prefs={};try{prefs=JSON.parse(localStorage.getItem(key)||'{}');}catch{}
 for(const field of ['language','date','time','timezone'])if(prefs[field])$('#preference-'+field).value=prefs[field];
 $('#preferences-form').onsubmit=e=>{e.preventDefault();try{const p={...prefs,...Object.fromEntries(['language','date','time','timezone'].map(k=>[k,$('#preference-'+k).value]))};prefs=p;localStorage.setItem(key,JSON.stringify(p));$('#preferences-message').textContent='Display preferences saved in this browser.';}catch{$('#preferences-message').textContent='Browser storage is unavailable.';}};
 $$('[data-settings-tab]').forEach(b=>b.onclick=()=>{const name=b.dataset.settingsTab;$$('[data-settings-tab]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));$$('[role=tabpanel]').forEach(p=>p.hidden=p.id!=='settings-panel-'+(name==='security'?'profile':name));if(name==='security')$('.password-card').scrollIntoView({block:'start'});});
 $('#notifications-enabled').checked=prefs.notifications!==false;$('#notifications-form').onsubmit=e=>{e.preventDefault();try{prefs={...prefs,notifications:$('#notifications-enabled').checked};localStorage.setItem(key,JSON.stringify(prefs));$('#notifications-message').textContent='Notification preference saved in this browser.';}catch{$('#notifications-message').textContent='Browser storage is unavailable.';}};
 $('#appearance-form').onsubmit=e=>{e.preventDefault();const theme=new FormData(e.target).get('theme')||'light';try{prefs={...prefs,theme,compact:$('#compact-tables').checked};localStorage.setItem(key,JSON.stringify(prefs));document.body.dataset.adminTheme=theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;document.body.dataset.adminDensity=prefs.compact?'compact':'comfortable';$('#appearance-message').textContent='Appearance saved in this browser.';}catch{$('#appearance-message').textContent='Browser storage is unavailable.';}};
 $('#reset-appearance').onclick=()=>{document.body.dataset.adminTheme='light';document.body.dataset.adminDensity='comfortable';prefs={...prefs,theme:'light',compact:false};try{localStorage.setItem(key,JSON.stringify(prefs));}catch{}$('#appearance-form').reset();};
 $('#settings-panel-system p').textContent='Your catalogs and client records are saved in the database.';
 $('#storage-summary').textContent=data.summary.clients+' clients, '+data.styles.length+' lash styles, '+data.studios.length+' studio records.';
 $('#reset-preview-data').disabled=true;$('#reset-preview-data').title='Database records are not replaced with sample data.';
 $('#settings-export').onclick=()=>{const blob=new Blob([JSON.stringify({styles:data.styles,studios:data.studios,rules:data.rules},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='lashmatch-catalog.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
}
function renderPage(){
 ({'admin-lash-styles.html':styles,'admin-studios.html':()=>studioList(),'admin-studio-capabilities.html':()=>studioList(true),'admin-users-results.html':users,'admin-recommendation-criteria.html':criteria,'admin-settings.html':settings}[page]||dashboard)();
}
async function logout(){try{await request('logout',{});location.replace('../login.html?role=admin');}catch(e){note(e.message);}}
$('#admin-search-form').onsubmit=e=>e.preventDefault();$('#profile').onclick=()=>location.assign('admin-settings.html');$('#notifications').onclick=()=>{try{if(JSON.parse(localStorage.getItem('lashmatch-admin-display-'+data.user.id)||'{}').notifications===false){open('Notifications','<p>Activity notifications are turned off in Settings.</p>');return;}}catch{}open('Recent quiz results',data.matches.slice(0,10).map(m=>'<p>'+esc(m.name)+' - '+esc(m.style)+'</p>').join('')||'<p>No results yet.</p>');};
$('.logout-wrap a').onclick=e=>{e.preventDefault();logout();};
(async()=>{try{
 const session=await request('session');csrf=session.csrf;if(!session.user){location.replace('../login.html?role=admin');return;}if(session.user.role!=='admin')throw Error('Administrator access is required.');
 data=await request('admin_data');
 try{const p=JSON.parse(localStorage.getItem('lashmatch-admin-display-'+data.user.id)||'{}');document.body.dataset.adminTheme=p.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):(p.theme||'light');document.body.dataset.adminDensity=p.compact?'compact':'comfortable';}catch{}
 ({'admin-lash-styles.html':initStyles,'admin-studios.html':initStudios,'admin-studio-capabilities.html':initCapabilities,'admin-users-results.html':initUsers,'admin-recommendation-criteria.html':initCriteria,'admin-settings.html':initSettings}[page]||initDashboard)();
 $$('.local-data-note').forEach(p=>p.textContent='Saved to your LashMatch database.');
 const link=document.createElement('a');link.href='../home.html';link.className='nav-item';link.textContent='Open client side';$('.logout-wrap').prepend(link);
 await refresh();status.hidden=true;document.body.classList.add('live-ready');
}catch(e){status.textContent=e.message+' Refresh this page to retry.';}})();
addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
})();
