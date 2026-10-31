// A single scale preserves the real photo ratio at every animation frame.
export function containedRect(box,ratio){
 const width=Math.min(box.width,box.height*ratio),height=width/ratio;
 return{x:box.x+(box.width-width)/2,y:box.y+(box.height-height)/2,width,height};
}
export async function photoBridge(image,corners,enter){
 await image.decode();const rect=image.getBoundingClientRect(),ratio=image.naturalWidth/image.naturalHeight;
 const target=containedRect(rect,ratio),source=containedRect({x:Math.min(...corners.map(p=>p.x)),y:Math.min(...corners.map(p=>p.y)),width:Math.max(...corners.map(p=>p.x))-Math.min(...corners.map(p=>p.x)),height:Math.max(...corners.map(p=>p.y))-Math.min(...corners.map(p=>p.y))},ratio);
 const ghost=image.cloneNode();ghost.removeAttribute('id');ghost.className='rear-reading-bridge';ghost.style.cssText=`left:0;top:0;width:${target.width}px;height:${target.height}px;transform-origin:0 0;`;document.body.append(ghost);image.style.visibility='hidden';document.body.dataset.bridge='soft-reversible-photo';
 const key=p=>({transform:`translate(${p.x}px,${p.y}px) scale(${p.width/target.width})`}),a={...key(source),opacity:.75},b={...key(target),opacity:1};
 try{await ghost.animate(enter?[a,b]:[b,a],{duration:480,easing:'cubic-bezier(.25,.1,.2,1)',fill:'both'}).finished;}finally{ghost.remove();image.style.visibility='';}
}
