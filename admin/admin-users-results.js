(() => {
'use strict';
const $=s=>document.querySelector(s),key=window.AdminUsers.key;
let records=window.AdminUsers.load(),page=1,active=records[0]?.id||null,tab='quiz',dateFrom='',dateTo='',selected=new Set(),timer;
const reference='users%20%26%20result.png';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>'<svg aria-hidden="true"><use href="#'+name+'"/></svg>';
function portrait(user,large=false){const index=Number.isInteger(user.portrait)&&user.portrait>=0&&user.portrait<8?user.portrait:0;const box=large&&index===0?'1454 465 78 78':'513 '+[462,525,589,653,718,782,847,910][index]+' 45 46';return '<span class="user-portrait"><svg viewBox="'+box+'" preserveAspectRatio="xMidYMid slice" role="img" aria-label="'+esc(user.name)+'"><image href="'+reference+'" width="1920" height="1080"/></svg></span>';}
function look(user,cls='user-look'){const index=Number.isInteger(user.look)&&user.look>=0&&user.look<8?user.look:0;return '<span class="'+cls+'"><svg viewBox="865 '+[460,525,588,652,716,782,460,909][index]+' 58 49" preserveAspectRatio="xMidYMid slice" role="img" aria-label="'+esc(user.style||'Final lash look')+'"><image href="'+reference+'" width="1920" height="1080"/></svg></span>';}
function dateLabel(value){if(window.AdminPreferences)return window.AdminPreferences.date(value);if(!value)return 'Not available';return new Date(value.length===10?value+'T00:00:00':value).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
function timeLabel(value){if(window.AdminPreferences)return window.AdminPreferences.time(value);return value?new Date(value).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):'';}
function studios(user){const all=window.AdminStudios.load();return user.preferred.map(id=>all.find(o=>o.id===id)).filter(Boolean);}
function fillStyles(){const old=$('#lash-filter').value;$('#lash-filter').innerHTML='<option value="">All Lash Styles</option>'+[...new Set(records.map(o=>o.style).filter(Boolean))].sort().map(name=>'<option>'+esc(name)+'</option>').join('');$('#lash-filter').value=old;}
function filtered(){const q=$('#users-search').value.trim().toLowerCase();return records.filter(o=>(o.name+' '+o.email+' '+o.style).toLowerCase().includes(q)&&(!$('#status-filter').value||o.status===$('#status-filter').value)&&(!$('#lash-filter').value||o.style===$('#lash-filter').value)&&(!dateFrom||(o.date&&o.date.slice(0,10)>=dateFrom))&&(!dateTo||(o.date&&o.date.slice(0,10)<=dateTo)));}
function shown(){return filtered().slice((page-1)*8,page*8);}
function selection(){const rows=shown(),count=rows.filter(o=>selected.has(o.id)).length;$('#select-all').checked=rows.length>0&&count===rows.length;$('#select-all').indeterminate=count>0&&count<rows.length;$('#select-all').disabled=!rows.length;}
function stats(){$('#total-users').textContent=records.length;$('#completed-users').textContent=records.filter(o=>o.status==='Completed').length;$('#generated-users').textContent=records.filter(o=>o.generated).length;$('#saved-users').textContent=records.filter(o=>o.saved).length;}
function pageButtons(total){
 const pages=Math.max(1,Math.ceil(total/8));let numbers;
 if(pages<=7)numbers=Array.from({length:pages},(_,i)=>i+1);
 else if(page<=4)numbers=[1,2,3,4,5,'…',pages];
 else if(page>=pages-3)numbers=[1,'…',pages-4,pages-3,pages-2,pages-1,pages];
 else numbers=[1,'…',page-1,page,page+1,'…',pages];
 $('#user-pagination').innerHTML='<button type="button" class="page-arrow" data-page="'+(page-1)+'" aria-label="Previous page" '+(page===1?'disabled':'')+'>‹</button>'+numbers.map(n=>typeof n==='number'?'<button type="button" data-page="'+n+'" aria-label="Page '+n+'" '+(n===page?'aria-current="page"':'')+'>'+n+'</button>':'<span aria-hidden="true">…</span>').join('')+'<button type="button" class="page-arrow" data-page="'+(page+1)+'" aria-label="Next page" '+(page===pages?'disabled':'')+'>›</button>';
}
function render(){
 const items=filtered();page=Math.min(page,Math.max(1,Math.ceil(items.length/8)));const rows=shown();
 $('#users-body').innerHTML=rows.length?rows.map(o=>'<tr'+(selected.has(o.id)?' class="selected"':'')+'><td class="check-cell"><input type="checkbox" data-select="'+esc(o.id)+'" aria-label="Select '+esc(o.name)+'" '+(selected.has(o.id)?'checked':'')+'></td><td><div class="table-user">'+portrait(o)+'<span><strong>'+esc(o.name)+'</strong><small>'+esc(o.email)+'</small></span></div></td><td>'+(o.style?'<span class="quiz-style">'+esc(o.style)+'</span><div class="quiz-tags"><span>'+esc(o.eye)+'</span><span class="'+(o.preference==='Full Color'?'blue-tag':'')+'">'+esc(o.preference)+'</span></div>':'<span class="user-muted">-<br>Not yet taken</span>')+'</td><td>'+(o.generated?look(o):'<span class="user-muted">-</span>')+'</td><td class="user-muted">'+(studios(o).map(s=>esc(s.name)).join('<br>')||'-')+'</td><td class="user-muted">'+esc(dateLabel(o.date))+'<br>'+esc(timeLabel(o.date))+'</td><td><span class="status-pill '+(o.status==='In Progress'?'status-progress':o.status==='Registered'?'status-registered':o.status==='Inactive'?'status-inactive':'')+'">'+esc(o.status)+'</span></td><td><div class="row-actions"><button type="button" data-view="'+esc(o.id)+'" aria-label="View results for '+esc(o.name)+'">'+icon('eye')+'</button><button type="button" data-delete="'+esc(o.id)+'" aria-label="Delete '+esc(o.name)+'">'+icon('trash')+'</button></div></td></tr>').join(''):'<tr><td colspan="8" class="empty-row">No users match your filters. Try another search or reset the filters.</td></tr>';
 $('#entry-count').textContent='Showing '+(items.length?(page-1)*8+1:0)+' to '+Math.min(page*8,items.length)+' of '+items.length+' entries';pageButtons(items.length);selection();stats();
 if(!rows.some(o=>o.id===active))active=rows[0]?.id||null;
 if(active){if(!$('#user-details').hidden)renderDetails();}else{$('#user-details').hidden=true;$('.users-layout').classList.add('details-closed');}
}
function quizHTML(user){
 if(!user.style)return '<p>This user has not taken the quiz yet.</p>';
 const info=[['Eye Shape',user.eye],['Lash Preference',user.preference],['Desired Look',user.desired],['Color Preference',user.color],['Occasion',user.occasion]];
 const details='<dl class="quiz-details">'+info.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+esc(value||'Not specified')+'</dd></div>').join('')+'</dl>';
 if(user.status==='In Progress')return details+'<p>The quiz is still in progress. Recommendations are not finalized.</p>';
 const recommended=[{name:user.style,score:92,look:user.look},{name:user.style==='Classic Lash'?'Hybrid Lash':'Classic Lash',score:76,look:2},{name:user.style==='Wispy Lash'?'Volume Lash':'Wispy Lash',score:68,look:3}];
 return details+'<h3>Recommended Lash Styles</h3>'+recommended.map((r,i)=>'<article class="recommendation-result">'+look({...user,look:r.look,style:r.name})+'<div><strong>'+esc(r.name)+'</strong>'+(i===0?'<span class="top-match">Top Match</span>':'')+'<small>'+r.score+'% match</small></div></article>').join('');
}
function lookHTML(user){if(!user.generated)return '<p>No final look has been generated for this user.</p>';return look(user,'result-photo')+'<h3>'+esc(user.style)+'</h3><p>'+esc(user.preference)+' · '+esc(user.eye)+' eyes</p><p>'+(user.saved?'Saved to this user’s preview looks.':'This preview look has not been saved.')+'</p>';}
function studiosHTML(user){const nearby=studios(user);return nearby.length?'<p class="user-muted">Preferred studios from this sample result.</p>'+nearby.map(s=>'<article class="nearby-studio"><strong>'+esc(s.name)+'</strong><small>'+esc(s.city)+', '+esc(s.province)+' · '+esc(s.status)+'</small><a href="admin-studios.html?edit='+encodeURIComponent(s.id)+'">View Studio</a></article>').join(''):'<p>No preferred studios are available for this result.</p>';}
function renderDetails(){
 const user=records.find(o=>o.id===active);if(!user)return;
 $('#user-profile').innerHTML='<div class="detail-profile">'+portrait(user,true)+'<div><strong>'+esc(user.name)+'</strong><small>'+esc(user.email)+'</small><small>Member since '+esc(dateLabel(user.joined))+'</small></div></div>';
 document.querySelectorAll('[data-tab]').forEach(button=>{const chosen=button.dataset.tab===tab;button.setAttribute('aria-selected',String(chosen));button.tabIndex=chosen?0:-1;});
 $('#user-tab-panel').setAttribute('aria-labelledby','tab-'+tab);
 $('#user-tab-panel').innerHTML=tab==='quiz'?quizHTML(user):tab==='look'?lookHTML(user):studiosHTML(user);
}
function view(id,focus=true){active=id;tab='quiz';$('#user-details').hidden=false;$('.users-layout').classList.remove('details-closed');renderDetails();if(focus){$('#tab-quiz').focus({preventScroll:true});if(matchMedia('(max-width:999px)').matches)$('#user-details').scrollIntoView({behavior:'smooth',block:'start'});}}
const dialog=$('#admin-dialog');
function open(title,html){$('#dialog-title').textContent=title;$('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();}
$('.dialog-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
$('#full-result').onclick=()=>{const user=records.find(o=>o.id===active);if(!user)return;open(user.name+' — Full Result','<div class="full-user-result"><p class="manager-note">Sample result from the browser preview; not a live client record.</p><h3>Quiz Result</h3>'+quizHTML(user)+'<h3>Final Look</h3>'+lookHTML(user)+'<h3>Preferred Studios</h3>'+studiosHTML(user)+'</div>');};
$('#close-details').onclick=()=>{$('#user-details').hidden=true;$('.users-layout').classList.add('details-closed');document.querySelector('[data-view="'+CSS.escape(active||'')+'"]')?.focus();};
document.querySelectorAll('[data-tab]').forEach(button=>{button.onclick=()=>{tab=button.dataset.tab;renderDetails();};button.onkeydown=e=>{const all=[...document.querySelectorAll('[data-tab]')],index=all.indexOf(button);let next;if(e.key==='ArrowRight')next=(index+1)%all.length;else if(e.key==='ArrowLeft')next=(index+all.length-1)%all.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=all.length-1;else return;e.preventDefault();tab=all[next].dataset.tab;renderDetails();all[next].focus();};});
$('#users-body').onclick=e=>{const show=e.target.closest('[data-view]'),remove=e.target.closest('[data-delete]');if(show)view(show.dataset.view);if(remove){const user=records.find(o=>o.id===remove.dataset.delete);open('Delete user and results?','<p>Remove <strong>'+esc(user.name)+'</strong> and their associated results from this browser preview? Live accounts will not be affected.</p><div class="delete-actions"><button type="button" id="cancel-delete" class="cancel-button">Cancel</button><button type="button" id="confirm-delete" class="pink-button">Delete</button></div><p id="delete-error" role="alert"></p>');$('#cancel-delete').onclick=()=>dialog.close();$('#confirm-delete').onclick=()=>{const next=records.filter(o=>o.id!==user.id);try{localStorage.setItem(key,JSON.stringify(next));}catch{$('#delete-error').textContent='Browser storage is full or unavailable. This user was not deleted.';return;}records=next;selected.delete(user.id);fillStyles();render();dialog.close();window.dispatchEvent(new CustomEvent('admin-data-changed',{detail:{kind:'users',action:'Preview user removed',name:user.name}}));clearTimeout(timer);$('#users-toast').textContent='User and results removed from this browser preview.';$('#users-toast').hidden=false;timer=setTimeout(()=>{$('#users-toast').hidden=true;},4500);};}};
$('#users-body').onchange=e=>{const input=e.target.closest('[data-select]');if(!input)return;input.checked?selected.add(input.dataset.select):selected.delete(input.dataset.select);input.closest('tr').classList.toggle('selected',input.checked);selection();};
$('#select-all').onchange=e=>{shown().forEach(o=>e.target.checked?selected.add(o.id):selected.delete(o.id));render();};
$('#user-pagination').onclick=e=>{const button=e.target.closest('[data-page]');if(!button||button.disabled)return;page=Number(button.dataset.page);render();};
function filterChanged(){page=1;render();}
$('#users-search').oninput=()=>{$('#admin-search').value=$('#users-search').value;filterChanged();};$('#admin-search').oninput=()=>{$('#users-search').value=$('#admin-search').value;filterChanged();};
$('#admin-search-form').onsubmit=e=>{e.preventDefault();$('#users-search').focus();};$('#users-filters').onsubmit=e=>e.preventDefault();
['#status-filter','#lash-filter'].forEach(id=>$(id).onchange=filterChanged);
function clearDates(){dateFrom='';dateTo='';$('#date-from').value='';$('#date-to').value='';$('#date-label').textContent='Select date range';$('#date-error').textContent='';$('#date-filter').open=false;}
$('#apply-dates').onclick=()=>{const from=$('#date-from').value,to=$('#date-to').value;if(from&&to&&from>to){$('#date-error').textContent='The start date must be before the end date.';return;}dateFrom=from;dateTo=to;$('#date-label').textContent=from||to?(from?dateLabel(from):'Any date')+' – '+(to?dateLabel(to):'Any date'):'Select date range';$('#date-error').textContent='';$('#date-filter').open=false;filterChanged();};
$('#clear-dates').onclick=()=>{clearDates();filterChanged();};
$('#users-filters').onreset=e=>{e.preventDefault();$('#users-search').value='';$('#admin-search').value='';$('#status-filter').value='';$('#lash-filter').value='';clearDates();filterChanged();};
window.addEventListener('admin-preferences-changed',render);fillStyles();render();if(active)view(active,false);
const query=new URLSearchParams(location.search).get('search');if(query){$('#users-search').value=query;$('#users-search').dispatchEvent(new Event('input'));}
window.addEventListener('storage',e=>{if(e.key===key){records=window.AdminUsers.load();fillStyles();render();}else if(e.key===window.AdminStudios.key)render();});
})();
