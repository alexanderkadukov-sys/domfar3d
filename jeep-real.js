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
 const scene=new T.Scene();scene.background=new T.Color(0x030506);scene.fog=new T.FogExp2(0x030506,.024);
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
 const floorMat=new T.MeshBasicMaterial({color:0x030506,toneMapped:false});
 const floor=new T.Mesh(new T.PlaneGeometry(100,100),floorMat);floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.receiveShadow=true;scene.add(floor);
 // A real distant surface catches the beams when the Jeep points away.
 const wallMat=new T.MeshStandardMaterial({color:0x010203,roughness:1,metalness:0,envMapIntensity:0});
 const wall=new T.Mesh(new T.CylinderGeometry(19,19,9,96,1,true),wallMat);wall.position.y=4.45;wall.material.side=T.BackSide;wall.receiveShadow=true;scene.add(wall);
 const vehicle=new T.Group();turntable.add(vehicle);
 const lights=new T.Group();vehicle.add(lights);
 function flareMap(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const g=x.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.08,'rgba(239,250,255,1)');g.addColorStop(.22,'rgba(185,225,255,.5)');g.addColorStop(.55,'rgba(136,200,255,.12)');g.addColorStop(1,'rgba(130,200,255,0)');x.fillStyle=g;x.fillRect(0,0,256,256);const s=x.createLinearGradient(0,0,256,0);s.addColorStop(0,'transparent');s.addColorStop(.5,'rgba(224,246,255,.85)');s.addColorStop(1,'transparent');x.fillStyle=s;x.fillRect(0,126,256,4);return new T.CanvasTexture(c);}
 const flareTexture=flareMap(),flares=[];
 const projector={angle:{value:0},lamps:{value:new T.Vector3(.8,1.5,2.7)}};
 function projectedSurface(material){
  material.onBeforeCompile=shader=>{
   shader.uniforms.beamAngle=projector.angle;shader.uniforms.beamLamps=projector.lamps;
   shader.vertexShader='varying vec3 beamWorld;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nbeamWorld=(modelMatrix*vec4(position,1.)).xyz;');
   shader.fragmentShader='varying vec3 beamWorld;uniform float beamAngle;uniform vec3 beamLamps;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
    float bc=cos(beamAngle),bs=sin(beamAngle);
    vec3 q=vec3(bc*beamWorld.x-bs*beamWorld.z,beamWorld.y,bs*beamWorld.x+bc*beamWorld.z);
    float d=q.z-beamLamps.z;
    float slope=(q.y-beamLamps.y)/max(d,.1);
    float cutoff=1.-smoothstep(-.015,-.011,slope);
    float below=smoothstep(-.21,-.075,slope);
    float width=max(d*.52,.12);
    float left=(q.x-beamLamps.x)/width;float right=(q.x+beamLamps.x)/width;
    float sides=exp(-pow(abs(left),6.))+exp(-pow(abs(right),6.));
    float reach=smoothstep(.1,1.,d)*(1.-smoothstep(32.,46.,d));
    totalEmissiveRadiance+=vec3(.73,.87,1.)*sides*cutoff*below*reach*3.5;`);
  };
 }
 projectedSurface(wallMat);wallMat.needsUpdate=true;
 function flatBeam(x,y,z){
  // A broad, shallow wedge with a flat upper edge, rather than a circular cone.
  const geo=new T.BufferGeometry();
  const near=[[-.09,0,0],[.09,0,0],[-.09,-.035,0],[.09,-.035,0]];
  const far=[[-10.2,-.32,24],[10.2,-.32,24],[-10.2,-4.1,24],[10.2,-4.1,24]];
  const vertices=near.concat(far).flat();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
  geo.setIndex([0,4,1,1,4,5,2,3,6,3,7,6,0,2,4,2,6,4,1,5,3,3,5,7]);
  geo.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,0,0,1,0,0,1,1,1,0,1,1,1],2));geo.computeVertexNormals();
  const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
   vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
   fragmentShader:'varying vec2 vUv;void main(){float side=sin(vUv.x*3.14159);float fade=pow(1.-vUv.y,1.5);gl_FragColor=vec4(.64,.82,1.,.022*side*fade);}' });
  const beam=new T.Mesh(geo,mat);beam.position.set(x,y,z);lights.add(beam);
 }
 function addHeadlamps(frontZ,y,width){
  lights.clear();flares.length=0;projector.lamps.value.set(width,y,frontZ);
  for(const x of [-width,width]){
   const lens=new T.Mesh(new T.CircleGeometry(.105,32),new T.MeshBasicMaterial({color:0xe4f5ff}));lens.position.set(x,y,frontZ);lights.add(lens);
   const f=new T.Sprite(new T.SpriteMaterial({map:flareTexture,transparent:true,opacity:.1,blending:T.AdditiveBlending,depthWrite:false}));f.position.set(x,y,frontZ+.01);lights.add(f);flares.push(f);
   flatBeam(x,y,frontZ+.02);
  }
 }
 const motion=matchMedia('(prefers-reduced-motion: reduce)');let paused=motion.matches,visible=true,loaded=false,angle=-.3,previous=performance.now(),lastDraw=0;
 function button(){toggle.textContent=paused?'Включить вращение':'Приостановить';toggle.setAttribute('aria-pressed',String(paused));}
 button();toggle.disabled=true;stage.dataset.modelState='loading';
 function render(){
  turntable.rotation.y=angle;projector.angle.value=angle;
  const align=new T.Vector3(Math.sin(angle),0,Math.cos(angle)).dot(new T.Vector3(camera.position.x,0,camera.position.z).normalize());
  const strength=Math.pow(Math.max(0,(align-.78)/.22),2.25);
  for(const f of flares){f.material.opacity=.04+strength*.98;const s=.45+strength*4.6;f.scale.set(s,s*.67,1);}
  stage.style.setProperty('--headlight-glow',(strength*.24).toFixed(3));stage.dataset.rotation=angle.toFixed(3);stage.dataset.headlightStrength=strength.toFixed(3);
  renderer.render(scene,camera);
 }
 function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);cameraSize();camera.aspect=w/h;camera.updateProjectionMatrix();render();}
 new ResizeObserver(resize).observe(host);
 const wallButton=stage.querySelector('.jeep-wall');wallButton.addEventListener('click',()=>{angle=Math.PI;paused=true;button();render();});
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
  addHeadlamps(lensBounds.max.z+.025,lensCenter.y,(lensBounds.max.x-lensBounds.min.x)*.43);loaded=true;toggle.disabled=false;stage.dataset.modelState='ready';stage.classList.add('jeep-ready');stage.querySelector('.jeep-fallback').setAttribute('aria-hidden','true');render();
 },undefined,()=>{stage.dataset.modelState='error';toggle.hidden=true;});
 function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-previous)/1000,.1);previous=now;if(!loaded||paused||!visible||document.hidden)return;angle=(angle+dt*Math.PI*2/40)%(Math.PI*2);if(now-lastDraw>1000/30){lastDraw=now;render();}}
 resize();requestAnimationFrame(frame);
})();
