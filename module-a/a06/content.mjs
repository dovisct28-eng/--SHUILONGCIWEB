import {MURAL_RESOURCES} from '../mural-resources.mjs';

export const a06Guide = {
  muralId: 'mural-01', chapter: '06', title: '行进途中', order: '02 / 03',
  chapterLabel: '06 / 行进', subtitle: '出庙之后，归庙之前', marker: '途中　02 / 03',
  start: 25, end: 32, direction: 'right-to-left',
  introBeats: [
    {role: 'lead', weight: 1.05, paragraphs: [0], roles: ['lead']},
    {role: 'body', weight: 1.15, paragraphs: [1], roles: ['body'], breaks: [['来看，']]},
    {role: 'closing', weight: .8, paragraphs: [2], roles: ['closing'], breaks: [['这里，']]},
  ],
  introduction: '离开水龙祠之后，\n赛会的队伍继续向前。\n\n从整组“出兵入将”的叙事来看，这一铺处在神灵出庙与最终归庙之间。\n\n在这里，我们继续沿着壁画向前，\n跟随这场赛会走向归程。',
  image: MURAL_RESOURCES['mural-01'].display,
  next: '巡游之后，队伍重新归庙 →',
};
