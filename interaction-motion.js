/* Delegated feedback also covers dynamically rendered cards and admin forms. */
(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const selector='button,a[href],[role="button"],summary,label.preference-option,[data-select],input[type="checkbox"],input[type="radio"]';
 const animations=new Set();
 function animate(element,frames,options){
  if(reduced.matches||!element.animate)return;
  const animation=element.animate(frames,options);animations.add(animation);
  animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));return animation;
 }
 document.addEventListener('click',event=>{
  if(reduced.matches||!(event.target instanceof Element))return;
  const control=event.target.closest(selector);
  if(!control||control.matches(':disabled,[aria-disabled="true"]')||control.closest('[inert]'))return;
  // A label forwards a second native click to its input; show only one bloom.
  if(control.matches('input')&&control.closest('label.preference-option'))return;
  const rect=control.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const bloom=document.createElement('span');bloom.className='lm-click-bloom';bloom.setAttribute('aria-hidden','true');
  const x=event.detail?event.clientX:rect.left+rect.width/2,y=event.detail?event.clientY:rect.top+rect.height/2;
  // Dialog children must stay in the browser's top layer.
  const host=control.closest('dialog[open]')||document.body;
  if(host!==document.body){const box=host.getBoundingClientRect();bloom.style.position='absolute';bloom.style.left=(x-box.left+host.scrollLeft-host.clientLeft-17)+'px';bloom.style.top=(y-box.top+host.scrollTop-host.clientTop-17)+'px';}
  else{bloom.style.left=(x-17)+'px';bloom.style.top=(y-17)+'px';}
  host.append(bloom);
  const effect=animate(bloom,[{opacity:.8,scale:'.35'},{opacity:.4,scale:'1.35',offset:.55},{opacity:0,scale:'1.8'}],{duration:420,easing:'cubic-bezier(.16,.7,.3,1)'});
  if(effect)effect.finished.catch(()=>{}).finally(()=>bloom.remove());else bloom.remove();
 },true);
 const observer=new MutationObserver(records=>{
  if(reduced.matches)return;
  for(const record of records){
   const target=record.target;
   if(record.type==='attributes'&&record.attributeName==='aria-pressed'&&target.getAttribute('aria-pressed')==='true'&&record.oldValue!=='true'){
    const icon=target.querySelector('svg');if(icon)animate(icon,[{scale:'1'},{scale:'1.2',offset:.45},{scale:'1'}],{duration:300,easing:'ease-out'});
   }
   if(record.type==='childList'&&target.matches('.preference-options,#dialog-content')){
    animate(target,[{opacity:.35,translate:'0 5px'},{opacity:1,translate:'0 0'}],{duration:220,easing:'ease-out'});
   }
  }
 });
 observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeOldValue:true,attributeFilter:['aria-pressed']});
 reduced.addEventListener('change',()=>{if(reduced.matches){animations.forEach(a=>a.cancel());document.querySelectorAll('.lm-click-bloom').forEach(el=>el.remove());}});
})();
