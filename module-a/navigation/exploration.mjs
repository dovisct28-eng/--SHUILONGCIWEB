export const EXPLORATION_URL = 'http://localhost:3000/index.html';

// B stays an independent service. A cross-origin opaque response establishes
// connectivity only (not B's internal readiness); connection failures stay in A.
export async function explorationAvailable(fetcher = fetch, timeoutMs = 3000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetcher(EXPLORATION_URL, {mode:'no-cors', cache:'no-store', signal:controller.signal});
    return true;
  } catch {return false;}
  finally {clearTimeout(timeout);}
}

export function connectExploration(stage) {
  const notice = document.createElement('aside');
  notice.className = 'exploration-notice';
  notice.hidden = true;
  notice.setAttribute('role', 'alert');
  notice.innerHTML = '<p>《入将图》服务未启动或暂时不可达。请在 Mural-Exhibition 目录运行 node server.js，再点击入口重试。</p><button type="button">关闭</button>';
  stage.append(notice);
  let busy = false, source = null;
  function close() {
    notice.hidden = true;
    if (source?.isConnected && !source.closest('[inert]')) source.focus({preventScroll:true});
    else stage.querySelector('.story-nav:not([inert]) button')?.focus({preventScroll:true});
  }
  notice.querySelector('button').addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (!notice.hidden && event.key === 'Escape') {event.preventDefault(); close();}
  });
  stage.addEventListener('click', async event => {
    const link = event.target.closest('a[data-exploration],.a08 a');
    if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (busy) return;
    source = link; busy = true;
    notice.hidden = true;
    link.setAttribute('aria-busy', 'true');
    try {
      if (await explorationAvailable()) location.assign(EXPLORATION_URL);
      else {
        notice.hidden = false;
        notice.querySelector('button').focus({preventScroll:true});
      }
    } finally {busy = false; link.removeAttribute('aria-busy');}
  });
}
