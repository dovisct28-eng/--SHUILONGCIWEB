import {a08Progress} from './progress.mjs';

export function createA08Controller(stage) {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('./styles.css', import.meta.url).href;
  document.head.append(stylesheet);
  const section = document.createElement('section');
  section.className = 'a08';
  section.hidden = true;
  section.setAttribute('aria-label', '入将图探索交接');
  section.innerHTML = '<div class="a08__panel"><p class="a08__chapter">A08 / 进入探索</p><span class="a08__rule" aria-hidden="true"></span><h2>《入将图》</h2><p>空间与整体导读到这里结束。</p><p>接下来，你可以进入壁画，<br>自主查看人物、节点与局部信息。</p><a href="http://localhost:3000/index.html">进入探索 <span aria-hidden="true">→</span></a></div>';
  stage.append(section);
  const link = section.querySelector('a');
  return screens => {
    const state = a08Progress(screens);
    section.hidden = !state.active;
    section.inert = !state.active || state.opacity < .8;
    section.style.opacity = state.opacity;
    if (state.active) document.body.dataset.phase = 'a08';
    // Type enters only AFTER the same image has opened genuine background space.
    // No moving panel, gradient, clipping aperture, or extra image request.
    link.tabIndex = section.inert ? -1 : 0;
  };
}
