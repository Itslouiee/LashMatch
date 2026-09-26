/* Shared reference studios and compatibility with existing browser saves. */
(() => {
'use strict';
const defaults=[
{id:'abg',name:'ABG Studios',city:'Quezon City',province:'Metro Manila',address:'',latitude:14.676,longitude:121.0437,phone:'0917 123 4567',instagram:'@abgstudios',facebook:'ABG Studios',rating:4.8,reviews:120,status:'Active',specialties:["Classic","Hybrid","Volume","Wispy"],matches:48,crop:0},
{id:'lush',name:'Lush Beauty PH',city:'Quezon City',province:'Metro Manila',address:'',latitude:14.676,longitude:121.0437,phone:'0928 765 4321',instagram:'@lushbeautyph',facebook:'Lush Beauty PH',rating:4.6,reviews:89,status:'Active',specialties:["Classic","Hybrid","Wispy"],matches:36,crop:1},
{id:'room',name:'The Lash Room',city:'Mandaluyong',province:'Metro Manila',address:'',latitude:14.5794,longitude:121.0359,phone:'0919 345 6789',instagram:'@thelashroom',facebook:'The Lash Room',rating:4.5,reviews:76,status:'Active',specialties:["Volume","Mega Volume","Wispy"],matches:28,crop:2},
{id:'glow',name:'Glow Lab',city:'Makati',province:'Metro Manila',address:'',latitude:14.5547,longitude:121.0244,phone:'0906 111 2222',instagram:'@glowlab.ph',facebook:'Glow Lab',rating:4.3,reviews:58,status:'Active',specialties:["Classic","Hybrid","Volume"],matches:24,crop:3},
{id:'co',name:'Lash & Co.',city:'Pasig',province:'Metro Manila',address:'',latitude:14.5764,longitude:121.0851,phone:'0915 333 4444',instagram:'@lashandco',facebook:'Lash & Co.',rating:4.7,reviews:102,status:'Inactive',specialties:["Hybrid","Volume","Mega Volume"],matches:18,crop:4},
{id:'wink',name:'Pretty Wink',city:'Taguig',province:'Metro Manila',address:'',latitude:14.5176,longitude:121.0509,phone:'0932 555 6666',instagram:'@prettywinkph',facebook:'Pretty Wink',rating:4.4,reviews:64,status:'Active',specialties:["Classic","Wispy","Volume"],matches:0,crop:5}
];
const key='lashmatch-admin-studios-v1';
function load(){try{const raw=localStorage.getItem(key);if(raw===null)return structuredClone(defaults);const saved=JSON.parse(raw);if(!Array.isArray(saved)||!saved.every(o=>o&&typeof o.id==='string'&&typeof o.name==='string'))throw Error('Invalid studio data');return saved.map(o=>{const base=defaults.find(d=>d.id===o.id)||{province:'Metro Manila',address:'',phone:'',instagram:'',facebook:'',rating:null,reviews:0,specialties:[],matches:0,crop:0,status:'Active'};return {...base,...o,city:o.city||base.city||'',specialties:Array.isArray(o.specialties)?o.specialties:base.specialties};});}catch{return structuredClone(defaults);}}
window.AdminStudios={load,key};
})();
