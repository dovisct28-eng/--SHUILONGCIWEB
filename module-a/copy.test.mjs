import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {a05Guide} from './a05/content.mjs';
import {a06Guide} from './a06/content.mjs';
import {a07Guide} from './a07/content.mjs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('A01 and A02 contain the approved copy, without the superseded explanations', () => {
  const html = read('./a01/index.html'), app = read('./a01/app.mjs');
  for (const text of ['湖南江永 · 勾蓝瑶', '<h1>水龙祠</h1>', '出兵 · 入将',
    '一座神祠，两侧壁画，留下了一场出发与归来的故事。', '走近水龙祠',
    '02 / 建筑空间', '壁画藏在何处']) {
    assert.ok(html.includes(text), text);
  }
  const body = '五幅壁画散落在水龙祠的不同墙面。\n\n从其中三幅，走进“出兵入将”';
  assert.ok(html.replace(/\r\n/g, '\n').replace(/<[^>]+>/g, '').includes(body));
  for (const text of ['建筑空间', '五幅壁画 · 空间总览', '第五幅 · 第一幅 · 第二幅', '继续向下，走近“出兵入将”']) {
    assert.ok(app.includes(text), text);
  }
  assert.doesNotMatch(html + app, /先看清它们的位置|模型空间示意 · 编号沿用项目记录|a02-note|从建筑空间出发，循着|向下探索|先认识建筑，再看|壁画，在建筑的何处|核心三幅 · 共同强调|五幅位置 · 总览|实际墙位待核实|了解出兵·入将/);
});

test('three guides match the final copy verbatim, with coherent natural paragraphs', () => {
  const expected = [
    ['05 / 出庙', '神灵出庙', '一场迎神赛会，由此开始', '出庙　01 / 03', '随队伍继续前行 →',
      '所谓“出兵入将”，并不是一场战争。\n\n它描绘的是一次迎神赛会中，神灵从庙中出行、巡游，最后重新归庙的完整过程。\n\n第五幅位于这段叙事的开端。\n\n神灵离开水龙祠，赛会队伍由庙中向外展开。火炮发出信号，仪仗随行，一场迎神赛会由此开始。'],
    ['06 / 行进', '行进途中', '出庙之后，归庙之前', '途中　02 / 03', '巡游之后，队伍重新归庙 →',
      '离开水龙祠之后，赛会的队伍继续向前。\n\n从整组“出兵入将”的叙事来看，这一铺处在神灵出庙与最终归庙之间。\n\n从出庙到归庙，故事继续展开。\n\n在这里，我们继续沿着壁画向前，跟随这场赛会走向归程。'],
    ['07 / 归庙', '入将 · 神灵归庙', '出行的终点，也是赛会的结束', '归庙　03 / 03', '从完整故事，进入画中细节 →',
      '巡游之后，队伍重新回到水龙祠。\n\n这就是“入将”。神灵、仪仗与随行人群从外部空间返回庙中，一场从出庙开始的迎神赛会，在这里走向结束。\n\n“出兵”与“入将”，并不是彼此分开的场景。\n\n它们共同描绘这场迎神赛会从出行到回归的叙事。\n\n一边是出发，一边是归来。\n\n水龙祠两侧的壁画，把一次迎神赛会从开始到结束的过程，留在了庙宇的墙面之上。'],
  ];
  for (const [index, guide] of [a05Guide, a06Guide, a07Guide].entries()) {
    assert.deepEqual([guide.chapterLabel, guide.title, guide.subtitle, guide.marker, guide.next, guide.introduction], expected[index]);
    assert.equal(guide.source, undefined);
    assert.deepEqual([guide.muralId, guide.start, guide.end, guide.direction], [
      ['mural-05', 18, 25, 'right-to-left'], ['mural-01', 25, 32, 'right-to-left'], ['mural-02', 32, 40, 'right-to-left'],
    ][index]);
  }
  assert.equal(a05Guide.entryMode, 'model');
  assert.doesNotMatch(a06Guide.introduction, /骑马|步行|仪仗|火炮|人物身份|祭祀后/);
});

test('local serif subset covers every rendered heading and body subset covers all new copy', () => {
  const manifest = JSON.parse(read('./visual-director/fonts/manifest.json'));
  for (const title of ['壁画藏在何处', a05Guide.title, a06Guide.title, a07Guide.title]) {
    for (const char of title) assert.ok(manifest.titleText.includes(char), `Heading glyph: ${char}`);
  }
  for (const guide of [a05Guide, a06Guide, a07Guide]) {
    for (const char of [guide.chapterLabel, guide.subtitle, guide.marker, guide.next, guide.introduction].join('')) {
      if (!char.trim()) continue;
      assert.ok(manifest.text.includes(char), `Body glyph: ${char}`);
    }
  }
  assert.match(read('./guide/styles.css'), /\.mural-guide__description\{[^}]*white-space:normal/);
  assert.match(read('./a02/styles.css'), /\.a02-description span\{display:block\}/);
});
