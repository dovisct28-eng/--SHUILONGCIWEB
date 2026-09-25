import { a08Progress } from './progress.mjs';

export function createA08Controller(stage) {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('./styles.css', import.meta.url).href;
  document.head.append(stylesheet);
  const section = document.createElement('section');
  section.className = 'a08';
  section.hidden = true;
  section.setAttribute('aria-label', '入将图探索交接');
  section.innerHTML = '<div class="a08__panel"><p>08 / 导读完成</p><h2>《入将图》</h2><p>空间与整体导读到这里结束。接下来，你可以进入壁画，自主查看人物、节点与局部信息。</p><a href="http://localhost:3000/index.html">进入探索</a></div>';
  stage.append(section);
  return screens => {
    const state = a08Progress(screens);
    section.hidden = !state.active;
    section.inert = !state.active || state.opacity < .8;
    section.style.opacity = state.opacity;
    if (state.active) document.body.dataset.phase = 'a08';
  };
}
