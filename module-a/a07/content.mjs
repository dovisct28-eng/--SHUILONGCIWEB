import {MURAL_RESOURCES} from '../mural-resources.mjs';

export const a07Guide = {
  muralId: 'mural-02', chapter: '07', title: '入将 · 神灵归庙', order: '03 / 03',
  chapterLabel: '07 / 归庙', subtitle: '出行的终点，也是赛会的结束', marker: '归庙　03 / 03',
  start: 32, end: 40, direction: 'right-to-left',
  introLength: 4.2,
  introBeats: [
    {role: 'arrival', weight: 1.7, paragraphs: [0, 1], roles: ['lead', 'body']},
    {role: 'connection', weight: 1.4, paragraphs: [2, 3], roles: ['lead', 'body']},
    {role: 'closing', weight: 1.5, paragraphs: [4, 5], roles: ['lead', 'body']},
  ],
  introduction: '巡游之后，队伍重新回到水龙祠。\n\n这就是“入将”。神灵、仪仗与随行人群从外部空间返回庙中，一场从出庙开始的迎神赛会，在这里走向结束。\n\n“出兵”与“入将”，并不是彼此分开的场景。\n\n它们共同描绘这场迎神赛会从出行到回归的叙事。\n\n一边是出发，一边是归来。\n\n水龙祠两侧的壁画，把一次迎神赛会从开始到结束的过程，留在了庙宇的墙面之上。',
  image: MURAL_RESOURCES['mural-02'].display,
  next: '从完整故事，进入画中细节 →',
};
