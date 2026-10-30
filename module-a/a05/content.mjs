import { MURAL_RESOURCES } from '../mural-resources.mjs';

export const a05Guide = {
  muralId: 'mural-05',
  chapter: '05',
  title: '第五铺壁画',
  chapterLabel: '05 / 第五铺',
  subtitle: '从完整图像开始观看',
  marker: '第五铺　01 / 03',
  order: '01 / 03',
  start: 18,
  end: 25,
  entryMode: 'model',
  introBeats: [
    {role: 'lead', weight: 1.5, paragraphs: [0, 1], roles: ['lead', 'body']},
    {role: 'context', weight: 1.7, paragraphs: [2, 3], roles: ['lead', 'body']},
  ],
  introduction: '先看第五铺的完整画面。\n\n壁画沿墙面展开，保留着人物、持物与图像痕迹。\n\n从右端向左端，连续观看。\n\n继续滚动，观察画面不同区域的线条与疏密。',
  image: MURAL_RESOURCES['mural-05'].display,
  direction: 'right-to-left',
  next: '继续观看第一铺 →',
};
