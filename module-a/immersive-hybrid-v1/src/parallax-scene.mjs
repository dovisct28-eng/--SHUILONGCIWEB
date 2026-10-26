// Foreground alpha comes from the model's depth mask, not an AI segmentation.
export function createParallax(element,loader){const background=element.querySelector('.scene-background'),foreground=element.querySelector('.scene-foreground');
 let active=null;
 return {async set(entry,reference=false){const asset=await loader.scene(entry,reference);background.src=asset.url;await background.decode();foreground.style.backgroundImage=`url("${asset.url}")`;foreground.style.maskImage=entry.mask?`url("${entry.mask}")`:'none';foreground.hidden=!entry.mask;active={...asset,entry};element.style.opacity='1';this.move(0);return active;},move(t,reduced=false){const amount=reduced?0:t;background.style.transform=`scale(${1+amount*.008}) translateX(${amount*-.12}%)`;foreground.style.transform=`scale(${1+amount*.012}) translateX(${amount*-.2}%)`;},get active(){return active;},hide(){element.style.opacity='0';},show(){element.style.opacity='1';}};
}
