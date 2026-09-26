'use strict';
window.LashThumbnails=(()=>{
 const base=new URL('.',document.currentScript.src),photo=new Image(),cache=new Map();
 const ready=new Promise((resolve,reject)=>{photo.onload=resolve;photo.onerror=()=>reject(Error('Sample image unavailable'));});photo.src=new URL('assets/preview-eye.png',base).href;
 const eye={width:575,lid:[{x:490,y:594},{x:570,y:517},{x:685,y:451},{x:805,y:437},{x:930,y:467},{x:1010,y:520},{x:1065,y:566}]};
 function point(lid,t){const u=Math.max(0,Math.min(1,t))*(lid.length-1),i=Math.min(lid.length-2,Math.floor(u)),f=u-i,p0=lid[Math.max(0,i-1)],p1=lid[i],p2=lid[i+1],p3=lid[Math.min(lid.length-1,i+2)];const v=k=>.5*(2*p1[k]+(-p0[k]+p2[k])*f+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*f*f+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*f*f*f);return{x:v('x'),y:v('y')};}
 function source(name){if(!cache.has(name))cache.set(name,(async()=>{await ready;if(!await ClassicLashAsset.ready)throw Error('Lash texture unavailable');if(!LashStyleProfiles.resolve(name))throw Error('Preview not available');const c=document.createElement('canvas');c.width=640;c.height=390;const ctx=c.getContext('2d');ctx.scale(.8,.8);ctx.translate(-380,-230);ctx.drawImage(photo,0,0);ClassicLashAsset.draw(ctx,eye,'right',point,1.4,()=>null,name);return c.toDataURL('image/png');})());return cache.get(name);}
 function image(name){const img=new Image();img.alt=name+' preview on a sample eye';img.className='lash-thumbnail';source(name).then(src=>{img.src=src;}).catch(()=>{img.alt=name+' ? preview unavailable';});return img;}
 return {source,image,eye,point};
})();
