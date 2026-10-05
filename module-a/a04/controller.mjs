import {chapter,smooth,mixCamera,route,sampleTour,handoff,duration} from './path.mjs';
import {introCopy,caption} from './copy.mjs';

export function createA04Controller(stage, frame, requestRender) {
  const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./styles.css',import.meta.url).href;document.head.append(style);
  const section=document.createElement('section');section.className='a04';section.hidden=true;
  section.setAttribute('aria-label','空间观看路径');
  section.innerHTML=`<header class="a04-intro"><p>空间观看路径</p><h2>${introCopy.title}</h2><p class="a04-intro__description">${introCopy.description}</p></header><p class="a04-boundary">${introCopy.boundary}</p><div class="a04-caption"><span data-number aria-hidden="true"></span><div><h2 data-title></h2><p data-description></p></div></div><p class="a04-status" role="status" aria-live="polite"></p><div class="a04-controls"><button type="button" data-skip aria-label="跳过空间观看动画">跳过</button><button type="button" data-replay aria-label="重新观看空间路径">重新观看 ↻</button></div>`;
  stage.append(section);
  const title=section.querySelector('[data-title]'),description=section.querySelector('[data-description]'),status=section.querySelector('[role=status]');
  const skip=section.querySelector('[data-skip]'),replay=section.querySelector('[data-replay]');
  const number=section.querySelector('[data-number]');
  const tourDuration=new URLSearchParams(location.search).get('a04-duration')==='58'?58:duration;
  let elapsed=0,mode='idle',last=0,active=false,raf=0,everEntered=false,early=null,bridge=0,lastCamera=null,waitSince=0,fitWidth=0,fitHeight=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const restored=performance.getEntriesByType('navigation')[0]?.type==='reload';
  function wake(){if(!raf)raf=requestAnimationFrame(now=>{raf=0;const dt=last?Math.min(80,now-last):0;last=now;if(!document.hidden){if(mode==='playing')elapsed=Math.min(tourDuration,elapsed+dt/1000);if(early)bridge=Math.min(1,bridge+dt/800);}if(elapsed===tourDuration&&mode==='playing')mode='completed';requestRender();});}
  skip.onclick=()=>{elapsed=tourDuration;mode='completed';early=null;requestRender();};
  replay.onclick=()=>{elapsed=0;mode='playing';early=null;last=0;requestRender();};
  document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden&&active)requestRender();});
  reduced.addEventListener('change',()=>{if(reduced.matches){elapsed=tourDuration;mode='completed';}requestRender();});
  return screens=>{
    const state=chapter(screens),api=frame.contentWindow?.shuilongTemple;
    section.hidden=!state.active;section.inert=!state.active;
    if(!state.active){
      if(active){api?.setA04?.(null);mode='idle';elapsed=0;early=null;last=0;}
      active=false;waitSince=0;section.style.opacity='0';delete document.body.dataset.a04Mode;stage.style.removeProperty('--a04-entry');stage.style.removeProperty('--a04-model-opacity');
      frame.parentElement.style.width='';frame.parentElement.style.height='';
      return;
    }
    const entering=!active;active=true;stage.style.setProperty('--a04-entry',state.entry);
    section.style.opacity=state.entry;
    section.inert=state.entry<.9;
    // The outer frame and inner projection change together; no screenshot scaling.
    frame.parentElement.style.width=`${innerWidth}px`;
    frame.parentElement.style.height=`${innerHeight}px`;
    stage.style.setProperty('--model-scale',1);
    if(frame.clientWidth!==fitWidth||frame.clientHeight!==fitHeight){fitWidth=frame.clientWidth;fitHeight=frame.clientHeight;wake();}
    if(!api?.getA04Overview||!frame.contentWindow.modelReady){
      waitSince ||= performance.now();title.textContent='正在准备空间模型';description.textContent=performance.now()-waitSince>12000?'模型未能就绪。可刷新重试，或向上返回主题。观看顺序：第五幅 → 第一幅 → 第二幅。':'模型就绪后开始观看';status.textContent='';skip.hidden=replay.hidden=true;wake();return;
    }
    waitSince=0;
    const overview=api.getA04Overview();
    if((!everEntered&&restored)||reduced.matches||(entering&&state.guideStart>0)){mode='completed';elapsed=tourDuration;}
    everEntered=true;
    if(state.stable&&mode==='idle'){mode='playing';last=0;}
    if(screens<13.65&&mode==='playing'){mode='idle';elapsed=0;}
    const intro=api.getIntroState(),d=intro.distance,p=intro.phi,t=intro.theta;
    const entry={position:[intro.target[0]+d*Math.sin(p)*Math.sin(t),intro.target[1]+d*Math.cos(p),intro.target[2]+d*Math.sin(p)*Math.cos(t)],target:intro.target};
    const sample=sampleTour(elapsed,overview,tourDuration);
    let camera=mode==='idle'?mixCamera(entry,overview,state.entry):sample.camera;
    let growth=mode==='completed'?[1,1,1]:sample.growth;
    let target=sample.target;
    if(state.guideStart>0){
      if(mode==='playing'){early=lastCamera;bridge=0;elapsed=tourDuration;mode='completed';}
      camera=handoff(screens,overview).camera;
      if(early){camera=mixCamera(early,camera,smooth(bridge));if(bridge===1)early=null;}
      growth=[1,1,1];target='mural-05';
    }else if(early){camera=mixCamera(early,overview,smooth(bridge));growth=[1,1,1];if(bridge===1)early=null;}
    if(state.entry<1&&mode==='completed')camera=mixCamera(entry,overview,state.entry);
    lastCamera=camera;
    const transfer=handoff(screens,overview);
    const routeOpacity=state.entry*(screens>16?transfer.routeOpacity:1),labelOpacity=1;
    stage.style.setProperty('--a04-model-opacity',screens>16?transfer.modelOpacity:1);
    api.setA04({camera,entryProgress:state.entry,paths:route,growth,routeOpacity,labelOpacity,target,mode,elapsed,storyTime:sample.storyTime,currentRoute:mode==='playing'?sample.currentRoute:-1,guideStartProgress:state.guideStart,secondaryOpacity:screens>16?transfer.secondaryOpacity:1,nextGuideMuralId:'mural-05',routeComplete:mode==='completed',overviewCamera:overview});
    const text=caption(sample,mode,state.guideStart>0);
    title.textContent=text.title;description.textContent=text.description;number.textContent=text.number;
    const introWeight=state.guideStart>0?0:reduced.matches?1:mode==='idle'?1:1-smooth(sample.storyTime/3);
    section.style.setProperty('--a04-intro',introWeight);
    section.style.setProperty('--a04-caption',mode==='idle'?0:1-introWeight);
    section.dataset.mode=mode;
    const label=mode==='playing'?'空间观看中，可跳过或滚动离开':state.guideStart>0?'继续向下，进入第五铺壁画导读':'完整路线已建立，可继续滚动或重新观看。';
    if(status.textContent!==label)status.textContent=label;
    skip.hidden=mode!=='playing';replay.hidden=mode!=='completed'||state.guideStart>0||state.entry<1;
    stage.dataset.phase=document.body.dataset.phase=state.guideStart>0?'a04-guide-start':`a04-${mode}`;
    document.body.dataset.a04Mode=mode;
    if(mode==='playing'||early||state.entry<1)wake();else last=0;
  };
}
