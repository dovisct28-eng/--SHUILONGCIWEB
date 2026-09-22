export function createA03View(stage) {
  const section = document.createElement('section');
  section.className = 'a03';
  section.setAttribute('aria-label', '出兵·入将主题引入');
  section.innerHTML = `
    <article class="a03-copy" data-a03-copy aria-hidden="true">
      <p class="a03-kicker">03 / 主题引入</p>
      <h2>出兵<span>·</span>入将</h2>
      <p class="a03-lead">从壁画的位置，走向出行与归来的故事。</p>
      <p class="a03-research">李济民将“出兵入将”解释为迎神赛会中队伍出庙与入庙的场景。</p>
      <p class="a03-purpose">以这组关系为线索，留意队伍的朝向，以及不同壁面之间的联系。</p>
      <p class="a03-source">研究视角：李济民，2025，第122页。<br>主题尚有不同释读，这里提供一种观看线索。</p>
    </article>
    <p class="a03-reading-hint" data-a03-reading-hint aria-hidden="true">继续向下，从第五幅开始走近壁画</p>
    <div class="a03-handoff" data-a03-handoff aria-hidden="true">
      <p class="a03-kicker">接下来 / 观看路径</p>
      <h2>从第五幅出发</h2>
      <p>以站在主殿、面向戏台为起点，先看身体右侧的第五幅。</p>
      <p class="a03-route-note">这是一条项目设计的观看路径。</p>
    </div>
    <p class="a03-end" data-a03-end aria-hidden="true">主题引入结束 · 空间路线待后续展开 · 向上滚动可回看</p>`;
  stage.append(section);
  const copy = section.querySelector('[data-a03-copy]');
  const hint = section.querySelector('[data-a03-reading-hint]');
  const handoff = section.querySelector('[data-a03-handoff]');
  const end = section.querySelector('[data-a03-end]');
  return state => {
    stage.style.setProperty('--a03-text', state.text);
    stage.style.setProperty('--a03-handoff', state.handoff);
    stage.style.setProperty('--a03-takeover', state.takeover);
    for (const [el, opacity] of [[copy,state.text],[hint,state.text],[handoff,state.handoff],[end,state.handoff]]) {
      el.setAttribute('aria-hidden', String(opacity === 0));
      el.style.visibility = opacity === 0 ? 'hidden' : 'visible';
    }
  };
}
