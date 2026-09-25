const display = name => new URL(`../水龙祠壁画素材/网页展示图/${name}-display.webp`, import.meta.url).href;

export const MURAL_RESOURCES = Object.freeze({
  'mural-01': Object.freeze({ id: 'mural-01', label: '第一幅', display: display('mural-01'), detail: null }),
  'mural-02': Object.freeze({ id: 'mural-02', label: '第二幅', display: display('mural-02'), detail: null }),
  'mural-03': Object.freeze({ id: 'mural-03', label: '第三幅', display: null, detail: null }),
  'mural-04': Object.freeze({ id: 'mural-04', label: '第四幅', display: null, detail: null }),
  'mural-05': Object.freeze({ id: 'mural-05', label: '第五幅', display: display('mural-05'), detail: null }),
});

// Photo-calibrated design wall spans; these are not measured site dimensions.
export const MODEL_DISPLAY_BOUNDS = Object.freeze({
  'mural-01': Object.freeze({ maxWidth: 3.65, maxHeight: 1.2547 }),
  'mural-02': Object.freeze({ maxWidth: 6.1, maxHeight: 1.3796 }),
  'mural-05': Object.freeze({ maxWidth: 6.1, maxHeight: 1.64395 }),
});

export function fitMuralImage(mural, aspectRatio, bounds = mural) {
  const ratio = Number(aspectRatio);
  if (!(ratio > 0) || !Number.isFinite(ratio)) throw new TypeError('Mural image aspect ratio must be positive');
  const height = Math.min(bounds.maxHeight ?? bounds.height, (bounds.maxWidth ?? bounds.width) / ratio);
  return { width: height * ratio, height };
}
