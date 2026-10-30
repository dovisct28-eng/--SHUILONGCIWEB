import {MURAL_RESOURCES} from '../mural-resources.mjs';

export const a06Guide = {
  muralId: 'mural-01', chapter: '06', title: '第一铺壁画', order: '02 / 03',
  chapterLabel: '06 / 第一铺', subtitle: '观察人物与画面排列', marker: '第一铺　02 / 03',
  start: 25, end: 32, direction: 'right-to-left',
  introBeats: [
    {role: 'lead', weight: 1.4, paragraphs: [0, 1], roles: ['lead', 'body']},
    {role: 'closing', weight: 1.3, paragraphs: [2, 3], roles: ['lead', 'body']},
  ],
  introduction: '走近第一铺壁画。\n\n先看图像全貌，再观察画中人物与周围形象的排列。\n\n从整体走向连续观看。\n\n沿壁画右端向左端移动，比较不同区域的疏密与线条。',
  image: MURAL_RESOURCES['mural-01'].display,
  next: '继续观看第二铺 →',
};
