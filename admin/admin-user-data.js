/* Demo users for the admin reference. Never reads or changes client accounts. */
(() => {
'use strict';
const names=['Mika Dela Cruz','Samantha Reyes','Nicole Santos','Angelica Tan','Bianca Lim','Trisha Mae','Kyla Mendoza','Ella Garcia'];
const emails=['mika.dc@email.com','samreyes@email.com','nicole.s@email.com','angelica.tan@email.com','bianca.lim@email.com','trishamae@email.com','kyla.mdz@email.com','ella.garcia@email.com'];
const styles=['Hybrid Lash','Volume Lash','Classic Lash','Wispy Lash','Hybrid Lash','Mega Volume','','Colored Lash'];
const eyes=['Almond','Round','Hooded','Almond','Round','Almond','','Almond'];
const prefs=['Natural','Glam','Natural','Dramatic','Color Accent','Full Color','','Playful'];
const dates=['2025-09-14T15:24:00','2025-09-13T18:11:00','2025-09-13T13:05:00','2025-09-12T19:42:00','2025-09-12T14:18:00','2025-09-11T17:36:00','2025-09-10T11:09:00','2025-09-10T16:27:00'];
const preferred=[['lush','room'],['abg','glow'],['co','wink'],['room','lush'],['glow'],['abg','co'],[],['wink','glow']];
function seed(){
 const records=names.map((name,i)=>({id:'reference-'+(i+1),name,email:emails[i],style:styles[i],eye:eyes[i],preference:prefs[i],date:dates[i],joined:'2025-08-21',status:i===5?'In Progress':i===6?'Registered':'Completed',preferred:preferred[i],portrait:i,look:i,generated:i!==6,saved:[0,1,2,3,4,7].includes(i),desired:'Everyday',color:'None',occasion:'Daily Use',accountStatus:'Active'}));
 for(let n=9;n<=152;n++){const complete=n<=126;const day=9-Math.floor((n-9)/24);records.push({id:'demo-'+n,name:'Demo User '+String(n).padStart(3,'0'),email:'preview'+n+'@example.com',style:complete?styles[(n-9)%5]:'',eye:complete?eyes[(n-9)%5]:'',preference:complete?prefs[(n-9)%5]:'',date:'2025-09-'+String(Math.max(1,day)).padStart(2,'0')+'T10:00:00',joined:'2025-08-21',status:complete?'Completed':n%2?'Registered':'In Progress',preferred:complete?preferred[(n-9)%5]:[],portrait:(n-9)%8,look:(n-9)%5,generated:false,saved:false,desired:'Everyday',color:'None',occasion:'Daily Use',accountStatus:'Active'});}
 let generated=records.filter(o=>o.generated).length,saved=records.filter(o=>o.saved).length;
 records.slice(8).forEach(o=>{if(o.status==='Completed'){if(generated<118){o.generated=true;generated++;}if(saved<96){o.saved=true;saved++;}}});
 return records;
}
function load(){const fallback=seed();try{const raw=localStorage.getItem('lashmatch-admin-users-v1');if(raw===null)return fallback;const stored=JSON.parse(raw);if(!Array.isArray(stored)||!stored.every(o=>o&&typeof o.id==='string'&&typeof o.name==='string'&&typeof o.email==='string'))return fallback;return stored.map(o=>{const base=fallback.find(d=>d.id===o.id)||{style:'',eye:'',preference:'',date:'',joined:'',status:'Registered',preferred:[],portrait:0,look:0,generated:false,saved:false,desired:'',color:'',occasion:'',accountStatus:'Active'};const legacy=['Active','Inactive'].includes(o.status);return {...base,...o,status:legacy?(o.status==='Inactive'?'Inactive':'Registered'):o.status,accountStatus:legacy?o.status:o.accountStatus||'Active',preferred:Array.isArray(o.preferred)?o.preferred:base.preferred};});}catch{return fallback;}}
window.AdminUsers={load,key:'lashmatch-admin-users-v1'};
})();
