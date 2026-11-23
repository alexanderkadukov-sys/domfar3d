/* Lada Niva by tiunov.se, CC BY 4.0. Red/black paint adapted from the supplied reference. */
(() => {
 'use strict';
 const stage=document.querySelector('#jeep-showcase');
 if(!stage||!window.THREE||!window.DOMFAR_GLTFLoader)return;
 const T=window.THREE,host=stage.querySelector('.jeep-canvas'),toggle=stage.querySelector('.jeep-toggle');
 let renderer;
 try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch(_){toggle.hidden=true;return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
 const scene=new T.Scene();scene.background=new T.Color(0x030506);scene.fog=new T.FogExp2(0x030506,.012);
 const camera=new T.PerspectiveCamera(32,1,.1,100);
 function cameraSize(){const f=host.clientWidth<600?1.24:1;camera.position.set(6.5*f,3.45*f,10.5*f);camera.lookAt(0,1.25,0);}
 cameraSize();
 scene.add(new T.HemisphereLight(0xa6bfce,0x030405,.38));
 function directional(color,power,x,y,z){const l=new T.DirectionalLight(color,power);l.position.set(x,y,z);scene.add(l);return l;}
 const key=directional(0xe4efff,2.1,-4,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.5,far:24});key.shadow.normalBias=.04;
 directional(0xdcecf5,2.2,5,5,-5);directional(0xd7e2c4,1.1,-5,2,-3);
 // Studio softboxes in a local reflection map make black paint read as metal.
 const reflectionScene=new T.Scene();reflectionScene.background=new T.Color(0x050608);
 function softbox(x,y,z,w,h,d,power){const o=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({color:new T.Color(power,power,power)}));o.position.set(x,y,z);reflectionScene.add(o);}
 softbox(-5,3,0,.1,5,10,3);softbox(5,4,1,.1,4,7,2);softbox(0,7,0,5,.1,9,2.8);softbox(0,2,-6,8,3,.1,1.5);
 const pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromScene(reflectionScene,.03);scene.environment=env.texture;pmrem.dispose();
 const turntable=new T.Group();scene.add(turntable);
 // Matte ground and a real relief wall: projector light and shadows reveal their depth.
 function concreteTexture(){
  const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d'),pixels=ctx.createImageData(256,256);let seed=273;
  for(let i=0;i<256*256;i++){seed=(Math.imul(seed,1664525)+1013904223)|0;const n=(seed>>>24)/255;const x=i%256,y=Math.floor(i/256);const v=154+n*38+5*Math.sin(x*.08)*Math.sin(y*.12);pixels.data[i*4]=v;pixels.data[i*4+1]=v;pixels.data[i*4+2]=v;pixels.data[i*4+3]=255;}
  ctx.putImageData(pixels,0,0);const texture=new T.CanvasTexture(c);texture.wrapS=texture.wrapT=T.RepeatWrapping;return texture;
 }
 const grain=concreteTexture();
 const floorMat=new T.MeshStandardMaterial({color:0x050708,roughness:.98,metalness:0,bumpMap:grain,bumpScale:.018,envMapIntensity:.015});
 const floor=new T.Mesh(new T.PlaneGeometry(70,70),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.receiveShadow=true;scene.add(floor);
 const wallMat=new T.MeshStandardMaterial({color:0x34383a,roughness:.97,metalness:0,map:grain,bumpMap:grain,bumpScale:.015,envMapIntensity:.015});
 const mortarMat=new T.MeshStandardMaterial({color:0x141a1d,roughness:1,envMapIntensity:0});
 const wall=new T.Mesh(new T.BoxGeometry(64,7.2,.3),mortarMat);wall.position.set(0,3.58,-11.1);wall.receiveShadow=true;scene.add(wall);
 const blocks=new T.InstancedMesh(new T.BoxGeometry(1.96,.62,1),wallMat,320),blockPose=new T.Object3D();
 for(let row=0,k=0;row<10;row++)for(let col=0;col<32;col++,k++){
  const depth=.12+((row*7+col*3)%5)*.027;
  blockPose.position.set((col-15.5)*2+(row%2)*.18,.33+row*.65,-10.94+depth*.5);blockPose.scale.set(1,1,depth);blockPose.updateMatrix();blocks.setMatrixAt(k,blockPose.matrix);
  const shade=.82+((row*13+col*11)%7)*.025;blocks.setColorAt(k,new T.Color(shade,shade,shade));
 }blocks.castShadow=true;blocks.receiveShadow=true;scene.add(blocks);
 const ribMat=new T.MeshStandardMaterial({color:0x414649,roughness:.94,map:grain,bumpMap:grain,bumpScale:.02,envMapIntensity:.015});
 for(const x of [-27,-22,-17,-12,-7,-2,3,8,13,18,23,28]){const rib=new T.Mesh(new T.BoxGeometry(.43,6.8,.74),ribMat);rib.position.set(x,3.38,-10.68);rib.castShadow=true;rib.receiveShadow=true;scene.add(rib);}
 const plinth=new T.Mesh(new T.BoxGeometry(64,.18,.52),ribMat);plinth.position.set(0,.07,-10.72);plinth.castShadow=true;plinth.receiveShadow=true;scene.add(plinth);
 const vehicle=new T.Group();turntable.add(vehicle);
 const lights=new T.Group();vehicle.add(lights);
 function flareMap(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const g=x.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.08,'rgba(239,250,255,1)');g.addColorStop(.22,'rgba(185,225,255,.5)');g.addColorStop(.55,'rgba(136,200,255,.12)');g.addColorStop(1,'rgba(130,200,255,0)');x.fillStyle=g;x.fillRect(0,0,256,256);const s=x.createLinearGradient(0,0,256,0);s.addColorStop(0,'transparent');s.addColorStop(.5,'rgba(224,246,255,.85)');s.addColorStop(1,'transparent');x.fillStyle=s;x.fillRect(0,126,256,4);return new T.CanvasTexture(c);}
 const flareTexture=flareMap(),flares=[];
 const projector={angle:{value:0},lamps:{value:new T.Vector3(.8,1.5,2.7)}};
 // A dipped-beam cookie: flat cutoff, a small right-hand step, two overlapping hotspots
 // and a broad, weaker skirt below. Actual spotlights project it onto each surface.
 function dippedBeamMap(){
  const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d'),p=ctx.createImageData(512,512);
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
   const u=(x+.5)/256-1,v=(y+.5)/256-1;
   const step=Math.max(0,Math.min(1,(u+.06)/.14));const down=v-(-.008-.025*step);
   const cut=Math.max(0,Math.min(1,(down+.004)/.009));
   const hot=Math.exp(-Math.pow(u/.27,2)-Math.pow((down-.055)/.15,2));
   const skirt=Math.exp(-Math.pow(u/.71,4))*Math.exp(-Math.max(down,0)/.31);
   const value=Math.min(1,cut*(.79*hot+.27*skirt));const i=(y*512+x)*4;
   p.data[i]=p.data[i+1]=p.data[i+2]=Math.round(value*255);p.data[i+3]=255;
  }
  ctx.putImageData(p,0,0);return new T.CanvasTexture(c);
 }
 const dippedCookie=dippedBeamMap();
 function addHeadlamps(frontZ,y,width){
  lights.clear();flares.length=0;projector.lamps.value.set(width,y,frontZ);
  for(const x of [-width,width]){
   const lens=new T.Mesh(new T.CircleGeometry(.105,32),new T.MeshBasicMaterial({color:0xe4f5ff}));lens.position.set(x,y,frontZ);lights.add(lens);
   const f=new T.Sprite(new T.SpriteMaterial({map:flareTexture,transparent:true,opacity:.1,blending:T.AdditiveBlending,depthWrite:false}));f.position.set(x,y,frontZ+.01);lights.add(f);flares.push(f);
   const lamp=new T.SpotLight(0xfff5e4,4200,46,.56,.12,2);lamp.position.set(x,y,frontZ+.07);lamp.target.position.set(x,y-.16,frontZ+20);lamp.map=dippedCookie;
   lamp.castShadow=true;lamp.shadow.mapSize.set(host.clientWidth<600?512:1024,host.clientWidth<600?512:1024);lamp.shadow.bias=-.00006;lamp.shadow.normalBias=.012;lamp.shadow.camera.near=.12;lamp.shadow.camera.far=46;
   lights.add(lamp,lamp.target);
  }
 }
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let paused=motion.matches,visible=true,loaded=false,angle=-.3,previous=performance.now(),lastDraw=0;
 function button(){toggle.textContent=paused?'Включить вращение':'Приостановить';toggle.setAttribute('aria-pressed',String(paused));}
 button();toggle.disabled=true;stage.dataset.modelState='loading';
 function render(){
  turntable.rotation.y=angle;projector.angle.value=angle;
  const align=new T.Vector3(Math.sin(angle),0,Math.cos(angle)).dot(new T.Vector3(camera.position.x,0,camera.position.z).normalize());
  const strength=Math.pow(Math.max(0,(align-.78)/.22),2.25);
  for(const f of flares){f.material.opacity=.035+strength*.8;const s=.35+strength*2.9;f.scale.set(s,s*.67,1);}
  stage.style.setProperty('--headlight-glow',(strength*.24).toFixed(3));stage.dataset.rotation=angle.toFixed(3);stage.dataset.headlightStrength=strength.toFixed(3);
  renderer.render(scene,camera);
 }
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);cameraSize();camera.aspect=w/h;camera.updateProjectionMatrix();render();}
 new ResizeObserver(resize).observe(host);
 const wallButton=stage.querySelector('.jeep-wall');wallButton.addEventListener('click',()=>{angle=Math.PI+.28;paused=true;button();render();});
 toggle.addEventListener('click',()=>{paused=!paused;button();render();});motion.addEventListener('change',e=>{paused=e.matches;button();});
 new IntersectionObserver(e=>{visible=e[0].isIntersecting;}).observe(stage);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;stage.classList.remove('jeep-ready');toggle.hidden=true;});
 new window.DOMFAR_GLTFLoader().setMeshoptDecoder(window.DOMFAR_MeshoptDecoder).load('assets/niva/niva.glb',gltf=>{
  const model=new T.Group();model.add(gltf.scene);model.rotation.y=Math.PI;
  gltf.scene.traverse(o=>{if(o.name==='wheel'||/^wheel_[0-9]+$/.test(o.name)){o.scale.multiplyScalar(1.06);}});
  let bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());model.scale.setScalar(5.8/Math.max(size.x,size.z));
  bounds=new T.Box3().setFromObject(model);const center=bounds.getCenter(new T.Vector3());model.position.set(-center.x,.16-bounds.min.y,-center.z);
  model.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
   o.material=o.material.clone();const m=o.material;m.envMapIntensity=.9;
   if(m.name==='kuzov'){
    m.color.set(0x111519);m.roughness=.27;m.metalness=.5;
    const hood=/Capot/i.test(o.name);
    m.onBeforeCompile=shader=>{
     shader.uniforms.paintAngle=projector.angle;
     shader.vertexShader='varying vec3 paintWorld;\n'+shader.vertexShader;
     shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npaintWorld=(modelMatrix*vec4(position,1.)).xyz;');
     shader.fragmentShader='varying vec3 paintWorld;uniform float paintAngle;\n'+shader.fragmentShader;
     shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float pc=cos(paintAngle),ps=sin(paintAngle);
      vec3 paintP=vec3(pc*paintWorld.x-ps*paintWorld.z,paintWorld.y,ps*paintWorld.x+pc*paintWorld.z);
      float band=step(.57,paintP.y)*(1.-step(1.51,paintP.y));
      float hoodStripe=1.-step(.24,abs(paintP.x));
      float rearPillar=step(2.1,-paintP.z)*step(1.4,paintP.y);
      float paintMask=${hood?'hoodStripe':'max(band,rearPillar)'};
      diffuseColor.rgb=mix(vec3(.008,.012,.016),vec3(.52,.012,.017),paintMask);`);
    };m.customProgramCacheKey=()=>hood?'niva-hood-red-stripe':'niva-two-tone-red-black';
   }else if(/steklo|stecloton/i.test(m.name)){m.color.set(0x0b141c);m.roughness=.15;m.metalness=.35;m.opacity=.92;}
   else if(m.name==='disk'){m.color.set(0x131619);m.metalness=.7;m.roughness=.31;}
   else if(m.name==='plast'){m.color.set(0x14181c);m.metalness=.1;m.roughness=.78;}
   if(m.emissive){m.emissiveIntensity=/material_12/.test(m.name)?.08:.65;}
  });
  vehicle.add(model);model.updateMatrixWorld(true);
  // Reference-inspired off-road trim: large treaded tyres, dark multi-spoke rims and roof rails.
  const vehicleInverse=vehicle.matrixWorld.clone().invert();
  const wheelCenters=[];model.traverse(o=>{if(o.isMesh&&/^wheel_plast_0/.test(o.name)){wheelCenters.push(new T.Box3().setFromObject(o).getCenter(new T.Vector3()).applyMatrix4(vehicleInverse));}});
  const rubber=new T.MeshStandardMaterial({color:0x16191b,roughness:.94,metalness:.01});
  const alloy=new T.MeshStandardMaterial({color:0x171d23,roughness:.38,metalness:.78});
  const hardware=new T.MeshStandardMaterial({color:0x6c7379,roughness:.32,metalness:.92});
  model.traverse(o=>{if(o.isMesh&&/^wheel_/.test(o.name))o.visible=false;});
  for(const pos of wheelCenters){
   const wheel=new T.Group();wheel.position.copy(pos);wheel.position.y=.665;wheel.rotation.y=Math.PI/2;vehicle.add(wheel);
   const tyre=new T.Mesh(new T.TorusGeometry(.48,.15,16,72),rubber);tyre.castShadow=true;wheel.add(tyre);
   const treads=new T.InstancedMesh(new T.BoxGeometry(.105,.055,.11),rubber,144);
   const dummy=new T.Object3D();let index=0;
   for(let row=-1;row<=1;row++)for(let k=0;k<48;k++){
    const a=(k+(row===0?.5:0))*Math.PI/24;const r=row===0?.637:.605;
    dummy.position.set(Math.sin(a)*r,Math.cos(a)*r,row*.102);dummy.rotation.set(0,0,-a+(row*.10));dummy.updateMatrix();treads.setMatrixAt(index++,dummy.matrix);
   }treads.castShadow=true;wheel.add(treads);
   for(const face of [-1,1]){
    const ring=new T.Mesh(new T.TorusGeometry(.345,.026,8,64),alloy);ring.position.z=face*.154;wheel.add(ring);
    const side=new T.Mesh(new T.TorusGeometry(.47,.008,6,64),rubber);side.position.z=face*.148;wheel.add(side);
    const spokes=new T.InstancedMesh(new T.BoxGeometry(.041,.26,.045),alloy,10);
    for(let k=0;k<10;k++){const a=k*Math.PI/5;dummy.position.set(Math.sin(a)*.203,Math.cos(a)*.203,face*.14);dummy.rotation.set(0,0,-a);dummy.updateMatrix();spokes.setMatrixAt(k,dummy.matrix);}wheel.add(spokes);
    const hub=new T.Mesh(new T.CylinderGeometry(.09,.09,.12,24),alloy);hub.rotation.x=Math.PI/2;hub.position.z=face*.14;wheel.add(hub);
    const nuts=new T.InstancedMesh(new T.SphereGeometry(.012,6,6),hardware,5);
    for(let k=0;k<5;k++){const a=k*Math.PI*2/5;dummy.position.set(Math.sin(a)*.067,Math.cos(a)*.067,face*.208);dummy.rotation.set(0,0,0);dummy.updateMatrix();nuts.setMatrixAt(k,dummy.matrix);}wheel.add(nuts);
   }
  }
  function trimTube(points,radius=.035){const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));const tube=new T.Mesh(new T.TubeGeometry(curve,32,radius,8,false),alloy);tube.castShadow=true;vehicle.add(tube);}
  const roofY=new T.Box3().setFromObject(model).max.y;
  for(const x of [-.91,.91])trimTube([[x,roofY-.02,-1.64],[x,roofY+.10,-1.45],[x,roofY+.10,.48],[x,roofY-.02,.67]]);
  for(const z of [-1.1,.15]){const cross=new T.Mesh(new T.BoxGeometry(1.82,.045,.08),alloy);cross.position.set(0,roofY+.10,z);vehicle.add(cross);}
  trimTube([[-.69,.73,3.04],[-.60,.91,3.12],[-.48,1.23,3.10],[.48,1.23,3.10],[.60,.91,3.12],[.69,.73,3.04]],.05);
  trimTube([[-.59,.83,3.10],[.59,.83,3.10]],.04);

  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sx=shadowCanvas.getContext('2d');const gradient=sx.createRadialGradient(64,64,15,64,64,64);gradient.addColorStop(0,'rgba(0,0,0,.86)');gradient.addColorStop(1,'rgba(0,0,0,0)');sx.fillStyle=gradient;sx.fillRect(0,0,128,128);
  const contactShadow=new T.Mesh(new T.PlaneGeometry(3.4,5.4),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));contactShadow.rotation.x=-Math.PI/2;contactShadow.position.y=.019;vehicle.add(contactShadow);
  model.updateMatrixWorld(true);
  const lensBounds=new T.Box3();model.traverse(o=>{if(o.isMesh&&/Kuzov_f1/.test(o.name)){o.geometry.computeBoundingBox();lensBounds.union(o.geometry.boundingBox.clone().applyMatrix4(vehicleInverse.clone().multiply(o.matrixWorld)));}});
  const lensCenter=lensBounds.getCenter(new T.Vector3());
  addHeadlamps(lensBounds.max.z+.09,lensCenter.y,(lensBounds.max.x-lensBounds.min.x)*.43);loaded=true;toggle.disabled=false;stage.dataset.modelState='ready';stage.classList.add('jeep-ready');stage.querySelector('.jeep-fallback').setAttribute('aria-hidden','true');render();
 },undefined,()=>{stage.dataset.modelState='error';toggle.hidden=true;});
 function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-previous)/1000,.1);previous=now;if(!loaded||paused||!visible||document.hidden)return;angle=(angle+dt*Math.PI*2/40)%(Math.PI*2);if(now-lastDraw>1000/30){lastDraw=now;render();}}
 resize();requestAnimationFrame(frame);
})();
