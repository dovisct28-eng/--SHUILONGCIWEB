import {chapter,smooth,mixCamera,route,sampleTour,duration} from './path.mjs';

export function createA04Controller(stage, frame, requestRender) {
  const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./styles.css',import.meta.url).href;document.head.append(style);
  const section=document.createElement('section');section.className='a04';section.hidden=true;
  section.setAttribute('aria-label','空间观看路径');
  section.innerHTML='<header><p>04 / 空间观看路径</p><span>项目设计的观看路线 · 模型空间示意</span></header><footer><h2 data-title></h2><p data-description></p><p class="a04-status" role="status" aria-live="polite"></p><div class="a04-controls"><button type="button" data-skip>跳过动画</button><button type="button" data-replay>重新观看</button></div></footer>';
  stage.append(section);
  const title=section.querySelector('[data-title]'),description=section.querySelector('[data-description]'),status=section.querySelector('[role=status]');
  const skip=section.querySelector('[data-skip]'),replay=section.querySelector('[data-replay]');
  let elapsed=0,mode='idle',last=0,active=false,raf=0,everEntered=false,early=null,bridge=0,lastCamera=null,waitSince=0,fitWidth=0,fitHeight=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const restored=performance.getEntriesByType('navigation')[0]?.type==='reload';
  function wake(){if(!raf)raf=requestAnimationFrame(now=>{raf=0;const dt=last?Math.min(80,now-last):0;last=now;if(!document.hidden){if(mode==='playing')elapsed=Math.min(duration,elapsed+dt/1000);if(early)bridge=Math.min(1,bridge+dt/800);}if(elapsed===duration&&mode==='playing')mode='completed';requestRender();});}
  skip.onclick=()=>{elapsed=duration;mode='completed';early=null;requestRender();};
  replay.onclick=()=>{elapsed=0;mode='playing';early=null;last=0;requestRender();};
  document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden&&active)requestRender();});
  reduced.addEventListener('change',()=>{if(reduced.matches){elapsed=duration;mode='completed';}requestRender();});
  return screens=>{
    const state=chapter(screens),api=frame.contentWindow?.shuilongTemple;
    section.hidden=!state.active;section.inert=!state.active;
    if(!state.active){
      if(active){api?.setA04?.(null);mode='idle';elapsed=0;early=null;last=0;}
      active=false;waitSince=0;section.style.opacity='0';stage.style.removeProperty('--a04-entry');
      frame.parentElement.style.width='';frame.parentElement.style.height='';
      return;
    }
    const entering=!active;active=true;stage.style.setProperty('--a04-entry',state.entry);
    section.style.opacity=state.entry;
    section.inert=state.entry<.9;
    // The outer frame and inner projection change together; no screenshot scaling.
    const w=innerWidth,h=innerHeight,baseWidth=w<=1100?w*.78:Math.min(w*.72,1000),baseHeight=Math.min(h*.84,820);
    frame.parentElement.style.width=`${baseWidth+(w-baseWidth)*state.entry}px`;
    frame.parentElement.style.height=`${baseHeight+(h-baseHeight)*state.entry}px`;
    stage.style.setProperty('--model-scale',.83+.17*state.entry);
    if(frame.clientWidth!==fitWidth||frame.clientHeight!==fitHeight){fitWidth=frame.clientWidth;fitHeight=frame.clientHeight;wake();}
    if(!api?.getA04Overview||!frame.contentWindow.modelReady){
      waitSince ||= performance.now();title.textContent='正在准备空间模型';description.textContent=performance.now()-waitSince>12000?'模型未能就绪。可刷新重试，或向上返回主题。观看顺序：第五幅 → 第一幅 → 第二幅。':'模型就绪后开始观看';status.textContent='';skip.hidden=replay.hidden=true;wake();return;
    }
    waitSince=0;
    const overview=api.getA04Overview(),handoff=api.getA04Handoff();
    if((!everEntered&&restored)||reduced.matches||(entering&&state.handoff>0)){mode='completed';elapsed=duration;}
    everEntered=true;
    if(state.stable&&mode==='idle'){mode='playing';last=0;}
    if(screens<13.65&&mode==='playing'){mode='idle';elapsed=0;}
    const intro=api.getIntroState(),d=intro.distance,p=intro.phi,t=intro.theta;
    const entry={position:[intro.target[0]+d*Math.sin(p)*Math.sin(t),intro.target[1]+d*Math.cos(p),intro.target[2]+d*Math.sin(p)*Math.cos(t)],target:intro.target};
    const sample=sampleTour(elapsed,overview);
    let camera=mode==='idle'?mixCamera(entry,overview,state.entry):sample.camera;
    let growth=mode==='completed'?[1,1,1]:sample.growth;
    let target=sample.target;
    if(state.handoff>0){
      if(mode==='playing'){early=lastCamera||camera;bridge=0;elapsed=duration;mode='completed';}
      // A short continuous bridge joins the canonical reversible scroll path on early exit.
      camera=mixCamera(overview,handoff,state.handoff);
      if(early){camera=mixCamera(early,camera,smooth(bridge));if(bridge===1)early=null;}
      growth=[1,1,1];target='mural-02';
    }else if(early){camera=mixCamera(early,overview,smooth(bridge));growth=[1,1,1];if(bridge===1)early=null;}
    if(state.entry<1&&mode==='completed')camera=mixCamera(entry,overview,state.entry);
    lastCamera=camera;
    const routeOpacity=state.entry*(1-state.handoff),labelOpacity=1-state.handoff;
    api.setA04({camera,entryProgress:state.entry,paths:route,growth,routeOpacity,labelOpacity,target,roofOpacity:.08*(1-state.entry),mode,elapsed,handoff:state.handoff,targetMuralId:'mural-02',handoffStartCamera:overview,handoffEndCamera:handoff});
    const texts=[['01 / 第五幅','从主殿出发，转向身体右侧的第五幅。'],['02 / 第一幅','转回戏台方向，沿侧廊前行，再左转抵达第一幅。'],['03 / 第二幅《入将图》','转向主殿，沿对侧返回，抵达第二幅。'],['回望完整建筑','镜头抬高回撤，辨认三幅壁画之间的空间关系。'],['观看路线','先看第五幅，再前行至第一幅，最后返回第二幅。']];
    let text=texts[sample.phase];
    if(sample.phase===4&&mode==='playing')text=elapsed<48?['01 / 第五幅观察站位','先看身体右侧的第五幅。']:elapsed<54?['02 / 前行至第一幅','沿出发侧前行，横向左转到第一幅。']:['03 / 返回第二幅','沿对侧返回主殿，抵达第二幅《入将图》。'];
    if(mode==='idle')text=['从主殿出发','继续向下，开始自动空间观看。'];
    if(mode==='completed')text=['第五幅 → 第一幅 → 第二幅','继续向下，走近《入将图》。'];
    if(state.handoff>0)text=['走近第二幅《入将图》',state.handoff===1?'交接预览 · A05 图像导读待后续开发':'从建筑空间连续聚焦至第二幅壁面。'];
    title.textContent=text[0];description.textContent=text[1];
    const label=mode==='playing'?'自动观看中 · 可跳过，也可滚动离开':state.handoff>0?'向上滚动，返回完整路线':'这是一条项目设计的观看路径。';
    if(status.textContent!==label)status.textContent=label;
    skip.hidden=mode!=='playing';replay.hidden=mode!=='completed'||state.handoff>0||state.entry<1;
    stage.dataset.phase=document.body.dataset.phase=state.handoff>0?'a04-handoff':`a04-${mode}`;
    document.body.dataset.a04Mode=mode;
    if(mode==='playing'||early||state.entry<1)wake();else last=0;
  };
}
