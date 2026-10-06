import {ambientProgress} from './progress.mjs';

// Reuse A01's existing DOM/CSS landscape and exact cached URL without editing A01.
export function createGalleryAmbient(stage) {
  const layer = document.createElement('div');
  layer.className = 'gallery-ambient';
  layer.hidden = true;
  layer.setAttribute('aria-hidden', 'true');
  const field = document.createElement('div');
  field.className = 'ink-landscape';
  layer.append(field);
  stage.append(layer);
  let requested = false;
  return screens => {
    const state = ambientProgress(screens);
    layer.hidden = !state.visible;
    layer.style.opacity = state.opacity;
    layer.style.setProperty('--ambient-weight', state.weight);
    if (!requested && screens >= 16) {
      requested = true;
      for (const name of ['ink-sky', 'ink-valley']) {
        const image = document.createElement('img');
        image.className = name;
        image.alt = '';
        image.decoding = 'async';
        image.src = new URL('../../shuilong-temple/environment-assets/a01-v3/karst-valley.webp', import.meta.url).href;
        image.onerror = () => { image.hidden = true; };
        field.append(image);
      }
    }
  };
}
