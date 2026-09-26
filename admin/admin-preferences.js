/* Shared browser-only admin preferences. */
(() => {
const key='lashmatch-admin-settings-v1';
const defaults={name:'Admin',email:'admin@lashmatch.com',username:'admin',phone:'',photo:'',notifications:true,notificationTypes:{catalog:true,studios:true,criteria:true,users:true,account:true},language:'en',dateFormat:'MM/DD/YYYY',timeFormat:'12',timezone:'Asia/Manila',theme:'light',compact:false,formatSet:false};
function load(){let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}const p={...defaults,...saved,notificationTypes:{...defaults.notificationTypes,...saved.notificationTypes}};if(typeof p.name!=='string'||!p.name.trim())p.name='Admin';if(!['en','fil'].includes(p.language))p.language='en';if(!['light','dark','system'].includes(p.theme))p.theme='light';if(!['Asia/Manila','Asia/Tokyo','UTC','America/New_York'].includes(p.timezone))p.timezone='Asia/Manila';return p;}
const media=matchMedia('(prefers-color-scheme: dark)');
function apply(){const p=load();document.documentElement.lang=p.language;document.body.dataset.adminTheme=p.theme==='system'?(media.matches?'dark':'light'):p.theme;document.body.dataset.adminDensity=p.compact?'compact':'comfortable';}
function save(update){const p={...load(),...update};localStorage.setItem(key,JSON.stringify(p));apply();window.dispatchEvent(new Event('admin-preferences-changed'));return p;}
function dateObject(value){if(value.length===10)return new Date(value+'T12:00:00Z');return new Date(/[Zz]|[+-]\d\d:\d\d$/.test(value)?value:value+'+08:00');}
function date(value){if(!value)return 'Not available';const p=load(),d=dateObject(value),zone=value.length===10?'UTC':p.timezone;if(Number.isNaN(d.getTime()))return 'Not available';if(!p.formatSet)return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:zone});const parts=new Intl.DateTimeFormat('en-US',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:zone}).formatToParts(d),get=t=>parts.find(x=>x.type===t)?.value;return p.dateFormat==='YYYY-MM-DD'?get('year')+'-'+get('month')+'-'+get('day'):p.dateFormat==='DD/MM/YYYY'?get('day')+'/'+get('month')+'/'+get('year'):get('month')+'/'+get('day')+'/'+get('year');}
function time(value){if(!value)return '';const p=load(),d=typeof value==='number'?new Date(value):dateObject(value);if(Number.isNaN(d.getTime()))return '';return d.toLocaleTimeString(p.language==='fil'?'fil-PH':'en-US',{hour:'numeric',minute:'2-digit',hour12:p.timeFormat!=='24',timeZone:p.timezone});}
window.AdminPreferences={load,save,apply,date,time,key};
apply();media.addEventListener('change',apply);window.addEventListener('storage',e=>{if(e.key===key){apply();window.dispatchEvent(new Event('admin-preferences-changed'));}});
})();
