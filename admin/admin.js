/* Isolated visual admin dashboard. Reference figures are sample data, not live records. */
(() => {
'use strict';
const $ = selector => document.querySelector(selector);
const reference = 'ui-admin.png';
const lashes = [
{name:'Hybrid Lash',count:45,box:'483 805 60 39'},
{name:'Volume Lash',count:32,box:'483 850 60 39'},
{name:'Classic Lash',count:28,box:'483 895 60 39'},
{name:'Wispy Lash',count:18,box:'483 940 60 39'},
{name:'Mega Volume',count:12,box:'483 986 60 39'}
];
const studios = [
{name:'ABG Studios',count:48,box:'971 804 40 40'},
{name:'Lush Beauty PH',count:36,box:'971 849 40 40'},
{name:'The Lash Room',count:28,box:'971 893 40 40'},
{name:'Glow Lab',count:24,box:'971 938 40 40'},
{name:'Lash & Co.',count:18,box:'971 984 40 40'}
];
const activities = [
['person','New client registered','user@email.com','10 mins ago'],
['shop','New studio added','Lush Beauty PH','1 hour ago'],
['lashes','Lash style updated','Hybrid Lash','3 hours ago'],
['criteria','Quiz criteria edited','Eye Shape - Almond','4 hours ago'],
['shop','Studio capability updated','The Lash Room','5 hours ago']
];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = name => '<svg aria-hidden="true"><use href="#'+name+'"/></svg>';
const photo = (box, name) => '<svg class="photo-crop" viewBox="'+box+'" role="img" aria-label="'+escape(name)+'"><image href="'+reference+'" width="1920" height="1080"/></svg>';
$('#lash-rankings').innerHTML = lashes.map(item => '<div class="lash-row"><span class="lash-photo">'+photo(item.box,item.name)+'</span><span>'+item.name+'</span><span class="bar-track"><span class="bar-fill" style="width:'+item.count/54*100+'%"></span></span><span class="lash-count">'+item.count+'</span></div>').join('');
$('#studio-rankings').innerHTML = studios.map((item,i) => '<div class="studio-row"><span class="rank">'+(i+1)+'</span><span class="studio-photo">'+photo(item.box,item.name)+'</span><span>'+item.name+'</span><span class="match-count">'+item.count+' matches</span></div>').join('');
const activityHTML = () => activities.map(item => '<div class="activity-row"><span class="activity-icon">'+icon(item[0])+'</span><span class="activity-copy">'+item[1]+'<small>'+item[2]+'</small></span><span class="activity-time">'+item[3]+'</span></div>').join('');
$('#recent-activities').innerHTML = activityHTML();
function drawChart(days) {
 const chart = $('#activity-chart');
 const labels = days === '7' ? ['Sep 8','Sep 9','Sep 10','Sep 11','Sep 12','Sep 13','Sep 14'] : days === '14' ? ['Sep 1','Sep 3','Sep 5','Sep 7','Sep 9','Sep 11','Sep 14'] : ['Aug 16','Aug 21','Aug 26','Aug 31','Sep 5','Sep 10','Sep 14'];
 const series = days === '7' ? [[23,24,37,30,40,29,40],[16,16,27,19,31,21,30],[9,10,13,10,15,14,18]] : days === '14' ? [[15,20,27,23,35,30,40],[8,12,18,16,24,19,30],[4,7,11,8,13,10,18]] : [[8,15,22,18,29,37,40],[4,9,13,11,20,27,30],[2,5,8,7,11,13,18]];
 const colors = ['#ff4c8b','#ffacca','#dc88c0'];
 const xs = [34,154,274,394,514,634,782];
 const y = value => 192-value*3.55;
 let markup = '<title>Sample client activity — last '+days+' days</title><desc>Demonstration figures for new users, quiz completions, and studio searches; not live analytics.</desc>';
 for(let n=0;n<=50;n+=10) markup += '<line x1="34" y1="'+y(n)+'" x2="782" y2="'+y(n)+'" stroke="#f0eaed" stroke-width="1"/><text x="20" y="'+(y(n)+4)+'" text-anchor="end" fill="#65728a" font-family="Arial" font-size="13">'+n+'</text>';
 xs.forEach((x,i) => { markup += '<line x1="'+x+'" y1="14.5" x2="'+x+'" y2="192" stroke="#f6f0f2" stroke-width="1"/><text x="'+x+'" y="217" text-anchor="'+(i===6?'end':'middle')+'" fill="#65728a" font-family="Arial" font-size="13">'+labels[i]+'</text>'; });
 series.forEach((values,s) => {
  let path = 'M '+xs[0]+' '+y(values[0]);
  for(let i=1;i<values.length;i++){const middle=(xs[i-1]+xs[i])/2;path+=' C '+middle+' '+y(values[i-1])+', '+middle+' '+y(values[i])+', '+xs[i]+' '+y(values[i]);}
  markup += '<path d="'+path+' L 782 192 L 34 192 Z" fill="'+colors[s]+'" fill-opacity=".08"/><path d="'+path+'" fill="none" stroke="'+colors[s]+'" stroke-width="1.9"/>';
  values.forEach((value,i) => {markup += '<circle cx="'+xs[i]+'" cy="'+y(value)+'" r="3.8" fill="'+colors[s]+'"><title>'+labels[i]+': '+value+' '+['new users','quiz completions','studio searches'][s]+'</title></circle>';});
 });
 chart.innerHTML = markup;
 chart.setAttribute('aria-label','Sample client activity — last '+days+' days');
}
drawChart('7');
$('#activity-range').addEventListener('change', event => drawChart(event.target.value));
const dialog = $('#admin-dialog');
function open(title, html) { $('#dialog-title').textContent = title; $('#dialog-content').innerHTML = html; if(!dialog.open) dialog.showModal(); }
$('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
const note = '<p class="preview-note">Design preview · These are sample records from the reference. Admin data management is not connected yet.</p>';
const list = items => '<ul class="detail-list">'+items.map(item=>'<li>'+escape(item.name)+'<small>'+item.count+' '+(lashes.includes(item)?'recommendations':'matches')+'</small></li>').join('')+'</ul>';
function showSection(name) {
 if(name==='Recommendation Criteria'){location.assign('admin-recommendation-criteria.html');return;}
 if(name==='Lash Styles'||name==='Add Lash Style'){location.assign('admin-lash-styles.html'+(name==='Add Lash Style'?'#add':''));return;}
 let content = note;
 if(name==='Lash Styles') content += list(lashes);
 else if(name==='Studios') content += list(studios);
 else if(name==='Recommendation Criteria') content += '<ul class="detail-list"><li>Eye shape<small>Almond, round, hooded, monolid</small></li><li>Preferred finish<small>Natural, balanced, textured, dramatic</small></li><li>Occasion<small>Everyday, event</small></li></ul>';
 else if(name==='Studio Capabilities') content += '<p>Studio specialties and available lash services will be managed here.</p>';
 else if(name==='Users & Results') content += '<p>The reference shows 152 clients and 124 completed quizzes. Live user records are not connected to this preview.</p>';
 else if(name==='Settings') content += '<p>Administrator account and dashboard settings will be managed here.</p>';
 else content += '<p>'+ (name==='Add Lash Style'?'Creating lash styles':'Creating studios') +' will be available when admin management is connected.</p>';
 open(name,content);
}
document.querySelectorAll('[data-section]').forEach(button=>button.addEventListener('click',()=>showSection(button.dataset.section)));
$('#all-activities').addEventListener('click',()=>open('Recent Activities',note+activityHTML()));
$('#notifications').addEventListener('click',()=>open('Notifications',note+activityHTML()));
$('#profile').addEventListener('click',()=>open('Admin', '<p>System Administrator</p>'+note));
$('#admin-search-form').addEventListener('submit', event => {
 event.preventDefault();
 const query=$('#admin-search').value.trim();
 if(!query) return;
 const results=[...lashes,...studios].filter(item=>item.name.toLowerCase().includes(query.toLowerCase()));
 open('Search results',note+'<p>Results for “'+escape(query)+'”</p>'+(results.length?list(results):'<p class="empty-state">No matching lash styles or studios.</p>'));
});
})();
