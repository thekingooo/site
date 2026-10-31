(() => {
 'use strict';
 const section=document.getElementById('process');if(!section)return;
 const pin=section.querySelector('.process-pin'),road=section.querySelector('.roadmap'),svg=section.querySelector('.road-svg');
 const base=svg.querySelector('.road-base'),fill=svg.querySelector('.road-fill'),marker=svg.querySelector('.road-marker'),halo=svg.querySelector('.road-halo');
 const steps=[...section.querySelectorAll('.road-step')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),wide=matchMedia('(min-width:1000px)');
 let stops=[],total=0,current=0,targetIndex=0,frame=0,currentIndex=-1;
 let lastWheel=-Infinity,cooldown=0,programmaticY=null,pendingScroll=false;
 const clamp=v=>Math.min(1,Math.max(0,v));
 const pinned=()=>section.dataset.pin==='true';
 const headerHeight=()=>document.querySelector('.header').getBoundingClientRect().height;
 function range(){const start=scrollY+section.getBoundingClientRect().top-headerHeight();return{start,travel:section.offsetHeight-pin.offsetHeight};}
 function render(distance){
  if(!total)return;current=distance;
  const point=base.getPointAtLength(distance);
  fill.style.strokeDasharray=String(total);fill.style.strokeDashoffset=String(total-distance);
  for(const circle of [marker,halo]){circle.setAttribute('cx',point.x);circle.setAttribute('cy',point.y);}
  let index=0;stops.forEach((stop,i)=>{if(stop<=distance+.5)index=i;});
  if(index!==currentIndex){
   currentIndex=index;
   steps.forEach((step,i)=>{step.classList.toggle('is-reached',i<=index);step.classList.toggle('is-current',i===index);if(i===index)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');});
   section.classList.toggle('is-complete',index===steps.length-1);
  }
 }
 function nearestStep(){
  if(reduced.matches)return steps.length-1;
  let distance;
  if(pinned()){
   const {start,travel}=range();distance=clamp((scrollY-start)/Math.max(1,travel))*total;
  }else{
   const first=steps[0].querySelector('.road-dot').getBoundingClientRect(),last=steps.at(-1).querySelector('.road-dot').getBoundingClientRect();
   distance=clamp((innerHeight*.53-first.top)/Math.max(1,last.top-first.top))*total;
  }
  return stops.reduce((best,stop,i)=>Math.abs(stop-distance)<Math.abs(stops[best]-distance)?i:best,0);
 }
 function alignPage(index){
  if(!pinned())return;
  const {start,travel}=range();programmaticY=start+stops[index]/total*travel;
  window.scrollTo({top:programmaticY,behavior:'instant'});
 }
 function go(index,{align=false,instant=false}={}){
  if(!total)return;
  index=Math.min(steps.length-1,Math.max(0,index));
  if(align)alignPage(index);
  if(index===targetIndex&&(frame||Math.abs(current-stops[index])<.01))return;
  cancelAnimationFrame(frame);frame=0;pendingScroll=false;targetIndex=index;
  const from=current,to=stops[index],duration=560+Math.min(320,Math.abs(to-from)/total*650);
  if(instant||reduced.matches){section.dataset.state='idle';render(to);return;}
  section.dataset.state='moving';let started;
  function tick(time){
   if(started===undefined)started=time;
   const progress=clamp((time-started)/duration),eased=progress*progress*(3-2*progress);
   render(from+(to-from)*eased);
   if(progress<1)frame=requestAnimationFrame(tick);
   else{frame=0;section.dataset.state='idle';cooldown=performance.now()+140;render(to);if(pendingScroll){pendingScroll=false;go(nearestStep());}}
  }
  frame=requestAnimationFrame(tick);
 }
 function measure(){
  cancelAnimationFrame(frame);frame=0;pendingScroll=false;programmaticY=null;
  const style=getComputedStyle(pin),natural=pin.firstElementChild.offsetHeight+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
  section.dataset.pin=String(wide.matches&&!reduced.matches&&natural<=innerHeight-headerHeight()+2);
  const bounds=road.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
  const points=steps.map(step=>{const r=step.querySelector('.road-dot').getBoundingClientRect();return{x:r.left+r.width/2-bounds.left,y:r.top+r.height/2-bounds.top};});
  let path=`M ${points[0].x} ${points[0].y}`;stops=[0];
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];
   if(wide.matches&&Math.abs(a.y-b.y)>15){const edge=a.x>bounds.width/2?bounds.width-8:8;path+=` C ${edge} ${a.y},${edge} ${b.y},${b.x} ${b.y}`;}
   else path+=` L ${b.x} ${b.y}`;
   base.setAttribute('d',path);stops.push(base.getTotalLength());
  }
  fill.setAttribute('d',path);total=base.getTotalLength();targetIndex=nearestStep();section.dataset.state='idle';render(stops[targetIndex]);
 }
 steps.forEach((step,i)=>step.addEventListener('click',()=>{if(!frame)go(i,{align:true});}));
 window.addEventListener('scroll',()=>{
  if(programmaticY!==null&&Math.abs(scrollY-programmaticY)<2){programmaticY=null;return;}
  programmaticY=null;
  if(frame){pendingScroll=true;return;}
  go(nearestStep());
 },{passive:true});
 window.addEventListener('wheel',event=>{
  if(!pinned()||event.defaultPrevented||event.ctrlKey||!event.deltaY||Math.abs(event.deltaX)>Math.abs(event.deltaY)||document.querySelector('dialog[open]'))return;
  const {start,travel}=range(),end=start+travel;
  const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?innerHeight:1);
  const enteringFromAbove=scrollY<start-2&&delta>0&&scrollY+delta>=start;
  const enteringFromBelow=scrollY>end+2&&delta<0&&scrollY+delta<=end;
  if(!enteringFromAbove&&!enteringFromBelow&&(scrollY<start-2||scrollY>end+2))return;
  const now=performance.now(),gap=now-lastWheel;lastWheel=now;
  if(enteringFromAbove||enteringFromBelow){event.preventDefault();go(enteringFromAbove?0:steps.length-1,{align:true,instant:true});return;}
  // A wheel burst and its inertial tail finish one whole leg, never half a leg.
  if(frame||now<cooldown||gap<300){event.preventDefault();return;}
  const destination=targetIndex+(delta>0?1:-1);
  if(destination<0||destination>=steps.length)return;
  event.preventDefault();go(destination,{align:true});
 },{passive:false});
 document.addEventListener('keydown',event=>{
  if(!pinned()||event.ctrlKey||event.metaKey||event.altKey||document.querySelector('dialog[open]'))return;
  if(event.target.closest('input,textarea,select,a,[contenteditable],button:not(.road-step)'))return;
  const {start,travel}=range();if(scrollY<start-2||scrollY>start+travel+2)return;
  const forward=['ArrowDown','PageDown',' '].includes(event.key),back=['ArrowUp','PageUp'].includes(event.key);if(!forward&&!back)return;
  const destination=targetIndex+(forward?1:-1);if(destination<0||destination>=steps.length)return;
  event.preventDefault();if(!event.repeat&&!frame)go(destination,{align:true});
 });
 const resize=new ResizeObserver(measure);resize.observe(pin.firstElementChild);resize.observe(road);
 window.addEventListener('resize',measure,{passive:true});reduced.addEventListener('change',measure);
 Object.defineProperty(window,'fpJourney',{get:()=>({step:targetIndex,busy:!!frame,distance:current,stops:[...stops]})});
 document.fonts.ready.then(measure);measure();
})();
