import {MURAL_RESOURCES} from '../mural-resources.mjs';

export const a07Guide = {
  muralId: 'mural-02', chapter: '07', title: '入将 · 神灵归庙', order: '03 / 03',
  chapterLabel: '07 / 归庙', subtitle: '出行的终点，也是赛会的结束', marker: '归庙　03 / 03',
  start: 32, end: 40, direction: 'right-to-left',
  introLength: 4.2,
  introBeats: [
    {role: 'arrival', weight: 1.3, paragraphs: [0, 1], roles: ['lead', 'statement'], breaks: [['之后，'], []]},
    {role: 'body', weight: 1.1, paragraphs: [2], roles: ['body'], breaks: [['人群', '庙中，', '赛会，']]},
    {role: 'connection', weight: .8, paragraphs: [3], roles: ['secondary'], breaks: [['于是，', '“入将”']]},
    {role: 'climax', weight: 1.2, paragraphs: [4], roles: ['climax']},
    {role: 'closing', weight: 1, paragraphs: [5], roles: ['closing'], breaks: [['壁画，', '赛会', '过程，']]},
  ],
  introduction: '巡游之后，队伍重新回到水龙祠。\n\n这就是“入将”。\n\n神灵、仪仗与随行人群从外部空间返回庙中，一场从出庙开始的迎神赛会，在这里走向结束。\n\n于是，“出兵”与“入将”并不是彼此分开的场景。\n\n一边是出发，\n一边是归来。\n\n水龙祠两侧的壁画，把一次迎神赛会从开始到结束的过程，留在了庙宇的墙面之上。',
  image: MURAL_RESOURCES['mural-02'].display,
  next: '从完整故事，进入画中细节 →',
};
