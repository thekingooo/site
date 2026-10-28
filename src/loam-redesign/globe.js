import * as THREE from 'three';
import world from './world.json';
const stage=document.getElementById('lm-globe-stage');
if(stage){
const fallback=document.getElementById('lm-globe-fallback');
const map=document.createElement('canvas');map.width=2048;map.height=1024;const ctx=map.getContext('2d');
ctx.fillStyle='#263d35';ctx.fillRect(0,0,2048,1024);
const polygons=g=>g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
function paint(g,color){ctx.fillStyle=color;for(const p of polygons(g)){const rings=p.map(ring=>{let previous=ring[0][0];return ring.map(([lon,lat])=>{while(lon-previous>180)lon-=360;while(lon-previous< -180)lon+=360;previous=lon;return[lon,lat];});});for(const shift of [-360,0,360]){ctx.beginPath();for(const ring of rings){ring.forEach(([lon,lat],i)=>{const x=(lon+shift+180)/360*2048,y=(90-lat)/180*1024;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.closePath();}ctx.fill('evenodd');}}}
world.land.forEach(g=>paint(g,'#75836b'));paint(world.russia,'#a7b28e');
ctx.strokeStyle='#2c493c66';ctx.lineWidth=1;for(let lon=0;lon<2048;lon+=2048/12){ctx.beginPath();ctx.moveTo(lon,0);ctx.lineTo(lon,1024);ctx.stroke();}for(let lat=0;lat<1024;lat+=1024/6){ctx.beginPath();ctx.moveTo(0,lat);ctx.lineTo(2048,lat);ctx.stroke();}
fallback.width=2048;fallback.height=1024;fallback.getContext('2d').drawImage(map,0,0);
try{
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setClearColor(0x000000,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.domElement.setAttribute('aria-hidden','true');stage.appendChild(renderer.domElement);fallback.hidden=true;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,100);const texture=new THREE.CanvasTexture(map);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
const earth=new THREE.Mesh(new THREE.SphereGeometry(2,96,64),new THREE.MeshPhongMaterial({map:texture,shininess:6,specular:0x25352b}));scene.add(earth);scene.add(new THREE.AmbientLight(0xffffff,2.1));const light=new THREE.DirectionalLight(0xfff4dc,2.2);light.position.set(-4,6,5);scene.add(light);
const point=(lon,lat,r=2.014)=>{const a=THREE.MathUtils.degToRad(lon),b=THREE.MathUtils.degToRad(lat);return new THREE.Vector3(r*Math.cos(b)*Math.cos(a),r*Math.sin(b),-r*Math.cos(b)*Math.sin(a));};
const lines=[];for(const polygon of polygons(world.russia)){for(const ring of polygon){for(let i=1;i<ring.length;i++){if(Math.abs(ring[i][0]-ring[i-1][0])>180)continue;lines.push(...point(...ring[i-1]).toArray(),...point(...ring[i]).toArray());}}}
const outlineGeometry=new THREE.BufferGeometry();outlineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));const outline=new THREE.LineSegments(outlineGeometry,new THREE.LineBasicMaterial({color:0xf5e8c9,transparent:true,opacity:.95}));scene.add(outline);
const cities=[[37.6173,55.7558],[55.9587,54.7388],[61.4026,55.1644]].map(([lon,lat],i)=>{const pos=point(lon,lat,2.03);const mesh=new THREE.Mesh(new THREE.SphereGeometry(.014,12,8),new THREE.MeshBasicMaterial({color:0xf9e8c2}));mesh.position.copy(pos);scene.add(mesh);return{pos,mesh,label:stage.querySelector(`[data-city="${i}"]`)};});
const section=stage.closest('section'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let target=0,current=0,frame=0,visible=false,lastTime=performance.now();
function measure(){const r=stage.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height));camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();schedule();}
function progress(){const r=section.getBoundingClientRect();target=reduced.matches?1:THREE.MathUtils.clamp((innerHeight*.8-r.top)/(innerHeight*.7),0,1);schedule();}
function draw(){frame=0;if(!visible)return;const now=performance.now(),delta=Math.min(180,now-lastTime);lastTime=now;current=reduced.matches?1:THREE.MathUtils.lerp(current,target,1-Math.exp(-delta*.008));if(Math.abs(current-target)<.001)current=target;const t=current*current*(3-2*current);const lon=THREE.MathUtils.lerp(-5,84,t),lat=THREE.MathUtils.lerp(12,48,t),distance=THREE.MathUtils.lerp(9.5,7.2,t);camera.position.copy(point(lon,lat,distance));camera.lookAt(0,0,0);camera.updateMatrixWorld();outlineGeometry.setDrawRange(0,Math.floor(Math.max(0,(current-.18)/.82)*lines.length/6)*2);outline.material.opacity=.4+current*.6;
for(const {pos,mesh,label} of cities){const front=pos.clone().normalize().dot(camera.position.clone().normalize())>.35&&current>.55;mesh.visible=front;const p=pos.clone().project(camera);label.style.opacity=front?'1':'0';label.style.transform=`translate(${(p.x*.5+.5)*stage.clientWidth}px,${(-p.y*.5+.5)*stage.clientHeight}px)`;}
renderer.render(scene,camera);stage.dataset.progress=current.toFixed(3);if(current!==target)schedule();}
function schedule(){if(!frame&&visible)frame=requestAnimationFrame(draw);}
new ResizeObserver(measure).observe(stage);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){measure();progress();}else if(frame){cancelAnimationFrame(frame);frame=0;}},{rootMargin:'100px'}).observe(section);window.addEventListener('scroll',progress,{passive:true});window.addEventListener('resize',progress);reduced.addEventListener('change',progress);measure();
}catch(error){stage.dataset.fallback='true';stage.querySelectorAll('.lm-map-city').forEach(e=>e.hidden=true);fallback.hidden=false;}
}
