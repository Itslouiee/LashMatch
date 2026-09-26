'use strict';
window.SavedItems=(()=>{
 const accounts=new Map();
 const empty=()=>({looks:[],studios:[],dates:{looks:{},studios:{}}});
 function hydrate(id,saved){accounts.set(Number(id),saved||empty());}
 function list(kind,id){return [...(accounts.get(Number(id))?.[kind]||[])];}
 function dates(kind,id){return {...(accounts.get(Number(id))?.dates?.[kind]||{})};}
 async function save(kind,id,items){
  const before=list(kind,id),r=await api('save_favorites',{kind,items});hydrate(id,r.saved);
  if(window.ProfileData){for(const item of items)if(!before.includes(item))ProfileData.record(id,kind==='looks'?'save-look':'save-studio',item);for(const item of before)if(!items.includes(item))ProfileData.record(id,kind==='looks'?'remove-look':'remove-studio',item);}
  return true;
 }
 // Old preview studio IDs referred to different studios; do not import those IDs.
 function migrateStudios(){}
 return {hydrate,list,dates,save,migrateStudios};
})();
