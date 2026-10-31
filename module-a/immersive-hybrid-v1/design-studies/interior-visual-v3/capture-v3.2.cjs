// Historical capture/reference only: retired v32/v33/v34 HTML must first be restored from pre-repository-cleanup-v2-2026-10-31. Current coverage: browser-v3.5 + integration-v3.5 + edge-v3.5.
// Offline reference export only; the prototype keeps its existing renderer.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'assets/route-v3.2/references');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:4186/module-a/immersive-hybrid-v1/design-studies/interior-visual-v3/');
 await page.waitForFunction(()=>window.study?.ready&&!study.busy,null,{timeout:90000});
 const existing=fs.existsSync(path.join(out,'camera-manifest.json'))?JSON.parse(fs.readFileSync(path.join(out,'camera-manifest.json'))):null;
 const result=await page.evaluate(async(existing)=>{
  const {createRail,REFERENCE_STOPS}=await import('./route-v3.2.mjs'),r=study.runtime.model;
  const rail=createRail(study.runtime.sample(2)),hits=rail.validate(r);if(hits.length)throw Error('Curve collision '+JSON.stringify(hits.slice(0,3)));
  study.layer.setMode('original');document.querySelector('#space').contentWindow.v24a.layer.setMode('original');
  study.finish.setEnabled(true);
  const T=await document.querySelector('#space').contentWindow.document.querySelector('#temple').contentWindow.eval("import('/module-a/immersive-hybrid-v1/vendor/three.module.js')");
  let scene=r.root;while(scene.parent)scene=scene.parent;
  const renderer=new T.WebGLRenderer({antialias:false,preserveDrawingBuffer:true});renderer.setSize(1280,720);renderer.outputColorSpace=T.LinearSRGBColorSpace;renderer.toneMapping=T.NoToneMapping;
  const material=new T.ShaderMaterial({side:T.DoubleSide,vertexShader:'varying vec3 w;varying vec3 n;void main(){w=(modelMatrix*vec4(position,1.)).xyz;n=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 w;varying vec3 n;void main(){vec3 c=vec3(0.);if(w.x>4.4&&n.x<-.9)c.r=1.;if(n.y>.9&&w.y>.20&&w.y<.80)c.g=1.;if(w.y>2.6&&w.y<4.2&&n.y<-.8)c.b=1.;gl_FragColor=vec4(c,1.);}`});
  const items=[];
  for(const stop of REFERENCE_STOPS){
   if(existing&&stop.name!=='second-dock'){items.push(existing.items.find(x=>x.name===stop.name));continue;}
   const pose=rail.sample(stop.progress);r.setCamera(pose,{immediate:true});
   const data=r.handoff(),canvas=document.querySelector('#space').contentWindow.document.querySelector('#temple').contentWindow.document.querySelector('canvas');
   r.renderFrame();const model=canvas.toDataURL('image/png');
   const old=scene.overrideMaterial,bg=scene.background;scene.overrideMaterial=material;scene.background=new T.Color(0);renderer.render(scene,r.camera);const regions=renderer.domElement.toDataURL('image/png');scene.overrideMaterial=old;scene.background=bg;
   const depth=r.captureDepth(40);const bytes=new Uint8Array(new Float32Array(depth.depth).buffer);let binary='';for(let j=0;j<bytes.length;j+=32768)binary+=String.fromCharCode(...bytes.subarray(j,j+32768));delete depth.depth;
   items.push({...stop,pose,projection:data.camera.projectionMatrix,cameraMatrix:data.camera.matrixWorld,near:data.camera.near,far:data.camera.far,aspect:data.camera.aspect,modelTransform:data.model,model,regions,depth:{...depth,base64:btoa(binary)}});
  }
  material.dispose();renderer.dispose();return {length:rail.length,clearanceRadius:.18,collisionSamples:700,collisions:hits,items};
 },existing);
 for(const item of result.items){for(const key of ['model','regions']){if(item[key]){fs.writeFileSync(path.join(out,`${item.name}-${key}.png`),Buffer.from(item[key].split(',')[1],'base64'));delete item[key];}}if(item.depth.base64){fs.writeFileSync(path.join(out,`${item.name}-depth.f32`),Buffer.from(item.depth.base64,'base64'));delete item.depth.base64;}}
 fs.writeFileSync(path.join(out,'camera-manifest.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({length:result.length,views:result.items.map(x=>x.name),collisions:result.collisions}));
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
