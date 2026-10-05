import {guideProgress, horizontalPlacement, mapMuralProjection, muralTransfer, introReading, guideHeight} from './progress.mjs';
import {quadTransform} from '../visual-director/projection.mjs';

export function createMuralGuide(stage, config, requestRender) {
  if (!document.querySelector('[data-mural-guide-styles]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('./styles.css', import.meta.url).href;
    stylesheet.dataset.muralGuideStyles = '';
    document.head.append(stylesheet);
  }

  const section = document.createElement('section');
  section.className = 'mural-guide';
  section.dataset.chapter = config.chapter;
  section.hidden = true;
  section.setAttribute('aria-label', `${config.title}壁画导读`);
  section.innerHTML = `
    <div class="mural-guide__canvas"><img class="mural-guide__image" alt="${config.title}壁画网页展示图"></div>
    <div class="mural-guide__veil" aria-hidden="true"></div>
    <div class="mural-guide__intro">
      <div class="mural-guide__reading mural-guide__opening"><h2></h2><p class="mural-guide__source mural-guide__subtitle"></p><span class="mural-guide__continue" aria-hidden="true">↓</span></div>
      <div class="mural-guide__description"></div>
    </div>
    <p class="mural-guide__marker"></p>
    <div class="mural-guide__axis" aria-hidden="true"><span class="mural-guide__direction">← 观看方向：从右向左</span><span class="mural-guide__rail"><i></i><i></i><i></i><b></b></span></div>
    <p class="mural-guide__next"></p>
    <p class="mural-guide__status" role="status"></p>`;
  stage.append(section);
  const image = section.querySelector('img');
  section.querySelector('h2').textContent = config.title;
  const paragraphs = config.introduction.split('\n\n');
  let first = 0;
  for (const size of config.readingGroups || [paragraphs.length]) {
    const layer = document.createElement('div');
    layer.className = 'mural-guide__reading';
    for (const text of paragraphs.slice(first, first + size)) {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      layer.append(paragraph);
    }
    first += size;
    section.querySelector('.mural-guide__description').append(layer);
  }
  const layers = [...section.querySelectorAll('.mural-guide__reading')];
  section.querySelector('.mural-guide__subtitle').textContent = config.subtitle;
  section.querySelector('.mural-guide__marker').textContent = `A${config.chapter} / ${config.chapterLabel.split(' / ')[1]}`;
  section.querySelector('.mural-guide__next').textContent = config.next;
  const status = section.querySelector('.mural-guide__status');
  let requested = false, failed = false, lastModelMuralOpacity = 1;
  image.addEventListener('load', requestRender);
  image.addEventListener('error', () => { failed = true; requestRender(); });

  return screens => {
    const state = guideProgress(screens, config.start, config.end);
    const carried = config.chapter === '07' && screens >= config.end && screens <= 42.1;
    if (!requested && screens >= config.start - 2) {
      requested = true;
      image.src = config.image;
    }
    const transferring=config.entryMode==='model'&&screens>config.start-.6&&screens<config.start;
    if (!transferring && lastModelMuralOpacity !== 1) {
      stage.querySelector('iframe')?.contentWindow?.shuilongTemple?.setMuralTransferOpacity?.(config.muralId, 1);
      lastModelMuralOpacity = 1;
    }
    section.hidden = !state.visible&&!transferring&&!carried;
    section.inert = !state.active || carried;
    if (section.hidden) {
      if (config.entryMode==='model') stage.style.removeProperty('--a05-entry');
      return;
    }

    section.style.opacity = carried ? '1' : config.entryMode==='model' ? String(screens<config.start?1:Math.max(0,1-(screens-config.end)/.4)) : String(state.opacity);
    const textExit=Math.max(0,Math.min(1,(screens-(config.start-.6))/.6));
    if (config.entryMode==='model') stage.style.setProperty('--a05-entry',textExit*textExit*(3-2*textExit));
    section.style.setProperty('--transfer-background',transferring?Math.max(0,Math.min(1,(screens-(config.start-.28))/.28)):1);
    section.style.setProperty('--intro-opacity', carried || transferring ? 0 : state.introduction * state.entry);
    const reveal = Math.max(0, Math.min(1, (screens - config.start - 0.4) / 0.4));
    section.style.setProperty('--intro-entrance', state.introduction * reveal * reveal * (3 - 2 * reveal));
    section.style.setProperty('--scan-opacity', carried ? 0 : 1 - state.introduction);
    section.style.setProperty('--handoff-opacity', carried ? 0 : state.handoff);
    section.style.setProperty('--axis-position', `${(1 - state.scan) * 100}%`);
    introReading(state.introProgress, layers.length).forEach((reading, index) => {
      layers[index].style.opacity = reading.opacity;
      layers[index].style.transform = `translateY(${reading.y}px)`;
      layers[index].setAttribute('aria-hidden', String(reading.opacity < 0.5));
    });
    section.dataset.introStage = String(Math.min(layers.length - 1, Math.floor(state.introProgress * layers.length)));
    section.dataset.introProgress = state.introProgress.toFixed(4);
    section.dataset.scanProgress = state.scan.toFixed(4);
    section.dataset.phase = state.handoff > 0 ? 'handoff' : screens >= config.start + 3.2 ? 'scan' : 'introduction';
    if (state.active && state.opacity > 0) document.body.dataset.phase = `a${config.chapter}-${section.dataset.phase}`;

    if (image.naturalWidth && image.naturalHeight) {
      const formalHeight=guideHeight(innerWidth, innerHeight, matchMedia('(prefers-reduced-motion: reduce)').matches);
      if(transferring){
        const frame=stage.querySelector('iframe'), api=frame?.contentWindow?.shuilongTemple;
        const localProjection=api?.getMuralProjection?.(config.muralId);
        const projection=mapMuralProjection(localProjection,frame?.getBoundingClientRect(),frame?.contentWindow?.innerWidth,frame?.contentWindow?.innerHeight,stage.getBoundingClientRect());
        const layout=muralTransfer(screens,projection,stage.clientWidth,stage.clientHeight,image.naturalWidth/image.naturalHeight,formalHeight,config.start);
        const modelOpacity=1-layout.imageOpacity;
        if (Math.abs(modelOpacity-lastModelMuralOpacity)>.001) {
          api?.setMuralTransferOpacity?.(config.muralId,modelOpacity);
          lastModelMuralOpacity=modelOpacity;
        }
        Object.assign(image.style,{left:`${layout.left}px`,top:`${layout.top}px`,width:`${layout.width}px`,height:`${layout.height}px`,transform:'none',opacity:String(layout.imageOpacity)});
        const formalWidth=formalHeight*image.naturalWidth/image.naturalHeight;
        const matrix=quadTransform(layout.corners,formalWidth,formalHeight);
        if(matrix)Object.assign(image.style,{left:'0px',top:'0px',width:`${formalWidth}px`,height:`${formalHeight}px`,transformOrigin:'0 0',transform:`matrix3d(${matrix.join(',')})`});
        section.style.setProperty('--transfer-background',layout.backgroundOpacity);
        section.dataset.projection=projection?JSON.stringify(projection):'';
        return;
      }
      section.style.setProperty('--transfer-background','1');
      image.style.height=`${formalHeight}px`;image.style.top='50%';image.style.left='0px';image.style.opacity='1';image.style.transformOrigin='50% 50%';
      const renderedWidth = formalHeight * image.naturalWidth / image.naturalHeight;
      const {x, travel} = horizontalPlacement(renderedWidth, stage.clientWidth, carried ? 1 : state.scan);
      // A short wall-to-wall drift accompanies the existing overlap. Both
      // images remain visible; the next mural's right edge settles before INTRO.
      const departing = config.chapter !== '07' && screens >= config.end;
      const wallShift = departing ? -stage.clientWidth * 0.045 * ((screens - config.end) / 0.4)
        : config.entryMode !== 'model' ? stage.clientWidth * 0.045 * (1 - Math.min(1, Math.max(0, (screens - config.start) / 0.4))) : 0;
      image.style.width = `${renderedWidth}px`;
      image.style.transform = `translate3d(${x + wallShift}px, -50%, 0)`;
      section.dataset.travelPx = travel.toFixed(2);
      section.dataset.offsetPx = x.toFixed(2);
      status.textContent = '';
    } else {
      section.dataset.travelPx = '0';
      status.textContent = failed ? '壁画图片暂时无法加载，请刷新页面重试。' : `正在加载${config.title}壁画…`;
    }
  };
}
