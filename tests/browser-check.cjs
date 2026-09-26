const {spawn,execFileSync}=require('node:child_process');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const php=process.env.LASHMATCH_PHP||'C:/xampp/php/php.exe',chrome=process.env.LASHMATCH_BROWSER||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const baseUrl=process.env.LASHMATCH_TEST_URL||'http://localhost:8080';
const fixture=JSON.parse(execFileSync(php,[path.join(__dirname,'browser-fixtures.php'),'create'],{encoding:'utf8',windowsHide:true}));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'lashmatch-browser-check-'));
const proc=spawn(chrome,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9225','--user-data-dir='+profile,'about:blank'],{stdio:'ignore',windowsHide:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));let socket;const pending=new Map();let seq=0;const errors=[];
async function send(method,params={},sessionId){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},20000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject});socket.send(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})}));});}
async function tab(){const {browserContextId}=await send('Target.createBrowserContext');const {targetId}=await send('Target.createTarget',{url:'about:blank',browserContextId});const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});await send('Runtime.enable',{},sessionId);await send('Network.enable',{},sessionId);await send('Network.setCacheDisabled',{cacheDisabled:true},sessionId);await send('Page.enable',{},sessionId);await send('Emulation.setDeviceMetricsOverride',{width:1533,height:1000,deviceScaleFactor:1,mobile:false},sessionId);return sessionId;}
async function evaluate(s,expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},s);if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
async function until(s,expression,label){for(let n=0;n<80;n++){if(await evaluate(s,expression))return;await delay(150);}throw Error('Timed out: '+label+'; '+await evaluate(s,'document.body.innerText.slice(0,600)'));}
async function navigate(s,page){await send('Page.navigate',{url:baseUrl+'/'+page},s);await until(s,"document.readyState==='complete'",'load '+page);}
function assert(ok,label){if(!ok)throw Error(label);console.log('PASS '+label);}
async function login(s,role){await navigate(s,'login.html'+(role==='admin'?'?role=admin':''));await evaluate(s,`document.querySelector('#login-form').elements.email.value=${JSON.stringify(fixture.accounts[role].email)};document.querySelector('#password').value=${JSON.stringify(fixture.password)};document.querySelector('#login-form').requestSubmit();`);await until(s,role==='admin'?"document.body.classList.contains('live-ready')":"!!document.querySelector('.dashboard')&&!document.querySelector('.dashboard').hidden",role+' login');}
(async()=>{
 try{
  let meta;for(let i=0;i<60;i++){try{meta=await (await fetch('http://127.0.0.1:9225/json/version')).json();break;}catch{await delay(200);}}if(!meta)throw Error('Chrome did not start');
  socket=new WebSocket(meta.webSocketDebuggerUrl);await new Promise((res,rej)=>{socket.onopen=res;socket.onerror=rej;});
  socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
  const admin=await tab(),client=await tab();await login(admin,'admin');assert(true,'admin form login opens live dashboard');
  for(const p of ['admin-users-results.html','admin-studios.html','admin-studio-capabilities.html','admin-lash-styles.html','admin-recommendation-criteria.html','admin-settings.html']){await navigate(admin,'admin/'+p);await until(admin,"document.body.classList.contains('live-ready')",p);assert(true,p+' renders live data');}
  await navigate(admin,'admin/admin-studios.html');await until(admin,"!!document.querySelector('#add-studio')",'studio editor');await evaluate(admin,"document.querySelector('#add-studio').click()");
  await evaluate(admin,`(()=>{const f=document.querySelector('#studio-form');f.elements.name.value=${JSON.stringify(fixture.tag+' Studio')};document.querySelector('#studio-city').value='Imus';f.elements.address.value='Integration address';f.requestSubmit();})()`);
  await until(admin,"document.querySelector('#studio-body').innerText.includes("+JSON.stringify(fixture.tag+" Studio")+")",'save studio');assert(await evaluate(admin,`document.querySelector('#studio-body').innerText.includes(${JSON.stringify(fixture.tag+' Studio')})`),'admin studio creation');
  await navigate(admin,'admin/admin-lash-styles.html');await until(admin,"document.body.classList.contains('live-ready')",'original lash layout');
  assert(await evaluate(admin,"!!document.querySelector('.styles-layout') && !!document.querySelector('#style-editor') && document.querySelectorAll('#styles-body .style-thumb').length>=4 && !document.querySelector('#live-admin')"),'original lash layout, photos and side editor are preserved');
  await evaluate(admin,"document.querySelector('#add-style').click();document.querySelector('#style-name').value="+JSON.stringify(fixture.tag+' Lash')+";document.querySelector('#style-type').value='Wispy';document.querySelector('#style-description').value='Browser-created wispy style';document.querySelector('#style-form').requestSubmit()");
  await until(admin,"document.querySelector('#styles-body').innerText.includes("+JSON.stringify(fixture.tag+' Lash')+")",'save style');
  await navigate(admin,'admin/admin-lash-styles.html');await until(admin,"document.body.classList.contains('live-ready')",'reload styles');
  assert(await evaluate(admin,"document.querySelector('#styles-body').innerText.includes("+JSON.stringify(fixture.tag+' Lash')+")"),'new lash style persists after reload');
  await navigate(admin,'tryon.html?style='+encodeURIComponent(fixture.tag+' Lash'));await until(admin,"!!document.querySelector('#photo-title').dataset.selectedStyle",'custom catalog preview');
  assert(await evaluate(admin,"document.querySelector('.eye-style[aria-pressed=true]').dataset.style==="+JSON.stringify(fixture.tag+' Lash')),'new admin style is available in client Try-On');
  await navigate(admin,'admin/admin-lash-styles.html');await until(admin,"document.body.classList.contains('live-ready')",'return to original editor');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true},admin);
  assert(await evaluate(admin,'document.documentElement.scrollWidth<=innerWidth+1'),'original lash layout fits mobile viewport');
  await send('Emulation.setDeviceMetricsOverride',{width:1533,height:1000,deviceScaleFactor:1,mobile:false},admin);
  await delay(100);
  const restored=await send('Page.captureScreenshot',{format:'png'},admin);fs.writeFileSync(path.join(__dirname,'admin-lash-styles-restored.png'),Buffer.from(restored.data,'base64'));
  await evaluate(admin,"[...document.querySelectorAll('#styles-body tr')].find(r=>r.innerText.includes("+JSON.stringify(fixture.tag+' Lash')+")).querySelector('[data-delete]').click();document.querySelector('#delete-form').requestSubmit()");
  await until(admin,"!document.querySelector('#admin-dialog').open",'delete custom style');
  await navigate(admin,'admin/admin-studio-capabilities.html');await until(admin,"document.body.classList.contains('live-ready')",'capabilities form');
  await evaluate(admin,"[...document.querySelectorAll('#capability-body tr')].find(r=>r.innerText.includes("+JSON.stringify(fixture.tag+' Studio')+")).querySelector('[data-edit]').click();document.querySelector('#supported-options input[value=Classic]').checked=true;document.querySelector('#color-options input[value=Brown]').checked=true;document.querySelector('#capability-form').requestSubmit()");
  await until(admin,"document.querySelector('#admin-feedback')?.textContent==='Changes saved.'",'save capabilities');
  assert(await evaluate(admin,"document.querySelector('#capability-body').innerText.includes('Brown')"),'studio capabilities persist in the original editor');
  await login(client,'user');assert(true,'client form login opens client dashboard');
  assert(await evaluate(client,"document.querySelectorAll('.look-card').length===0 && document.querySelectorAll('.progress-steps .complete').length===0"),'new account has no recommendations or completed steps');
  await evaluate(client,"localStorage.setItem('lashmatch-profile-'+user.id,JSON.stringify({triedOn:true,quizCount:99,events:[{type:'tryon',at:Date.now()}]}));sessionStorage.setItem('lashmatch-result-'+user.id,JSON.stringify({finish:'balanced',occasion:'everyday',style:'Hybrid'}))");
  await navigate(client,'home.html');await until(client,"!document.querySelector('.dashboard').hidden",'fresh home');
  assert(await evaluate(client,"document.querySelectorAll('.look-card').length===0"),'stale browser result cannot create recommendations');
  await navigate(client,'Userprofile.html');await until(client,"!document.querySelector('.dashboard').hidden",'empty profile');
  assert(await evaluate(client,"document.querySelector('#profile-quiz-count').textContent==='0' && document.querySelector('#beauty-progress-text').textContent==='0/3' && !!document.querySelector('.profile-empty')"),'stale browser activity cannot create progress');
  await navigate(client,'saved.html');await until(client,"!document.querySelector('.dashboard').hidden",'empty saved');
  assert(await evaluate(client,"document.querySelector('#looks-count').textContent==='0' && document.querySelector('#studios-count').textContent==='0'"),'new saved collections are empty');
  await navigate(client,'Fstudios.html');await until(client,"!document.querySelector('#studio-results').hidden",'Cavite studios');
  assert(await evaluate(client,"document.querySelectorAll('.studio-progress .done').length===0 && document.querySelector('#studios-title').textContent.includes('Cavite') && !document.querySelector('#studio-look-copy').textContent.includes('Hybrid')"),'studio page has Cavite scope and no invented look or progress');
  await navigate(client,'preference.html');await until(client,"!!document.querySelector('[name=choice]')",'quiz');
  for(let i=0;i<3;i++){await evaluate(client,"document.querySelector('[name=choice]').click();document.querySelector('#preference-form').requestSubmit()");await delay(200);}
  await until(client,"document.querySelector('#quiz-message')?.textContent==='Result saved.'",'quiz result saved');assert(true,'quiz completes and saves result');
  await navigate(client,'preference.html#finish');await until(client,"document.querySelector('#quiz-message')?.textContent==='Result saved.'",'reload quiz result');
  assert(await evaluate(client,"api('matches').then(r=>r.matches.length===1)"),'reloading quiz result does not duplicate it');
  await evaluate(client,"document.querySelector('#favorite-result').click()");await until(client,"document.querySelector('#favorite-result').textContent==='Saved to Favorites'",'favorite result');
  await navigate(client,'Fstudios.html');await until(client,"!document.querySelector('#studio-results')?.hidden",'studio directory');assert(await evaluate(client,`document.querySelector('#matching-studios').innerText.includes(${JSON.stringify(fixture.tag+' Studio')})`),'admin-created studio appears on client page');
  await evaluate(client,`[...document.querySelectorAll('.studio-card')].find(c=>c.innerText.includes(${JSON.stringify(fixture.tag+' Studio')})).querySelector('[data-favorite]').click()`);
  await until(client,`[...document.querySelectorAll('.studio-card')].find(c=>c.innerText.includes(${JSON.stringify(fixture.tag+' Studio')})).querySelector('[data-favorite]').getAttribute('aria-pressed')==='true'`,'save studio');
  await navigate(client,'saved.html#saved-studios');await until(client,"!!document.querySelector('.dashboard')&&!document.querySelector('.dashboard').hidden",'saved items');assert(await evaluate(client,`document.querySelector('#saved-studios-grid').innerText.includes(${JSON.stringify(fixture.tag+' Studio')})`),'saved studios load from database');
  await navigate(client,'Userprofile.html');await until(client,"!!document.querySelector('.dashboard')&&!document.querySelector('.dashboard').hidden",'profile');assert(await evaluate(client,"document.querySelector('#profile-quiz-count').textContent==='1'"),'profile shows database quiz count');
  await navigate(admin,'admin/admin-users-results.html');await until(admin,"document.body.classList.contains('live-ready')",'admin users');
  await evaluate(admin,`document.querySelector('[data-user="${fixture.accounts.user.id}"]').click()`);assert(await evaluate(admin,"document.querySelector('#user-tab-panel').innerText.includes('Classic')"),'client quiz result visible in admin dialog');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true},admin);await evaluate(admin,"document.querySelector('#admin-dialog').close()");await delay(200);
  assert(await evaluate(admin,'document.documentElement.scrollWidth<=innerWidth+1'),'admin page fits mobile viewport');
  const shot=await send('Page.captureScreenshot',{format:'png'},admin);fs.writeFileSync(path.join(__dirname,'admin-mobile.png'),Buffer.from(shot.data,'base64'));
  await navigate(client,'tryon.html');await until(client,"!!document.querySelector('#photo-title').dataset.selectedStyle",'quiz match in try-on');
  assert(await evaluate(client,"document.querySelector('.eye-style[aria-pressed=true]').dataset.style==='Classic'"),'Classic quiz match is selected in Try-On');
  assert(await evaluate(client,"JSON.stringify([...document.querySelectorAll('.eye-style')].map(b=>b.dataset.style))===JSON.stringify(['Classic','Hybrid','Wispy','Volume'])"),'Try-On offers the same four styles as the quiz');
  await evaluate(client,"sessionStorage.clear()");
  await navigate(client,'tryon.html?style=unknown');await until(client,"!!document.querySelector('#photo-title').dataset.selectedStyle",'database fallback');
  assert(await evaluate(client,"document.querySelector('.eye-style[aria-pressed=true]').dataset.style==='Classic'"),'missing browser cache and invalid style fall back to saved quiz result');
  for(const style of ['Hybrid','Wispy','Volume']){
   await navigate(client,'tryon.html?style='+style);await until(client,"!!document.querySelector('#photo-title').dataset.selectedStyle",'explicit '+style);
   assert(await evaluate(client,"document.querySelector('.eye-style[aria-pressed=true]').dataset.style==="+JSON.stringify(style)),'selected result alternative opens '+style);
   assert(await evaluate(client,"document.querySelector('.eye-style.quiz-match').dataset.style==='Classic'"),'exploration preserves quiz recommendation');
  }
  await evaluate(client,"photoReady=true;document.querySelector('#use-photo').click()");
  assert(await evaluate(client,"document.body.classList.contains('eye-mode') && document.querySelector('.eye-style[aria-pressed=true]').dataset.style==='Volume'"),'photo review preserves selected lash style');
  for(const [finish,style] of [['balanced','Hybrid'],['textured','Wispy'],['dramatic','Volume']]){
   await evaluate(client,"api('save_match',"+JSON.stringify({eye_shape:'unsure',finish,occasion:'everyday'})+")");
   await navigate(client,'tryon.html');await until(client,"!!document.querySelector('#photo-title').dataset.selectedStyle",'saved '+style);
   assert(await evaluate(client,"document.querySelector('.eye-style[aria-pressed=true]').dataset.style==="+JSON.stringify(style)),'saved '+style+' quiz result selects its matching preview');
  }
  assert(errors.length===0,'no browser JavaScript exceptions');console.log('Browser integration checks complete.');
 }finally{
  if(socket){try{await send('Browser.close');}catch{}socket.close();}proc.kill();
  console.log(execFileSync(php,[path.join(__dirname,'browser-fixtures.php'),'cleanup',fixture.tag],{encoding:'utf8',windowsHide:true}));
 }
})().catch(e=>{console.error(e);console.error(errors);process.exitCode=1;});
