'use strict';
// Curved 3D fibers projected into the captured photo. No strips or stretched hair sprites.
// Depth and illumination are estimates from landmarks/photo, not a calibrated head scan.
window.ClassicLashAsset=(()=>{
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const noise=i=>{const n=Math.sin(i*127.1+37.2)*43758.5453;return n-Math.floor(n);};
 function appearance(frame,eye){
  const samples=[],w=frame.width,h=frame.height;
  for(const p of eye.lid)for(const dy of [-.04,-.02,0]){
   const x=Math.round(p.x),y=Math.round(p.y+eye.width*dy);if(x<0||y<0||x>=w||y>=h)continue;
   const i=(y*w+x)*4;samples.push(.2126*frame.data[i]+.7152*frame.data[i+1]+.0722*frame.data[i+2]);
  }
  samples.sort((a,b)=>a-b);const low=samples[Math.floor(samples.length*.15)]||20,mid=samples[Math.floor(samples.length*.65)]||100;
  return {ink:clamp(low*.35,8,48),light:clamp(mid/180,.25,1),opacity:clamp(.72+(mid-low)/500,.74,.94)};
 }
 function arcSampler(lid,point){
  const samples=[{...point(lid,0),distance:0}];let total=0;
  for(let i=1;i<=128;i++){const p=point(lid,i/128),q=samples[i-1];total+=Math.hypot(p.x-q.x,p.y-q.y);samples.push({...p,distance:total});}
  return u=>{const d=clamp(u,0,1)*total;let lo=0,hi=128;while(hi-lo>1){const m=(lo+hi)>>1;samples[m].distance<d?lo=m:hi=m;}const a=samples[lo],b=samples[hi],f=(d-a.distance)/(b.distance-a.distance||1);return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f};};
 }
 function draw(ctx,eye,side,point,strength,colorAt,variant='Classic'){
  const profile=window.LashStyleProfiles?.resolve(variant);if(!profile||!eye.lid?.length)return;
  const p=profile.legacy?{...profile,count:76,fans:profile.legacy==='Hybrid'?4:1,hybrid:profile.legacy==='Hybrid',thickness:.57,variation:.24}:profile;
  const sample=arcSampler(eye.lid,point),first=sample(0),last=sample(1),roll=Math.atan2(last.y-first.y,last.x-first.x),width=eye.width;
  const lighting=eye.appearance||{ink:18,light:.75,opacity:.88},yaw=clamp(eye.yaw||0,-.65,.65),fibers=[];
  const maps={natural:[.055,.115,.17,.18,.155,.075],doll:[.045,.105,.20,.20,.105,.045],cat:[.04,.075,.11,.15,.205,.11],kitten:[.045,.10,.155,.185,.15,.07],fox:[.035,.055,.075,.105,.20,.12]};
  const lengthMap=u=>{const m=maps[p.shape]||maps.natural,v=clamp(u,0,1)*5,i=Math.min(4,Math.floor(v)),f=v-i;return m[i]*(1-f)+m[i+1]*f;};
  const add=(u,length,spread,thickness,seed,cluster=false)=>{
   const root=sample(u),a=sample(u-.006),b=sample(u+.006),local=Math.atan2(b.y-a.y,b.x-a.x);
   const outward=(u-.5)*.90+(local-roll)*.28+spread+(noise(seed+81)-.5)*(cluster?.045:.28);
   const angle=roll+outward,dx=Math.sin(angle),dy=-Math.cos(angle),sx=Math.cos(roll),sy=Math.sin(roll);
   const curl=1.05+noise(seed+33)*.48,lean=(noise(seed+13)-.5)*.17,depth=length*(.29+.09*noise(seed+61));
   const path=[];
   for(let j=0;j<=24;j++){
    const t=j/24;
    // Circular rise and forward depth form the curl; perspective foreshortens near tips.
    const rise=length*(1-Math.cos(t*curl))/(1-Math.cos(curl));
    const z=depth*Math.sin(t*curl),perspective=1/(1+z/(width*3));
    const sideways=length*(lean*t*t+(side==='left'?-1:1)*(-.07+.42*noise(seed+11))*Math.sin(Math.PI*t)*t)+z*yaw;
    const x=root.x+(dx*rise+sx*sideways)*perspective,y=root.y+(dy*rise+sy*sideways-z*.24)*perspective;
    path.push({x,y,t,z});
   }
   fibers.push({path,radius:width*.00265*(thickness/.57)*(.8+.35*noise(seed+8)),u,seed,depth,opacity:lighting.opacity*(.83+.17*noise(seed+29))});
  };
  for(let i=0;i<p.count;i++){
   const u=.055+.89*(i+.22+noise(i)*.56)/p.count,outer=side==='left'?1-u:u;
   const short=i%9===0?.68:1,length=width*lengthMap(outer)*strength*p.length*short*(1-p.variation+2*p.variation*noise(i+93));
   const count=p.hybrid&&i%2===0?1:p.fans;
   for(let k=0;k<count;k++)add(u,length*(.96+.04*noise(i*17+k)),(k-(count-1)/2)*p.spread+(p.cross?(i%2?-.18:.18):0)+(side==='left'?-1:1)*(p.sweep||0)*outer*outer,count===1?.57:p.thickness,i*17+k,p.spread<.03);
  }
  for(let i=0;i<(p.spikes||0);i++){
   const u=.09+.82*(i+.5)/p.spikes,outer=side==='left'?1-u:u,n=p.spikeFans||3;
   const length=width*lengthMap(outer)*strength*p.length*p.spikeLength;
   for(let k=0;k<n;k++)add(u,length*(1-.025*Math.abs(k-(n-1)/2)),(k-(n-1)/2)*.014,.5,700+i*17+k,true);
  }
  // Occlude the underside at the upper lid, so roots cannot paint over the eyeball.
  ctx.save();ctx.beginPath();for(let i=0;i<=128;i++){const q=sample(i/128);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}
  const reach=width*4;ctx.lineTo(last.x+Math.sin(roll)*reach,last.y-Math.cos(roll)*reach);ctx.lineTo(first.x+Math.sin(roll)*reach,first.y-Math.cos(roll)*reach);ctx.closePath();ctx.clip();
  if(p.band){ctx.save();ctx.beginPath();for(let i=0;i<=100;i++){const q=sample(.055+.89*i/100);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.strokeStyle='rgba(23,17,14,.35)';ctx.lineWidth=width*.003;ctx.stroke();ctx.restore();}
  fibers.sort((a,b)=>a.depth-b.depth);
  for(const fiber of fibers){
   const {path,radius,u,opacity}=fiber,root=path[0],tip=path[path.length-1],outer=side==='left'?1-u:u;
   const edges=[[],[]];path.forEach((q,j)=>{const a=path[Math.max(0,j-1)],b=path[Math.min(path.length-1,j+1)],d=Math.hypot(b.x-a.x,b.y-a.y)||1,r=radius*Math.pow(1-q.t,.72)*(.8+.2*Math.sin(Math.PI*q.t));edges[0].push({x:q.x-(b.y-a.y)/d*r,y:q.y+(b.x-a.x)/d*r});edges[1].push({x:q.x+(b.y-a.y)/d*r,y:q.y-(b.x-a.x)/d*r});});
   const trace=()=>{ctx.beginPath();ctx.moveTo(edges[0][0].x,edges[0][0].y);for(const q of edges[0].slice(1))ctx.lineTo(q.x,q.y);for(const q of [...edges[1]].reverse())ctx.lineTo(q.x,q.y);ctx.closePath();};
   // Subtle contact shadow only near the root; no opaque eyeliner strip.
   ctx.save();ctx.strokeStyle='rgba(23,16,13,.08)';ctx.lineWidth=radius*2.8;ctx.beginPath();ctx.moveTo(root.x,root.y);for(const q of path.slice(1,6))ctx.lineTo(q.x,q.y+width*.001);ctx.stroke();ctx.restore();
   const ink=Math.round(lighting.ink),gradient=ctx.createLinearGradient(root.x,root.y,tip.x,tip.y);
   gradient.addColorStop(0,'rgba('+ink+','+Math.max(0,ink-3)+','+Math.max(0,ink-5)+',.18)');gradient.addColorStop(.09,'rgb('+ink+','+Math.max(0,ink-3)+','+Math.max(0,ink-5)+')');gradient.addColorStop(.72,'rgb('+(ink+7)+','+(ink+3)+','+ink+')');gradient.addColorStop(1,'rgba('+ink+','+ink+','+ink+',.5)');
   ctx.save();ctx.globalAlpha*=opacity;trace();ctx.fillStyle=gradient;ctx.fill();
   const pick=colorAt(outer);if(pick){ctx.save();trace();ctx.clip();ctx.globalAlpha*=pick.alpha;const tint=ctx.createLinearGradient(root.x,root.y,tip.x,tip.y);tint.addColorStop(0,'transparent');tint.addColorStop(pick.tips?.55:.07,pick.tips?'transparent':pick.color);tint.addColorStop(.85,pick.color);tint.addColorStop(1,pick.color);ctx.fillStyle=tint;ctx.fill();ctx.restore();}
   // A faint off-center highlight gives the curved fiber a round cross section.
   ctx.strokeStyle='rgba(167,145,125,'+(.07*lighting.light)+')';ctx.lineWidth=radius*.32;ctx.beginPath();path.slice(5,18).forEach((q,j)=>j?ctx.lineTo(q.x-radius*.25,q.y):ctx.moveTo(q.x-radius*.25,q.y));ctx.stroke();ctx.restore();
  }
  ctx.restore();
 }
 return {ready:Promise.resolve(true),draw,appearance,arcSampler,version:'depth-fibers-1',get hairCount(){return 0;}};
})();
