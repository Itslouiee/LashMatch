'use strict';
window.ClassicLashAsset=(()=>{
 const image=new Image(),hairs=[];
 const ready=new Promise(resolve=>{
  image.onerror=()=>resolve(false);
  image.onload=()=>{try{
   const source=document.createElement('canvas');source.width=image.width;source.height=image.height;
   const ctx=source.getContext('2d');ctx.drawImage(image,0,0);
   const data=ctx.getImageData(0,0,source.width,source.height).data,w=source.width,h=source.height,seen=new Uint8Array(w*h);
   for(let seed=0;seed<w*h;seed++){
    if(seen[seed]||data[seed*4+3]<35)continue;
    const queue=[seed];seen[seed]=1;let minX=w,maxX=0,minY=h,maxY=0;
    for(let head=0;head<queue.length;head++){
     const p=queue[head],x=p%w,y=Math.floor(p/w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
     for(const n of [x>0?p-1:-1,x<w-1?p+1:-1,p-w,p+w])if(n>=0&&n<w*h&&!seen[n]&&data[n*4+3]>=35){seen[n]=1;queue.push(n);}
    }
    if(queue.length<90||maxY-minY<35)continue;
    const sprite=document.createElement('canvas');sprite.width=maxX-minX+3;sprite.height=maxY-minY+3;
    const ink=sprite.getContext('2d'),rgba=ink.createImageData(sprite.width,sprite.height);let rootSum=0,rootN=0;
    for(const p of queue){const x=p%w,y=Math.floor(p/w),i=((y-minY+1)*sprite.width+x-minX+1)*4;rgba.data[i]=20;rgba.data[i+1]=15;rgba.data[i+2]=13;rgba.data[i+3]=data[p*4+3];if(y>=maxY-3){rootSum+=x-minX+1;rootN++;}}
    ink.putImageData(rgba,0,0);hairs.push({sprite,root:rootSum/Math.max(1,rootN),position:minX});
   }
   hairs.sort((a,b)=>a.position-b.position);resolve(hairs.length>8);
  }catch(e){console.error(e);resolve(false);}};
 });
 image.src=new URL('assets/classic-single-v2.png',document.currentScript.src).href;
 const random=i=>{const v=Math.sin(i*127.1+37.2)*43758.5453;return v-Math.floor(v);};
 function draw(ctx,eye,side,point,strength,colorAt,variant='Classic'){
  if(!hairs.length)return;
  
  const profile=window.LashStyleProfiles?.resolve(variant);
  if(profile&&!profile.legacy){drawProfile(ctx,eye,side,point,strength,colorAt,profile);return;}
  variant=profile?.legacy||variant;
  const first=eye.lid[0],last=eye.lid[eye.lid.length-1],angle=Math.atan2(last.y-first.y,last.x-first.x),count=88;
  // Whole isolated hair textures preserve curvature instead of tearing it into strips.
  for(let i=0;i<count;i++){
   const t=.13+.78*(i+.25+random(i)*.5)/count,outer=side==='left'?1-t:t;
   const root=point(eye.lid,t),short=random(i+400)<.3;
   const length=eye.width*(.045+.125*Math.pow(Math.sin(Math.PI*outer),.8)+.025*outer)*strength*(short?.55:.65+random(i+93)*.65);
   const hair=hairs[Math.floor(random(i+23)*hairs.length)],scale=length/hair.sprite.height;
   let sprite=hair.sprite;const pick=colorAt(outer);
   if(pick){
    sprite=document.createElement('canvas');sprite.width=hair.sprite.width;sprite.height=hair.sprite.height;
    const tint=sprite.getContext('2d');tint.drawImage(hair.sprite,0,0);tint.globalCompositeOperation='source-atop';tint.globalAlpha=pick.alpha;
    if(pick.tips){const gradient=tint.createLinearGradient(0,sprite.height,0,0);gradient.addColorStop(0,'transparent');gradient.addColorStop(.5,'transparent');gradient.addColorStop(.85,pick.color);gradient.addColorStop(1,pick.color);tint.fillStyle=gradient;}else tint.fillStyle=pick.color;
    tint.fillRect(0,0,sprite.width,sprite.height);
   }
   const fan=(t-.5)*1.05+(random(i+201)-.5)*.48;
   const isFan=variant==='Hybrid'&&i%2===1,fanCount=isFan?4:1;
   for(let strand=0;strand<fanCount;strand++){
    const spread=isFan?(strand-1.5)*.09:0;
    const strandLength=isFan?length*(.93+.07*random(i+strand+600)):length;
    const strandScale=strandLength/hair.sprite.height,thickness=isFan?.43:.62;
    ctx.save();ctx.globalAlpha*=isFan?.76:(short?.55:.82+random(i+77)*.15);ctx.translate(root.x,root.y);ctx.rotate(angle+fan+spread);
    ctx.scale(side==='left'?-1:1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(sprite,-hair.root*strandScale*thickness,-strandLength+2*strandScale,hair.sprite.width*strandScale*thickness,strandLength);ctx.restore();
   }
  }
 }

 // Whole hair textures preserve tapered ends; each named profile controls its own fan and map.
 function drawProfile(ctx,eye,side,point,strength,colorAt,p){
  const first=eye.lid[0],last=eye.lid[eye.lid.length-1],angle=Math.atan2(last.y-first.y,last.x-first.x);
  const map=u=>{
   const maps={natural:[.055,.10,.16,.185,.17,.11],doll:[.045,.105,.20,.20,.105,.045],cat:[.045,.075,.105,.15,.205,.125],kitten:[.05,.10,.155,.185,.16,.08],fox:[.035,.055,.075,.105,.20,.14]};
   const values=maps[p.shape],pos=Math.max(0,Math.min(1,u))*5,j=Math.min(4,Math.floor(pos)),f=pos-j;
   return values[j]*(1-f)+values[j+1]*f;
  };
  const strand=(t,length,rotation,thickness,seed,opacity)=>{
   const root=point(eye.lid,t),outer=side==='left'?1-t:t,hair=hairs[Math.floor(random(seed+23)*hairs.length)],scale=length/hair.sprite.height;
   let sprite=hair.sprite;const pick=colorAt(outer);
   if(pick){sprite=document.createElement('canvas');sprite.width=hair.sprite.width;sprite.height=hair.sprite.height;const tint=sprite.getContext('2d');tint.drawImage(hair.sprite,0,0);tint.globalCompositeOperation='source-atop';tint.globalAlpha=pick.alpha;
    if(pick.tips){const g=tint.createLinearGradient(0,sprite.height,0,0);g.addColorStop(0,'transparent');g.addColorStop(.5,'transparent');g.addColorStop(.85,pick.color);g.addColorStop(1,pick.color);tint.fillStyle=g;}else tint.fillStyle=pick.color;tint.fillRect(0,0,sprite.width,sprite.height);}
   ctx.save();ctx.globalAlpha*=opacity;ctx.translate(root.x,root.y);ctx.rotate(angle+rotation);ctx.scale(side==='left'?-1:1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(sprite,-hair.root*scale*thickness,-length+2*scale,hair.sprite.width*scale*thickness,length);ctx.restore();
  };
  if(p.band){ctx.save();ctx.beginPath();for(let i=0;i<=80;i++){const q=point(eye.lid,.10+.80*i/80);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);}ctx.strokeStyle='rgba(27,19,18,.42)';ctx.lineWidth=eye.width*.003;ctx.stroke();ctx.restore();}
  for(let i=0;i<p.count;i++){
   const t=.11+.79*(i+.25+random(i)*.5)/p.count,outer=side==='left'?1-t:t,u=(outer-.1)/.8;
   const length=eye.width*map(u)*strength*p.length*(1-p.variation+2*p.variation*random(i+93))*(i%7===0?.65:1);
   const direction=(t-.5)*1.05+(random(i+201)-.5)*.24+(side==='left'?-1:1)*(p.sweep||0)*Math.pow(Math.max(0,u),2);
   const fans=p.hybrid&&i%3===0?1:p.fans;
   for(let k=0;k<fans;k++)strand(t,length*(.94+.06*random(i*11+k)),direction+(k-(fans-1)/2)*p.spread+(p.cross?(i%2?-.17:.17):0),fans===1?.6:p.thickness,i*13+k,.78);
  }
  for(let i=0;i<(p.spikes||0);i++){
   const t=.15+.69*(i+.5)/p.spikes,outer=side==='left'?1-t:t,u=(outer-.1)/.8;
   const length=eye.width*map(u)*strength*p.length*p.spikeLength*(.97+.06*random(i+911)),n=p.spikeFans||3;
   for(let k=0;k<n;k++)strand(t,length*(1-.025*Math.abs(k-(n-1)/2)),(t-.5)*1.05+(k-(n-1)/2)*.013,.5,i*13+700,.9);
  }
 }
 return {ready,draw,get hairCount(){return hairs.length;}};
})();