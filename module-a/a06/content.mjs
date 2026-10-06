import {MURAL_RESOURCES} from '../mural-resources.mjs';

export const a06Guide = {
  muralId: 'mural-01', chapter: '06', title: '行进途中', order: '02 / 03',
  chapterLabel: '06 / 行进', subtitle: '出庙之后，归庙之前', marker: '途中　02 / 03',
  start: 25, end: 32, direction: 'right-to-left',
  introBeats: [
    {role: 'lead', weight: 1.4, paragraphs: [0, 1], roles: ['lead', 'body']},
    {role: 'closing', weight: 1.3, paragraphs: [2, 3], roles: ['lead', 'body']},
  ],
  introduction: '离开水龙祠之后，赛会的队伍继续向前。\n\n从整组“出兵入将”的叙事来看，这一铺处在神灵出庙与最终归庙之间。\n\n从出庙到归庙，故事继续展开。\n\n在这里，我们继续沿着壁画向前，跟随这场赛会走向归程。',
  image: MURAL_RESOURCES['mural-01'].display,
  next: '巡游之后，队伍重新归庙 →',
};
