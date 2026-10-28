import * as THREE from './vendor/three.module.js';
import {timing} from './config.js';
const canvas=document.querySelector('#space');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let energy=0,clock=0,standby=0,last=performance.now(),aspect=innerWidth/innerHeight;
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-aspect,aspect,1,-1,.1,20);camera.position.z=10;
const cols=14,rows=10,nodes=[],cells=[],edges=[];
for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)nodes.push({x:x/(cols-1)*2-1,y:y/(rows-1)*2-1,phase:Math.random()*Math.PI*2,offsetX:0,offsetY:0,targetX:0,targetY:0});
for(let y=0;y<rows-1;y++)for(let x=0;x<cols-1;x++)cells.push({a:y*cols+x,b:y*cols+x+1,c:(y+1)*cols+x,d:(y+1)*cols+x+1,flip:Math.random()>.5,hue:.40+Math.random()*.19,light:.15+Math.random()*.09});
for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*cols+x;if(x<cols-1)edges.push([a,a+1]);if(y<rows-1)edges.push([a,a+cols]);}
const pointPositions=new Float32Array(nodes.length*3),linePositions=new Float32Array((edges.length+cells.length)*6),facePositions=new Float32Array(cells.length*18),faceColors=new Float32Array(facePositions.length);
const pointsGeometry=new THREE.BufferGeometry();pointsGeometry.setAttribute('position',new THREE.BufferAttribute(pointPositions,3).setUsage(THREE.DynamicDrawUsage));
const linesGeometry=new THREE.BufferGeometry();linesGeometry.setAttribute('position',new THREE.BufferAttribute(linePositions,3).setUsage(THREE.DynamicDrawUsage));
const facesGeometry=new THREE.BufferGeometry();facesGeometry.setAttribute('position',new THREE.BufferAttribute(facePositions,3).setUsage(THREE.DynamicDrawUsage));facesGeometry.setAttribute('color',new THREE.BufferAttribute(faceColors,3).setUsage(THREE.DynamicDrawUsage));
const pointMaterial=new THREE.PointsMaterial({color:0x91c5b0,size:2.5,sizeAttenuation:false,transparent:true,opacity:.34,depthWrite:false});
const lineMaterial=new THREE.LineBasicMaterial({color:0x679b99,transparent:true,opacity:.12,depthWrite:false});
const faceMaterial=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false});
const faces=new THREE.Mesh(facesGeometry,faceMaterial),lines=new THREE.LineSegments(linesGeometry,lineMaterial),points=new THREE.Points(pointsGeometry,pointMaterial);
// Bounds change with viewport and vertex updates; this tiny full-screen field is always visible.
faces.frustumCulled=lines.frustumCulled=points.frustumCulled=false;
scene.add(faces,lines,points);const color=new THREE.Color();
export function pulse(strength=1){if(reduced.matches)return;energy=Math.max(energy,strength);nodes.forEach(n=>{n.targetX=(Math.random()-.5)*.15;n.targetY=(Math.random()-.5)*.16;});cells.forEach(c=>{if(Math.random()<.4)c.flip=!c.flip;c.hue=.4+Math.random()*.19;});}
function draw(dt){
 const decay=Math.exp(-dt*2.3);energy*=decay;standby+=dt;
 // Cosine easing varies idle speed smoothly from 110% to 200%.
 const speed=1.1+.9*(1-Math.cos(standby/timing.standbyCycle*Math.PI*2))/2;
 clock+=dt*(.17*speed+energy*1.8);const follow=1-Math.exp(-dt*(1.5+energy*3));
 nodes.forEach((n,i)=>{n.offsetX+=(n.targetX-n.offsetX)*follow;n.offsetY+=(n.targetY-n.offsetY)*follow;pointPositions[i*3]=(n.x*1.18+Math.sin(clock*.7+n.phase)*.055+n.offsetX)*aspect;pointPositions[i*3+1]=n.y*1.18+Math.cos(clock*.6+n.phase)*.065+n.offsetY;pointPositions[i*3+2]=0;});
 let l=0,f=0;const addEdge=(a,b)=>{for(const i of [a,b]){linePositions[l++]=pointPositions[i*3];linePositions[l++]=pointPositions[i*3+1];linePositions[l++]=.01;}};
 edges.forEach(([a,b])=>addEdge(a,b));
 cells.forEach(c=>{addEdge(c.flip?c.a:c.b,c.flip?c.d:c.c);color.setHSL(c.hue,.25,c.light+energy*.055);const indices=c.flip?[c.a,c.b,c.d,c.a,c.d,c.c]:[c.a,c.b,c.c,c.b,c.d,c.c];for(const i of indices){facePositions[f]=pointPositions[i*3];faceColors[f++]=color.r;facePositions[f]=pointPositions[i*3+1];faceColors[f++]=color.g;facePositions[f]=-.01;faceColors[f++]=color.b;}});
 pointsGeometry.attributes.position.needsUpdate=true;linesGeometry.attributes.position.needsUpdate=true;facesGeometry.attributes.position.needsUpdate=true;facesGeometry.attributes.color.needsUpdate=true;
 lineMaterial.opacity=.085+energy*.16;pointMaterial.opacity=.22+energy*.3;faceMaterial.opacity=.12+energy*.2;renderer.render(scene,camera);
}
function resize(){aspect=innerWidth/innerHeight;renderer.setSize(innerWidth,innerHeight);camera.left=-aspect;camera.right=aspect;camera.updateProjectionMatrix();draw(0);}
window.addEventListener('resize',resize);resize();
function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;if(!document.hidden&&!reduced.matches)draw(dt);requestAnimationFrame(frame);}
requestAnimationFrame(frame);reduced.addEventListener('change',()=>{energy=0;draw(0);});
