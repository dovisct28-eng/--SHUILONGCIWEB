import {guideProgress, mapMuralProjection, muralTransfer, introReading, introGeometry, galleryGeometry, explorationGeometry} from './progress.mjs';
import {createGalleryAmbient} from './ambient.mjs';
import {quadTransform} from '../visual-director/projection.mjs';

export function createMuralGuide(stage, config, requestRender) {
  if (!document.querySelector('[data-mural-guide-styles]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('./styles.css', import.meta.url).href;
    stylesheet.dataset.muralGuideStyles = '';
    document.head.append(stylesheet);
  }
  // A05 owns the one background update; all four chapters share its fixed layer.
  const renderAmbient = config.chapter === '05' ? createGalleryAmbient(stage) : null;
  const section = document.createElement('section');
  section.className = 'mural-guide';
  section.dataset.chapter = config.chapter;
  section.hidden = true;
  section.setAttribute('aria-label', `${config.title}壁画导读`);
  section.innerHTML = `
    <header class="mural-guide__editorial mural-guide__intro">
      <div class="mural-guide__identity mural-guide__opening">
        <p class="mural-guide__marker"></p><span class="mural-guide__rule" aria-hidden="true"></span>
        <h2></h2><p class="mural-guide__subtitle"></p>
      </div>
      <div class="mural-guide__copy mural-guide__description"></div>
    </header>
    <div class="mural-guide__canvas"><img class="mural-guide__image" alt="${config.title}壁画网页展示图"></div>
    <div class="mural-guide__veil" aria-hidden="true"></div>
    <p class="mural-guide__scan-marker" aria-hidden="true"></p>
    <footer class="mural-guide__axis" aria-hidden="true"><span>左端</span><span class="mural-guide__rail"><b></b></span><span>右端</span><span class="mural-guide__direction">← 观看方向</span></footer>
    <p class="mural-guide__next"></p><p class="mural-guide__status" role="status"></p>`;
  stage.append(section);
  const image = section.querySelector('img');
  section.querySelector('h2').textContent = config.title;
  section.querySelector('.mural-guide__subtitle').textContent = config.subtitle;
  for (const marker of section.querySelectorAll('.mural-guide__marker,.mural-guide__scan-marker')) marker.textContent = `A${config.chapter} / ${config.chapterLabel.split(' / ')[1]}`;
  section.querySelector('.mural-guide__next').textContent = config.next;
  const paragraphs = config.introduction.split('\n\n');
  const beats = config.introBeats;
  for (const beat of beats) {
    const layer = document.createElement('div');
    layer.className = 'mural-guide__reading';
    layer.dataset.readingRole = beat.role || 'body';
    for (const [index, paragraphIndex] of beat.paragraphs.entries()) {
      const paragraph = document.createElement('p');
      paragraph.textContent = paragraphs[paragraphIndex];
      paragraph.dataset.typeRole = beat.roles?.[index] || 'body';
      layer.append(paragraph);
    }
    section.querySelector('.mural-guide__description').append(layer);
  }
  const layers = [...section.querySelectorAll('.mural-guide__reading')];
  const status = section.querySelector('.mural-guide__status');
  let requested = false, failed = false, lastModelMuralOpacity = 1;
  image.addEventListener('load', requestRender);
  image.addEventListener('error', () => { failed = true; requestRender(); });

  return screens => {
    renderAmbient?.(screens);
    const state = guideProgress(screens, config.start, config.end, config.introLength);
    const carried = config.chapter === '07' && screens >= config.end && screens <= 42.1;
    if (!requested && screens >= config.start - 2) {
      requested = true;
      image.src = config.image;
    }
    const transferring = config.entryMode === 'model' && screens > config.start - .6 && screens < config.start;
    if (!transferring && lastModelMuralOpacity !== 1) {
      stage.querySelector('iframe')?.contentWindow?.shuilongTemple?.setMuralTransferOpacity?.(config.muralId, 1);
      lastModelMuralOpacity = 1;
    }
    section.hidden = !state.visible && !transferring && !carried;
    section.inert = !state.active || carried;
    if (section.hidden) {
      if (config.entryMode === 'model') stage.style.removeProperty('--a05-entry');
      return;
    }
    section.style.opacity = carried ? '1' : config.entryMode === 'model' ? String(screens < config.start ? 1 : Math.max(0, 1 - (screens - config.end) / .4)) : String(state.opacity);
    const textExit = Math.max(0, Math.min(1, (screens - (config.start - .6)) / .6));
    if (config.entryMode === 'model') stage.style.setProperty('--a05-entry', textExit * textExit * (3 - 2 * textExit));
    section.style.setProperty('--intro-opacity', carried || transferring ? 0 : state.introduction * state.entry);
    const reveal = Math.max(0, Math.min(1, (screens - config.start - .4) / .4));
    const editorialOpacity = carried || transferring ? 0 : state.introduction * reveal * reveal * (3 - 2 * reveal);
    section.style.setProperty('--intro-entrance', editorialOpacity);
    section.querySelector('header').setAttribute('aria-hidden', String(editorialOpacity < .01));
    section.style.setProperty('--scan-opacity', carried || transferring ? 0 : state.galleryExpand);
    section.style.setProperty('--handoff-opacity', carried ? 0 : state.handoff);
    section.style.setProperty('--axis-opacity', carried || transferring ? 0 : 1);
    section.style.setProperty('--axis-position', `${(1 - state.scan) * 100}%`);
    const readings = introReading(state.introProgress, [1, ...beats.map(beat => beat.weight)]);
    const explanation = 1 - readings[0].opacity;
    section.style.setProperty('--title-weight', 1 - .18 * explanation);
    section.style.setProperty('--subtitle-weight', 1 - .18 * explanation);
    section.style.setProperty('--chapter-weight', 1 - .20 * explanation);
    layers.forEach((layer, index) => {
      const reading = readings[index + 1];
      layer.style.opacity = reading.opacity;
      layer.style.transform = `translateY(${reading.y}px)`;
      layer.setAttribute('aria-hidden', String(reading.opacity < .5 || editorialOpacity < .01));
    });
    section.dataset.introStage = String(readings.reduce((best, reading, i) => reading.opacity > readings[best].opacity ? i : best, 0));
    section.dataset.introProgress = state.introProgress.toFixed(4);
    section.dataset.scanProgress = state.scan.toFixed(4);
    section.dataset.galleryExpand = state.galleryExpand.toFixed(4);
    section.dataset.phase = state.handoff > 0 ? 'handoff' : screens >= config.start + (config.introLength || 3.2) ? 'scan' : state.galleryExpand > 0 ? 'expanding' : 'introduction';
    if (state.active && state.opacity > 0) document.body.dataset.phase = `a${config.chapter}-${section.dataset.phase}`;

    if (image.naturalWidth && image.naturalHeight) {
      const width = stage.clientWidth, height = stage.clientHeight, ratio = image.naturalWidth / image.naturalHeight;
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const intro = introGeometry(width, height, ratio);
      section.style.setProperty('--editorial-top', `${intro.editorialTop}px`);
      section.style.setProperty('--editorial-height', `${intro.editorialHeight}px`);
      if (transferring) {
        const frame = stage.querySelector('iframe'), api = frame?.contentWindow?.shuilongTemple;
        const localProjection = api?.getMuralProjection?.(config.muralId);
        const projection = mapMuralProjection(localProjection, frame?.getBoundingClientRect(), frame?.contentWindow?.innerWidth, frame?.contentWindow?.innerHeight, stage.getBoundingClientRect());
        const layout = muralTransfer(screens, projection, width, height, ratio, intro, config.start);
        const modelOpacity = 1 - layout.imageOpacity;
        if (Math.abs(modelOpacity - lastModelMuralOpacity) > .001) {
          api?.setMuralTransferOpacity?.(config.muralId, modelOpacity);
          lastModelMuralOpacity = modelOpacity;
        }
        Object.assign(image.style, {left: `${layout.left}px`, top: `${layout.top}px`, width: `${layout.width}px`, height: `${layout.height}px`, transform: 'none', opacity: String(layout.imageOpacity)});
        const matrix = quadTransform(layout.corners, intro.width, intro.height);
        if (matrix) Object.assign(image.style, {left: '0px', top: '0px', width: `${intro.width}px`, height: `${intro.height}px`, transformOrigin: '0 0', transform: `matrix3d(${matrix.join(',')})`});
        section.dataset.projection = projection ? JSON.stringify(projection) : '';
        return;
      }
      const layout = carried ? explorationGeometry(width, height, ratio, screens, reduced) : galleryGeometry(width, height, ratio, state, reduced);
      Object.assign(image.style, {left: '0px', top: `${layout.top}px`, width: `${layout.width}px`, height: `${layout.height}px`, opacity: '1', transformOrigin: 'left center', transform: `translate3d(${layout.left}px, 0, 0)`});
      const canvas = section.querySelector('.mural-guide__canvas');
      section.dataset.carried = String(carried);
      if (carried) {
        const matrix = quadTransform(layout.corners, layout.apertureWidth, layout.height);
        Object.assign(canvas.style, {width: `${layout.apertureWidth}px`, height: `${layout.height}px`, transformOrigin: '0 0', transform: `matrix3d(${matrix.join(',')})`});
        Object.assign(image.style, {top: '0px', transform: 'none'});
        canvas.style.setProperty('--wall-presence', layout.progress);
        canvas.style.maskImage = `linear-gradient(90deg,#000 ${100 - 10 * layout.progress}%,transparent 100%)`;
      } else {
        canvas.removeAttribute('style');
      }
      section.dataset.travelPx = (layout.travel || 0).toFixed(2);
      section.dataset.offsetPx = layout.left.toFixed(2);
      status.textContent = '';
    } else {
      section.dataset.travelPx = '0';
      status.textContent = failed ? '壁画图片暂时无法加载，请刷新页面重试。' : `正在加载${config.title}壁画…`;
    }
  };
}
