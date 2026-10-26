export const STATES=['overview','gate-exterior','gate-interior','gallery-approach','mural-01-stop','mural-01-detail'];
export function createController(onChange){let state='overview',busy=false;
 return {get state(){return state;},get busy(){return busy;},async go(next){if(busy||!STATES.includes(next)||next===state)return false;busy=true;const previous=state;try{await onChange(next,previous);state=next;return true;}finally{busy=false;}},step(direction){const index=STATES.indexOf(state);return this.go(STATES[Math.max(0,Math.min(STATES.length-1,index+direction))]);}};
}
export const ease=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};
export function animate(duration,draw){return new Promise(resolve=>{let start;function tick(now){start??=now;const t=duration?Math.min(1,(now-start)/duration):1;draw(ease(t),t);if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});}
