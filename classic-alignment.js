'use strict';
// Refine only near the detected upper lid. Low-contrast photos keep the detected line.
window.refineClassicLid=(frame,eye)=>{
 const {data,width,height}=frame,lid=eye.lid;
 if(eye.width<30)return lid.map(p=>({...p}));
 const first=lid[0],last=lid[lid.length-1],dx=(last.x-first.x)/eye.width,dy=(last.y-first.y)/eye.width,nx=-dy,ny=dx;
 const maxShift=Math.min(9,eye.width*.035),step=Math.max(.5,maxShift/10),gap=Math.max(1,eye.width*.012);
 const pixel=(x,y)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=width||y>=height)return null;const i=(y*width+x)*4;return .2126*data[i]+.7152*data[i+1]+.0722*data[i+2];};
 const profile=(p,offset)=>{
  let above=0,below=0,n=0;
  for(const along of [-gap,0,gap]){
   const x=p.x+nx*offset+dx*along,y=p.y+ny*offset+dy*along;
   const a=pixel(x-nx*gap,y-ny*gap),b=pixel(x+nx*gap,y+ny*gap);
   if(a===null||b===null)continue;above+=a;below+=b;n++;
  }
  return n===3?(above-below)/n:0;
 };
 const shifts=lid.map((p,i)=>{
  if(i===0||i===lid.length-1)return 0;
  const baseline=profile(p,0);let best=baseline,bestOffset=0;
  for(let offset=-maxShift;offset<=maxShift;offset+=step){
   const edge=profile(p,offset),score=edge-1.7*Math.abs(offset);
   if(edge>=14&&score>best+3){best=score;bestOffset=offset;}
  }
  return bestOffset;
 });
 return lid.map((p,i)=>{
  if(i===0||i===lid.length-1)return {...p};
  const sorted=shifts.slice(i-1,i+2).sort((a,b)=>a-b);
  const offset=(sorted[1]*.6+shifts[i]*.4)*Math.sin(Math.PI*i/(lid.length-1));
  return {x:p.x+nx*offset,y:p.y+ny*offset};
 });
};