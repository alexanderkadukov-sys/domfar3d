/* DomFar3D showroom. Three.js r160, bundled locally; no network requests. */
(() => {
  'use strict';
  const stage = document.querySelector('#jeep-showcase');
  if (!stage) return;
  const host = stage.querySelector('.jeep-canvas');
  const toggle = stage.querySelector('.jeep-toggle');
  const fallback = stage.querySelector('.jeep-fallback');
  if (!window.THREE) return;
  const T = window.THREE;
  let renderer;
  try {
    renderer = new T.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'low-power'});
  } catch (_) { toggle.hidden = true; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x080c0b, .021);
  const camera = new T.PerspectiveCamera(32, 1, .1, 80);
  camera.position.set(7.4, 4.5, 10);
  camera.lookAt(0, 1.05, 0);
  scene.add(new T.HemisphereLight(0xc1d9e3, 0x192518, 2.2));
  const key = new T.DirectionalLight(0xffffff, 4);
  key.position.set(-3, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, {left: -5, right: 5, top: 5, bottom: -5, near: .5, far: 20});
  key.shadow.normalBias = .035;
  scene.add(key);
  const rim = new T.DirectionalLight(0xb8d8ef, 3.5);
  rim.position.set(4, 4, -5); scene.add(rim);
  const warm = new T.DirectionalLight(0xe8edc8, 1.6);
  warm.position.set(-6, 2, -1); scene.add(warm);
  const body = new T.MeshPhysicalMaterial({color: 0x141918, metalness: .65, roughness: .28, clearcoat: 1, clearcoatRoughness: .18});
  const trim = new T.MeshStandardMaterial({color: 0x080b0c, roughness: .62, metalness: .32});
  const rubber = new T.MeshStandardMaterial({color: 0x090b0d, roughness: .94});
  const glass = new T.MeshPhysicalMaterial({color: 0x233e49, metalness: .7, roughness: .12, clearcoat: 1});
  const steel = new T.MeshStandardMaterial({color: 0x879092, metalness: .9, roughness: .28});
  const darkSteel = new T.MeshStandardMaterial({color: 0x323a3c, metalness: .8, roughness: .4});
  const lamp = new T.MeshBasicMaterial({color: 0xe8f7ff});
  const amber = new T.MeshBasicMaterial({color: 0xffaa37});
  const red = new T.MeshStandardMaterial({color: 0x631414, emissive: 0x9d1009, emissiveIntensity: .7, roughness: .3});
  function mesh(geometry, material, parent, x=0, y=0, z=0) {
    const m = new T.Mesh(geometry, material); m.position.set(x,y,z);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(w,h,d,material,parent,x,y,z) {return mesh(new T.BoxGeometry(w,h,d),material,parent,x,y,z);}
  function rounded(w,h,d,material,parent,x,y,z,r=.06) {
    const s = new T.Shape();
    s.moveTo(-w/2+r,-h/2); s.lineTo(w/2-r,-h/2); s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
    s.lineTo(w/2,h/2-r); s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);
    s.lineTo(-w/2+r,h/2); s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);
    s.lineTo(-w/2,-h/2+r); s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
    const g = new T.ExtrudeGeometry(s,{depth: d-2*r, bevelEnabled:true, bevelSegments:2, steps:1, bevelSize:r, bevelThickness:r, curveSegments:4});
    g.translate(0,0,-(d-2*r)/2);
    return mesh(g,material,parent,x,y,z);
  }
  const table = new T.Group(); scene.add(table);
  const platform = mesh(new T.CylinderGeometry(3.55,3.7,.25,96),new T.MeshStandardMaterial({color:0x1b211f,metalness:.8,roughness:.4}),table,0,.12,0);
  platform.receiveShadow = true;
  const rimRing = mesh(new T.TorusGeometry(3.58,.018,8,96),new T.MeshBasicMaterial({color:0xc5eb3e}),table,0,.235,0);
  rimRing.rotation.x = Math.PI/2;
  const lowerRing = mesh(new T.TorusGeometry(3.65,.025,8,96),new T.MeshBasicMaterial({color:0x51651d}),table,0,.045,0);
  lowerRing.rotation.x = Math.PI/2;
  for(let i=0;i<36;i++) {
    const a=i*Math.PI/18;
    const mark=box(.018,.004,.16,darkSteel,table,Math.sin(a)*3.32,.251,Math.cos(a)*3.32);
    mark.rotation.y=a;
  }
  const floor = mesh(new T.PlaneGeometry(100,100),new T.MeshStandardMaterial({color:0x010201,metalness:.2,roughness:.9}),scene,0,-.025,0);
  floor.rotation.x=-Math.PI/2; floor.castShadow=false;
  const car = new T.Group(); table.add(car);
  // Upright black 4x4: exposed wheel arches, seven-slot grille, round Bi-LED lamps.
  rounded(2.08,.59,4.25,body,car,0,1.18,0);
  box(1.8,.20,4.4,trim,car,0,.82,0);
  rounded(1.96,1.23,2.52,body,car,0,1.99,-.57);
  rounded(2.06,.15,2.64,trim,car,0,2.68,-.57,.04);
  rounded(2.02,.22,1.55,body,car,0,1.55,1.35,.045);
  // Windshield, rear window and divided side windows.
  box(1.76,.75,.035,glass,car,0,2.11,.708);
  box(.035,.79,.055,trim,car,0,2.11,.738);
  box(1.72,.69,.035,glass,car,0,2.12,-1.855);
  for(const side of [-1,1]) {
    for(const z of [-1.22,-.01]) {
      rounded(.035,.7,1.03,glass,car,side*1.058,2.13,z,.012);
      box(.027,.035,1.04,steel,car,side*1.079,1.76,z);
      box(.03,.42,.018,trim,car,side*1.045,1.43,z+.52);
      rounded(.05,.055,.23,darkSteel,car,side*1.044,1.62,z+.31,.012);
    }
    box(.09,.1,2.28,trim,car,side*1.13,.87,-.2);
    box(.13,.07,.2,darkSteel,car,side*1.05,2.0,.63);
    rounded(.22,.28,.18,body,car,side*1.19,2.05,.66,.04);
    box(.17,.21,.012,glass,car,side*1.19,2.05,.76);
    for(const z of [-1.55,1.53]) {
      // Wide, squared fenders and visible rugged tyres.
      rounded(.34,.18,1.48,trim,car,side*1.06,1.43,z,.05);
      const wheel = new T.Group(); wheel.position.set(side*1.12,.88,z);car.add(wheel);
      const tyre = mesh(new T.TorusGeometry(.43,.19,12,36),rubber,wheel); tyre.rotation.y=Math.PI/2;
      const rimMesh = mesh(new T.CylinderGeometry(.34,.34,.35,24),darkSteel,wheel,side*.05,0,0);rimMesh.rotation.z=Math.PI/2;
      const hub = mesh(new T.CylinderGeometry(.12,.12,.39,16),steel,wheel,side*.06,0,0);hub.rotation.z=Math.PI/2;
      for(let i=0;i<8;i++) {
        const a=i*Math.PI/4;
        const spoke=box(.025,.065,.53,steel,wheel,side*.245,0,0);spoke.rotation.x=a;
      }
      for(let i=0;i<24;i++) {
        const a=i*Math.PI/12;
        const tread=box(.39,.065,.14,rubber,wheel,0,Math.cos(a)*.59,Math.sin(a)*.59);
        tread.rotation.x=a;
      }
    }
    // Roof rails.
    box(.055,.075,2.18,darkSteel,car,side*.72,2.79,-.56);
    for(const z of [-1.45,.35])box(.055,.10,.055,darkSteel,car,side*.72,2.72,z);
    box(.26,.16,.055,red,car,side*.72,1.29,-2.18);
  }
  box(2.02,.65,.13,body,car,0,1.2,2.15);
  box(1.23,.52,.025,trim,car,0,1.22,2.23);
  for(let i=0;i<7;i++)rounded(.065,.43,.022,darkSteel,car,(i-3)*.155,1.22,2.253,.018);
  rounded(2.3,.20,.30,trim,car,0,.87,2.27,.05);
  rounded(2.22,.17,.24,trim,car,0,.85,-2.22,.04);
  box(.55,.13,.018,darkSteel,car,0,.98,2.44);
  for(const x of [-.91,.91])box(.18,.09,.03,amber,car,x,1.01,2.24);
  // Spare wheel on the rear door.
  mesh(new T.TorusGeometry(.40,.17,12,36),rubber,car,0,1.63,-2.37);
  const spare = mesh(new T.CylinderGeometry(.34,.34,.30,24),darkSteel,car,0,1.63,-2.42); spare.rotation.x=Math.PI/2;
  // Soft camera-facing lens flares; brightness follows the actual headlamp direction.
  function flareTexture() {
    const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
    const g=ctx.createRadialGradient(128,128,0,128,128,128);
    g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.08,'rgba(235,249,255,.95)');g.addColorStop(.22,'rgba(188,227,255,.38)');g.addColorStop(.5,'rgba(133,199,242,.10)');g.addColorStop(1,'rgba(105,181,230,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
    const streak=ctx.createLinearGradient(0,0,256,0);streak.addColorStop(0,'transparent');streak.addColorStop(.5,'rgba(215,241,255,.6)');streak.addColorStop(1,'transparent');ctx.fillStyle=streak;ctx.fillRect(0,126,256,4);
    return new T.CanvasTexture(c);
  }
  const flareMap=flareTexture();const flares=[];const beams=[];
  for(const x of [-.79,.79]) {
    const surround=mesh(new T.CylinderGeometry(.25,.25,.11,40),trim,car,x,1.36,2.23);surround.rotation.x=Math.PI/2;
    const lens=mesh(new T.CylinderGeometry(.178,.178,.018,40),lamp,car,x,1.36,2.302);lens.rotation.x=Math.PI/2;
    const halo=mesh(new T.TorusGeometry(.197,.021,10,40),lamp,car,x,1.36,2.32);halo.castShadow=false;
    const flare=new T.Sprite(new T.SpriteMaterial({map:flareMap,blending:T.AdditiveBlending,transparent:true,opacity:.15,depthWrite:false}));
    flare.position.set(x,1.36,2.35);flare.scale.set(1.2,1.2,1);car.add(flare);flares.push(flare);
    const beam=mesh(new T.ConeGeometry(.9,5.4,40,1,true),new T.MeshBasicMaterial({color:0xc5eaff,transparent:true,opacity:.025,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),car,x,.90,4.95);
    beam.rotation.x=-Math.PI/2-.13;beam.castShadow=false;beam.receiveShadow=false;beams.push(beam);
    const light=new T.SpotLight(0xe7f3ff,14,13,.22,.7,1.2);light.position.set(x,1.36,2.36);
    light.target.position.set(x,.1,10);car.add(light,light.target);
  }
  // A compact studio reflection on the floor under the turntable.
  const groundGlow=mesh(new T.CircleGeometry(3.74,96),new T.MeshBasicMaterial({color:0xaac333,transparent:true,opacity:.035,depthWrite:false}),scene,0,-.015,0);groundGlow.rotation.x=-Math.PI/2;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=reduced.matches;let visible=true;let angle=-.28;
  function updateToggle(){toggle.textContent=paused?'Включить вращение':'Приостановить';toggle.setAttribute('aria-pressed',String(paused));}
  updateToggle();
  function draw() {
    table.rotation.y=angle;
    const facing=new T.Vector3(Math.sin(angle),0,Math.cos(angle));
    const viewer=new T.Vector3(camera.position.x,0,camera.position.z).normalize();
    const alignment=facing.dot(viewer);
    const strength=Math.pow(Math.max(0,(alignment-.78)/.22),2.3);
    flares.forEach(f=>{f.material.opacity=.045+strength*.95;const s=.65+strength*3.6;f.scale.set(s,s*.72,1);});
    beams.forEach(b=>{b.material.opacity=.005+strength*.025;});
    stage.style.setProperty('--headlight-glow',(strength*.19).toFixed(4));
    stage.dataset.headlightStrength=strength.toFixed(3);
    stage.dataset.rotation=angle.toFixed(3);
    renderer.render(scene,camera);
  }
  function resize(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw();}
  new ResizeObserver(resize).observe(host);
  toggle.addEventListener('click',()=>{paused=!paused;updateToggle();draw();});
  reduced.addEventListener('change',e=>{paused=e.matches;updateToggle();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:0}).observe(stage);
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();paused=true;stage.classList.remove('jeep-ready');toggle.hidden=true;});
  // Advance time independently of the 30 fps draw limit.
  let previous=performance.now();let drawAt=0;
  function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-previous)/1000,.1);previous=now;if(paused||!visible||document.hidden)return;angle=(angle+dt*Math.PI*2/36)%(Math.PI*2);if(now-drawAt>=1000/30){drawAt=now;draw();}}
  resize();stage.classList.add('jeep-ready');fallback.setAttribute('aria-hidden','true');
  requestAnimationFrame(animate);
})();
