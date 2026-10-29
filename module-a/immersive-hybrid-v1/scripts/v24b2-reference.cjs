const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../assets/combined-b-transition/references');fs.mkdirSync(dir,{recursive:true});
const shots=[['gate-interior-mid',.95],['gate-interior',1],['stage-turn',1.43],['corridor-advance',1.8],['mural-approach',2]];
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
const p=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:'reduce'});
await p.goto('http://127.0.0.1:4186/module-a/immersive-hybrid-v1/v24.html');await p.waitForFunction(()=>window.v24a?.ready&&hybrid.model.mural.status==='ready',null,{timeout:90000});
await p.addStyleTag({content:'#gallery > :not(.world), .v24a-label { visibility:hidden !important; }'});
// Reference is a blank real wall: never ask the generator to repaint the mural.
await p.evaluate(()=>{v24a.layer?.setMode('original');hybrid.model.mural.render=()=>{};});
const results=[];
for(const [name,t] of shots){const data=await p.evaluate(async t=>{const r=hybrid.model,pose=hybrid.sample(t);r.setCamera(pose,{immediate:true});await new Promise(q=>requestAnimationFrame(()=>requestAnimationFrame(q)));const handoff=r.handoff();
// Independent diagnostic render of the actual scene, camera and depth. RGB:
// red=plaster, green=upward stone, blue=wood, yellow=roof tile, black=other.
const T=await document.querySelector('#temple').contentWindow.eval("import('/module-a/immersive-hybrid-v1/vendor/three.module.js')"),scene=new T.Scene(),clone=r.root.clone(true),counts={};scene.add(clone);const colors={plaster:[1,0,0],stone:[0,1,0],paving:[0,1,0],wood:[0,0,1],roof:[1,1,0]};
const mats={};for(const [key,color] of Object.entries(colors))mats[key]=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{color:{value:new T.Color(...color)},stone:{value:key==='stone'||key==='paving'}},vertexShader:'varying vec3 normalWorld; void main(){normalWorld=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 color; uniform bool stone; varying vec3 normalWorld; void main(){gl_FragColor=vec4(stone&&normalWorld.y<.85?vec3(0.):color,1.);}'});mats.other=new T.MeshBasicMaterial({color:0,side:T.DoubleSide});
scene.traverse(o=>{if(!o.isMesh)return;const key=o.material?.userData?.textureKey??'other';counts[key]=(counts[key]??0)+1;o.material=mats[key]??mats.other;});scene.background=new T.Color(0);const diag=new T.WebGLRenderer({preserveDrawingBuffer:true,antialias:false});diag.setSize(1920,1080,false);diag.setPixelRatio(1);let regions;try{diag.render(scene,r.camera);regions=diag.domElement.toDataURL('image/png');}finally{diag.dispose();for(const m of Object.values(mats))m.dispose();}
return {pose,viewport:[1920,1080],projection:r.camera.projectionMatrix.toArray(),cameraMatrix:r.camera.matrixWorld.toArray(),muralCorners:r.mural.state().corners,modelSurfaces:handoff.surfaces,foregroundMask:r.captureMask(2.8),regions,regionMeshKeys:counts};},t);
for(const [key,suffix] of [['foregroundMask','foreground-depth-2.8'],['regions','regions']]){fs.writeFileSync(path.join(dir,`${name}-${suffix}.png`),Buffer.from(data[key].split(',')[1],'base64'));delete data[key];}await p.evaluate(()=>hybrid.model.renderFrame());await p.frameLocator('#temple').locator('canvas').screenshot({path:path.join(dir,`${name}.png`)});results.push({name,state:name==='gate-interior-mid'?'threshold → gate-interior':name==='corridor-advance'?'corridor-hybrid':name==='mural-approach'?'corridor-2_5d':name,...data});}
fs.writeFileSync(path.join(dir,'camera-manifest.json'),JSON.stringify({model:'Combined B / V2.4-B1',basis:'Running v24.html model; coordinates are design units, not survey measurements',results},null,2));console.log('Exported',results.length,'Combined B views');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
