(() => {
'use strict';
const $=s=>document.querySelector(s);
const key='lashmatch-admin-lash-styles-v1';
const types=['Classic','Hybrid','Volume','Wispy','Mega Volume','Colored'];
const seed=[
{id:'classic',name:'Classic Lash',type:'Classic',description:'A natural and timeless look with a clean and subtle finish.',status:'Active',crop:0},
{id:'hybrid',name:'Hybrid Lash',type:'Hybrid',description:'A perfect blend of classic and volume lashes for a fuller look.',status:'Active',crop:1},
{id:'volume',name:'Volume Lash',type:'Volume',description:'A fuller and more dramatic look with lightweight volume fans.',status:'Active',crop:2},
{id:'wispy',name:'Wispy Lash',type:'Wispy',description:'A textured and stylish look with delicate spikes.',status:'Active',crop:3},
{id:'mega',name:'Mega Volume',type:'Mega Volume',description:'An ultra-dramatic look with maximum fullness.',status:'Active',crop:4},
{id:'colored',name:'Colored Lash',type:'Colored',description:'Add a pop of color to make your eyes stand out.',status:'Active',crop:5},
{id:'brown',name:'Brown Lash',type:'Classic',description:'A softer, more natural look using brown lashes.',status:'Inactive',crop:6}
];
let records=seed.map(item=>({...item})),page=1,editing=null,upload=null,uploadVersion=0,uploadPending=false,selected=new Set(),toastTimer;
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validImage=value=>typeof value==='string' && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(value);
const validRecord=item=>item&&typeof item.id==='string'&&typeof item.name==='string'&&typeof item.description==='string'&&types.includes(item.type)&&['Active','Inactive'].includes(item.status)&&(item.image?validImage(item.image):Number.isInteger(item.crop)&&item.crop>=0&&item.crop<7);
let storageWarning='';
try{const saved=localStorage.getItem(key);if(saved!==null){const parsed=JSON.parse(saved);if(Array.isArray(parsed)&&parsed.every(validRecord))records=parsed;else storageWarning='Saved preview data could not be read. Showing the reference catalog.';}}catch{storageWarning='Browser storage is unavailable. Changes may not be saved.';}
const imageMarkup=item=>item.image?'<img src="'+item.image+'" alt="'+escape(item.name)+'">':'<svg viewBox="498 '+[385,461,539,617,695,774,852][item.crop]+' 66 60" role="img" aria-label="'+escape(item.name)+'"><image href="lashstyles.png" width="1920" height="1080"/></svg>';
const icon=name=>'<svg aria-hidden="true"><use href="#'+name+'"/></svg>';
function filtered(){const q=$('#style-search').value.trim().toLowerCase();return records.filter(item=>(!q||(item.name+' '+item.description).toLowerCase().includes(q))&&(!$('#type-filter').value||item.type===$('#type-filter').value)&&(!$('#status-filter').value||item.status===$('#status-filter').value));}
function pageRecords(){return filtered().slice((page-1)*7,page*7);}
function updateSelection(){const shown=pageRecords();const count=shown.filter(item=>selected.has(item.id)).length;$('#select-all').checked=shown.length>0&&count===shown.length;$('#select-all').indeterminate=count>0&&count<shown.length;$('#select-all').disabled=!shown.length;}
function render(){
 const results=filtered(),pages=Math.max(1,Math.ceil(results.length/7));page=Math.min(page,pages);
 const shown=results.slice((page-1)*7,page*7);
 $('#styles-body').innerHTML=shown.length?shown.map(item=>'<tr'+(selected.has(item.id)?' class="selected"':'')+'><td class="check-cell"><input type="checkbox" data-select="'+escape(item.id)+'" aria-label="Select '+escape(item.name)+'" '+(selected.has(item.id)?'checked':'')+'></td><td><span class="style-thumb">'+imageMarkup(item)+'</span></td><td class="style-name">'+escape(item.name)+'</td><td><span class="type-pill type-'+item.type.toLowerCase().replaceAll(' ','-')+'">'+item.type+'</span></td><td class="style-description">'+escape(item.description)+'</td><td><span class="status-pill '+(item.status==='Inactive'?'status-inactive':'')+'">'+item.status+'</span></td><td><div class="row-actions"><button type="button" data-edit="'+escape(item.id)+'" aria-label="Edit '+escape(item.name)+'">'+icon('edit')+'</button><button type="button" data-delete="'+escape(item.id)+'" aria-label="Delete '+escape(item.name)+'">'+icon('trash')+'</button></div></td></tr>').join(''):'<tr><td class="empty-row" colspan="7">No lash styles found. Try another search or reset the filters.</td></tr>';
 $('#entry-count').textContent='Showing '+(results.length?(page-1)*7+1:0)+' to '+Math.min(page*7,results.length)+' of '+results.length+' entries';
 $('#current-page').textContent=page;$('#previous-page').disabled=page===1;$('#next-page').disabled=page>=pages;updateSelection();
}
function toast(message){clearTimeout(toastTimer);$('#styles-toast').textContent=message;$('#styles-toast').hidden=false;toastTimer=setTimeout(()=>{$('#styles-toast').hidden=true;},4500);}
function commit(next){try{localStorage.setItem(key,JSON.stringify(next));records=next;window.dispatchEvent(new CustomEvent("admin-data-changed",{detail:{kind:"lash-styles"}}));return true;}catch{openDialog('Unable to save','<p>Your browser could not save this change. Storage may be full or unavailable. Your catalog has not been changed. Try a smaller image or enable browser storage.</p>');return false;}}
const example='<svg viewBox="1564 665 124 128" role="img" aria-label="Example lash image"><image href="lashstyles.png" width="1920" height="1080"/></svg>';
function resetEditor(){uploadVersion++;uploadPending=false;$('#save-style').disabled=false;editing=null;upload=null;$('#style-form').reset();$('#form-message').textContent='';$('#editor-title').textContent='Add New Lash Style';$('#upload-preview').innerHTML=example;}
function showEditor(focus=true){$('#style-editor').hidden=false;$('.styles-layout').classList.remove('editor-closed');if(focus){$('#style-name').focus({preventScroll:true});if(matchMedia('(max-width:999px)').matches)$('#style-editor').scrollIntoView({behavior:'smooth',block:'start'});}}
function closeEditor(){resetEditor();$('#style-editor').hidden=true;$('.styles-layout').classList.add('editor-closed');$('#add-style').focus();}
$('#add-style').addEventListener('click',()=>{resetEditor();showEditor();});
$('#close-editor').addEventListener('click',closeEditor);$('#cancel-style').addEventListener('click',closeEditor);
$('#style-search').addEventListener('input',()=>{page=1;$('#admin-search').value=$('#style-search').value;render();});
$('#admin-search').addEventListener('input',()=>{$('#style-search').value=$('#admin-search').value;page=1;render();});
$('#admin-search-form').addEventListener('submit',event=>{event.preventDefault();$('#style-search').focus();});
$('#style-filters').addEventListener('submit',event=>event.preventDefault());
['#type-filter','#status-filter'].forEach(id=>$(id).addEventListener('change',()=>{page=1;render();}));
$('#style-filters').addEventListener('reset',event=>{event.preventDefault();page=1;$('#style-search').value='';$('#admin-search').value='';$('#type-filter').value='';$('#status-filter').value='';render();});
$('#previous-page').addEventListener('click',()=>{page--;render();});$('#next-page').addEventListener('click',()=>{page++;render();});
$('#select-all').addEventListener('change',event=>{pageRecords().forEach(item=>event.target.checked?selected.add(item.id):selected.delete(item.id));render();});
$('#styles-body').addEventListener('change',event=>{const input=event.target.closest('[data-select]');if(!input)return;input.checked?selected.add(input.dataset.select):selected.delete(input.dataset.select);input.closest('tr').classList.toggle('selected',input.checked);updateSelection();});
const dialog=$('#admin-dialog');
function openDialog(title,html){$('#dialog-title').textContent=title;$('#dialog-content').innerHTML=html;if(!dialog.open)dialog.showModal();}
$('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
$('#styles-body').addEventListener('click',event=>{
 const edit=event.target.closest('[data-edit]'),remove=event.target.closest('[data-delete]');
 if(edit){const item=records.find(record=>record.id===edit.dataset.edit);if(!item)return;resetEditor();editing=item.id;$('#editor-title').textContent='Edit Lash Style';$('#style-name').value=item.name;$('#style-type').value=item.type;$('#style-description').value=item.description;$('#style-status').value=item.status;$('#upload-preview').innerHTML=imageMarkup(item);showEditor();}
 if(remove){const item=records.find(record=>record.id===remove.dataset.delete);if(!item)return;openDialog('Delete lash style?','<p>Remove <strong>'+escape(item.name)+'</strong> from this browser’s preview catalog?</p><div class="delete-actions"><button class="cancel-button" id="cancel-delete">Cancel</button><button class="pink-button" id="confirm-delete">Delete</button></div>');$('#cancel-delete').onclick=()=>dialog.close();$('#confirm-delete').onclick=()=>{if(commit(records.filter(record=>record.id!==item.id))){selected.delete(item.id);if(editing===item.id)resetEditor();render();dialog.close();toast('Lash style removed from this browser’s preview.');}};}
});
async function readUpload(file){
 if(!file)return;
 const version=++uploadVersion;upload=null;uploadPending=false;$('#save-style').disabled=false;$('#form-message').textContent='';
 if(!['image/png','image/jpeg'].includes(file.type)||file.size>2*1024*1024){$('#form-message').textContent='Choose a PNG or JPG image no larger than 2 MB.';$('#style-image').value='';$('#upload-preview').innerHTML=example;return;}
 uploadPending=true;$('#save-style').disabled=true;
 try{
 const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
 const image=new Image();image.src=data;await image.decode();
 if(version!==uploadVersion)return;
 upload=data;$('#upload-preview').innerHTML='<img src="'+data+'" alt="Selected lash image">';
 }catch{if(version===uploadVersion){$('#form-message').textContent='This image could not be opened. Choose another PNG or JPG.';$('#style-image').value='';$('#upload-preview').innerHTML=example;}}
 finally{if(version===uploadVersion){uploadPending=false;$('#save-style').disabled=false;}}
}
$('#style-image').addEventListener('change',event=>readUpload(event.target.files[0]));
['dragenter','dragover'].forEach(name=>$('#upload-zone').addEventListener(name,event=>{event.preventDefault();$('#upload-zone').classList.add('drag-over');}));
['dragleave','drop'].forEach(name=>$('#upload-zone').addEventListener(name,event=>{event.preventDefault();$('#upload-zone').classList.remove('drag-over');}));
$('#upload-zone').addEventListener('drop',event=>readUpload(event.dataTransfer.files[0]));
$('#style-form').addEventListener('submit',event=>{
 event.preventDefault();if(uploadPending)return;
 const name=$('#style-name').value.trim(),description=$('#style-description').value.trim(),type=$('#style-type').value,status=$('#style-status').value;
 if(!name||!description){$('#form-message').textContent='Enter a style name and description.';return;}
 if(records.some(item=>item.id!==editing&&item.name.toLowerCase()===name.toLowerCase())){$('#form-message').textContent='A lash style with this name already exists.';return;}
 if(!editing&&!upload){$('#form-message').textContent='Upload a PNG or JPG image for this lash style.';$('#style-image').focus();return;}
 const previous=records.find(item=>item.id===editing);
 const item={...(previous||{id:crypto.randomUUID(),crop:0}),name,type,description,status,...(upload?{image:upload}:{})};
 const next=editing?records.map(record=>record.id===editing?item:record):[...records,item];
 if(!commit(next))return;
 resetEditor();$('#style-filters').reset();$('#style-search').value='';$('#admin-search').value='';$('#type-filter').value='';$('#status-filter').value='';page=Math.max(1,Math.ceil((records.findIndex(record=>record.id===item.id)+1)/7));render();
 toast('Lash style saved in this browser’s preview.');
});
document.querySelectorAll('[data-section]').forEach(button=>button.addEventListener('click',()=>openDialog(button.dataset.section,'<p>This admin section is not connected yet.</p>')));
$('#profile').addEventListener('click',()=>openDialog('Admin','<p>System Administrator</p><p>You are viewing the local admin design preview.</p>'));
$('#notifications').addEventListener('click',()=>openDialog('Notifications','<p>No new notifications in this preview.</p>'));
render();if(storageWarning)toast(storageWarning);
if(location.hash==='#add')showEditor();
})();
