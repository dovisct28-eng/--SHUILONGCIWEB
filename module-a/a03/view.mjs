export function createA03View(stage) {
  const poster=document.createElement('div');poster.className='a03-poster';
  poster.innerHTML='<h2 class="a03-title" aria-label="出庙 · 入庙"><span class="a03-title__out" aria-hidden="true">出庙</span><span class="a03-title__in" aria-hidden="true">入庙</span></h2>';
  stage.append(poster);
  const section=document.createElement('section');section.className='a03';section.setAttribute('aria-label','出兵 · 入将主题引入');
  section.innerHTML=`
    <p class="a03-kicker" data-a03-kicker>出兵入将</p>
    <article class="a03-copy" data-a03-copy>
      <p class="a03-introduction">一出一入，三铺壁画分列两侧，留下了一场迎神赛会的始与终。</p>
      <p class="a03-purpose">队伍从庙中出发，又重新归来；出行、仪仗与祭祀，被共同留在水龙祠的墙上。</p>
    </article>
    <p class="a03-reading-hint" data-a03-reading-hint>继续向下，从第五幅开始走近壁画</p>
    <div class="a03-handoff" data-a03-handoff><p>从第五幅出发</p></div>
    <p class="a03-end" data-a03-end>继续向下，观看空间路线 · 向上滚动可回看</p>`;
  stage.append(section);
  const groups=[[poster,'title'],[section.querySelector('[data-a03-kicker]'),'kicker'],[section.querySelector('[data-a03-copy]'),'text'],[section.querySelector('[data-a03-reading-hint]'),'hint'],[section.querySelector('[data-a03-handoff]'),'handoff'],[section.querySelector('[data-a03-end]'),'handoff']];
  return state=>{
    for(const key of ['text','handoff','takeover','kicker','title','return','introduction','purpose','hint'])stage.style.setProperty(`--a03-${key}`,state[key]);
    for(const[el,key]of groups){el.setAttribute('aria-hidden',String(state[key]===0));el.style.visibility=state[key]===0?'hidden':'visible';}
  };
}
