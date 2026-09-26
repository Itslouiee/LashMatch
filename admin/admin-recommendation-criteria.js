(() => {
'use strict';
const $=s=>document.querySelector(s),key='lashmatch-admin-criteria-v1';
const categories=['Physical','Preference','Lifestyle'],styles=['Classic','Hybrid','Volume','Wispy','Mega Volume','Colored'];
const seed=[
['eye','Eye Shape','Shape of the eyes','Physical',['Almond','Round','Hooded','Monolid','Upturned'],['Classic','Hybrid','Wispy']],
['length','Natural Lash Length','Length of natural lashes','Physical',['Short','Medium','Long'],['Classic','Hybrid','Volume']],
['look','Desired Look','Overall look preference','Preference',['Natural','Balanced','Dramatic','Textured'],['Classic','Hybrid','Volume','Wispy']],
['occasion','Occasion','Purpose of lash extension','Lifestyle',['Everyday','Work','Special Event','Holiday'],['Classic','Hybrid','Wispy']],
['color','Color Preference','Preferred lash colors','Preference',['Black','Brown','Pink','Purple','Blue'],['Colored','Hybrid','Volume']],
['placement','Color Placement','Where to place color','Preference',['Full','Outer Corner','Middle Accent','Highlights'],['Colored','Hybrid']],
['volume','Lash Volume','Preferred fullness','Preference',['Light','Medium','Full'],['Classic','Hybrid','Volume','Mega Volume']],
['maintenance','Maintenance Level','How often can they maintain','Lifestyle',['Low','Moderate','High'],['Classic','Hybrid']]
].map(([id,name,description,category,options,linked])=>({id,name,description,category,options:options.map(label=>({label,scores:{}})),linked,status:'Active'}));
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validOption=o=>o&&typeof o.label==='string'&&o.scores&&typeof o.scores==='object'&&Object.entries(o.scores).every(([name,n])=>styles.includes(name)&&Number.isInteger(n)&&n>=0&&n<=100);
const validRecord=o=>o&&typeof o.id==='string'&&typeof o.name==='string'&&typeof o.description==='string'&&categories.includes(o.category)&&['Active','Inactive'].includes(o.status)&&Array.isArray(o.options)&&o.options.every(validOption)&&Array.isArray(o.linked)&&o.linked.every(name=>styles.includes(name));
let records=structuredClone(seed),page=1,editing=null,options=[],linked=new Set(),selected=new Set(),timer,dragIndex=null,warning='';
try{const saved=localStorage.getItem(key);if(saved!==null){const parsed=JSON.parse(saved);if(Array.isArray(parsed)&&parsed.every(validRecord))records=parsed;else warning='Saved preview data could not be read. Showing reference criteria.';}}catch{warning='Browser storage is unavailable. Changes may not be saved.';}
function toast(message){clearTimeout(timer);$('#criteria-toast').textContent=message;$('#criteria-toast').hidden=false;timer=setTimeout(()=>{$('#criteria-toast').hidden=true;},4500);}
const icon=name=>'<svg aria-hidden="true"><use href="#'+name+'"/></svg>';
function filtered(){const q=$('#criteria-search').value.trim().toLowerCase();return records.filter(o=>(!q||(o.name+' '+o.description+' '+o.linked.join(' ')+' '+o.options.map(x=>x.label).join(' ')).toLowerCase().includes(q))&&(!$('#category-filter').value||o.category===$('#category-filter').value)&&(!$('#status-filter').value||o.status===$('#status-filter').value));}
function shown(){return filtered().slice((page-1)*8,page*8);}
function updateSelection(){const items=shown(),count=items.filter(o=>selected.has(o.id)).length;$('#select-all').checked=items.length>0&&count===items.length;$('#select-all').indeterminate=count>0&&count<items.length;$('#select-all').disabled=!items.length;}
function render(){
 const items=filtered(),pages=Math.max(1,Math.ceil(items.length/8));page=Math.min(page,pages);
 $('#criteria-body').innerHTML=shown().length?shown().map(o=>'<tr'+(selected.has(o.id)?' class="selected"':'')+'><td class="check-cell"><input type="checkbox" data-select="'+escape(o.id)+'" aria-label="Select '+escape(o.name)+'" '+(selected.has(o.id)?'checked':'')+'></td><td class="criteria-name"><strong>'+escape(o.name)+'</strong><small>'+escape(o.description)+'</small></td><td><span class="type-pill category-'+o.category.toLowerCase()+'">'+o.category+'</span></td><td class="style-description">'+o.options.length+' options</td><td class="style-description">'+o.linked.map(escape).join(', ')+'</td><td><span class="status-pill '+(o.status==='Inactive'?'status-inactive':'')+'">'+o.status+'</span></td><td><div class="row-actions"><button data-edit="'+escape(o.id)+'" aria-label="Edit '+escape(o.name)+'">'+icon('edit')+'</button><button data-delete="'+escape(o.id)+'" aria-label="Delete '+escape(o.name)+'">'+icon('trash')+'</button></div></td></tr>').join(''):'<tr><td colspan="7" class="empty-row">No matching criteria. Try another search or reset the filters.</td></tr>';
 $('#entry-count').textContent='Showing '+(items.length?(page-1)*8+1:0)+' to '+Math.min(page*8,items.length)+' of '+items.length+' entries';
 $('#current-page').textContent=page;$('#previous-page').disabled=page===1;$('#next-page').disabled=page>=pages;updateSelection();
}
const dialog=$('#admin-dialog');
function openDialog(title,html){$('#dialog-title').textContent=title;$('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();}
$('.dialog-close').onclick=()=>dialog.close();
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
function commit(next){try{localStorage.setItem(key,JSON.stringify(next));records=next;window.dispatchEvent(new CustomEvent("admin-data-changed",{detail:{kind:"criteria"}}));return true;}catch{openDialog('Unable to save','<p>Browser storage is full or unavailable. Your criteria have not been changed. Enable browser storage and try again.</p>');return false;}}
function renderOptions(){
 $('#option-list').innerHTML=options.map((o,i)=>'<div class="option-row" data-option-row="'+i+'"><button type="button" class="option-grip" draggable="true" data-option-menu="'+i+'" aria-label="Reorder or remove option '+(i+1)+'" title="Drag to reorder, or click for option actions">'+icon('grip')+'</button><input data-option="'+i+'" value="'+escape(o.label)+'" placeholder="Option '+(i+1)+'" aria-label="Option '+(i+1)+'" maxlength="80" required><button type="button" class="score-button '+(Object.values(o.scores).some(n=>n>0)?'has-scores':'')+'" data-score="'+i+'" aria-label="Set scores for option '+(i+1)+'">＋ Score</button></div>').join('');
}
function renderLinked(){
 $('#linked-options').innerHTML=styles.map(name=>'<label><input type="checkbox" value="'+name+'" '+(linked.has(name)?'checked':'')+'>'+name+'</label>').join('');
 $('#linked-summary').textContent=linked.size?[...linked].join(', '):'Select lash styles';
}
function resetEditor(){editing=null;options=Array.from({length:3},()=>({label:'',scores:{}}));linked=new Set();$('#criteria-form').reset();$('#form-message').textContent='';$('#editor-title').textContent='Add New Criteria';$('#linked-picker').open=false;renderOptions();renderLinked();}
function showEditor(focus=true){$('#criteria-editor').hidden=false;$('.styles-layout').classList.remove('editor-closed');if(focus){$('#criteria-name').focus({preventScroll:true});if(matchMedia('(max-width:999px)').matches)$('#criteria-editor').scrollIntoView({behavior:'smooth',block:'start'});}}
function closeEditor(){resetEditor();$('#criteria-editor').hidden=true;$('.styles-layout').classList.add('editor-closed');$('#add-criteria').focus();}
$('#add-criteria').onclick=()=>{resetEditor();showEditor();};$('#close-editor').onclick=closeEditor;$('#cancel-criteria').onclick=closeEditor;
$('#add-option').onclick=()=>{if(options.length>=20){$('#form-message').textContent='You can add up to 20 options.';return;}options.push({label:'',scores:{}});renderOptions();$('#option-list').lastElementChild.querySelector('input').focus();};
$('#option-list').addEventListener('input',event=>{if(event.target.matches('[data-option]'))options[Number(event.target.dataset.option)].label=event.target.value;});
$('#linked-options').addEventListener('change',event=>{const name=event.target.value;event.target.checked?linked.add(name):linked.delete(name);$('#linked-summary').textContent=linked.size?[...linked].join(', '):'Select lash styles';});
function moveOption(from,to){if(to<0||to>=options.length)return;const [item]=options.splice(from,1);options.splice(to,0,item);renderOptions();$('#option-list').children[to].querySelector('.option-grip').focus();}
$('#option-list').addEventListener('keydown',event=>{const grip=event.target.closest('[data-option-menu]');if(grip&&['ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const i=Number(grip.dataset.optionMenu);moveOption(i,i+(event.key==='ArrowUp'?-1:1));}});
$('#option-list').addEventListener('dragstart',event=>{const grip=event.target.closest('[data-option-menu]');if(!grip)return;dragIndex=Number(grip.dataset.optionMenu);event.dataTransfer.setData('text/plain',String(dragIndex));event.dataTransfer.effectAllowed='move';grip.closest('.option-row').classList.add('dragging');});
$('#option-list').addEventListener('dragover',event=>{if(dragIndex!==null)event.preventDefault();});
$('#option-list').addEventListener('drop',event=>{const row=event.target.closest('[data-option-row]');if(dragIndex===null||!row)return;event.preventDefault();moveOption(dragIndex,Number(row.dataset.optionRow));dragIndex=null;});
$('#option-list').addEventListener('dragend',()=>{dragIndex=null;document.querySelectorAll('.dragging').forEach(el=>el.classList.remove('dragging'));});
$('#option-list').addEventListener('click',event=>{
 const score=event.target.closest('[data-score]'),menu=event.target.closest('[data-option-menu]');
 if(score){const i=Number(score.dataset.score),option=options[i];openDialog('Lash style scores','<p>Scores for '+escape(option.label||'Option '+(i+1))+'. Enter a whole number from 0 to 100. A higher score gives the style more weight.</p><form id="score-form"><div class="score-fields">'+styles.map(name=>'<label>'+name+'<input type="number" name="'+name+'" min="0" max="100" step="1" required value="'+(option.scores[name]||0)+'"></label>').join('')+'</div><div class="score-actions"><button type="button" class="cancel-button" id="cancel-scores">Cancel</button><button class="pink-button" type="submit">Apply Scores</button></div></form>');$('#cancel-scores').onclick=()=>dialog.close();$('#score-form').onsubmit=e=>{e.preventDefault();const data=new FormData(e.currentTarget);option.scores={};styles.forEach(name=>{const n=Number(data.get(name));option.scores[name]=n;if(n>0)linked.add(name);});renderLinked();renderOptions();dialog.close();};}
 if(menu){const i=Number(menu.dataset.optionMenu);openDialog('Option '+(i+1),'<div class="option-menu"><button id="move-up" '+(i===0?'disabled':'')+'>Move up</button><button id="move-down" '+(i===options.length-1?'disabled':'')+'>Move down</button><button id="remove-option" '+(options.length<=2?'disabled':'')+'>Remove option</button></div>');$('#move-up').onclick=()=>{dialog.close();moveOption(i,i-1);};$('#move-down').onclick=()=>{dialog.close();moveOption(i,i+1);};$('#remove-option').onclick=()=>{options.splice(i,1);renderOptions();dialog.close();};}
});
$('#criteria-search').addEventListener('input',()=>{page=1;$('#admin-search').value=$('#criteria-search').value;render();});
$('#admin-search').addEventListener('input',()=>{$('#criteria-search').value=$('#admin-search').value;page=1;render();});
$('#admin-search-form').onsubmit=event=>{event.preventDefault();$('#criteria-search').focus();};
$('#criteria-filters').onsubmit=event=>event.preventDefault();
$('#criteria-filters').addEventListener('reset',event=>{event.preventDefault();$('#criteria-search').value='';$('#admin-search').value='';$('#category-filter').value='';$('#status-filter').value='';page=1;render();});
['#category-filter','#status-filter'].forEach(id=>$(id).onchange=()=>{page=1;render();});
$('#previous-page').onclick=()=>{page--;render();};$('#next-page').onclick=()=>{page++;render();};
$('#select-all').onchange=event=>{shown().forEach(o=>event.target.checked?selected.add(o.id):selected.delete(o.id));render();};
$('#criteria-body').addEventListener('change',event=>{const input=event.target.closest('[data-select]');if(!input)return;input.checked?selected.add(input.dataset.select):selected.delete(input.dataset.select);input.closest('tr').classList.toggle('selected',input.checked);updateSelection();});
$('#criteria-body').addEventListener('click',event=>{
 const edit=event.target.closest('[data-edit]'),remove=event.target.closest('[data-delete]');
 if(edit){const item=records.find(o=>o.id===edit.dataset.edit);if(!item)return;resetEditor();editing=item.id;$('#editor-title').textContent='Edit Criteria';$('#criteria-name').value=item.name;$('#criteria-category').value=item.category;$('#criteria-description').value=item.description;$('#criteria-status').value=item.status;options=structuredClone(item.options);linked=new Set(item.linked);renderOptions();renderLinked();showEditor();}
 if(remove){const item=records.find(o=>o.id===remove.dataset.delete);if(!item)return;openDialog('Delete criteria?','<p>Remove <strong>'+escape(item.name)+'</strong> and its option scores from this browser’s preview catalog?</p><div class="delete-actions"><button class="cancel-button" id="cancel-delete">Cancel</button><button class="pink-button" id="confirm-delete">Delete</button></div>');$('#cancel-delete').onclick=()=>dialog.close();$('#confirm-delete').onclick=()=>{if(commit(records.filter(o=>o.id!==item.id))){selected.delete(item.id);if(editing===item.id)resetEditor();render();dialog.close();toast('Criteria removed from this browser’s preview.');}};}
});
$('#criteria-form').onsubmit=event=>{
 event.preventDefault();const name=$('#criteria-name').value.trim(),description=$('#criteria-description').value.trim(),category=$('#criteria-category').value,status=$('#criteria-status').value;
 const labels=options.map(o=>o.label.trim());
 let error='';
 if(!name||!description)error='Enter a criteria name and description.';
 else if(records.some(o=>o.id!==editing&&o.name.toLowerCase()===name.toLowerCase()))error='A criterion with this name already exists.';
 else if(labels.length<2||labels.some(label=>!label))error='Enter at least two options, and fill in every option.';
 else if(new Set(labels.map(label=>label.toLowerCase())).size!==labels.length)error='Each option must have a different name.';
 else if(!linked.size)error='Select at least one linked lash style.';
 if(error){$('#form-message').textContent=error;return;}
 const item={id:editing||crypto.randomUUID(),name,description,category,status,linked:[...linked],options:options.map((o,i)=>({label:labels[i],scores:Object.fromEntries(Object.entries(o.scores).filter(([style])=>linked.has(style)))}))};
 const next=editing?records.map(o=>o.id===editing?item:o):[...records,item];
 if(!commit(next))return;
 resetEditor();$('#criteria-filters').reset();page=Math.max(1,Math.ceil((records.findIndex(o=>o.id===item.id)+1)/8));render();toast('Criteria saved in this browser’s preview.');
};
document.querySelectorAll('[data-section]').forEach(button=>button.onclick=()=>openDialog(button.dataset.section,'<p>This admin section is not connected yet.</p>'));
$('#notifications').onclick=()=>openDialog('Notifications','<p>No new notifications in this preview.</p>');
$('#profile').onclick=()=>openDialog('Admin','<p>System Administrator</p><p>You are viewing the local admin design preview.</p>');
resetEditor();render();if(warning)toast(warning);if(location.hash==='#add')showEditor();
})();
