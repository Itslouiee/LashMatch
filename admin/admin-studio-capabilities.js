(() => {
'use strict';
const $=s=>document.querySelector(s),key=window.AdminStudios.key;
const styleList=['Classic','Hybrid','Volume','Wispy','Mega Volume'];
const colors=['Black','Brown','Pink','Purple','Blue','Green','Red','Other (specify)'];
const customizations=['Full Color','Color Accent','Color Mix','Inner Accent','Middle Accent','Outer Accent'];
const services=['Bottom Lashes','Lash Tint','Lash Lift'];
const defaults={
abg:{colors:['Black','Brown','Pink','Purple'],customizations:['Full Color','Color Accent','Inner Accent','Middle Accent'],services:['Bottom Lashes','Lash Tint']},
lush:{colors:['Black','Brown','Pink'],customizations:['Color Mix'],services:['Bottom Lashes']},
room:{colors:['Black','Brown'],customizations:['Full Color'],services:['Lash Tint','Bottom Lashes']},
glow:{colors:['Black','Brown'],customizations:['Color Accent'],services:['Lash Lift','Bottom Lashes']},
co:{colors:['Black','Pink','Purple'],customizations:['Color Mix'],services:['Lash Tint']},
wink:{colors:['Black','Brown'],customizations:['Color Accent','Full Color'],services:['Bottom Lashes']}
};
let records=window.AdminStudios.load(),page=1,editing=null,selected=new Set(),expanded=new Set(),timer;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon=name=>'<svg aria-hidden="true"><use href="#'+name+'"/></svg>';
function config(item){const base=defaults[item.id]||{colors:[],customizations:[],services:[]};return {colors:Array.isArray(item.colors)?item.colors:base.colors,customizations:Array.isArray(item.customizations)?item.customizations:base.customizations,services:Array.isArray(item.services)?item.services:base.services,otherColor:item.otherColor||''};}
function photo(item){if(typeof item.image==='string'&&/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(item.image))return '<img src="'+item.image+'" alt="'+esc(item.name)+'">';const y=[395,483,570,658,748,840][Number.isInteger(item.crop)?item.crop:0]||395;return '<svg viewBox="510 '+y+' 71 65" role="img" aria-label="'+esc(item.name)+'"><image href="studio-capabilities.png" width="1920" height="1080"/></svg>';}
function features(item){const c=config(item);return [...new Set([...(c.colors.some(name=>!['Black','Brown'].includes(name))?['Colored Lashes']:[]),...c.customizations.filter(name=>['Full Color','Color Accent','Color Mix'].includes(name)),...c.services])];}
function pill(name,feature=false){const color=feature?'green':name==='Volume'?'blue':name==='Wispy'?'pink':name==='Mega Volume'?'orange':'';return '<span class="capability-tag '+(name==='Colored Lashes'?'pink':color)+'">'+esc(name)+'</span>';}
function tags(items,item,kind){const id=item.id+'-'+kind,isExpanded=expanded.has(id),limit=kind==='features'&&items.length>3?2:3,visible=isExpanded?items:items.slice(0,limit);return '<div class="capability-tags">'+visible.map(name=>pill(name,kind==='features')).join('')+(items.length>limit?'<button type="button" class="more-tags" data-expand="'+esc(id)+'" aria-expanded="'+isExpanded+'" aria-label="'+(isExpanded?'Show fewer':'Show all')+' '+kind+' for '+esc(item.name)+'">'+(isExpanded?'Less':'+'+(items.length-limit)+' more')+'</button>':'')+(items.length?'':'<span>None</span>')+'</div>';}
function fillCities(){const current=$('#city-filter').value;$('#city-filter').innerHTML='<option value="">All Cities</option>'+[...new Set(records.map(o=>o.city).filter(Boolean))].sort().map(city=>'<option>'+esc(city)+'</option>').join('');$('#city-filter').value=current;}
function filtered(){const q=$('#capability-search').value.trim().toLowerCase();return records.filter(o=>([o.name,o.city,o.province,...o.specialties,...features(o),...config(o).colors].join(' ')).toLowerCase().includes(q)&&(!$('#city-filter').value||o.city===$('#city-filter').value)&&(!$('#status-filter').value||o.status===$('#status-filter').value));}
function shown(){return filtered().slice((page-1)*6,page*6);}
function selection(){const all=shown(),count=all.filter(o=>selected.has(o.id)).length;$('#select-all').checked=all.length>0&&count===all.length;$('#select-all').indeterminate=count>0&&count<all.length;$('#select-all').disabled=!all.length;}
function render(){const items=filtered();page=Math.min(page,Math.max(1,Math.ceil(items.length/6)));$('#capability-body').innerHTML=shown().length?shown().map(o=>'<tr'+(selected.has(o.id)?' class="selected"':'')+'><td class="check-cell"><input type="checkbox" data-select="'+esc(o.id)+'" aria-label="Select '+esc(o.name)+'" '+(selected.has(o.id)?'checked':'')+'></td><td><div class="capability-studio"><span class="style-thumb">'+photo(o)+'</span><strong>'+esc(o.name)+'</strong></div></td><td><span class="capability-location">'+icon('pin')+'<span>'+esc(o.city)+'<br>'+esc(o.province)+'</span></span></td><td>'+tags(o.specialties,o,'styles')+'</td><td>'+tags(features(o),o,'features')+'</td><td><span class="status-pill '+(o.status==='Inactive'?'status-inactive':'')+'">'+esc(o.status)+'</span></td><td><div class="row-actions"><button data-edit="'+esc(o.id)+'" aria-label="Edit capabilities for '+esc(o.name)+'">'+icon('edit')+'</button></div></td></tr>').join(''):'<tr><td colspan="7" class="empty-row">No matching studios. Reset the filters or add a studio from Manage Studios.</td></tr>';$('#entry-count').textContent='Showing '+(items.length?(page-1)*6+1:0)+' to '+Math.min(page*6,items.length)+' of '+items.length+' entries';$('#current-page').textContent=page;$('#previous-page').disabled=page===1;$('#next-page').disabled=page>=Math.ceil(items.length/6);selection();}
function checkboxes(target,names,values,group){$(target).innerHTML=names.map(name=>'<label><input type="checkbox" name="'+group+'" value="'+esc(name)+'" '+(values.includes(name)?'checked':'')+'>'+esc(name)+'</label>').join('');}
function edit(id,focus=true){
 const o=records.find(item=>item.id===id);if(!o)return;
 editing=id;const c=config(o);$('#capability-editor').hidden=false;$('#empty-editor').hidden=true;$('.capability-layout').classList.remove('editor-closed');
 $('#capability-profile').innerHTML='<span class="profile-studio-photo">'+photo(o)+'</span><div><strong>'+esc(o.name)+'</strong><span class="capability-location">'+icon('pin')+'<span>'+esc(o.city)+', '+esc(o.province)+'</span></span></div>';
 const savedStyles=(()=>{try{return JSON.parse(localStorage.getItem('lashmatch-admin-lash-styles-v1')||'[]').map(s=>s.name);}catch{return [];}})();
 checkboxes('#supported-options',[...new Set([...styleList,...o.specialties,...savedStyles])],o.specialties,'specialties');
 checkboxes('#color-options',colors,c.colors,'colors');checkboxes('#customization-options',customizations,c.customizations,'customizations');checkboxes('#service-options',services,c.services,'services');
 $('#other-color').value=c.otherColor;$('#other-color-field').hidden=!c.colors.includes('Other (specify)');$('#other-color').required=c.colors.includes('Other (specify)');$('#capability-status').value=o.status;$('#form-message').textContent='';
 if(focus){$('#supported-options input')?.focus({preventScroll:true});if(matchMedia('(max-width:999px)').matches)$('#capability-editor').scrollIntoView({behavior:'smooth',block:'start'});}
}
function closeEditor(){$('#capability-editor').hidden=true;$('.capability-layout').classList.add('editor-closed');document.querySelector('[data-edit="'+CSS.escape(editing||'')+'"]')?.focus();}
$('#close-editor').onclick=closeEditor;$('#cancel-capability').onclick=()=>{if(editing)edit(editing,false);closeEditor();};
$('#color-options').onchange=()=>{const active=[...document.querySelectorAll('#color-options input:checked')].some(el=>el.value==='Other (specify)');$('#other-color-field').hidden=!active;$('#other-color').required=active;if(active)$('#other-color').focus();};
$('#capability-body').onclick=e=>{const button=e.target.closest('[data-edit]'),more=e.target.closest('[data-expand]');if(button)edit(button.dataset.edit);if(more){const id=more.dataset.expand;expanded.has(id)?expanded.delete(id):expanded.add(id);render();document.querySelector('[data-expand="'+CSS.escape(id)+'"]')?.focus();}};
$('#capability-body').onchange=e=>{const input=e.target.closest('[data-select]');if(!input)return;input.checked?selected.add(input.dataset.select):selected.delete(input.dataset.select);input.closest('tr').classList.toggle('selected',input.checked);selection();};
$('#select-all').onchange=e=>{shown().forEach(o=>e.target.checked?selected.add(o.id):selected.delete(o.id));render();};
$('#capability-search').oninput=()=>{page=1;$('#admin-search').value=$('#capability-search').value;render();};$('#admin-search').oninput=()=>{page=1;$('#capability-search').value=$('#admin-search').value;render();};$('#admin-search-form').onsubmit=e=>{e.preventDefault();$('#capability-search').focus();};
$('#capability-filters').onsubmit=e=>e.preventDefault();$('#capability-filters').onreset=e=>{e.preventDefault();$('#capability-search').value='';$('#admin-search').value='';$('#city-filter').value='';$('#status-filter').value='';page=1;render();};
['#city-filter','#status-filter'].forEach(id=>$(id).onchange=()=>{page=1;render();});$('#previous-page').onclick=()=>{page--;render();};$('#next-page').onclick=()=>{page++;render();};
$('#capability-form').onsubmit=e=>{
 e.preventDefault();const current=window.AdminStudios.load(),item=current.find(o=>o.id===editing);if(!item){$('#form-message').textContent='This studio was removed. Reload and select another studio.';return;}
 const data=new FormData(e.currentTarget),chosenColors=data.getAll('colors'),other=$('#other-color').value.trim();if(chosenColors.includes('Other (specify)')&&!other){$('#form-message').textContent='Specify the other color.';return;}
 const next=current.map(o=>o.id===editing?{...o,specialties:data.getAll('specialties'),colors:chosenColors,otherColor:chosenColors.includes('Other (specify)')?other:'',customizations:data.getAll('customizations'),services:data.getAll('services'),status:$('#capability-status').value}:o);
 try{localStorage.setItem(key,JSON.stringify(next));}catch{$('#form-message').textContent='Browser storage is full or unavailable. Changes were not saved.';return;}
 records=next;render();window.dispatchEvent(new CustomEvent('admin-data-changed',{detail:{kind:'studios',action:'Studio capabilities updated',name:item.name}}));clearTimeout(timer);$('#capability-toast').textContent='Studio capabilities saved in this browser.';$('#capability-toast').hidden=false;timer=setTimeout(()=>{$('#capability-toast').hidden=true;},4500);
};
const dialog=$('#admin-dialog');$('.dialog-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
fillCities();render();if(records.length)edit(new URLSearchParams(location.search).get('edit')||records[0].id,false);else{$('#capability-editor').hidden=true;$('#empty-editor').hidden=false;}
window.addEventListener('storage',e=>{if(e.key===key){records=window.AdminStudios.load();fillCities();render();if(editing&&!records.some(o=>o.id===editing)){$('#capability-editor').hidden=true;$('#empty-editor').hidden=records.length>0;}}});
})();
