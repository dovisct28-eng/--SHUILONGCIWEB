import {guideProgress, horizontalPlacement, muralTransfer} from './progress.mjs';

export function createMuralGuide(stage, config, requestRender) {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('./styles.css', import.meta.url).href;
  document.head.append(stylesheet);

  const section = document.createElement('section');
  section.className = 'mural-guide';
  section.hidden = true;
  section.setAttribute('aria-label', `${config.title}壁画导读`);
  section.innerHTML = `
    <div class="mural-guide__canvas"><img class="mural-guide__image" alt="${config.title}壁画网页展示图"></div>
    <div class="mural-guide__veil" aria-hidden="true"></div>
    <div class="mural-guide__intro">
      <p class="mural-guide__chapter"></p><h2></h2>
      <p class="mural-guide__description"></p><p class="mural-guide__source"></p>
    </div>
    <p class="mural-guide__marker"></p>
    <p class="mural-guide__next"></p>
    <p class="mural-guide__status" role="status"></p>`;
  stage.append(section);
  const image = section.querySelector('img');
  section.querySelector('.mural-guide__chapter').textContent = `${config.chapter} / 壁画导读`;
  section.querySelector('h2').textContent = config.title;
  section.querySelector('.mural-guide__description').textContent = config.introduction;
  section.querySelector('.mural-guide__source').textContent = config.source;
  section.querySelector('.mural-guide__marker').textContent = `${config.title}　${config.order}`;
  section.querySelector('.mural-guide__next').textContent = config.next;
  const status = section.querySelector('.mural-guide__status');
  let requested = false, failed = false;
  image.addEventListener('load', requestRender);
  image.addEventListener('error', () => { failed = true; requestRender(); });

  return screens => {
    const state = guideProgress(screens, config.start, config.end);
    if (!requested && screens >= config.start - 2) {
      requested = true;
      image.src = config.image;
    }
    const transferring=screens>config.start-.6&&screens<config.start;
    section.hidden = !state.active&&!transferring;
    section.inert = !state.active;
    if (section.hidden) { stage.style.removeProperty('--a05-entry'); return; }

    section.style.opacity = '1';
    const textExit=Math.max(0,Math.min(1,(screens-(config.start-.6))/.6));
    stage.style.setProperty('--a05-entry',textExit*textExit*(3-2*textExit));
    section.style.setProperty('--transfer-background',transferring?Math.max(0,Math.min(1,(screens-(config.start-.28))/.28)):1);
    section.style.setProperty('--intro-opacity', state.introduction);
    const reveal = Math.max(0, Math.min(1, (screens - config.start - 0.4) / 0.4));
    section.style.setProperty('--intro-entrance', state.introduction * reveal * reveal * (3 - 2 * reveal));
    section.style.setProperty('--scan-opacity', 1 - state.introduction);
    section.style.setProperty('--handoff-opacity', state.handoff);
    section.dataset.scanProgress = state.scan.toFixed(4);
    section.dataset.phase = state.handoff > 0 ? 'handoff' : state.scan > 0 ? 'scan' : 'introduction';
    document.body.dataset.phase = `a${config.chapter}-${section.dataset.phase}`;

    if (image.naturalWidth && image.naturalHeight) {
      const formalHeight=innerHeight*(matchMedia('(prefers-reduced-motion: reduce)').matches?.7:innerWidth<=1100?.78:.8);
      if(transferring){
        const api=stage.querySelector('iframe')?.contentWindow?.shuilongTemple;
        const projection=api?.getMuralProjection?.(config.muralId);
        const layout=muralTransfer(screens,projection,stage.clientWidth,stage.clientHeight,image.naturalWidth/image.naturalHeight,formalHeight,config.start);
        Object.assign(image.style,{left:`${layout.left}px`,top:`${layout.top}px`,width:`${layout.width}px`,height:`${layout.height}px`,transform:'none',opacity:String(layout.imageOpacity)});
        section.style.setProperty('--transfer-background',layout.backgroundOpacity);
        section.dataset.projection=projection?JSON.stringify(projection):'';
        return;
      }
      section.style.setProperty('--transfer-background','1');
      image.style.height=`${formalHeight}px`;image.style.top='50%';image.style.left='0px';image.style.opacity='1';
      const renderedWidth = formalHeight * image.naturalWidth / image.naturalHeight;
      const {x, travel} = horizontalPlacement(renderedWidth, stage.clientWidth, state.scan);
      image.style.width = `${renderedWidth}px`;
      image.style.transform = `translate3d(${x}px, -50%, 0)`;
      section.dataset.travelPx = travel.toFixed(2);
      section.dataset.offsetPx = x.toFixed(2);
      status.textContent = '';
    } else {
      section.dataset.travelPx = '0';
      status.textContent = failed ? '壁画图片暂时无法加载，请刷新页面重试。' : `正在加载${config.title}壁画…`;
    }
  };
}
