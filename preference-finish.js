'use strict';
let finishRequest=0;
async function drawFinish(){
 const request=++finishRequest,button=$('#quiz-next');button.disabled=true;button.onclick=null;$('#quiz-message').textContent='Finding your recommendation...';$('.preference-options').replaceChildren();
 const answers={eye_shape:'unsure',volume:preferenceAnswers.volume,experience:preferenceAnswers.experience,occasion:preferenceAnswers.occasion};
 try{
  const catalog=await api('catalog');const signature=JSON.stringify({answers,rules:catalog.rules});
  if(preferenceAnswers.resultSignature!==signature||!preferenceAnswers.requestKey){preferenceAnswers.resultSignature=signature;preferenceAnswers.requestKey=crypto.randomUUID();rememberPreference();}
  const result=await api('save_match',{...answers,request_key:preferenceAnswers.requestKey});
  if(request!==finishRequest||preferenceStep!==3)return;
  const style=catalog.styles.find(s=>s.name===result.style);if(!style)throw Error('Your recommendation changed. Please retry.');
  const names=result.recommended_styles||[style.name],related=names.filter(n=>n!==style.name).map(n=>catalog.styles.find(s=>s.name===n)).filter(Boolean);
  preferenceAnswers.finish=result.finish;rememberPreference();const match={...answers,...result};sessionStorage.setItem('lashmatch-result-'+preferenceUser.id,JSON.stringify(match));setStyle(style.name);
  const go=name=>location.assign('tryon.html?v=quiz-match-3&style='+encodeURIComponent(name)+'&open='+Date.now());
  $('.preference-options').innerHTML='<div class="finish-main"><div class="finish-photo"><span class="best-match">Best Match</span></div><div class="finish-copy"><h2></h2><p class="finish-tag">Your personalized recommendation.</p><p class="match-description"></p><button type="button" class="button" id="favorite-result">Save to Favorites</button></div></div>';
  $('.finish-photo').prepend(LashThumbnails.image(style.name));$('.finish-copy h2').textContent=style.name;$('.match-description').textContent=style.description||LashStyleProfiles.resolve(style.name)?.description||'';
  if(related.length){const heading=document.createElement('div');heading.className='finish-related-heading';heading.innerHTML='<div><h3>You Might Also Like</h3><p>Related styles selected by the recommendation criteria.</p></div>';const list=document.createElement('div');list.className='finish-related';for(const item of related){const card=document.createElement('button');card.type='button';const art=document.createElement('span'),copy=document.createElement('span'),title=document.createElement('strong'),desc=document.createElement('small');art.append(LashThumbnails.image(item.name));title.textContent=item.name;desc.textContent=item.description||LashStyleProfiles.resolve(item.name)?.description||'';copy.append(title,desc);card.append(art,copy);card.onclick=()=>go(item.name);list.append(card);}$('.preference-options').append(heading,list);}
  const favorite=$('#favorite-result');favorite.disabled=SavedItems.list('looks',user.id).includes(style.name);if(favorite.disabled)favorite.textContent='Saved to Favorites';favorite.onclick=async()=>{favorite.disabled=true;try{await SavedItems.save('looks',user.id,[...new Set([...SavedItems.list('looks',user.id),style.name])]);favorite.textContent='Saved to Favorites';}catch(e){toast(e.message);favorite.disabled=false;}};
  $('#finish-reason').textContent='Matched using your volume preference, lash experience, and occasion.';const occasion=preferenceSteps[2].options.find(o=>o[0]===preferenceAnswers.occasion);$('#finish-lifestyle').textContent=occasion?'Selected occasion: '+occasion[1]:'';
  button.disabled=false;button.onclick=event=>{event.preventDefault();go(style.name);};$('#quiz-message').textContent='Result saved.';
 }catch(e){if(request!==finishRequest||preferenceStep!==3)return;$('#quiz-message').textContent=e.message;const retry=document.createElement('button');retry.type='button';retry.className='button';retry.textContent='Retry recommendation';retry.onclick=drawFinish;$('.preference-options').replaceChildren(retry);}
}
