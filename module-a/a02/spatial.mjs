// A02 display parameters. These are review candidates, not surveyed data or a frozen palette.
export const ease = n => {const t=Math.max(0,Math.min(1,Number(n)||0));return t*t*(3-2*t);};
export function architecturalRoom(screens=0) {
  const arrival=ease((screens-6.4)/.8), release=ease((screens-10.2)/.75);
  return {arrival,weight:arrival*(1-release),environment:1-ease((screens-6.2)/1),
    heading:ease((screens-7.05)/.45),field:ease((screens-6.2)/1)*(1-release),
    exit:release,site:arrival*(1-release),grain:.016,atmosphere:.065};
}
export function roomFrame(frame,width,height,screens) {
  const s=architecturalRoom(screens),w=s.weight;
  return {width:frame.width+(width*.96-frame.width)*w,height:frame.height+(height*.80-frame.height)*w};
}
export function createRoomField(stage) {
  const field=document.createElement('div');field.className='a02-field';field.setAttribute('aria-hidden','true');
  field.innerHTML='<div class="a02-field__distance"></div><div class="a02-field__light"></div><div class="a02-field__air"></div><div class="a02-field__grain"></div>';
  stage.insertBefore(field,stage.querySelector('.hero'));
  return (screens,poster=0,residual=0)=>{const s=architecturalRoom(screens),weight=s.field+poster*(1-s.field);field.hidden=weight===0;field.style.opacity=weight;
    field.querySelector('.a02-field__distance').style.opacity=.28*(poster>0?residual:1);
    stage.style.setProperty('--a02-grain',s.grain);stage.style.setProperty('--a02-air',s.atmosphere);};
}
