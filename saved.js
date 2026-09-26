'use strict';
(()=>{
 const icon=id=>'<svg aria-hidden="true"><use href="#'+id+'"/></svg>';
 const crop=(box,label,source='r10.png',width=1620,height=1080)=>'<svg viewBox="'+box+'" preserveAspectRatio="xMidYMid slice" role="img" aria-label="'+escapeHTML(label)+'"><image href="'+source+'" width="'+width+'" height="'+height+'"/></svg>';
 $('.sidebar-art').innerHTML=crop('0 690 285 390','More than lashes, it?s a match.');
 $('.saved-flourish').innerHTML=crop('1215 105 380 193','Saved for your next glow');
 const lashData={Hybrid:{box:'590 779 194 116',intensity:'Medium'},Classic:{box:'374 779 194 116',intensity:'Light'},Volume:{box:'807 779 194 116',intensity:'Full'},Wispy:{box:'1024 779 194 116',intensity:'Medium'}};
 let studioData=[];
 let query=(new URLSearchParams(location.search).get('q')||'').trim().toLowerCase();$('#home-search').value=query;
 const dateText=value=>Number.isFinite(value)?'Saved on '+new Intl.DateTimeFormat('en-US',{month:'short',day:'2-digit',year:'numeric'}).format(value):'Saved to your collection';
 function actions(kind,id,name){return '<div class="saved-card-actions"><button class="saved-heart" data-remove="'+id+'" data-kind="'+kind+'" aria-label="Unsave '+escapeHTML(name)+'" aria-pressed="true">'+icon('heart')+'</button><button class="saved-more" data-more="'+id+'" data-kind="'+kind+'" aria-label="More options for '+escapeHTML(name)+'">&#8942;</button></div>';}
 function sorted(kind,items,name){const order=$('#'+kind+'-sort').value,times=SavedItems.dates(kind,user.id);return items.slice().sort((a,b)=>order==='name'?name(a).localeCompare(name(b)):order==='oldest'?(times[a]||0)-(times[b]||0):((times[b]||0)-(times[a]||0))||items.indexOf(b)-items.indexOf(a));}
 function empty(kind,hasItems){return '<div class="saved-empty"><span>'+icon(kind==='looks'?'heart':'pin')+'</span><h3>'+(hasItems?'No matching '+kind:'No saved '+kind+' yet')+'</h3><p>'+(hasItems?'Try another search.':'Tap a heart on a '+(kind==='looks'?'lash look':'studio')+' to keep it here.')+'</p><a href="'+(kind==='looks'?'home.html':'Fstudios.html')+'">Explore '+kind+' '+icon('arrow')+'</a></div>';}
 function render(){
 const lashes=SavedItems.list('looks',user.id),studios=SavedItems.list('studios',user.id).filter(id=>studioData.some(s=>s.id===id)),times=SavedItems.dates('looks',user.id);
 $('#looks-count').textContent=lashes.length;$('#studios-count').textContent=studios.length;
 const foundLooks=sorted('looks',lashes,s=>s).filter(s=>(s+' Lash Natural Color').toLowerCase().includes(query));
 $('#saved-looks-grid').innerHTML=foundLooks.length?foundLooks.map(style=>{const l=lashData[style]||lashData[looks[style]?.type]||lashData.Classic;return '<article class="saved-look-card"><a class="saved-eye" href="tryon.html?style='+encodeURIComponent(style)+'" aria-label="Try '+style+' Lash">'+crop(l.box,style+' lashes','ref2.png',1833,1031)+'</a><div class="saved-look-copy"><h3><a href="tryon.html?style='+style+'">'+style+' Lash</a></h3><ul>'+[['pin','Natural Color'],['spark','None'],['camera','Evenly'],['chart-icon',l.intensity]].map(([i,t])=>'<li>'+icon(i)+t+'</li>').join('')+'</ul></div>'+actions('looks',style,style+' Lash')+'<p class="saved-date">'+dateText(times[style])+'</p></article>';}).join(''):empty('looks',lashes.length);
 const foundStudios=sorted('studios',studios,id=>studioData.find(s=>s.id===id).name).map(id=>studioData.find(s=>s.id===id)).filter(s=>(s.name+' '+s.address+' '+s.tags.join(' ')).toLowerCase().includes(query));
 $('#saved-studios-grid').innerHTML=foundStudios.length?foundStudios.map(s=>'<article class="saved-studio-card">'+actions('studios',s.id,s.name)+'<h3><a href="Fstudios.html#studio-'+s.id+'">'+escapeHTML(s.name)+'</a></h3><p class="saved-address">'+icon('pin')+escapeHTML(s.address||s.city)+'</p><div class="saved-tags">'+s.tags.map(t=>'<span>'+escapeHTML(t)+'</span>').join('')+'</div><p>'+ (Number(s.is_demo)?'Sample listing':'')+'</p></article>').join(''):empty('studios',studios.length);
 }
 async function remove(kind,id){const items=SavedItems.list(kind,user.id).filter(x=>x!==id);try{await SavedItems.save(kind,user.id,items);render();toast('Removed from saved items.');}catch(error){toast(error.message);}}
 document.querySelector('.saved-content').addEventListener('click',e=>{
 const removeButton=e.target.closest('[data-remove]');if(removeButton){const kind=removeButton.dataset.kind;remove(kind,kind==='studios'?Number(removeButton.dataset.remove):removeButton.dataset.remove);return;}
 const more=e.target.closest('[data-more]');if(!more)return;const kind=more.dataset.kind,id=kind==='studios'?Number(more.dataset.more):more.dataset.more,name=kind==='studios'?studioData.find(s=>s.id===id).name:id+' Lash';
 open('<h2>'+escapeHTML(name)+'</h2><div class="saved-modal-actions"><a class="button" href="'+(kind==='studios'?'Fstudios.html#studio-'+id:'tryon.html?style='+encodeURIComponent(id))+'">View '+(kind==='studios'?'studio':'look')+'</a><button class="button outline" id="remove-saved-item">Remove from Saved</button></div>');
 $('#remove-saved-item').onclick=()=>{remove(kind,id);modal.close();};
 });
 $$('[data-jump]').forEach(b=>b.onclick=()=>{$$('[data-jump]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('#saved-'+b.dataset.jump).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});
 $('#dashboard-search').onsubmit=e=>{e.preventDefault();query=$('#home-search').value.trim().toLowerCase();render();};$('#home-search').oninput=e=>{query=e.target.value.trim().toLowerCase();render();};
 $('#looks-sort').onchange=$('#studios-sort').onchange=render;
 $$('[data-quiz]').forEach(b=>b.onclick=()=>location.assign('preference.html'));
 $$('[data-results]').forEach(b=>b.onclick=()=>location.assign('home.html#results'));
 $$('[data-profile]').forEach(b=>b.onclick=()=>{showAccount();$('#logout').onclick=async()=>{try{await api('logout',{});location.replace('login.html');}catch(e){toast(e.message);}};});
 $('#notifications').onclick=()=>open('<h2>Notifications</h2><p>You have no new notifications.</p>');
 async function load(){try{const session=await api('session');if(!session.user){location.replace('login.html');return;}user=session.user;csrf=session.csrf;const directory=await api('studios');studioData=directory.studios.map(s=>({...s,tags:s.specialties,box:'345 678 305 143'}));$('#greeting').textContent='Hi, '+user.name.split(' ')[0]+'!';$('#avatar').textContent=user.name.charAt(0).toUpperCase();render();$('.dashboard').hidden=false;$('#session-status').hidden=true;if(['#saved-looks','#saved-studios'].includes(location.hash)){document.querySelector(location.hash).scrollIntoView({block:'start'});$$('[data-jump]').forEach(b=>b.setAttribute('aria-pressed',String('#saved-'+b.dataset.jump===location.hash)));}}catch{$('#session-status').innerHTML='<p>Unable to load your saved items.</p><button class="button" id="retry-saved">Retry</button>';$('#retry-saved').onclick=load;}}
 addEventListener('storage',()=>{if(user)render();});addEventListener('pageshow',e=>{if(e.persisted)load();});load();
})();
