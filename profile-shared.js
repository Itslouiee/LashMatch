'use strict';
window.ProfileData=(()=>{
 const memory=new Map(),journeys=new Map();
 function hydrate(id,data){journeys.set(Number(id),data||{quizCount:0,triedOn:false,events:[]});}
 function summary(id){return journeys.get(Number(id))||{quizCount:0,triedOn:false,events:[]};}
 function read(id){if(memory.has(id))return memory.get(id);try{const p=JSON.parse(localStorage.getItem('lashmatch-profile-'+id)||'{}');return p&&typeof p==='object'&&!Array.isArray(p)?p:{};}catch{return {};}}
 function write(id,p){try{localStorage.setItem('lashmatch-profile-'+id,JSON.stringify(p));memory.delete(id);return true;}catch{memory.set(id,p);return false;}}
 function events(id){return summary(id).events.slice();}
 async function record(id,type,item){if(!id||type!=='tryon')return;const r=await api('record_tryon',{request_key:item});hydrate(id,r.journey);}
 return {read,write,events,record,hydrate,summary};
})();
document.addEventListener('click',event=>{const target=event.target.closest('[data-profile]');if(!target)return;event.preventDefault();event.stopImmediatePropagation();location.assign('Userprofile.html');},true);
document.addEventListener('DOMContentLoaded',()=>{
 const avatar=document.querySelector('#avatar');if(!avatar)return;
 function updateAvatar(){if(typeof user==='undefined'||!user)return;const p=ProfileData.read(user.id);if(typeof p.photo==='string'&&/^data:image\/(jpeg|png|webp);base64,/.test(p.photo)){if(avatar.dataset.photo===p.photo&&avatar.firstElementChild)return;const img=document.createElement('img');img.src=p.photo;img.alt='Your profile';img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:50%';avatar.replaceChildren(img);avatar.dataset.photo=p.photo;}}
 new MutationObserver(updateAvatar).observe(avatar,{childList:true});updateAvatar();
});
