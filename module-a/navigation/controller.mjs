import {ANCHORS, STAGES, navigationState} from './state.mjs';

export function createNavigation(stage, requestRender) {
  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = new URL('./styles.css', import.meta.url).href;
  document.head.append(stylesheet);
  const nav = document.createElement('nav');
  nav.className = 'story-nav';
  nav.inert = true;
  nav.setAttribute('aria-hidden', 'true');
  nav.setAttribute('aria-label', '叙事导航');
  nav.innerHTML = `<a class="story-nav__brand" href="#hero" data-jump="hero" aria-label="出兵入将，返回开屏稳定画面"><span>出兵入将</span><small>水龙祠壁画数字交互叙事</small></a>
    <div class="story-nav__tools"><div class="story-nav__progress" aria-hidden="true">${STAGES.map(() => '<i></i>').join('')}</div><span class="story-nav__position story-nav__sr"></span>
    <button class="story-nav__toggle" type="button" aria-label="章节目录" aria-expanded="false" aria-controls="story-directory">目录<span aria-hidden="true">＋</span></button></div>
    <div class="story-nav__directory" id="story-directory" hidden inert aria-hidden="true"><a href="#space" data-jump="space">建筑空间</a><a href="#theme" data-jump="theme">出兵·入将</a><a href="#guide" data-jump="guide">图像导读</a><a href="http://localhost:3000/index.html" data-exploration>进入探索 <span aria-hidden="true">↗</span></a></div>`;
  stage.append(nav);
  const toggle = nav.querySelector('button');
  const brand = nav.querySelector('.story-nav__brand');
  const directory = nav.querySelector('.story-nav__directory');
  const links = [...directory.querySelectorAll('a')];
  const progress = [...nav.querySelectorAll('.story-nav__progress i')];
  const position = nav.querySelector('.story-nav__position');
  let open = false, previousState = '';
  function close(restoreFocus = false) {
    const hadFocus = directory.contains(document.activeElement);
    open = false;
    toggle.setAttribute('aria-expanded', 'false');
    directory.inert = true;
    directory.setAttribute('aria-hidden', 'true');
    directory.hidden = true;
    if (restoreFocus && hadFocus && !nav.inert) toggle.focus({preventScroll: true});
  }
  function show(focus = false) {
    if (nav.inert) return;
    open = true;
    directory.hidden = false;
    directory.inert = false;
    directory.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    if (focus) links[0].focus({preventScroll: true});
  }
  toggle.addEventListener('click', () => open ? close(true) : show());
  toggle.addEventListener('keydown', event => {
    if (['ArrowDown','ArrowUp'].includes(event.key)) {
      event.preventDefault(); show(true);
      if (event.key === 'ArrowUp') links.at(-1).focus();
    }
  });
  document.addEventListener('pointerdown', event => {
    if (open && !nav.contains(event.target)) close(true);
  });
  document.addEventListener('keydown', event => {
    if (open && event.key === 'Escape') {event.preventDefault(); close(true); toggle.focus({preventScroll:true});}
  });
  nav.addEventListener('focusout', event => {
    if (open && !nav.contains(event.relatedTarget)) close();
  });
  directory.addEventListener('keydown', event => {
    const index = links.indexOf(document.activeElement);
    if (index < 0) return;
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % links.length;
    if (event.key === 'ArrowUp') next = (index + links.length - 1) % links.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = links.length - 1;
    if (next !== undefined) {event.preventDefault(); links[next].focus({preventScroll:true});}
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('[data-exploration]')) close(true);
    const link = event.target.closest('[data-jump]');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    close(true);
    scrollTo({top: ANCHORS[link.dataset.jump] * innerHeight, behavior:'instant'});
    requestRender();
  });
  return state => {
    const next = navigationState(state);
    const key = [next.visible,next.stage,next.layout,next.quiet,next.label].join('|');
    if (key === previousState) return;
    previousState = key;
    if (!next.visible) {
      close();
      if (nav.contains(document.activeElement)) document.activeElement.blur();
    }
    nav.inert = !next.visible;
    nav.setAttribute('aria-hidden', String(!next.visible));
    nav.dataset.visible = String(next.visible);
    nav.dataset.layout = next.layout;
    nav.dataset.quiet = String(next.quiet);
    nav.dataset.stage = String(next.stage);
    brand.hidden = !next.brandVisible;
    brand.inert = !next.brandVisible;
    if (position.textContent !== next.label) position.textContent = next.label;
    progress.forEach((line, index) => line.dataset.current = String(index === next.stage));
    links.slice(0,3).forEach((link,index) => {
      if (next.stage === [0,1,3][index]) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
}
