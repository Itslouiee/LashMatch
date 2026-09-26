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
  const admin=await tab();await login(admin,'admin');
  await navigate(admin,'admin/admin-studios.html');await until(admin,"document.body.classList.contains('live-ready')",'studio page');
  assert(await evaluate(admin,"L.version==='1.9.4' && !!document.querySelector('#studio-location-preview.leaflet-container')"),'local Leaflet initializes real preview');
  await evaluate(admin,"document.querySelector('#pick-location').click()");
  assert(await evaluate(admin,"document.querySelector('#map-latitude').value==='' && !document.querySelector('#location-map .studio-location-marker')"),'empty coordinates do not create a false pin');
  await evaluate(admin,"document.querySelector('#map-latitude').value='0';document.querySelector('#map-longitude').value='0';document.querySelector('#map-longitude').dispatchEvent(new Event('input'))");
  assert(await evaluate(admin,"!!document.querySelector('#location-map .studio-location-marker')"),'zero coordinates are accepted without Cavite fallback');
  await evaluate(admin,"document.querySelector('#map-cancel').click()");
  assert(await evaluate(admin,"document.querySelector('#studio-latitude').value===''") ,'cancel leaves studio coordinates unchanged');
  await delay(100);
  await evaluate(admin,"document.querySelector('#pick-location').click();document.querySelector('#map-latitude').value='14.429700';document.querySelector('#map-longitude').value='120.936700';document.querySelector('#map-longitude').dispatchEvent(new Event('input'))");
  const mapBox=await evaluate(admin,"(()=>{const r=document.querySelector('#location-map').getBoundingClientRect();return {x:r.x+r.width/2+45,y:r.y+r.height/2+25}})()");
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:mapBox.x,y:mapBox.y,button:'left',clickCount:1},admin);
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:mapBox.x,y:mapBox.y,button:'left',clickCount:1},admin);
  const clicked=await evaluate(admin,"[Number(document.querySelector('#map-latitude').value),Number(document.querySelector('#map-longitude').value)]");
  assert(clicked[0]<14.4297&&clicked[1]>120.9367,'map click updates geographic coordinates in correct direction');
  const pin=await evaluate(admin,"(()=>{const r=document.querySelector('#location-map .studio-location-marker').getBoundingClientRect();return {x:r.x+12,y:r.y+12}})()");
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:pin.x,y:pin.y},admin);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:pin.x,y:pin.y,button:'left',clickCount:1},admin);
  for(let i=1;i<=5;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:pin.x+6*i,y:pin.y-4*i,button:'left',buttons:1},admin);
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:pin.x+30,y:pin.y-20,button:'left',clickCount:1},admin);
  const dragged=await evaluate(admin,"[Number(document.querySelector('#map-latitude').value),Number(document.querySelector('#map-longitude').value)]");
  assert(dragged[0]>clicked[0]&&dragged[1]>clicked[1],'dragging the pin updates coordinates');
  await evaluate(admin,"document.querySelector('#location-form').requestSubmit()");
  assert(await evaluate(admin,`Number(document.querySelector('#studio-latitude').value)===${dragged[0]} && Number(document.querySelector('#studio-longitude').value)===${dragged[1]} && !!document.querySelector('#studio-location-preview .studio-location-marker')`),'confirmed pin populates studio form and preview');
  await evaluate(admin,`document.querySelector('#studio-name').value=${JSON.stringify(fixture.tag+' Studio')};document.querySelector('#studio-city').value='Imus';document.querySelector('#studio-address').value='Map regression test';document.querySelector('#studio-form').requestSubmit()`);
  await until(admin,"document.querySelector('#admin-feedback')?.textContent==='Changes saved.'",'save studio location');
  await navigate(admin,'admin/admin-studios.html');await until(admin,"document.body.classList.contains('live-ready')",'reload saved studio');
  await evaluate(admin,`[...document.querySelectorAll('#studio-body tr')].find(r=>r.innerText.includes(${JSON.stringify(fixture.tag+' Studio')})).querySelector('[data-edit]').click()`);
  assert(await evaluate(admin,`Math.abs(Number(document.querySelector('#studio-latitude').value)-${dragged[0]})<0.000001&&Math.abs(Number(document.querySelector('#studio-longitude').value)-${dragged[1]})<0.000001`),'saved coordinates survive database round trip and edit');
  assert(await evaluate(admin,`fetch('../api.php?action=studios').then(r=>r.json()).then(r=>{const s=r.studios.find(s=>s.name===${JSON.stringify(fixture.tag+' Studio')});return Math.abs(Number(s.latitude)-${dragged[0]})<0.000001&&Math.abs(Number(s.longitude)-${dragged[1]})<0.000001})`),'client studio API returns the same selected pin');
  await evaluate(admin,"document.querySelector('#pick-location').click()");
  await send('Emulation.setGeolocationOverride',{latitude:14.4297,longitude:120.9367,accuracy:25},admin);
  await evaluate(admin,"navigator.geolocation.getCurrentPosition=success=>success({coords:{latitude:14.4297,longitude:120.9367,accuracy:25}});document.querySelector('#map-current').click()");
  assert(await evaluate(admin,"document.querySelector('#map-status').textContent.includes('25 meters') && Number(document.querySelector('#map-latitude').value)===14.4297"),'device accuracy is displayed without claiming an exact studio location');
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true},admin);await delay(250);
  assert(await evaluate(admin,"document.documentElement.scrollWidth<=innerWidth+1 && document.querySelector('#admin-dialog').getBoundingClientRect().width<=innerWidth"),'map dialog fits mobile viewport');
  const shot=await send('Page.captureScreenshot',{format:'png'},admin);fs.writeFileSync(path.join(__dirname,'admin-studio-leaflet-mobile.png'),Buffer.from(shot.data,'base64'));
  await evaluate(admin,"document.querySelector('#map-cancel').click()");await delay(100);
  await evaluate(admin,"document.querySelector('#pick-location').click()");
  assert(await evaluate(admin,"!!document.querySelector('#location-map.leaflet-container')"),'picker can be reopened without duplicate initialization');
  assert(errors.length===0,'no browser JavaScript exceptions');
  console.log('Leaflet studio checks complete.');
 }finally{
  if(socket){try{await send('Browser.close');}catch{}socket.close();}proc.kill();
  console.log(execFileSync(php,[path.join(__dirname,'browser-fixtures.php'),'cleanup',fixture.tag],{encoding:'utf8',windowsHide:true}));
 }
})().catch(e=>{console.error(e);console.error(errors);process.exitCode=1;});