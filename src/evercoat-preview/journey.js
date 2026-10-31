(() => {
 'use strict';
 const section=document.getElementById('process');if(!section)return;
 const pin=section.querySelector('.process-pin'),road=section.querySelector('.roadmap'),svg=section.querySelector('.road-svg');
 const base=svg.querySelector('.road-base'),fill=svg.querySelector('.road-fill'),marker=svg.querySelector('.road-marker'),halo=svg.querySelector('.road-halo');
 const steps=[...section.querySelectorAll('.road-step')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),wide=matchMedia('(min-width:1000px)');
 let stops=[],total=0,current=0,target=0,frame=0,lastTime=0,manual=false,currentIndex=-1;
 const clamp=v=>Math.min(1,Math.max(0,v));
 function headerHeight(){return document.querySelector('.header').getBoundingClientRect().height;}
 function render(p){
  if(!total)return;
  const distance=p*total,point=base.getPointAtLength(distance);
  fill.style.strokeDasharray=String(total);fill.style.strokeDashoffset=String(total-distance);
  for(const circle of [marker,halo]){circle.setAttribute('cx',point.x);circle.setAttribute('cy',point.y);}
  let index=0;stops.forEach((stop,i)=>{if(stop<=distance+total*.002)index=i;});
  if(index!==currentIndex){
   currentIndex=index;
   steps.forEach((step,i)=>{step.classList.toggle('is-reached',i<=index);step.classList.toggle('is-current',i===index);if(i===index)step.setAttribute('aria-current','step');else step.removeAttribute('aria-current');});
   document.getElementById('journey-counter').textContent=`${String(index+1).padStart(2,'0')} / 09`;
   document.getElementById('journey-current').textContent=steps[index].querySelector('.road-title').textContent;
   section.classList.toggle('is-complete',index===steps.length-1);
  }
 }
 function scrollProgress(){
  if(reduced.matches)return 1;
  if(section.dataset.pin==='true'){
   const rect=section.getBoundingClientRect(),travel=section.offsetHeight-pin.offsetHeight;
   return clamp((headerHeight()-rect.top)/Math.max(1,travel));
  }
  const bounds=road.getBoundingClientRect(),first=steps[0].querySelector('.road-dot').getBoundingClientRect(),last=steps.at(-1).querySelector('.road-dot').getBoundingClientRect();
  return clamp((innerHeight*.53-first.top)/Math.max(1,last.top-first.top));
 }
 function animate(time){
  frame=0;const dt=Math.min(50,time-(lastTime||time-16));lastTime=time;
  current=reduced.matches?target:current+(target-current)*(1-Math.exp(-dt/95));
  if(Math.abs(target-current)<.0005)current=target;
  render(current);if(current!==target)frame=requestAnimationFrame(animate);
 }
 function requestUpdate(){if(!manual)target=scrollProgress();if(!frame){lastTime=0;frame=requestAnimationFrame(animate);}}
 function measure(){
  const style=getComputedStyle(pin),natural=pin.firstElementChild.offsetHeight+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
  const canPin=wide.matches&&!reduced.matches&&natural<=innerHeight-headerHeight()+2;
  section.dataset.pin=String(canPin);
  const bounds=road.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
  const points=steps.map(step=>{const r=step.querySelector('.road-dot').getBoundingClientRect();return{x:r.left+r.width/2-bounds.left,y:r.top+r.height/2-bounds.top};});
  let path=`M ${points[0].x} ${points[0].y}`;stops=[0];
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];
   if(wide.matches&&Math.abs(a.y-b.y)>15){const edge=a.x>bounds.width/2?bounds.width-8:8;path+=` C ${edge} ${a.y},${edge} ${b.y},${b.x} ${b.y}`;}
   else path+=` L ${b.x} ${b.y}`;
   base.setAttribute('d',path);stops.push(base.getTotalLength());
  }
  fill.setAttribute('d',path);total=base.getTotalLength();manual=false;target=scrollProgress();current=target;render(current);
 }
 steps.forEach((step,i)=>step.addEventListener('click',()=>{
  if(!total)return;const fraction=stops[i]/total;
  if(section.dataset.pin==='true'){
   const top=scrollY+section.getBoundingClientRect().top-headerHeight()+fraction*(section.offsetHeight-pin.offsetHeight);
   window.scrollTo({top,behavior:reduced.matches?'instant':'smooth'});
  }else{manual=true;target=fraction;requestUpdate();}
 }));
 window.addEventListener('scroll',()=>{manual=false;requestUpdate();},{passive:true});
 const resize=new ResizeObserver(measure);resize.observe(pin.firstElementChild);resize.observe(road);
 window.addEventListener('resize',measure,{passive:true});reduced.addEventListener('change',measure);
 document.fonts.ready.then(measure);measure();
})();
