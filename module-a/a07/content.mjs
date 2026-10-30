import {MURAL_RESOURCES} from '../mural-resources.mjs';

export const a07Guide = {
  muralId: 'mural-02', chapter: '07', title: '第二铺《入将图》', order: '03 / 03',
  chapterLabel: '07 / 第二铺', subtitle: '从整体观看，进入自主探索', marker: '第二铺　03 / 03',
  start: 32, end: 40, direction: 'right-to-left',
  introLength: 4.2,
  introBeats: [
    {role: 'arrival', weight: 1.7, paragraphs: [0, 1], roles: ['lead', 'body']},
    {role: 'connection', weight: 1.4, paragraphs: [2, 3], roles: ['lead', 'body']},
    {role: 'closing', weight: 1.5, paragraphs: [4, 5], roles: ['lead', 'body']},
  ],
  introduction: '先看第二铺的完整图像。\n\n从全幅到局部，逐步观看《入将图》。\n\n观察画面的排列。\n\n沿右端向左端巡视，留意人物、持物与画面之间的关系。\n\n让真实图像留在视野中。\n\n基础导读之后，可主动进入探索，放大查看局部与已有图鉴信息。',
  image: MURAL_RESOURCES['mural-02'].display,
  next: '进入画中细节 →',
};
